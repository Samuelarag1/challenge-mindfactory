import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { VehicleLicensePlateParamDto } from './dto/automotor-dominio-param.dto';
import { CreateVehicleDto } from './dto/create-automotor.dto';
import { ListVehiclesQueryDto } from './dto/list-automotores-query.dto';
import { UpdateVehicleDto } from './dto/update-automotor.dto';
import { VehiclesService } from './automotores.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(@Query() query: ListVehiclesQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get(':licensePlate')
  findOne(@Param() params: VehicleLicensePlateParamDto) {
    return this.vehiclesService.findOneByLicensePlate(params.licensePlate);
  }

  @Post()
  create(@Body() payload: CreateVehicleDto) {
    return this.vehiclesService.create(payload);
  }

  @Put(':licensePlate')
  update(
    @Param() params: VehicleLicensePlateParamDto,
    @Body() payload: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(params.licensePlate, payload);
  }

  @Delete(':licensePlate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: VehicleLicensePlateParamDto) {
    await this.vehiclesService.remove(params.licensePlate);
  }
}
