import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InterestModule } from './interest/interest.module';
import { Interest } from './interest/interest.entity';
import { CategoryModule } from './category/category.module';
import { Category } from './category/category.entity';
import { ProductModule } from './product/product.module';
import { Product } from './product/product.entity';
import { Variant } from './product/variant.entity';
import { Media } from './product/media.entity';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT ?? "5432", 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [Interest, Category, Product, Variant, Media],
      synchronize: true,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    InterestModule,
    CategoryModule,
    ProductModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

