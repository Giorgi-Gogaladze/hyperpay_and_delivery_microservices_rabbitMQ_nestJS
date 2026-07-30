import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dtos/create-attribute.dto';
import { Attribute } from '../../../generated/prisma/client';
import { UpdateAttributeDto } from './dtos/update-attribute.dto';
import { JwtAuthGuard } from '@app/common';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role, Roles } from '@app/common/decorators/roles.decorator';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async createAttribute(
    @Body() dto: CreateAttributeDto
  ): Promise<Attribute>{
    return await this.attributesService.createAttribute(dto);
  }

  @Get()
  async getAllAttributes(): Promise<Attribute[]>{
    return await this.attributesService.getAllAttributes();
  }

  @Get('/:id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<Attribute>{
    return await this.attributesService.getById(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('/:id')
  async updateAttribute(
    @Body() dto: UpdateAttributeDto,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<Attribute>{
    return await this.attributesService.updateAttribute(id, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Delete('/:id')
  async deleteAttribute(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{message: string}>{
    return await this.attributesService.deleteAttribute(id)
  }
}
