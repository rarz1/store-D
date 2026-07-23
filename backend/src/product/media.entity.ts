import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Variant } from './variant.entity';

@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: 'image' | 'video';

  @Column()
  url: string;

  @ManyToOne(() => Variant, (v) => v.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: Variant;

  @Column()
  variantId: number;
}
