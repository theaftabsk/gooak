import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { PageBuilderController } from './page-builder.controller';
import { PageBuilderService } from './page-builder.service';

@Module({
  imports: [PrismaModule],
  controllers: [PageBuilderController],
  providers: [PageBuilderService],
  exports: [PageBuilderService],
})
export class PageBuilderModule {}
