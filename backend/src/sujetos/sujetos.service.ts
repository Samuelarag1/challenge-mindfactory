import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOwnerDto } from './dto/create-sujeto.dto';
import { OwnerEntity } from './entities/sujeto.entity';

type OwnerResponse = {
  cuit: string;
  nombre: string;
};

@Injectable()
export class OwnersService {
  constructor(
    @InjectRepository(OwnerEntity)
    private readonly ownersRepository: Repository<OwnerEntity>,
  ) {}

  async findByCuit(cuit: string) {
    const owner = await this.ownersRepository.findOneBy({ cuit });

    if (!owner) {
      throw new NotFoundException(`No existe un sujeto con CUIT ${cuit}.`);
    }

    return this.toResponse(owner);
  }

  async create(payload: CreateOwnerDto) {
    const exists = await this.ownersRepository.existsBy({
      cuit: payload.cuit,
    });

    if (exists) {
      throw new UnprocessableEntityException({
        errors: [`Ya existe un sujeto con CUIT ${payload.cuit}.`],
      });
    }

    const owner = this.ownersRepository.create({
      cuit: payload.cuit,
      nombre: payload.nombre,
    });

    await this.ownersRepository.save(owner);

    return this.toResponse(owner);
  }

  private toResponse(entity: OwnerEntity): OwnerResponse {
    return {
      cuit: entity.cuit,
      nombre: entity.nombre,
    };
  }
}
