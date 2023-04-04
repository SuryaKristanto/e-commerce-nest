import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  new_password: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  confirm_new_password: string;
}
