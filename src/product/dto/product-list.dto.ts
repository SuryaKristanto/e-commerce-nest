import { IsNumber, IsNotEmpty } from 'class-validator';

export class ProductListDto {
  @IsNumber()
  @IsNotEmpty()
  page: number;

  @IsNumber()
  @IsNotEmpty()
  limit: number;
}
