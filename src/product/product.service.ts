import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db';
import { ProductListDto } from './dto';
import { CreateProductDto } from './dto/create-product';
import { UpdateProductDto } from './dto/update-product';

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

  async deleteProduct(code: number): Promise<any> {
    const findProduct = (await queryDB(
      `SELECT name FROM products WHERE code = ? AND deleted_at IS NULL`,
      code,
    )) as { length: number }[];
    // console.log(findProduct);

    if (findProduct.length === 0) {
      throw new NotFoundException('Product not found');
    }

    return await queryDB(
      `UPDATE products SET deleted_at = NOW() WHERE code = ?`,
      code,
    );
  }

  async updateProduct(code: number, dto: UpdateProductDto): Promise<any> {
    const product = (await queryDB(
      `SELECT code FROM products WHERE code = ? AND deleted_at IS NULL`,
      code,
    )) as { length: number }[];

    if (product.length === 0) {
      throw new NotFoundException('Product not found');
    }

    return await queryDB(
      `UPDATE products SET name = COALESCE(?, name), price = COALESCE(?, price), weight = COALESCE(?, weight), qty = COALESCE(?, qty) WHERE code = ?`,
      [dto.name, dto.price, dto.weight, dto.qty, code],
    );
  }

  async productDetail(name: string): Promise<any> {
    const product = (await queryDB(
      `SELECT name, price, weight, qty FROM products WHERE name = ? AND deleted_at IS NULL`,
      name,
    )) as { length: number };

    if (product.length === 0) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async searchProduct(query: string): Promise<any> {
    const product = (await queryDB(
      `SELECT name, price FROM products WHERE deleted_at IS NULL`,
      null,
    )) as { length: number }[];

    // eslint-disable-next-line prefer-const
    let productData = [];
    for (let i = 0; i < product.length; i++) {
      productData[i] = {};
      productData[i] = product[i];
    }

    const filteredProducts = productData.filter((product) => {
      const nameMatches = product.name
        .toLowerCase()
        .includes(query.toLowerCase());
      return nameMatches;
    });
    return filteredProducts;
  }
}
