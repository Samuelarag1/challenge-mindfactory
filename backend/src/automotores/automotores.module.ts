import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SujetoEntity } from '../sujetos/entities/sujeto.entity';
import { AutomotoresController } from './automotores.controller';
import { AutomotoresService } from './automotores.service';
import { AutomotorEntity } from './entities/automotor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AutomotorEntity, SujetoEntity])],
  controllers: [AutomotoresController],
  providers: [AutomotoresService],
})
export class AutomotoresModule {}
