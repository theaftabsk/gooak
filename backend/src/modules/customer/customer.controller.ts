import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { CustomerService } from './customer.service';

@Controller('api/v1/catalog/customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('register')
  async customerRegister(
    @Req() req: Request & { shopId?: string },
    @Body()
    dto: { name: string; email: string; phone?: string; password: string },
  ) {
    const shopId = req.shopId;
    if (!shopId)
      throw new BadRequestException('Shop context missing from request');
    return this.customerService.customerRegister(shopId, dto);
  }

  @Post('login')
  async customerLogin(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { email: string; password: string },
  ) {
    const shopId = req.shopId;
    if (!shopId)
      throw new BadRequestException('Shop context missing from request');
    return this.customerService.customerLogin(shopId, dto);
  }

  @Get('me')
  async getCustomerMe(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId)
      throw new BadRequestException('Shop context missing from request');
    const token = (req.headers as any)['authorization']?.replace('Bearer ', '');
    if (!token) throw new BadRequestException('Authorization token required');
    const { customerId } =
      await this.customerService.verifyCustomerToken(token);
    return this.customerService.getCustomerMe(shopId, customerId);
  }

  @Patch('me')
  async updateCustomerMe(
    @Req() req: Request & { shopId?: string },
    @Body()
    dto: {
      name?: string;
      phone?: string;
      avatar_url?: string;
      current_password?: string;
      new_password?: string;
    },
  ) {
    const shopId = req.shopId;
    if (!shopId)
      throw new BadRequestException('Shop context missing from request');
    const token = (req.headers as any)['authorization']?.replace('Bearer ', '');
    if (!token) throw new BadRequestException('Authorization token required');
    const { customerId } =
      await this.customerService.verifyCustomerToken(token);
    return this.customerService.updateCustomerMe(shopId, customerId, dto);
  }

  @Get('orders')
  async getCustomerOrders(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId)
      throw new BadRequestException('Shop context missing from request');
    const token = (req.headers as any)['authorization']?.replace('Bearer ', '');
    if (!token) throw new BadRequestException('Authorization token required');
    const { customerId } =
      await this.customerService.verifyCustomerToken(token);
    return this.customerService.getCustomerOrders(shopId, customerId);
  }
}
