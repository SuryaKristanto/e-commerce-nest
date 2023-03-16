import { Injectable } from '@nestjs/common';
import { pool } from '../db';
import { RegisterDto } from './dto';
import { createHmac } from 'crypto';
import * as dotenv from 'dotenv';

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
  async isRoleExist(dto: RegisterDto): Promise<any> {
    return await queryDB(`SELECT id FROM roles WHERE id = ?`, dto.role_id);
  }

  async isUserExist(dto: RegisterDto): Promise<any> {
    return await queryDB(`SELECT email FROM  users WHERE email = ?`, dto.email);
  }

  async isPhoneExist(dto: RegisterDto): Promise<any> {
    return await queryDB(`SELECT phone FROM  users WHERE phone = ?`, dto.phone);
  }

  async register(dto: RegisterDto): Promise<any> {
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
}
