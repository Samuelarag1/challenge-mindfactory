import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSujetoDto } from './dto/create-sujeto.dto';
import { SujetoEntity } from './entities/sujeto.entity';

type SujetoResponse = {
  cuit: string;
  nombre: string;
};

@Injectable()
export class SujetosService {
  constructor(
    @InjectRepository(SujetoEntity)
    private readonly sujetosRepository: Repository<SujetoEntity>,
  ) {}

  async findByCuit(cuit: string) {
    const sujeto = await this.sujetosRepository.findOneBy({ cuit });

    if (!sujeto) {
      throw new NotFoundException(`No existe un sujeto con CUIT ${cuit}.`);
    }

    return this.toResponse(sujeto);
  }

  async create(payload: CreateSujetoDto) {
    const exists = await this.sujetosRepository.existsBy({
      cuit: payload.cuit,
    });

    if (exists) {
      throw new UnprocessableEntityException({
        errors: [`Ya existe un sujeto con CUIT ${payload.cuit}.`],
      });
    }

    const sujeto = this.sujetosRepository.create({
      cuit: payload.cuit,
      nombre: payload.nombre,
    });

    await this.sujetosRepository.save(sujeto);

    return this.toResponse(sujeto);
  }

  private toResponse(entity: SujetoEntity): SujetoResponse {
    return {
      cuit: entity.cuit,
      nombre: entity.nombre,
    };
  }
}
