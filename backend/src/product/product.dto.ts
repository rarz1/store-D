import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMediaDto {
  @IsString()
  @IsIn(['image', 'video'])
  type: 'image' | 'video';

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  size: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  media: CreateMediaDto[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];
}
