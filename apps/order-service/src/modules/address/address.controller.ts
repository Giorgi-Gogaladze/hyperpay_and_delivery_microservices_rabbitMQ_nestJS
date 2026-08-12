import { Controller, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';
import { User } from '@app/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller('address')
export class AddressController {

  private logger = new Logger(AddressController.name);

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
  deleteAddress(
    @Param('id') id: string,
    @User('id') userId: string
  ):Promise<{message: string}>{
    return this.addressService.deleteAddress(id, userId);
  }


  @EventPattern('user.deleted')
  async handleUserDelete(
    @Payload() data: {userId: string},
    @Ctx() constxt: RmqContext
  ){
    const channel = constxt.getChannelRef();
    const originalMsg = constxt.getMessage();

    try {
      return await this.addressService.deleteAddressByUserId(data.userId);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Failed to delete address for user ${data.userId}`, error)
      channel.nack(originalMsg, false, false);
    }
  }
}
