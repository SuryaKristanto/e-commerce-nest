import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { pool } from '../db';
import { LoginDto, RegisterDto } from './dto';
import { createHmac } from 'crypto';
import * as dotenv from 'dotenv';
import { JwtService } from '@nestjs/jwt';

dotenv.config();

async function queryDB(query, param) {
  return new Promise((resolve) => {
    pool.query(query, param, function (err, result, fields) {
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

  async register(dto: RegisterDto): Promise<any> {
    const isRoleExist = (await queryDB(
      `SELECT id FROM roles WHERE id = ?`,
      dto.role_id,
    )) as { length: number }[];

    // cek apakah role_id nya ada atau tidak
    if (isRoleExist.length === 0) {
      throw new NotFoundException(`Role not found`);
    }

    const isUserExist = (await queryDB(
      `SELECT email FROM  users WHERE email = ?`,
      dto.email,
    )) as { length: number }[];

    // cek apakah ada user yang memiliki email yang sudah di register
    // if user exist, send error message
    if (isUserExist.length > 0) {
      throw new ConflictException(`Email ${dto.email} already exist`);
    }

    const isPhoneExist = (await queryDB(
      `SELECT phone FROM  users WHERE phone = ?`,
      dto.phone,
    )) as { length: number }[];

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

    return await queryDB(
      `INSERT INTO users (id,role_id,email,password,name,address,phone,updated_at,created_at) VALUES (DEFAULT,?,?,?,?,?,?,DEFAULT,DEFAULT)`,
      [dto.role_id, dto.email, encrypted, dto.name, dto.address, dto.phone],
    );
  }

  async login(dto: LoginDto): Promise<any> {
    // cek email tersebut ada ngga di db
    const user = (await queryDB(
      `SELECT email, password FROM users WHERE email = ?`,
      dto.email,
    )) as { length: number; password: string }[];

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

  async signToken(dto: LoginDto): Promise<any> {
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
}
