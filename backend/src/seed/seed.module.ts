import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../category/category.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../product/variant.entity';
import { Media } from '../product/media.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, Variant, Media])],
  providers: [SeedService],
})
export class SeedModule {}
