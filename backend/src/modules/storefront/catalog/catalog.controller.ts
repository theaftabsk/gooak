import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { CatalogService } from './catalog.service';

@Controller('api/v1/storefront')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('homepage')
  getHomepage(@Req() req: Request & { shopId?: string }) {
    return this.catalogService.getHomepageData(req.shopId!);
  }

  @Get('products')
  getProducts(@Req() req: Request & { shopId?: string }, @Query() query: any) {
    return this.catalogService.getProducts(req.shopId!, query);
  }

  @Get('products/:slug')
  getProductBySlug(@Req() req: Request & { shopId?: string }, @Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(req.shopId!, slug);
  }

  @Get('categories')
  getCategories(@Req() req: Request & { shopId?: string }) {
    return this.catalogService.getCategories(req.shopId!);
  }

  @Get('brands')
  getBrands(@Req() req: Request & { shopId?: string }) {
    return this.catalogService.getBrands(req.shopId!);
  }

  @Get('collections')
  getCollections(@Req() req: Request & { shopId?: string }) {
    return this.catalogService.getCollections(req.shopId!);
  }

  @Get('collections/:slug')
  getCollectionBySlug(@Req() req: Request & { shopId?: string }, @Param('slug') slug: string, @Query() query: any) {
    return this.catalogService.getCollectionBySlug(req.shopId!, slug, query);
  }

  @Get('settings')
  getSettings() {
    return this.catalogService.getPublicSystemSettings();
  }
}
