import { Injectable } from '@nestjs/common';
import { pool } from '../../db';
import { ProductListDto } from './dto';

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
export class ProductService {
  async productList(dto: ProductListDto): Promise<any> {
    const { page, limit } = dto;

    // Calculate the offset
    const offset = (page - 1) * limit;

    return await queryDB(
      `SELECT name, price FROM products WHERE deleted_at IS NULL LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  }

  async count(): Promise<any> {
    return await queryDB(
      `SELECT name FROM products WHERE deleted_at IS NULL`,
      null,
    );
  }
}
