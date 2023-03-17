import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response): Promise<any> {
    const register = await this.authService.register(dto);
    console.log(register);

    res.status(201).json({
      message: 'success create user',
      data: {
        name: dto.name,
        email: dto.email,
      },
    });
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response): Promise<any> {
    res.status(200).json({
      message: 'login succesful',
      token: await this.authService.login(dto),
    });
  }
}
