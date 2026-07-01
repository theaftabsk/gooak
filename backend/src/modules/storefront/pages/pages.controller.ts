import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { PagesService } from './pages.service';

@Controller('api/v1/storefront')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('page-content')
  getPageContent(@Req() req: Request & { shopId?: string }) {
    return this.pagesService.getPageContent(req.shopId!);
  }

  @Get('pages/:slug')
  getPageBySlug(@Req() req: Request & { shopId?: string }, @Param('slug') slug: string) {
    return this.pagesService.getPageBySlug(req.shopId!, slug);
  }

  @Post('contact')
  submitContact(
    @Req() req: Request & { shopId?: string },
    @Body() dto: { name: string; email: string; subject?: string; message: string },
  ) {
    return this.pagesService.submitContactForm(req.shopId!, dto);
  }

  @Post('requests')
  createTenantRequest(
    @Body() dto: { name: string; slug: string; ownerName: string; ownerEmail: string; phone?: string; category?: string },
  ) {
    return this.pagesService.createTenantRequest(dto);
  }
}
