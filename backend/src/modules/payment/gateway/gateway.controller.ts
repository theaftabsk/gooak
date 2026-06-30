import { Controller, Get, Patch, Param, Body, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { GatewayService } from './gateway.service';

@Controller('api/v1/payments')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  // Public — storefront uses this to show available payment methods (key_secret stripped)
  @Get('gateways')
  getPublicGateways(@Req() req: Request & { shopId?: string }) {
    if (!req.shopId) throw new BadRequestException('Shop context missing');
    return this.gatewayService.getPaymentGateways(req.shopId, false);
  }

  // Merchant admin — full config including key_secret
  @Get('merchant/gateways')
  getAdminGateways(@Req() req: Request & { shopId?: string }) {
    if (!req.shopId) throw new BadRequestException('Shop context missing');
    return this.gatewayService.getPaymentGateways(req.shopId, true);
  }

  @Patch('merchant/gateways/:id')
  updateGateway(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: { name?: string; is_active?: boolean; config?: any; sort_order?: number },
  ) {
    if (!req.shopId) throw new BadRequestException('Shop context missing');
    return this.gatewayService.updatePaymentGateway(req.shopId, id, dto);
  }
}
