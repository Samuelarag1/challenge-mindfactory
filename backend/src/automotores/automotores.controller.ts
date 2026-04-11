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
import { AutomotorDominioParamDto } from './dto/automotor-dominio-param.dto';
import { CreateAutomotorDto } from './dto/create-automotor.dto';
import { ListAutomotoresQueryDto } from './dto/list-automotores-query.dto';
import { UpdateAutomotorDto } from './dto/update-automotor.dto';
import { AutomotoresService } from './automotores.service';

@Controller('automotores')
export class AutomotoresController {
  constructor(private readonly automotoresService: AutomotoresService) {}

  @Get()
  findAll(@Query() query: ListAutomotoresQueryDto) {
    return this.automotoresService.findAll(query);
  }

  @Get(':dominio')
  findOne(@Param() params: AutomotorDominioParamDto) {
    return this.automotoresService.findOneByDominio(params.dominio);
  }

  @Post()
  create(@Body() payload: CreateAutomotorDto) {
    return this.automotoresService.create(payload);
  }

  @Put(':dominio')
  update(
    @Param() params: AutomotorDominioParamDto,
    @Body() payload: UpdateAutomotorDto,
  ) {
    return this.automotoresService.update(params.dominio, payload);
  }

  @Delete(':dominio')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: AutomotorDominioParamDto) {
    await this.automotoresService.remove(params.dominio);
  }
}
