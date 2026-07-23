import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Variant } from './variant.entity';
import { Media } from './media.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Variant, Media])],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}
