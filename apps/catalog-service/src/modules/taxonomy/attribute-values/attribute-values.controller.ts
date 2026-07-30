import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AttributeValuesService } from './attribute-values.service';
import { CreateAttributeValueDto } from './dtos/createAttributeValue.dto';
import { UpdateAttributeValueDto } from './dtos/updateAttributeValue.dto';
import { JwtAuthGuard } from '@app/common';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role, Roles } from '@app/common/decorators/roles.decorator';
import { AttributeValue } from '../../../generated/prisma/client';

@Controller('attribute-values')
export class AttributeValuesController {
  constructor(private readonly attributeValuesService: AttributeValuesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async createAttributeValues(
    @Body() dto: CreateAttributeValueDto,
  ): Promise<{ message: string; count: number }> {
    return await this.attributeValuesService.createAttributeValues(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateAttributeValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttributeValueDto,
  ): Promise<AttributeValue> {
    return await this.attributeValuesService.updateAttributeValue(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Delete(':attributeId/:id')
  async deleteAttributeValue(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return await this.attributeValuesService.deleteAttributeValue(attributeId, id);
  }
}
