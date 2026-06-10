import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // This is the magic decorator that means you don't have to keep importing it
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}