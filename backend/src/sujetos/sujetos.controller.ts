import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-sujeto.dto';
import { FindOwnerByCuitQueryDto } from './dto/find-sujeto-by-cuit-query.dto';
import { OwnersService } from './sujetos.service';

@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Get('by-cuit')
  findByCuit(@Query() query: FindOwnerByCuitQueryDto) {
    return this.ownersService.findByCuit(query.cuit);
  }

  @Post()
  create(@Body() payload: CreateOwnerDto) {
    return this.ownersService.create(payload);
  }
}
