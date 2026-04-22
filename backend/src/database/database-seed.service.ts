import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEntity } from '../automotores/entities/automotor.entity';
import { OwnerEntity } from '../sujetos/entities/sujeto.entity';

type SeedOwnerBlueprint = {
  prefix10: string;
  nombre: string;
};

type SeedVehicleBlueprint = {
  dominio: string;
  color: string;
  fechaFabricacion: string;
  ownerIndex: number;
};

const SEED_OWNER_BLUEPRINTS: SeedOwnerBlueprint[] = [
  { prefix10: '2012345678', nombre: 'Juan Perez' },
  { prefix10: '2723456789', nombre: 'Maria Gomez' },
  { prefix10: '3071234567', nombre: 'Transporte Delta SA' },
  { prefix10: '2033344455', nombre: 'Lucia Fernandez' },
  { prefix10: '2722233344', nombre: 'Carla Ruiz' },
  { prefix10: '3077788899', nombre: 'Logistica Pampeana SRL' },
  { prefix10: '2098765432', nombre: 'Diego Martinez' },
  { prefix10: '2711122233', nombre: 'Valeria Sosa' },
  { prefix10: '3055511122', nombre: 'Agroinsumos del Sur SA' },
  { prefix10: '2030314159', nombre: 'Martin Lopez' },
];

const SEED_VEHICLE_BLUEPRINTS: SeedVehicleBlueprint[] = [
  {
    dominio: 'AAA123',
    color: 'Blanco',
    fechaFabricacion: '201806',
    ownerIndex: 0,
  },
  {
    dominio: 'AB123CD',
    color: 'Negro',
    fechaFabricacion: '202112',
    ownerIndex: 1,
  },
  {
    dominio: 'AC456EF',
    color: 'Gris',
    fechaFabricacion: '202001',
    ownerIndex: 2,
  },
  {
    dominio: 'AAD456',
    color: 'Rojo',
    fechaFabricacion: '201904',
    ownerIndex: 3,
  },
  {
    dominio: 'AAE567',
    color: 'Azul',
    fechaFabricacion: '201711',
    ownerIndex: 4,
  },
  {
    dominio: 'AAF678',
    color: 'Plata',
    fechaFabricacion: '202205',
    ownerIndex: 5,
  },
  {
    dominio: 'AAG789',
    color: 'Blanco',
    fechaFabricacion: '201612',
    ownerIndex: 6,
  },
  {
    dominio: 'AAH890',
    color: 'Verde',
    fechaFabricacion: '201510',
    ownerIndex: 7,
  },
  {
    dominio: 'AA123AA',
    color: 'Bordo',
    fechaFabricacion: '202303',
    ownerIndex: 8,
  },
  {
    dominio: 'AB234BC',
    color: 'Negro',
    fechaFabricacion: '202210',
    ownerIndex: 9,
  },
  {
    dominio: 'AC345CD',
    color: 'Azul',
    fechaFabricacion: '201808',
    ownerIndex: 0,
  },
  {
    dominio: 'AD456DE',
    color: 'Gris',
    fechaFabricacion: '202109',
    ownerIndex: 1,
  },
  {
    dominio: 'AE567EF',
    color: 'Blanco',
    fechaFabricacion: '201706',
    ownerIndex: 2,
  },
  {
    dominio: 'AF678FG',
    color: 'Rojo',
    fechaFabricacion: '201912',
    ownerIndex: 3,
  },
  {
    dominio: 'AG789GH',
    color: 'Champagne',
    fechaFabricacion: '202406',
    ownerIndex: 4,
  },
  {
    dominio: 'AH890HJ',
    color: 'Azul Marino',
    fechaFabricacion: '201603',
    ownerIndex: 5,
  },
  {
    dominio: 'AK901KL',
    color: 'Negro',
    fechaFabricacion: '202011',
    ownerIndex: 6,
  },
  {
    dominio: 'AL012LM',
    color: 'Gris Plata',
    fechaFabricacion: '202307',
    ownerIndex: 7,
  },
  {
    dominio: 'AM123MN',
    color: 'Rojo',
    fechaFabricacion: '201502',
    ownerIndex: 8,
  },
  {
    dominio: 'AN234NP',
    color: 'Blanco Perla',
    fechaFabricacion: '201409',
    ownerIndex: 9,
  },
  {
    dominio: 'AO345PQ',
    color: 'Verde Oliva',
    fechaFabricacion: '201908',
    ownerIndex: 0,
  },
  {
    dominio: 'AP456QR',
    color: 'Azul',
    fechaFabricacion: '202104',
    ownerIndex: 1,
  },
  {
    dominio: 'AQ567RS',
    color: 'Negro',
    fechaFabricacion: '202212',
    ownerIndex: 2,
  },
  {
    dominio: 'AR678ST',
    color: 'Plata',
    fechaFabricacion: '201712',
    ownerIndex: 3,
  },
  {
    dominio: 'AS789TU',
    color: 'Rojo',
    fechaFabricacion: '202002',
    ownerIndex: 4,
  },
];

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeedService.name);
  private readonly seedEnabled = (process.env.DB_SEED ?? 'false') === 'true';

  constructor(
    @InjectRepository(OwnerEntity)
    private readonly ownersRepository: Repository<OwnerEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehiclesRepository: Repository<VehicleEntity>,
  ) {}

  async onApplicationBootstrap() {
    if (!this.seedEnabled) {
      this.logger.log(
        'Initial seed disabled. Use DB_SEED=true to enable it.',
      );
      return;
    }

    await this.seedOwners();
    await this.seedVehicles();
  }

  private async seedOwners() {
    const owners = SEED_OWNER_BLUEPRINTS.map((ownerBlueprint) => ({
      cuit: this.buildCuit(ownerBlueprint.prefix10),
      nombre: ownerBlueprint.nombre,
    }));

    await this.ownersRepository.upsert(owners, ['cuit']);

    this.logger.log(`Initial owner seed applied: ${owners.length} records.`);
  }

  private async seedVehicles() {
    const ownerCuits = SEED_OWNER_BLUEPRINTS.map((ownerBlueprint) =>
      this.buildCuit(ownerBlueprint.prefix10),
    );
    const vehicles = SEED_VEHICLE_BLUEPRINTS.map((vehicleBlueprint, index) => ({
      dominio: vehicleBlueprint.dominio,
      chasis: this.buildChassis(index + 1),
      motor: this.buildEngine(index + 1),
      color: vehicleBlueprint.color,
      fechaFabricacion: vehicleBlueprint.fechaFabricacion,
      titularCuit: ownerCuits[vehicleBlueprint.ownerIndex],
    }));

    await this.vehiclesRepository.upsert(vehicles, ['dominio']);

    this.logger.log(`Initial vehicle seed applied: ${vehicles.length} records.`);
  }

  private buildChassis(sequence: number) {
    return `8AFZZZ54ZMJ${String(sequence).padStart(6, '0')}`;
  }

  private buildEngine(sequence: number) {
    return `MTR${String(sequence).padStart(6, '0')}`;
  }

  private buildCuit(prefix10: string) {
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digits = prefix10.split('').map(Number);
    const sum = digits.reduce(
      (accumulator, digit, index) => accumulator + digit * weights[index],
      0,
    );
    const remainder = sum % 11;
    const verifier = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

    return `${prefix10}${verifier}`;
  }
}
