import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEntity } from '../automotores/entities/automotor.entity';
import { OwnerEntity } from '../sujetos/entities/sujeto.entity';

type SeedOwnerBlueprint = {
  prefix10: string;
  name: string;
};

type SeedVehicleBlueprint = {
  licensePlate: string;
  color: string;
  manufactureDate: string;
  ownerIndex: number;
};

const SEED_OWNER_BLUEPRINTS: SeedOwnerBlueprint[] = [
  { prefix10: '2012345678', name: 'Juan Perez' },
  { prefix10: '2723456789', name: 'Maria Gomez' },
  { prefix10: '3071234567', name: 'Transporte Delta SA' },
  { prefix10: '2033344455', name: 'Lucia Fernandez' },
  { prefix10: '2722233344', name: 'Carla Ruiz' },
  { prefix10: '3077788899', name: 'Logistica Pampeana SRL' },
  { prefix10: '2098765432', name: 'Diego Martinez' },
  { prefix10: '2711122233', name: 'Valeria Sosa' },
  { prefix10: '3055511122', name: 'Agroinsumos del Sur SA' },
  { prefix10: '2030314159', name: 'Martin Lopez' },
];

const SEED_VEHICLE_BLUEPRINTS: SeedVehicleBlueprint[] = [
  {
    licensePlate: 'AAA123',
    color: 'Blanco',
    manufactureDate: '2018-06-01',
    ownerIndex: 0,
  },
  {
    licensePlate: 'AB123CD',
    color: 'Negro',
    manufactureDate: '2021-12-01',
    ownerIndex: 1,
  },
  {
    licensePlate: 'AC456EF',
    color: 'Gris',
    manufactureDate: '2020-01-01',
    ownerIndex: 2,
  },
  {
    licensePlate: 'AAD456',
    color: 'Rojo',
    manufactureDate: '2019-04-01',
    ownerIndex: 3,
  },
  {
    licensePlate: 'AAE567',
    color: 'Azul',
    manufactureDate: '2017-11-01',
    ownerIndex: 4,
  },
  {
    licensePlate: 'AAF678',
    color: 'Plata',
    manufactureDate: '2022-05-01',
    ownerIndex: 5,
  },
  {
    licensePlate: 'AAG789',
    color: 'Blanco',
    manufactureDate: '2016-12-01',
    ownerIndex: 6,
  },
  {
    licensePlate: 'AAH890',
    color: 'Verde',
    manufactureDate: '2015-10-01',
    ownerIndex: 7,
  },
  {
    licensePlate: 'AA123AA',
    color: 'Bordo',
    manufactureDate: '2023-03-01',
    ownerIndex: 8,
  },
  {
    licensePlate: 'AB234BC',
    color: 'Negro',
    manufactureDate: '2022-10-01',
    ownerIndex: 9,
  },
  {
    licensePlate: 'AC345CD',
    color: 'Azul',
    manufactureDate: '2018-08-01',
    ownerIndex: 0,
  },
  {
    licensePlate: 'AD456DE',
    color: 'Gris',
    manufactureDate: '2021-09-01',
    ownerIndex: 1,
  },
  {
    licensePlate: 'AE567EF',
    color: 'Blanco',
    manufactureDate: '2017-06-01',
    ownerIndex: 2,
  },
  {
    licensePlate: 'AF678FG',
    color: 'Rojo',
    manufactureDate: '2019-12-01',
    ownerIndex: 3,
  },
  {
    licensePlate: 'AG789GH',
    color: 'Champagne',
    manufactureDate: '2024-06-01',
    ownerIndex: 4,
  },
  {
    licensePlate: 'AH890HJ',
    color: 'Azul Marino',
    manufactureDate: '2016-03-01',
    ownerIndex: 5,
  },
  {
    licensePlate: 'AK901KL',
    color: 'Negro',
    manufactureDate: '2020-11-01',
    ownerIndex: 6,
  },
  {
    licensePlate: 'AL012LM',
    color: 'Gris Plata',
    manufactureDate: '2023-07-01',
    ownerIndex: 7,
  },
  {
    licensePlate: 'AM123MN',
    color: 'Rojo',
    manufactureDate: '2015-02-01',
    ownerIndex: 8,
  },
  {
    licensePlate: 'AN234NP',
    color: 'Blanco Perla',
    manufactureDate: '2014-09-01',
    ownerIndex: 9,
  },
  {
    licensePlate: 'AO345PQ',
    color: 'Verde Oliva',
    manufactureDate: '2019-08-01',
    ownerIndex: 0,
  },
  {
    licensePlate: 'AP456QR',
    color: 'Azul',
    manufactureDate: '2021-04-01',
    ownerIndex: 1,
  },
  {
    licensePlate: 'AQ567RS',
    color: 'Negro',
    manufactureDate: '2022-12-01',
    ownerIndex: 2,
  },
  {
    licensePlate: 'AR678ST',
    color: 'Plata',
    manufactureDate: '2017-12-01',
    ownerIndex: 3,
  },
  {
    licensePlate: 'AS789TU',
    color: 'Rojo',
    manufactureDate: '2020-02-01',
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
      name: ownerBlueprint.name,
    }));

    await this.ownersRepository.upsert(owners, ['cuit']);

    this.logger.log(`Initial owner seed applied: ${owners.length} records.`);
  }

  private async seedVehicles() {
    const ownerCuits = SEED_OWNER_BLUEPRINTS.map((ownerBlueprint) =>
      this.buildCuit(ownerBlueprint.prefix10),
    );
    const vehicles = SEED_VEHICLE_BLUEPRINTS.map((vehicleBlueprint, index) => ({
      licensePlate: vehicleBlueprint.licensePlate,
      chassis: this.buildChassis(index + 1),
      engine: this.buildEngine(index + 1),
      color: vehicleBlueprint.color,
      manufactureDate: vehicleBlueprint.manufactureDate,
      ownerCuit: ownerCuits[vehicleBlueprint.ownerIndex],
    }));

    await this.vehiclesRepository.upsert(vehicles, ['licensePlate']);

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
