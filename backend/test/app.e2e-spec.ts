import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataType, newDb } from 'pg-mem';
import request from 'supertest';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
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

type AutomotorResponse = {
  dominio: string;
  marca: string;
  modelo: string;
  fechaFabricacion: string;
  titular: SujetoResponse;
};

type AutomotoresListResponse = {
  items: AutomotorResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    search: string | null;
    sortBy: string;
    sortDirection: string;
  };
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

  it('POST/GET/PUT/DELETE /api/automotores cubre el flujo principal con persistencia real', async () => {
    await request(httpServer).post('/api/sujetos').send({
      cuit: '20-12345678-6',
      nombre: 'Juan Perez',
    });
    await request(httpServer).post('/api/sujetos').send({
      cuit: '27-23456789-1',
      nombre: 'Maria Gomez',
    });

    const createResponse = await request(httpServer)
      .post('/api/automotores')
      .send({
        dominio: ' aa123aa ',
        marca: '  Ford  ',
        modelo: ' Fiesta   Kinetic ',
        fechaFabricacion: '201806',
        titularCuit: '20-12345678-6',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body as AutomotorResponse).toEqual({
      dominio: 'AA123AA',
      marca: 'Ford',
      modelo: 'Fiesta Kinetic',
      fechaFabricacion: '201806',
      titular: {
        cuit: '20123456786',
        nombre: 'Juan Perez',
      },
    });

    const findResponse = await request(httpServer).get(
      '/api/automotores/aa123aa',
    );

    expect(findResponse.status).toBe(200);
    expect(findResponse.body as AutomotorResponse).toEqual(
      createResponse.body as AutomotorResponse,
    );

    const updateResponse = await request(httpServer)
      .put('/api/automotores/AA123AA')
      .send({
        marca: 'Toyota',
        modelo: 'Etios',
        fechaFabricacion: '202001',
        titularCuit: '27-23456789-1',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body as AutomotorResponse).toEqual({
      dominio: 'AA123AA',
      marca: 'Toyota',
      modelo: 'Etios',
      fechaFabricacion: '202001',
      titular: {
        cuit: '27234567891',
        nombre: 'Maria Gomez',
      },
    });

    await request(httpServer).delete('/api/automotores/aa123aa').expect(204);

    const deletedResponse = await request(httpServer).get(
      '/api/automotores/AA123AA',
    );
    const deletedBody = deletedResponse.body as {
      message: string;
      statusCode: number;
      error: string;
    };

    expect(deletedResponse.status).toBe(404);
    expect(deletedBody).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'No existe un automotor con dominio AA123AA.',
    });
  });

  it('GET /api/automotores devuelve paginacion, sorting y search con base real', async () => {
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
        marca: 'Ford',
        modelo: 'Fiesta',
        fechaFabricacion: '201806',
        titularCuit: '20123456786',
      },
      {
        dominio: 'AB123CD',
        marca: 'Toyota',
        modelo: 'Corolla',
        fechaFabricacion: '202112',
        titularCuit: '20123456786',
      },
      {
        dominio: 'AC456EF',
        marca: 'Iveco',
        modelo: 'Daily',
        fechaFabricacion: '202001',
        titularCuit: '27234567891',
      },
    ]);

    const cuitSearchResponse = await request(httpServer).get(
      '/api/automotores?search=20-12345678-6&sortBy=fechaFabricacion&sortDirection=desc&limit=1&page=1',
    );

    expect(cuitSearchResponse.status).toBe(200);
    expect(cuitSearchResponse.body as AutomotoresListResponse).toEqual({
      items: [
        {
          dominio: 'AB123CD',
          marca: 'Toyota',
          modelo: 'Corolla',
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

    const dominioSearchResponse = await request(httpServer).get(
      '/api/automotores?search= ab123cd ',
    );
    const dominioBody = dominioSearchResponse.body as AutomotoresListResponse;

    expect(dominioSearchResponse.status).toBe(200);
    expect(dominioBody.items).toHaveLength(1);
    expect(dominioBody.items[0]).toMatchObject({
      dominio: 'AB123CD',
      titular: {
        cuit: '20123456786',
      },
    });
  });

  it('POST /api/automotores devuelve 422 consistente si falla una regla de negocio', async () => {
    const response = await request(httpServer).post('/api/automotores').send({
      dominio: 'AAA123',
      marca: 'Ford',
      modelo: 'Fiesta',
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

  it('POST /api/automotores devuelve 422 consistente si falla la validacion del payload', async () => {
    const response = await request(httpServer).post('/api/automotores').send({
      dominio: 'A123',
      marca: 'F',
      modelo: '',
      fechaFabricacion: '209901',
      titularCuit: '20-12345678-0',
    });
    const body = response.body as ErrorResponse;

    expect(response.status).toBe(422);
    expect(body.statusCode).toBe(422);
    expect(body.error).toBe('Unprocessable Entity');
    expect(body.path).toBe('/api/automotores');
    expect(body.errors).toEqual([
      'dominio debe tener formato AAA999 o AA999AA.',
      'marca must be longer than or equal to 2 characters',
      'modelo must be longer than or equal to 1 characters',
      'fechaFabricacion debe tener formato YYYYMM, un mes valido y no puede ser futura.',
      'titularCuit debe ser un CUIT valido con digito verificador.',
    ]);
    expect(body.message).toBeUndefined();
  });
});
