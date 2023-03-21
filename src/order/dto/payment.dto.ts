import { IsNotEmpty, IsNumber } from 'class-validator';

export class PaymentDto {
  @IsNumber()
  @IsNotEmpty()
  payment_amount: number;
}
