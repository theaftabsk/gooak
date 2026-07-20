import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductReviews(shopId: string, productId: string) {
    return this.prisma.review.findMany({
      where: { shop_id: shopId, product_id: productId },
      orderBy: { created_at: 'desc' },
    });
  }

  async createReview(
    shopId: string,
    productId: string,
    dto: {
      reviewer_name?: string;
      rating: number;
      title?: string;
      body?: string;
      status?: string;
    },
  ) {
    return this.prisma.review.create({
      data: {
        shop_id: shopId,
        product_id: productId,
        rating: dto.rating,
        title: dto.title || null,
        body: dto.body || null,
        status: dto.status || 'approved',
      },
    });
  }

  async deleteReview(shopId: string, reviewId: string) {
    return this.prisma.review.delete({
      where: { id: reviewId, shop_id: shopId },
    });
  }

  async updateReviewStatus(shopId: string, reviewId: string, status: string) {
    return this.prisma.review.update({
      where: { id: reviewId, shop_id: shopId },
      data: { status },
    });
  }

  async getAllReviews(shopId: string) {
    return this.prisma.review.findMany({
      where: { shop_id: shopId },
      include: {
        product: { select: { name: true, slug: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
