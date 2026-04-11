import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { SujetoEntity } from '../sujetos/entities/sujeto.entity';
import { CreateAutomotorDto } from './dto/create-automotor.dto';
import {
  AutomotorSortField,
  ListAutomotoresQueryDto,
} from './dto/list-automotores-query.dto';
import { UpdateAutomotorDto } from './dto/update-automotor.dto';
import { AutomotorEntity } from './entities/automotor.entity';

type AutomotorResponse = {
  dominio: string;
  marca: string;
  modelo: string;
  fechaFabricacion: string;
  titular: {
    cuit: string;
    nombre: string;
  };
};

@Injectable()
export class AutomotoresService {
  constructor(
    @InjectRepository(AutomotorEntity)
    private readonly automotoresRepository: Repository<AutomotorEntity>,
    @InjectRepository(SujetoEntity)
    private readonly sujetosRepository: Repository<SujetoEntity>,
  ) {}

  async findAll(query: ListAutomotoresQueryDto) {
    const builder = this.automotoresRepository
      .createQueryBuilder('automotor')
      .leftJoinAndSelect('automotor.titular', 'titular');

    const dominioSearch = query.normalizedDominioSearch;
    const cuitSearch = query.normalizedCuitSearch;

    if (dominioSearch || cuitSearch) {
      builder.andWhere(
        new Brackets((where) => {
          if (dominioSearch) {
            where.orWhere('automotor.dominio ILIKE :dominio', {
              dominio: `%${dominioSearch}%`,
            });
          }

          if (cuitSearch) {
            where.orWhere('automotor.titularCuit LIKE :cuit', {
              cuit: `%${cuitSearch}%`,
            });
          }
        }),
      );
    }

    const sortMap: Record<AutomotorSortField, string> = {
      dominio: 'automotor.dominio',
      marca: 'automotor.marca',
      modelo: 'automotor.modelo',
      fechaFabricacion: 'automotor.fechaFabricacion',
      titularCuit: 'automotor.titularCuit',
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

  async findOneByDominio(dominio: string) {
    const automotor = await this.automotoresRepository.findOne({
      where: { dominio },
      relations: { titular: true },
    });

    if (!automotor) {
      throw new NotFoundException(
        `No existe un automotor con dominio ${dominio}.`,
      );
    }

    return this.toResponse(automotor);
  }

  async create(payload: CreateAutomotorDto) {
    await this.ensureDominioAvailable(payload.dominio);

    const titular = await this.ensureTitularExists(payload.titularCuit);

    const automotor = this.automotoresRepository.create({
      dominio: payload.dominio,
      marca: payload.marca,
      modelo: payload.modelo,
      fechaFabricacion: payload.fechaFabricacion,
      titularCuit: titular.cuit,
      titular,
    });

    await this.automotoresRepository.save(automotor);

    return this.findOneByDominio(automotor.dominio);
  }

  async update(dominio: string, payload: UpdateAutomotorDto) {
    const automotor = await this.automotoresRepository.findOne({
      where: { dominio },
      relations: { titular: true },
    });

    if (!automotor) {
      throw new NotFoundException(
        `No existe un automotor con dominio ${dominio}.`,
      );
    }

    const titular = await this.ensureTitularExists(payload.titularCuit);

    automotor.marca = payload.marca;
    automotor.modelo = payload.modelo;
    automotor.fechaFabricacion = payload.fechaFabricacion;
    automotor.titularCuit = titular.cuit;
    automotor.titular = titular;

    await this.automotoresRepository.save(automotor);

    return this.findOneByDominio(automotor.dominio);
  }

  async remove(dominio: string) {
    const automotor = await this.automotoresRepository.findOneBy({ dominio });

    if (!automotor) {
      throw new NotFoundException(
        `No existe un automotor con dominio ${dominio}.`,
      );
    }

    await this.automotoresRepository.remove(automotor);
  }

  private async ensureDominioAvailable(dominio: string) {
    const exists = await this.automotoresRepository.existsBy({ dominio });

    if (exists) {
      throw new UnprocessableEntityException({
        errors: [`Ya existe un automotor con dominio ${dominio}.`],
      });
    }
  }

  private async ensureTitularExists(cuit: string) {
    const titular = await this.sujetosRepository.findOneBy({ cuit });

    if (!titular) {
      throw new UnprocessableEntityException({
        errors: [
          `No existe un sujeto para el CUIT ${cuit}. Crealo y reintenta la operacion.`,
        ],
      });
    }

    return titular;
  }

  private toResponse(entity: AutomotorEntity): AutomotorResponse {
    return {
      dominio: entity.dominio,
      marca: entity.marca,
      modelo: entity.modelo,
      fechaFabricacion: entity.fechaFabricacion,
      titular: {
        cuit: entity.titular.cuit,
        nombre: entity.titular.nombre,
      },
    };
  }
}
