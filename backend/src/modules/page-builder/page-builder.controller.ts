import { Controller, Get, Post, Delete, Body, Param, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { PageBuilderService } from './page-builder.service';

@Controller('api/v1/page-builder')
export class PageBuilderController {
  constructor(private readonly pageBuilderService: PageBuilderService) {}

  @Get('pages')
  async getPages(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.pageBuilderService.getPages(shopId);
  }

  @Get('pages/by-slug/:slug')
  async getPageBySlug(
    @Req() req: Request & { shopId?: string },
    @Param('slug') slug: string
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.pageBuilderService.getPageBySlug(shopId, slug);
  }

  @Get('pages/:id')
  async getPageById(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.pageBuilderService.getPageById(shopId, id);
  }

  @Post('pages')
  async savePage(
    @Req() req: Request & { shopId?: string },
    @Body() dto: {
      id?: string;
      title: string;
      slug: string;
      type: 'NORMAL' | 'COLLECTION';
      theme: any;
      widgets: any[];
    }
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.pageBuilderService.savePage(shopId, dto);
  }

  @Post('pages/:id/publish')
  async publishPage(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.pageBuilderService.publishPage(shopId, id);
  }

  @Delete('pages/:id')
  async deletePage(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string
  ) {
    const shopId = req.shopId;
    if (!shopId) {
      throw new BadRequestException('Shop context missing from request');
    }
    return this.pageBuilderService.deletePage(shopId, id);
  }
}
