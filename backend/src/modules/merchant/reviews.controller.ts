import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';

@Controller('api/v1/merchant')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  async getProductReviews(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.reviewsService.getProductReviews(shopId, productId);
  }

  @Post('products/:productId/reviews')
  async createReview(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string,
    @Body()
    dto: {
      reviewer_name?: string;
      rating: number;
      title?: string;
      body?: string;
      status?: string;
    },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.reviewsService.createReview(shopId, productId, dto);
  }

  @Patch('reviews/:id/status')
  async updateReviewStatus(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.reviewsService.updateReviewStatus(shopId, id, body.status);
  }

  @Delete('reviews/:id')
  async deleteReview(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.reviewsService.deleteReview(shopId, id);
  }
}
