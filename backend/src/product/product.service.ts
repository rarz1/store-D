import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      category: { id: dto.categoryId },
      variants: dto.variants.map((v) => ({
        color: v.color,
        size: v.size,
        media: v.media,
      })),
    });
    return this.productRepo.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepo.find({
      relations: { category: true, variants: { media: true } },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product | null> {
    return this.productRepo.findOne({
      where: { id },
      relations: { category: true, variants: { media: true } },
    });
  }

  async remove(id: number): Promise<void> {
    await this.productRepo.delete(id);
  }
}
