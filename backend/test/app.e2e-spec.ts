import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataType, newDb } from 'pg-mem';
import request from 'supertest';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import type {
  AutomotorResponseDto,
  ListAutomotoresResponseDto,
} from '../src/automotores/dto/automotor-response.dto';
import { AutomotoresModule } from '../src/automotores/automotores.module';
import { AutomotorEntity } from '../src/automotores/entities/automotor.entity';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { validationExceptionFactory } from '../src/common/validation/validation-exception.factory';
import { SujetosModule } from '../src/sujetos/sujetos.module';
import { SujetoEntity } from '../src/sujetos/entities/sujeto.entity';

type SupertestServer = Parameters<typeof request>[0];

type SujetoResponse = {
  cuit: string;
  nombre: string;
};

type ErrorResponse = {
  statusCode: number;
  error: string;
  errors: string[];
  path: string;
  timestamp: string;
  message?: unknown;
};

jest.setTimeout(15000);

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        database: 'challenge_mindfactory_test',
        autoLoadEntities: true,
        synchronize: true,
        retryAttempts: 0,
        retryDelay: 0,
      }),
      dataSourceFactory: (options?: DataSourceOptions) => {
        if (!options) {
          throw new Error(
            'Faltan opciones de TypeORM para la base de datos de test.',
          );
        }

        const db = newDb({
          autoCreateForeignKeyIndices: true,
        });
        db.public.registerFunction({
          name: 'version',
          returns: DataType.text,
          implementation: () => 'PostgreSQL 16.0 on pg-mem',
        });
        db.public.registerFunction({
          name: 'current_database',
          returns: DataType.text,
          implementation: () => 'challenge_mindfactory_test',
        });

        const dataSource = db.adapters.createTypeormDataSource(
          options,
        ) as DataSource;

        return dataSource;
      },
    }),
    SujetosModule,
    AutomotoresModule,
  ],
})
class TestAppModule {}

async function createTestingApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.init();

  return {
    app,
    httpServer: app.getHttpServer() as SupertestServer,
    sujetosRepository: moduleFixture.get<Repository<SujetoEntity>>(
      getRepositoryToken(SujetoEntity),
    ),
    automotoresRepository: moduleFixture.get<Repository<AutomotorEntity>>(
      getRepositoryToken(AutomotorEntity),
    ),
  };
}

function getFutureFechaFabricacion() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}${month}`;
}

describe('Backend e2e', () => {
  let app: INestApplication;
  let httpServer: SupertestServer;
  let sujetosRepository: Repository<SujetoEntity>;
  let automotoresRepository: Repository<AutomotorEntity>;

  beforeEach(async () => {
    ({ app, httpServer, sujetosRepository, automotoresRepository } =
      await createTestingApp());
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /api/sujetos normaliza y crea un sujeto', async () => {
    const response = await request(httpServer).post('/api/sujetos').send({
      cuit: '20-12345678-6',
      nombre: '  Juan   Perez  ',
    });

    const body = response.body as SujetoResponse;

    expect(response.status).toBe(201);
    expect(body).toEqual({
      cuit: '20123456786',
      nombre: 'Juan Perez',
    });
  });

  it('POST /api/automotores crea un automotor con el payload del challenge', async () => {
    await sujetosRepository.save({
      cuit: '20123456786',
      nombre: 'Juan Perez',
    });

    const response = await request(httpServer).post('/api/automotores').send({
      dominio: ' aa123aa ',
      chasis: ' 8AFZZZ54ZMJ123456 ',
      motor: ' ABC123456 ',
      color: '  Rojo  ',
      fechaFabricacion: '201806',
      titularCuit: '20-12345678-6',
    });

    expect(response.status).toBe(201);
    expect(response.body as AutomotorResponseDto).toEqual({
      dominio: 'AA123AA',
      chasis: '8AFZZZ54ZMJ123456',
      motor: 'ABC123456',
      color: 'Rojo',
      fechaFabricacion: '201806',
      titular: {
        cuit: '20123456786',
        nombre: 'Juan Perez',
      },
    });
  });

  it('GET /api/automotores/:dominio obtiene un automotor por dominio', async () => {
    await sujetosRepository.save({
      cuit: '20123456786',
      nombre: 'Juan Perez',
    });

    await automotoresRepository.save({
      dominio: 'AA123AA',
      chasis: '8AFZZZ54ZMJ123456',
      motor: 'ABC123456',
      color: 'Rojo',
      fechaFabricacion: '201806',
      titularCuit: '20123456786',
    });

    const response = await request(httpServer).get('/api/automotores/aa123aa');

    expect(response.status).toBe(200);
    expect(response.body as AutomotorResponseDto).toEqual({
      dominio: 'AA123AA',
      chasis: '8AFZZZ54ZMJ123456',
      motor: 'ABC123456',
      color: 'Rojo',
      fechaFabricacion: '201806',
      titular: {
        cuit: '20123456786',
        nombre: 'Juan Perez',
      },
    });
  });

  it('PUT /api/automotores/:dominio actualiza un automotor y cambia el titular', async () => {
    await sujetosRepository.save([
      {
        cuit: '20123456786',
        nombre: 'Juan Perez',
      },
      {
        cuit: '27234567891',
        nombre: 'Maria Gomez',
      },
    ]);

    await automotoresRepository.save({
      dominio: 'AA123AA',
      chasis: '8AFZZZ54ZMJ123456',
      motor: 'ABC123456',
      color: 'Rojo',
      fechaFabricacion: '201806',
      titularCuit: '20123456786',
    });

    const response = await request(httpServer)
      .put('/api/automotores/AA123AA')
      .send({
        chasis: '8AFZZZ54ZMJ123456',
        motor: 'XYZ987654',
        color: 'Azul',
        fechaFabricacion: '202001',
        titularCuit: '27-23456789-1',
      });

    expect(response.status).toBe(200);
    expect(response.body as AutomotorResponseDto).toEqual({
      dominio: 'AA123AA',
      chasis: '8AFZZZ54ZMJ123456',
      motor: 'XYZ987654',
      color: 'Azul',
      fechaFabricacion: '202001',
      titular: {
        cuit: '27234567891',
        nombre: 'Maria Gomez',
      },
    });
  });

  it('GET /api/automotores devuelve listado con busqueda, paginacion y ordenamiento', async () => {
    await sujetosRepository.save([
      {
        cuit: '20123456786',
        nombre: 'Juan Perez',
      },
      {
        cuit: '27234567891',
        nombre: 'Maria Gomez',
      },
    ]);

    await automotoresRepository.save([
      {
        dominio: 'AAA123',
        chasis: '8AFZZZ54ZMJ000001',
        motor: 'MTR000001',
        color: 'Negro',
        fechaFabricacion: '201806',
        titularCuit: '20123456786',
      },
      {
        dominio: 'AB123CD',
        chasis: '8AFZZZ54ZMJ000002',
        motor: 'MTR000002',
        color: 'Blanco',
        fechaFabricacion: '202112',
        titularCuit: '20123456786',
      },
      {
        dominio: 'AC456EF',
        chasis: '8AFZZZ54ZMJ000003',
        motor: 'MTR000003',
        color: 'Gris',
        fechaFabricacion: '202001',
        titularCuit: '27234567891',
      },
    ]);

    const response = await request(httpServer).get(
      '/api/automotores?search=20-12345678-6&sortBy=fechaFabricacion&sortDirection=desc&limit=1&page=1',
    );

    expect(response.status).toBe(200);
    expect(response.body as ListAutomotoresResponseDto).toEqual({
      items: [
        {
          dominio: 'AB123CD',
          chasis: '8AFZZZ54ZMJ000002',
          motor: 'MTR000002',
          color: 'Blanco',
          fechaFabricacion: '202112',
          titular: {
            cuit: '20123456786',
            nombre: 'Juan Perez',
          },
        },
      ],
      meta: {
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
        search: '20-12345678-6',
        sortBy: 'fechaFabricacion',
        sortDirection: 'desc',
      },
    });
  });

  it('POST /api/automotores devuelve 422 consistente si el titular no existe', async () => {
    const response = await request(httpServer).post('/api/automotores').send({
      dominio: 'AA123AA',
      chasis: '8AFZZZ54ZMJ123456',
      motor: 'ABC123456',
      color: 'Rojo',
      fechaFabricacion: '201806',
      titularCuit: '20123456786',
    });
    const body = response.body as ErrorResponse;

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      statusCode: 422,
      error: 'Unprocessable Entity',
      errors: [
        'No existe un sujeto para el CUIT 20123456786. Crealo y reintenta la operacion.',
      ],
      path: '/api/automotores',
    });
    expect(body.message).toBeUndefined();
  });

  it('POST /api/automotores devuelve 422 consistente si el dominio es invalido', async () => {
    await sujetosRepository.save({
      cuit: '20123456786',
      nombre: 'Juan Perez',
    });

    const response = await request(httpServer).post('/api/automotores').send({
      dominio: 'A123',
      chasis: '8AFZZZ54ZMJ123456',
      motor: 'ABC123456',
      color: 'Rojo',
      fechaFabricacion: '201806',
      titularCuit: '20123456786',
    });
    const body = response.body as ErrorResponse;

    expect(response.status).toBe(422);
    expect(body.statusCode).toBe(422);
    expect(body.error).toBe('Unprocessable Entity');
    expect(body.path).toBe('/api/automotores');
    expect(body.errors).toEqual([
      'dominio debe tener formato AAA999 o AA999AA.',
    ]);
    expect(body.message).toBeUndefined();
  });

  it('POST /api/automotores devuelve 422 consistente si fechaFabricacion es futura', async () => {
    await sujetosRepository.save({
      cuit: '20123456786',
      nombre: 'Juan Perez',
    });

    const response = await request(httpServer).post('/api/automotores').send({
      dominio: 'AA123AA',
      chasis: '8AFZZZ54ZMJ123456',
      motor: 'ABC123456',
      color: 'Rojo',
      fechaFabricacion: getFutureFechaFabricacion(),
      titularCuit: '20123456786',
    });
    const body = response.body as ErrorResponse;

    expect(response.status).toBe(422);
    expect(body.statusCode).toBe(422);
    expect(body.error).toBe('Unprocessable Entity');
    expect(body.path).toBe('/api/automotores');
    expect(body.errors).toEqual([
      'fechaFabricacion debe tener formato YYYYMM, un mes valido y no puede ser futura.',
    ]);
    expect(body.message).toBeUndefined();
  });

  it('POST /api/automotores devuelve 422 consistente si fechaFabricacion es invalida', async () => {
    await sujetosRepository.save({
      cuit: '20123456786',
      nombre: 'Juan Perez',
    });

    const response = await request(httpServer).post('/api/automotores').send({
      dominio: 'AA123AA',
      chasis: '8AFZZZ54ZMJ123456',
      motor: 'ABC123456',
      color: 'Rojo',
      fechaFabricacion: '202013',
      titularCuit: '20123456786',
    });
    const body = response.body as ErrorResponse;

    expect(response.status).toBe(422);
    expect(body.statusCode).toBe(422);
    expect(body.error).toBe('Unprocessable Entity');
    expect(body.path).toBe('/api/automotores');
    expect(body.errors).toEqual([
      'fechaFabricacion debe tener formato YYYYMM, un mes valido y no puede ser futura.',
    ]);
    expect(body.message).toBeUndefined();
  });

  it('GET /api/automotores/:dominio devuelve 404 consistente si el automotor no existe', async () => {
    const response = await request(httpServer).get('/api/automotores/AA123AA');
    const body = response.body as {
      message: string;
      statusCode: number;
      error: string;
      path: string;
      timestamp: string;
    };

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'No existe un automotor con dominio AA123AA.',
      path: '/api/automotores/AA123AA',
    });
  });
});
