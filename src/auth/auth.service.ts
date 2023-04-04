import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { connection } from '../db';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import { createHmac, randomBytes } from 'crypto';
import * as dotenv from 'dotenv';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { transporter } from './util/nodemailer';

dotenv.config();

async function queryDB(query, param) {
  return new Promise((resolve) => {
    connection.query(query, param, function (err, result, fields) {
      if (err) {
        //resolve('err : ' + err.stack);
        resolve('err :' + err.message);
      } else {
        resolve(result);
      }
    });
  });
}

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  async register(dto: RegisterDto): Promise<void> {
    const isRoleExist = (await queryDB(
      `SELECT id FROM roles WHERE id = ?`,
      dto.role_id,
    )) as { length: number }[];
    console.log(`isRoleExist: ${isRoleExist}`);

    // cek apakah role_id nya ada atau tidak
    if (isRoleExist.length === 0) {
      throw new NotFoundException(`Role not found`);
    }

    const isUserExist = (await queryDB(
      `SELECT email FROM  users WHERE email = ?`,
      dto.email,
    )) as { length: number }[];
    console.log(`isUserExist: ${isUserExist}`);

    // cek apakah ada user yang memiliki email yang sudah di register
    // if user exist, send error message
    if (isUserExist.length > 0) {
      throw new ConflictException(`Email ${dto.email} already exist`);
    }

    const isPhoneExist = (await queryDB(
      `SELECT phone FROM  users WHERE phone = ?`,
      dto.phone,
    )) as { length: number }[];
    console.log(`isPhoneExist: ${isPhoneExist}`);

    // cek apakah ada user yang memiliki phone yang sudah di register
    // if user exist, send error message
    if (isPhoneExist.length > 0) {
      throw new ConflictException(`Phone ${dto.phone} already exist`);
    }

    // hash pw karna secret (encrypt)
    // Hmac
    const encrypted = createHmac('sha256', process.env.SECRET)
      .update(dto.password)
      .digest('hex');
    // console.log(encrypted);

    const user = await queryDB(
      `INSERT INTO users (id,role_id,email,password,name,address,phone,updated_at,created_at) VALUES (DEFAULT,?,?,?,?,?,?,DEFAULT,DEFAULT)`,
      [dto.role_id, dto.email, encrypted, dto.name, dto.address, dto.phone],
    );
    console.log(`user: ${user}`);
  }

  async login(dto: LoginDto): Promise<string> {
    // cek email tersebut ada ngga di db
    const user = (await queryDB(
      `SELECT email, password FROM users WHERE email = ?`,
      dto.email,
    )) as { length: number; password: string }[];
    console.log(`user: ${user}`);

    // kalo gaada email, throw error user not found
    if (user.length === 0) {
      throw new NotFoundException(`Email ${dto.email} not found`);
    }

    const hashedPassword = createHmac('sha256', process.env.SECRET)
      .update(dto.password)
      .digest('hex');

    if (hashedPassword !== user[0].password)
      throw new ForbiddenException('Credentials incorrect');

    return this.signToken(dto);
  }

  async signToken(dto: LoginDto): Promise<string> {
    const user = await queryDB(
      `SELECT id, role_id FROM users WHERE email = ?`,
      dto.email,
    );

    let roleName = '';

    if (user[0].role_id === 1) {
      roleName = 'admin';
    } else if (user[0].role_id === 2) {
      roleName = 'member';
    } else {
      roleName = 'guest';
    }

    return this.jwt.signAsync(
      { user_id: user[0].id, role: roleName },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const subject = 'Reset Your Password';

    const isUserExist = (await queryDB(
      `SELECT email FROM  users WHERE email = ?`,
      dto.email,
    )) as { length: number }[];
    console.log(`isUserExist: ${isUserExist}`);

    // cek apakah ada user yang memiliki email yang sudah di register
    // if user doesn't exist, send error message
    if (isUserExist.length === 0) {
      throw new NotFoundException('Email not found');
    }

    const resetToken = randomBytes(16).toString('hex');
    const token = resetToken;
    const tokenExpired = moment().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');

    const user = await queryDB(
      `UPDATE users SET reset_token = ?, token_expired_at = ? WHERE email = ?`,
      [token, tokenExpired, dto.email],
    );
    console.log(`user: ${user}`);

    const mailOptions = {
      from: process.env.NODEMAILER_USER,
      to: dto.email,
      subject: subject,
      html: `Please click this link to reset your password: <a href="http://localhost:8080/reset-password?email=${dto.email}&token=${token}">Reset Password</a>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        throw new BadRequestException('Error: Something went wrong.');
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  async resetPassword(
    email: string,
    token: string,
    dto: ResetPasswordDto,
  ): Promise<any> {
    const encrypted = createHmac('sha256', process.env.SECRET)
      .update(dto.new_password)
      .digest('hex');
    // console.log(encrypted);

    const reset = await queryDB(
      `SELECT password, reset_token, token_expired_at FROM users WHERE email = ?`,
      email,
    );
    console.log(reset);

    const formatted = moment(reset[0].token_expired_at).format(
      'YYYY-MM-DD HH:mm:ss',
    );
    // console.log(formatted);

    if (token == reset[0].reset_token) {
      if (formatted > moment().format('YYYY-MM-DD HH:mm:ss')) {
        if (dto.confirm_new_password == dto.new_password) {
          const newPassword = await queryDB(
            `UPDATE users SET password = ? WHERE email = ?`,
            [encrypted, email],
          );
          console.log(newPassword);
        } else {
          throw new UnauthorizedException(
            'Incorrect new password confirmation',
          );
        }
      } else {
        throw new GoneException('Expired link');
      }
    } else {
      throw new ForbiddenException('Incorrect reset token');
    }
  }
}
