import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SujetoEntity } from './entities/sujeto.entity';
import { SujetosController } from './sujetos.controller';
import { SujetosService } from './sujetos.service';

@Module({
  imports: [TypeOrmModule.forFeature([SujetoEntity])],
  controllers: [SujetosController],
  providers: [SujetosService],
  exports: [SujetosService],
})
export class SujetosModule {}
