import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateSujetoDto } from './dto/create-sujeto.dto';
import { FindSujetoByCuitQueryDto } from './dto/find-sujeto-by-cuit-query.dto';
import { SujetosService } from './sujetos.service';

@Controller('sujetos')
export class SujetosController {
  constructor(private readonly sujetosService: SujetosService) {}

  @Get('by-cuit')
  findByCuit(@Query() query: FindSujetoByCuitQueryDto) {
    return this.sujetosService.findByCuit(query.cuit);
  }

  @Post()
  create(@Body() payload: CreateSujetoDto) {
    return this.sujetosService.create(payload);
  }
}
