import { Controller, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  createAddress(@Body() dto: CreateAddressDto) {
    return this.addressService.createAddress(dto);
  }

  @Patch(':id')
  updateAddress(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressService.updateAddress(id, dto);
  }

  @Delete(':id')
  deleteAddress(@Param('id') id: string) {
    return this.addressService.deleteAddress(id);
  }
}
