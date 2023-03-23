import { Body, Controller, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response): Promise<any> {
    await this.authService.register(dto);

    res.status(201).json({
      message: 'Success create user',
      data: {
        name: dto.name,
        email: dto.email,
      },
    });
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response): Promise<any> {
    res.status(200).json({
      message: 'Login succesful',
      token: await this.authService.login(dto),
    });
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<any> {
    await this.authService.forgotPassword(dto);
    return 'Email sent. Please check your email to reset your password.';
  }

  @Post('reset-password')
  async resetPassword(
    @Query('email') email: string,
    @Query('token') token: string,
    @Body() dto: ResetPasswordDto,
    @Res() res: Response,
  ): Promise<any> {
    await this.authService.resetPassword(email, token, dto);
    res.status(200).json({
      message: 'Password reset successful',
    });
  }
}
