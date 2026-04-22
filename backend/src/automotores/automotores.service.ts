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

  async findAll(query: ListVehiclesQueryDto): Promise<ListVehiclesResponseDto> {
    const builder = this.vehiclesRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.titular', 'owner');

    const licensePlateSearch = query.normalizedLicensePlateSearch;
    const cuitSearch = query.normalizedCuitSearch;
    const ownerNameSearch = query.normalizedOwnerNameSearch;

    if (licensePlateSearch || cuitSearch || ownerNameSearch) {
      builder.andWhere(
        new Brackets((where) => {
          if (licensePlateSearch) {
            where.orWhere('UPPER(vehicle.dominio) LIKE :licensePlate', {
              licensePlate: `%${licensePlateSearch.toUpperCase()}%`,
            });
          }

          if (cuitSearch) {
            where.orWhere('vehicle.titular_cuit LIKE :cuit', {
              cuit: `%${cuitSearch}%`,
            });
          }

          if (ownerNameSearch) {
            where.orWhere('UPPER(owner.nombre) LIKE :ownerName', {
              ownerName: `%${ownerNameSearch.toUpperCase()}%`,
            });
          }
        }),
      );
    }

    const sortMap: Record<VehicleSortField, string> = {
      dominio: 'vehicle.dominio',
      chasis: 'vehicle.chasis',
      color: 'vehicle.color',
      fechaFabricacion: 'vehicle.fechaFabricacion',
      titularCuit: 'vehicle.titularCuit',
      titularNombre: 'owner.nombre',
    };

    builder
      .orderBy(
        sortMap[query.sortBy],
        query.sortDirection.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [items, total] = await builder.getManyAndCount();

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
  }
  async findOneByLicensePlate(
    licensePlate: string,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { dominio: licensePlate },
      relations: { titular: true },
    });

    if (!vehicle) {
      throw new NotFoundException(
        `No existe un automotor con dominio ${licensePlate}.`,
      );
    }

    return this.toResponse(vehicle);
  }

  async create(payload: CreateVehicleDto): Promise<VehicleResponseDto> {
    await this.ensureLicensePlateAvailable(payload.dominio);

    const owner = await this.ensureOwnerExists(payload.titularCuit);

    const vehicle = this.vehiclesRepository.create({
      dominio: payload.dominio,
      chasis: payload.chasis,
      motor: payload.motor,
      color: payload.color,
      fechaFabricacion: payload.fechaFabricacion,
      titularCuit: owner.cuit,
      titular: owner,
    });

    await this.vehiclesRepository.save(vehicle);

    return this.findOneByLicensePlate(vehicle.dominio);
  }

  async update(
    licensePlate: string,
    payload: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { dominio: licensePlate },
      relations: { titular: true },
    });

    if (!vehicle) {
      throw new NotFoundException(
        `No existe un automotor con dominio ${licensePlate}.`,
      );
    }

    const owner = await this.ensureOwnerExists(payload.titularCuit);

    vehicle.chasis = payload.chasis;
    vehicle.motor = payload.motor;
    vehicle.color = payload.color;
    vehicle.fechaFabricacion = payload.fechaFabricacion;
    vehicle.titularCuit = owner.cuit;
    vehicle.titular = owner;

    await this.vehiclesRepository.save(vehicle);

    return this.findOneByLicensePlate(vehicle.dominio);
  }

  async remove(licensePlate: string) {
    const vehicle = await this.vehiclesRepository.findOneBy({ dominio: licensePlate });

    if (!vehicle) {
      throw new NotFoundException(
        `No existe un automotor con dominio ${licensePlate}.`,
      );
    }

    await this.vehiclesRepository.remove(vehicle);
  }

  private async ensureLicensePlateAvailable(licensePlate: string) {
    const exists = await this.vehiclesRepository.existsBy({ dominio: licensePlate });

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
          `No existe un sujeto para el CUIT ${cuit}. Crealo y reintenta la operacion.`,
        ],
      });
    }

    return owner;
  }
  private toResponse(entity: VehicleEntity): VehicleResponseDto {
    return {
      dominio: entity.dominio,
      chasis: entity.chasis,
      motor: entity.motor,
      color: entity.color,
      fechaFabricacion: entity.fechaFabricacion,
      titular: entity.titular
        ? {
            cuit: entity.titular.cuit,
            nombre: entity.titular.nombre,
          }
        : (null as any),
    };
  }
}
