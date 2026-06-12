import { Controller, Get, Post, Body, Param, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { InventoryService } from './inventory.service';

@Controller('api/v1/catalog/admin')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('variants/:id/stock')
  async adjustStock(
    @Req() req: Request & { shopId?: string },
    @Param('id') id: string,
    @Body() body: { adjustment: number; type?: string; note?: string },
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.inventoryService.adjustStock(shopId, id, body);
  }

  @Get('products/:productId/stock-logs')
  async getStockLogs(
    @Req() req: Request & { shopId?: string },
    @Param('productId') productId: string,
  ) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.inventoryService.getStockLogs(shopId, productId);
  }

  @Get('inventory')
  async getInventoryOverview(@Req() req: Request & { shopId?: string }) {
    const shopId = req.shopId;
    if (!shopId) throw new BadRequestException('Shop context missing');
    return this.inventoryService.getInventoryOverview(shopId);
  }
}
