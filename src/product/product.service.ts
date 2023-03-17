import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db';
import { ProductListDto } from './dto';
import { CreateProductDto } from './dto/create-product';

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
    // Calculate the offset
    const offset = (dto.page - 1) * dto.limit;

    const products = (await queryDB(
      `SELECT name, price FROM products WHERE deleted_at IS NULL LIMIT ? OFFSET ?`,
      [dto.limit, offset],
    )) as { length: number }[];

    if (products.length === 0) {
      // kalo ngga ada data, maka return status
      throw new NotFoundException('Product not found');
    } else {
      return products;
    }
  }

  async count(dto: ProductListDto): Promise<any> {
    const count = (await queryDB(
      `SELECT name FROM products WHERE deleted_at IS NULL`,
      null,
    )) as { length: number }[];

    return {
      totalFindings: count.length,
      currentPage: dto.page,
      nextPage: Math.min(Math.ceil(count.length / dto.limit), dto.page + 1),
      prevPage: Math.max(1, dto.page - 1),
      totalPage: Math.ceil(count.length / dto.limit),
    };
  }

  async createProduct(dto: CreateProductDto): Promise<any> {
    return await queryDB(
      `INSERT INTO products (code, name, price, weight, qty, updated_at, created_at) VALUES (DEFAULT,?,?,?,?,DEFAULT,DEFAULT)`,
      [dto.name, dto.price, dto.weight, dto.qty],
    );
  }
}
