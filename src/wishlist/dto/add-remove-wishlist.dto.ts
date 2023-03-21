import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddRemoveWishlistDto {
  @IsNumber()
  @IsNotEmpty()
  product_code: number;
}
