import { Injectable, NotFoundException } from '@nestjs/common';
import { connection } from '../db';
import { ProductListDto } from './dto';
import { CreateProductDto } from './dto/create-product';
import { UpdateProductDto } from './dto/update-product';

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
export class ProductService {
  async productList(dto: ProductListDto): Promise<object> {
    // Calculate the offset
    const offset = (dto.page - 1) * dto.limit;

    const products = (await queryDB(
      `SELECT name, price FROM products WHERE deleted_at IS NULL LIMIT ? OFFSET ?`,
      [dto.limit, offset],
    )) as { length: number }[];
    console.log(`products: ${products}`);

    if (products.length === 0) {
      // kalo ngga ada data, maka return status
      throw new NotFoundException('Product not found');
    } else {
      return products;
    }
  }

  async count(dto: ProductListDto): Promise<object> {
    const count = (await queryDB(
      `SELECT name FROM products WHERE deleted_at IS NULL`,
      null,
    )) as { length: number }[];
    console.log(`count: ${count}`);

    return {
      totalFindings: count.length,
      currentPage: dto.page,
      nextPage: Math.min(Math.ceil(count.length / dto.limit), dto.page + 1),
      prevPage: Math.max(1, dto.page - 1),
      totalPage: Math.ceil(count.length / dto.limit),
    };
  }

  async createProduct(dto: CreateProductDto): Promise<void> {
    const product = await queryDB(
      `INSERT INTO products (code, name, price, weight, qty, updated_at, created_at) VALUES (DEFAULT,?,?,?,?,DEFAULT,DEFAULT)`,
      [dto.name, dto.price, dto.weight, dto.qty],
    );
    console.log(`product: ${product}`);
  }

  async deleteProduct(code: number): Promise<void> {
    const findProduct = (await queryDB(
      `SELECT name FROM products WHERE code = ? AND deleted_at IS NULL`,
      code,
    )) as { length: number }[];
    console.log(`findProduct: ${findProduct}`);

    if (findProduct.length === 0) {
      throw new NotFoundException('Product not found');
    }

    const softDelete = await queryDB(
      `UPDATE products SET deleted_at = NOW() WHERE code = ?`,
      code,
    );
    console.log(`softDelete: ${softDelete}`);
  }

  async updateProduct(code: number, dto: UpdateProductDto): Promise<void> {
    const product = (await queryDB(
      `SELECT code FROM products WHERE code = ? AND deleted_at IS NULL`,
      code,
    )) as { length: number }[];

    if (product.length === 0) {
      throw new NotFoundException('Product not found');
    }

    const update = await queryDB(
      `UPDATE products SET name = COALESCE(?, name), price = COALESCE(?, price), weight = COALESCE(?, weight), qty = COALESCE(?, qty) WHERE code = ?`,
      [dto.name, dto.price, dto.weight, dto.qty, code],
    );
    console.log(`update: ${update}`);
  }

  async productDetail(name: string): Promise<object> {
    const product = (await queryDB(
      `SELECT name, price, weight, qty FROM products WHERE name = ? AND deleted_at IS NULL`,
      name,
    )) as { length: number };
    console.log(`product: ${product}`);

    if (product.length === 0) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async searchProduct(query: string): Promise<object[]> {
    const product = (await queryDB(
      `SELECT name, price FROM products WHERE deleted_at IS NULL`,
      null,
    )) as { length: number }[];
    console.log(`product: ${product}`);

    // eslint-disable-next-line prefer-const
    let productData = [];
    for (let i = 0; i < product.length; i++) {
      productData[i] = {};
      productData[i] = product[i];
    }

    const filteredProducts: object[] = productData.filter((product) => {
      const nameMatches = product.name
        .toLowerCase()
        .includes(query.toLowerCase());
      return nameMatches;
    });
    return filteredProducts;
  }
}
