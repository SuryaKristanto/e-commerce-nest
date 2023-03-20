import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

class Product {
  @IsNumber()
  @IsNotEmpty()
  code: number;

  @IsNumber()
  @IsNotEmpty()
  qty: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Product)
  products: Product[];

  @IsString()
  @IsNotEmpty()
  payment_method: string;
}
