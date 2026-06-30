import { Controller, Post, Param, Body, Req, Headers, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { CheckoutService } from './checkout.service';

// Customer-facing Razorpay payment flow.
// Routes stay under /api/v1/payments/razorpay/* to preserve existing frontend calls.
@Controller('api/v1/payments')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('razorpay/order')
  createRazorpayOrder(
    @Req() req: Request & { shopId?: string },
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('receiptId') receiptId: string,
  ) {
    if (!req.shopId) throw new BadRequestException('Shop context missing');
    if (!amount || !receiptId) throw new BadRequestException('amount and receiptId are required');
    return this.checkoutService.createRazorpayOrder(req.shopId, amount, currency || 'INR', receiptId);
  }

  @Post('razorpay/initialize/:orderId')
  initializePayment(@Req() req: Request & { shopId?: string }, @Param('orderId') orderId: string) {
    if (!req.shopId) throw new BadRequestException('Shop context missing');
    return this.checkoutService.initializePayment(req.shopId, orderId);
  }

  @Post('razorpay/verify')
  verifyPayment(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { orderId: string; razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string },
  ) {
    if (!req.shopId) throw new BadRequestException('Shop context missing');
    return this.checkoutService.verifyPayment(req.shopId, dto);
  }

  @Post('razorpay/webhook')
  async handleWebhook(
    @Req() req: Request & { shopId?: string },
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    if (!signature) throw new BadRequestException('Razorpay signature header missing');

    const shopId = req.shopId || '';
    const rawBodyBuffer = (req as any).rawBody;
    const rawBody = Buffer.isBuffer(rawBodyBuffer)
      ? rawBodyBuffer.toString('utf8')
      : typeof rawBodyBuffer === 'string'
        ? rawBodyBuffer
        : JSON.stringify(payload);

    const isValid = await this.checkoutService.verifyWebhookSignature(shopId, rawBody, signature);
    if (!isValid) throw new UnauthorizedException('Invalid Razorpay signature');

    return this.checkoutService.handleWebhook(shopId, payload);
  }

  @Post('razorpay/simulate/:orderId')
  simulatePayment(@Req() req: Request & { shopId?: string }, @Param('orderId') orderId: string) {
    if (!req.shopId) throw new BadRequestException('Shop context missing');
    return this.checkoutService.simulatePayment(req.shopId, orderId);
  }
}
