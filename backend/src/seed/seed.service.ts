import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { Product } from '../product/product.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.categoryRepo.count();
    if (count > 0) return;

    const remeras = await this.categoryRepo.save({ name: 'Remeras' });
    const pantalones = await this.categoryRepo.save({ name: 'Pantalones' });
    const buzos = await this.categoryRepo.save({ name: 'Buzos' });
    const accesorios = await this.categoryRepo.save({ name: 'Accesorios' });

    await this.productRepo.save([
      {
        name: 'Remera Básica Algodón',
        description: 'Remera de algodón peinado 24.1, corte clásico. Ideal para uso diario.',
        price: 8500,
        category: remeras,
        variants: [
          { color: 'Negro', size: 'S', media: [{ type: 'image', url: 'https://picsum.photos/seed/remera-negra-s/400/500' }] },
          { color: 'Negro', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/remera-negra-m/400/500' }] },
          { color: 'Negro', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/remera-negra-l/400/500' }] },
          { color: 'Blanco', size: 'S', media: [{ type: 'image', url: 'https://picsum.photos/seed/remera-blanca-s/400/500' }] },
          { color: 'Blanco', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/remera-blanca-m/400/500' }] },
          { color: 'Blanco', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/remera-blanca-l/400/500' }] },
          { color: 'Azul', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/remera-azul-m/400/500' }] },
          { color: 'Azul', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/remera-azul-l/400/500' }] },
        ],
      },
      {
        name: 'Remera Oversize Estampada',
        description: 'Remera oversize con estampado frontal. Corte moderno y relajado.',
        price: 10500,
        category: remeras,
        variants: [
          { color: 'Negro', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/oversize-negra-m/400/500' }] },
          { color: 'Negro', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/oversize-negra-l/400/500' }] },
          { color: 'Negro', size: 'XL', media: [{ type: 'image', url: 'https://picsum.photos/seed/oversize-negra-xl/400/500' }] },
          { color: 'Gris', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/oversize-gris-m/400/500' }] },
          { color: 'Gris', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/oversize-gris-l/400/500' }] },
        ],
      },
      {
        name: 'Pantalón Cargo',
        description: 'Pantalón cargo de gabardina con bolsillos laterales. Elástico en cintura.',
        price: 18900,
        category: pantalones,
        variants: [
          { color: 'Negro', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/cargo-negro-m/400/500' }] },
          { color: 'Negro', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/cargo-negro-l/400/500' }] },
          { color: 'Negro', size: 'XL', media: [{ type: 'image', url: 'https://picsum.photos/seed/cargo-negro-xl/400/500' }] },
          { color: 'Verde', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/cargo-verde-m/400/500' }] },
          { color: 'Verde', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/cargo-verde-l/400/500' }] },
        ],
      },
      {
        name: 'Pantalón Chino',
        description: 'Pantalón chino de vestir, tela sarga premium. Corte recto.',
        price: 16500,
        category: pantalones,
        variants: [
          { color: 'Beige', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/chino-beige-m/400/500' }] },
          { color: 'Beige', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/chino-beige-l/400/500' }] },
          { color: 'Azul', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/chino-azul-m/400/500' }] },
          { color: 'Azul', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/chino-azul-l/400/500' }] },
        ],
      },
      {
        name: 'Buzo Canguro',
        description: 'Buzo canguro con capucha. Interior frizado, bolsillo delantero.',
        price: 22500,
        category: buzos,
        variants: [
          { color: 'Negro', size: 'S', media: [{ type: 'image', url: 'https://picsum.photos/seed/buzo-negro-s/400/500' }] },
          { color: 'Negro', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/buzo-negro-m/400/500' }] },
          { color: 'Negro', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/buzo-negro-l/400/500' }] },
          { color: 'Gris', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/buzo-gris-m/400/500' }] },
          { color: 'Gris', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/buzo-gris-l/400/500' }] },
        ],
      },
      {
        name: 'Buzo Hoodie',
        description: 'Hoodie premium con bordado. Algodón frisado pesado.',
        price: 25900,
        category: buzos,
        variants: [
          { color: 'Negro', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/hoodie-negro-m/400/500' }] },
          { color: 'Negro', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/hoodie-negro-l/400/500' }] },
          { color: 'Negro', size: 'XL', media: [{ type: 'image', url: 'https://picsum.photos/seed/hoodie-negro-xl/400/500' }] },
          { color: 'Blanco', size: 'M', media: [{ type: 'image', url: 'https://picsum.photos/seed/hoodie-blanco-m/400/500' }] },
          { color: 'Blanco', size: 'L', media: [{ type: 'image', url: 'https://picsum.photos/seed/hoodie-blanco-l/400/500' }] },
        ],
      },
      {
        name: 'Gorra Trucker',
        description: 'Gorra estilo trucker con malla. Curva plana ajustable.',
        price: 6500,
        category: accesorios,
        variants: [
          { color: 'Negro', size: 'Único', media: [{ type: 'image', url: 'https://picsum.photos/seed/gorra-negra/400/500' }] },
          { color: 'Rojo', size: 'Único', media: [{ type: 'image', url: 'https://picsum.photos/seed/gorra-roja/400/500' }] },
          { color: 'Azul', size: 'Único', media: [{ type: 'image', url: 'https://picsum.photos/seed/gorra-azul/400/500' }] },
        ],
      },
      {
        name: 'Mochila Urbana',
        description: 'Mochila urbana 25L con compartimiento para notebook. Impermeable.',
        price: 19900,
        category: accesorios,
        variants: [
          { color: 'Negro', size: 'Único', media: [{ type: 'image', url: 'https://picsum.photos/seed/mochila-negra/400/500' }] },
          { color: 'Gris', size: 'Único', media: [{ type: 'image', url: 'https://picsum.photos/seed/mochila-gris/400/500' }] },
        ],
      },
    ]);
  }
}
