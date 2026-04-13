import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { OwnerEntity } from '../sujetos/entities/sujeto.entity';
import { CreateVehicleDto } from './dto/create-automotor.dto';
import {
  ListVehiclesQueryDto,
  VehicleSortField,
} from './dto/list-automotores-query.dto';
import {
  ListVehiclesResponseDto,
  VehicleResponseDto,
} from './dto/automotor-response.dto';
import { UpdateVehicleDto } from './dto/update-automotor.dto';
import { VehicleEntity } from './entities/automotor.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehiclesRepository: Repository<VehicleEntity>,
    @InjectRepository(OwnerEntity)
    private readonly ownersRepository: Repository<OwnerEntity>,
  ) {}

  // async findAll(query: ListVehiclesQueryDto): Promise<ListVehiclesResponseDto> {
  //   const builder = this.vehiclesRepository
  //     .createQueryBuilder('vehicle')
  //     .leftJoinAndSelect('vehicle.owner', 'owner');

  //   const licensePlateSearch = query.normalizedLicensePlateSearch;
  //   const cuitSearch = query.normalizedCuitSearch;

  //   if (licensePlateSearch || cuitSearch) {
  //     builder.andWhere(
  //       new Brackets((where) => {
  //         if (licensePlateSearch) {
  //           where.orWhere('vehicle.dominio ILIKE :licensePlate', {
  //             licensePlate: `%${licensePlateSearch}%`,
  //           });
  //         }

  //         if (cuitSearch) {
  //           where.orWhere('vehicle.titular_cuit LIKE :cuit', {
  //             cuit: `%${cuitSearch}%`,
  //           });
  //         }
  //       }),
  //     );
  //   }

  //   const sortMap: Record<VehicleSortField, string> = {
  //     licensePlate: 'vehicle.dominio',
  //     chassis: 'vehicle.chasis',
  //     color: 'vehicle.color',
  //     manufactureDate: 'vehicle.fecha_fabricacion',
  //     ownerCuit: 'vehicle.titular_cuit',
  //     ownerName: 'owner.nombre',
  //   };

  //   builder
  //     .orderBy(
  //       sortMap[query.sortBy],
  //       query.sortDirection.toUpperCase() as 'ASC' | 'DESC',
  //     )
  //     .skip((query.page - 1) * query.limit)
  //     .take(query.limit);

  //   const [items, total] = await builder.getManyAndCount();

  //   return {
  //     items: items.map((item) => this.toResponse(item)),
  //     meta: {
  //       page: query.page,
  //       limit: query.limit,
  //       total,
  //       totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
  //       search: query.search ?? null,
  //       sortBy: query.sortBy,
  //       sortDirection: query.sortDirection,
  //     },
  //   };
  // }
  async findAll(query: ListVehiclesQueryDto): Promise<ListVehiclesResponseDto> {
    try {
      console.log('QUERY', query);

      const builder = this.vehiclesRepository
        .createQueryBuilder('vehicle')
        .leftJoinAndSelect('vehicle.owner', 'owner');

      const licensePlateSearch = query.normalizedLicensePlateSearch;
      const cuitSearch = query.normalizedCuitSearch;

      console.log('SEARCHES', { licensePlateSearch, cuitSearch });

      if (licensePlateSearch || cuitSearch) {
        builder.andWhere(
          new Brackets((where) => {
            if (licensePlateSearch) {
              where.orWhere('vehicle.dominio ILIKE :licensePlate', {
                licensePlate: `%${licensePlateSearch}%`,
              });
            }

            if (cuitSearch) {
              where.orWhere('vehicle.titular_cuit LIKE :cuit', {
                cuit: `%${cuitSearch}%`,
              });
            }
          }),
        );
      }

      const sortMap: Record<VehicleSortField, string> = {
        licensePlate: 'vehicle.licensePlate',
        chassis: 'vehicle.chassis',
        color: 'vehicle.color',
        manufactureDate: 'vehicle.manufactureDate',
        ownerCuit: 'vehicle.ownerCuit',
        ownerName: 'owner.name',
      };

      console.log('ORDER BY', {
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
        mapped: sortMap[query.sortBy],
      });

      builder
        .orderBy(
          sortMap[query.sortBy],
          query.sortDirection.toUpperCase() as 'ASC' | 'DESC',
        )
        .skip((query.page - 1) * query.limit)
        .take(query.limit);

      console.log('SQL', builder.getSql());
      console.log('PARAMS', builder.getParameters());

      const [items, total] = await builder.getManyAndCount();

      console.log(
        'ITEMS',
        items.map((item) => ({
          licensePlate: item.licensePlate,
          ownerCuit: item.ownerCuit,
          owner: item.owner,
        })),
      );

      return {
        items: items.map((item) => this.toResponse(item)),
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
          search: query.search ?? null,
          sortBy: query.sortBy,
          sortDirection: query.sortDirection,
        },
      };
    } catch (error) {
      console.error('Vehicles findAll error:', error);
      throw error;
    }
  }
  async findOneByLicensePlate(
    licensePlate: string,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { licensePlate },
      relations: { owner: true },
    });

    if (!vehicle) {
      throw new NotFoundException(
        `No existe un automotor con dominio ${licensePlate}.`,
      );
    }

    return this.toResponse(vehicle);
  }

  async create(payload: CreateVehicleDto): Promise<VehicleResponseDto> {
    await this.ensureLicensePlateAvailable(payload.licensePlate);

    const owner = await this.ensureOwnerExists(payload.ownerCuit);

    const vehicle = this.vehiclesRepository.create({
      licensePlate: payload.licensePlate,
      chassis: payload.chassis,
      engine: payload.engine,
      color: payload.color,
      manufactureDate: payload.manufactureDate,
      ownerCuit: owner.cuit,
      owner,
    });

    await this.vehiclesRepository.save(vehicle);

    return this.findOneByLicensePlate(vehicle.licensePlate);
  }

  async update(
    licensePlate: string,
    payload: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { licensePlate },
      relations: { owner: true },
    });

    if (!vehicle) {
      throw new NotFoundException(
        `No existe un automotor con dominio ${licensePlate}.`,
      );
    }

    const owner = await this.ensureOwnerExists(payload.ownerCuit);

    vehicle.chassis = payload.chassis;
    vehicle.engine = payload.engine;
    vehicle.color = payload.color;
    vehicle.manufactureDate = payload.manufactureDate;
    vehicle.ownerCuit = owner.cuit;
    vehicle.owner = owner;

    await this.vehiclesRepository.save(vehicle);

    return this.findOneByLicensePlate(vehicle.licensePlate);
  }

  async remove(licensePlate: string) {
    const vehicle = await this.vehiclesRepository.findOneBy({ licensePlate });

    if (!vehicle) {
      throw new NotFoundException(
        `No existe un automotor con dominio ${licensePlate}.`,
      );
    }

    await this.vehiclesRepository.remove(vehicle);
  }

  private async ensureLicensePlateAvailable(licensePlate: string) {
    const exists = await this.vehiclesRepository.existsBy({ licensePlate });

    if (exists) {
      throw new UnprocessableEntityException({
        errors: [`Ya existe un automotor con dominio ${licensePlate}.`],
      });
    }
  }

  private async ensureOwnerExists(cuit: string) {
    const owner = await this.ownersRepository.findOneBy({ cuit });

    if (!owner) {
      throw new UnprocessableEntityException({
        errors: [
          `No existe un titular para el CUIT ${cuit}. Crealo y reintenta la operacion.`,
        ],
      });
    }

    return owner;
  }
  private toResponse(entity: VehicleEntity): VehicleResponseDto {
    return {
      licensePlate: entity.licensePlate,
      chassis: entity.chassis,
      engine: entity.engine,
      color: entity.color,
      manufactureDate: entity.manufactureDate,
      owner: entity.owner
        ? {
            cuit: entity.owner.cuit,
            name: entity.owner.name,
          }
        : (null as any),
    };
  }
}
