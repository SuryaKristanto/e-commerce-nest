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
import { RegisterDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response): Promise<any> {
    const isRoleExist = await this.authService.isRoleExist(dto);

    const isUserExist = await this.authService.isUserExist(dto);

    const isPhoneExist = await this.authService.isPhoneExist(dto);

    // cek apakah role_id nya ada atau tidak
    if (isRoleExist.length < 1) {
      throw new HttpException(
        {
          statusCode: 404,
          message: 'role not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    // console.log(isRoleExist.length);

    // cek apakah ada user yang memiliki email yang sudah di register
    // if user exist, send error message
    if (isUserExist.length > 0) {
      throw new HttpException(
        {
          statusCode: 409,
          message: 'email already exist',
        },
        HttpStatus.CONFLICT,
      );
    }
    // console.log(isUserExist.length);

    // cek apakah ada user yang memiliki phone yang sudah di register
    // if user exist, send error message
    if (isPhoneExist.length > 0) {
      throw new HttpException(
        {
          statusCode: 409,
          message: 'phone already exist',
        },
        HttpStatus.CONFLICT,
      );
    }
    // console.log(isPhoneExist.length);

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
}
