import { Controller, Get, Post, Patch, Param, Body, Req, Headers, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';

@Controller('api/v1/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('gateways')
  async getPublicGateways(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.paymentService.getPaymentGateways(shopId, false);
  }

  @Get('admin/gateways')
  async getAdminGateways(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.paymentService.getPaymentGateways(shopId, true);
  }

  @Patch('admin/gateways/:id')
  async updateGateway(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() dto: { name?: string; is_active?: boolean; config?: any; sort_order?: number }
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.paymentService.updatePaymentGateway(shopId, id, dto);
  }

  @Post('razorpay/order')
  async createOrder(
    @Req() req: Request & { shopId?: string },
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('receiptId') receiptId: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    if (!amount || !receiptId) {
      throw new BadRequestException('Amount and receiptId are required');
    }
    return this.paymentService.createRazorpayOrder(shopId, amount, currency || 'INR', receiptId);
  }

  @Post('razorpay/initialize/:orderId')
  async initializePayment(
    @Req() req: Request & { shopId?: string },
    @Param('orderId') orderId: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.paymentService.initializePayment(shopId, orderId);
  }

  @Post('razorpay/verify')
  async verifyPayment(
    @Req() req: Request & { shopId?: string },
    @Body() dto: {
      orderId: string;
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.paymentService.verifyPayment(shopId, dto);
  }

  @Post('razorpay/webhook')
  async handleWebhook(
    @Req() req: Request & { shopId?: string },
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Razorpay signature header missing');
    }

    const shopId = req.shopId || '';

    // signature checks require the raw request body payload
    const rawBodyBuffer = (req as any).rawBody;
    const rawBody = Buffer.isBuffer(rawBodyBuffer)
      ? rawBodyBuffer.toString('utf8')
      : typeof rawBodyBuffer === 'string'
        ? rawBodyBuffer
        : JSON.stringify(payload);
    
    const isValid = await this.paymentService.verifyWebhookSignature(shopId, rawBody, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Razorpay signature');
    }

    return this.paymentService.handleWebhook(shopId, payload);
  }
}
