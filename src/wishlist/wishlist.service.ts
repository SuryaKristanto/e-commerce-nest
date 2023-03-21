import { Injectable } from '@nestjs/common';
import { connection } from '../db';
import { AddRemoveWishlistDto } from './dto';

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
export class WishlistService {
  async addWishlist(user_id: number, dto: AddRemoveWishlistDto): Promise<any> {
    const wishlist = await queryDB(
      `INSERT INTO wishlist (id, user_id, product_code, created_at) VALUES (DEFAULT,?,?,DEFAULT)`,
      [user_id, dto.product_code],
    );
    console.log(wishlist);
  }

  async getWishlist(user_id: number): Promise<any> {
    const product = (await queryDB(
      `SELECT product_code FROM wishlist WHERE user_id = ? ORDER BY created_at DESC`,
      user_id,
    )) as { length: number; product_code: number }[];
    console.log(product);

    // eslint-disable-next-line prefer-const
    let productCode = [];
    for (let i = 0; i < product.length; i++) {
      productCode[i] = product[i].product_code;
    }
    // console.log(productCode);

    const placeholders = productCode.map(() => '?').join(', ');
    // console.log(placeholders);

    const list = await queryDB(
      `SELECT products.name, products.price FROM wishlist LEFT JOIN products ON wishlist.product_code = products.code WHERE code IN (${placeholders}) AND wishlist.user_id = ? AND deleted_at IS NULL ORDER BY wishlist.created_at DESC`,
      [productCode, user_id],
    );
    console.log(list);
    return list;
  }

  async removeWishlist(
    user_id: number,
    dto: AddRemoveWishlistDto,
  ): Promise<any> {
    const remove = await queryDB(
      `DELETE FROM wishlist WHERE user_id = ? AND product_code = ?`,
      [user_id, dto.product_code],
    );
    console.log(remove);
  }
}
