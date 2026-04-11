import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomotorEntity } from '../automotores/entities/automotor.entity';
import { SujetoEntity } from '../sujetos/entities/sujeto.entity';

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeedService.name);
  private readonly seedEnabled = (process.env.DB_SEED ?? 'false') === 'true';

  constructor(
    @InjectRepository(SujetoEntity)
    private readonly sujetosRepository: Repository<SujetoEntity>,
    @InjectRepository(AutomotorEntity)
    private readonly automotoresRepository: Repository<AutomotorEntity>,
  ) {}

  async onApplicationBootstrap() {
    if (!this.seedEnabled) {
      this.logger.log(
        'Seed inicial deshabilitado. Usa DB_SEED=true para activarlo.',
      );
      return;
    }

    await this.seedSujetos();
    await this.seedAutomotores();
  }

  private async seedSujetos() {
    await this.sujetosRepository.upsert(
      [
        { cuit: '20123456786', nombre: 'Juan Perez' },
        { cuit: '27234567891', nombre: 'Maria Gomez' },
        { cuit: '30712345671', nombre: 'Transporte Delta SA' },
      ],
      ['cuit'],
    );

    this.logger.log('Seed inicial de sujetos aplicado.');
  }

  private async seedAutomotores() {
    await this.automotoresRepository.upsert(
      [
        {
          dominio: 'AAA123',
          chasis: '8AFZZZ54ZMJ000001',
          motor: 'MTR000001',
          color: 'Blanco',
          fechaFabricacion: '201806',
          titularCuit: '20123456786',
        },
        {
          dominio: 'AB123CD',
          chasis: '8AFZZZ54ZMJ000002',
          motor: 'MTR000002',
          color: 'Negro',
          fechaFabricacion: '202112',
          titularCuit: '27234567891',
        },
        {
          dominio: 'AC456EF',
          chasis: '8AFZZZ54ZMJ000003',
          motor: 'MTR000003',
          color: 'Gris',
          fechaFabricacion: '202001',
          titularCuit: '30712345671',
        },
      ],
      ['dominio'],
    );

    this.logger.log('Seed inicial de automotores aplicado.');
  }
}
