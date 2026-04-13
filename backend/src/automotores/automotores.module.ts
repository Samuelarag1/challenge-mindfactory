import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerEntity } from '../sujetos/entities/sujeto.entity';
import { VehiclesController } from './automotores.controller';
import { VehiclesService } from './automotores.service';
import { VehicleEntity } from './entities/automotor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleEntity, OwnerEntity])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
