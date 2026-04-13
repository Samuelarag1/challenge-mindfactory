import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerEntity } from './entities/sujeto.entity';
import { OwnersController } from './sujetos.controller';
import { OwnersService } from './sujetos.service';

@Module({
  imports: [TypeOrmModule.forFeature([OwnerEntity])],
  controllers: [OwnersController],
  providers: [OwnersService],
  exports: [OwnersService],
})
export class OwnersModule {}
