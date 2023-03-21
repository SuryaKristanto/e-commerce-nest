import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { connection } from '../db';
import { CreateOrderDto, PaymentDto } from './dto';

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
export class OrderService {
  async createOrder(dto: CreateOrderDto, user_id: number): Promise<any> {
    const productCode = dto.products.map((product) => {
      return product.code;
    });
    // console.log(productCode);

    const placeholders = productCode.map(() => '?').join(', ');
    // console.log(placeholders);

    const existProducts = (await queryDB(
      `SELECT * FROM products WHERE code IN (${placeholders}) AND deleted_at IS NULL`,
      productCode,
    )) as { length: number; code: number; qty: number; price: number }[];
    console.log(existProducts);

    if (existProducts.length !== dto.products.length) {
      throw new NotFoundException('Product not found');
    }

    try {
      await connection.beginTransaction();

      const order_no = Math.floor(Math.random() * 100 + 1);

      const order = (await queryDB(
        `INSERT INTO orders (id, user_id, order_no, status, payment_method, updated_at, created_at) VALUES (DEFAULT,?,?,DEFAULT,?,DEFAULT,DEFAULT)`,
        [user_id, order_no, dto.payment_method],
      )) as { insertId: number };
      console.log(order);

      const totalPrice = [];
      await Promise.all(
        existProducts.map(async (product) => {
          const selectedPayload = dto.products.find(
            (val) => val.code === product.code,
          );
          // console.log(selectedPayload);

          const deductQty = product.qty - selectedPayload.qty;
          // console.log(deductQty);

          // deduct product qty
          const update = await queryDB(
            `UPDATE products SET qty = ? WHERE code = ? AND qty = ?`,
            [deductQty, product.code, product.qty],
          );
          console.log(update);

          // create order_products
          const orderProducts = await queryDB(
            `INSERT INTO order_products (id, product_code, order_id, qty_order, updated_at, created_at) VALUES (DEFAULT,?,?,?,DEFAULT,DEFAULT)`,
            [product.code, order.insertId, selectedPayload.qty],
          );
          console.log(orderProducts);

          const totalPerProduct = selectedPayload.qty * product.price;
          // console.log(totalPerProduct);
          totalPrice.push(totalPerProduct);
          // console.log(totalPrice);
        }),
      );

      let sum = 0;
      for (let i = 0; i < totalPrice.length; i++) {
        sum += totalPrice[i];
      }
      // console.log(sum);

      const updateTotalPrice = await queryDB(
        `UPDATE orders SET total_price = ? WHERE order_no = ?`,
        [sum, order_no],
      );
      console.log(updateTotalPrice);

      await connection.commit();
      console.log('Transaction committed successfully');
    } catch (error) {
      await connection.rollback();
      console.log('Transaction rolled back due to error: ' + error);
    }
  }

  async orderList(user_id: number): Promise<any> {
    const userId = await queryDB(
      `SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`,
      user_id,
    );
    console.log(userId);

    const orders = (await queryDB(
      `SELECT orders.order_no, orders.status, orders.total_price, order_products.product_code AS "product_code", order_products.qty_order AS "qty_order", products.name AS "name", products.price AS "price" FROM orders LEFT JOIN order_products ON orders.id = order_products.order_id LEFT JOIN products ON order_products.product_code = products.code AND (products.deleted_at IS NULL) WHERE orders.deleted_at IS NULL AND orders.user_id = ? AND status <> 'FINISHED' ORDER BY orders.created_at DESC`,
      userId[0].id,
    )) as {
      length: number;
      order_no: number;
      product_code: number;
      qty_order: number;
      name: string;
      price: number;
      status: string;
      total_price: number;
    }[];
    console.log(orders);

    const order_products = [];
    for (let i = 0; i < orders.length; i++) {
      const existingOrderIndex = order_products.findIndex(
        (order) => order.order_no === orders[i].order_no,
      );

      if (existingOrderIndex > -1) {
        order_products[existingOrderIndex].products.push({
          product_code: orders[i].product_code,
          qty_order: orders[i].qty_order,
          name: orders[i].name,
          price: orders[i].price,
        });
      } else {
        order_products.push({
          order_no: orders[i].order_no,
          status: orders[i].status,
          total_price: orders[i].total_price,
          products: [
            {
              product_code: orders[i].product_code,
              qty_order: orders[i].qty_order,
              name: orders[i].name,
              price: orders[i].price,
            },
          ],
        });
      }
    }
    // console.log(order_products);
    return order_products;
  }

  async orderStatus(query: string): Promise<any> {
    const existOrder = (await queryDB(
      `SELECT status FROM orders WHERE id = ? AND deleted_at IS NULL`,
      query,
    )) as { length: number }[];
    console.log(existOrder);

    if (existOrder.length === 0) {
      throw new NotFoundException('Order not found');
    }

    return existOrder[0];
  }

  async orderHistory(user_id: number): Promise<any> {
    const userId = await queryDB(
      `SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`,
      user_id,
    );
    console.log(userId);

    const orders = (await queryDB(
      `SELECT orders.order_no, orders.status, orders.total_price, order_products.product_code AS "product_code", order_products.qty_order AS "qty_order", products.name AS "name", products.price AS "price" FROM orders LEFT JOIN order_products ON orders.id = order_products.order_id LEFT JOIN products ON order_products.product_code = products.code AND (products.deleted_at IS NULL) WHERE orders.deleted_at IS NULL AND orders.user_id = ? AND status = 'FINISHED' ORDER BY orders.created_at DESC`,
      userId[0].id,
    )) as {
      length: number;
      order_no: number;
      product_code: number;
      qty_order: number;
      name: string;
      price: number;
      status: string;
      total_price: number;
    }[];
    console.log(orders);

    const order_products = [];
    for (let i = 0; i < orders.length; i++) {
      const existingOrderIndex = order_products.findIndex(
        (order) => order.order_no === orders[i].order_no,
      );

      if (existingOrderIndex > -1) {
        order_products[existingOrderIndex].products.push({
          product_code: orders[i].product_code,
          qty_order: orders[i].qty_order,
          name: orders[i].name,
          price: orders[i].price,
        });
      } else {
        order_products.push({
          order_no: orders[i].order_no,
          status: orders[i].status,
          total_price: orders[i].total_price,
          products: [
            {
              product_code: orders[i].product_code,
              qty_order: orders[i].qty_order,
              name: orders[i].name,
              price: orders[i].price,
            },
          ],
        });
      }
    }
    // console.log(order_products);
    return order_products;
  }

  async orderpayment(
    user_id: string,
    order_no: string,
    dto: PaymentDto,
  ): Promise<any> {
    const order = await queryDB(
      `SELECT total_price FROM orders WHERE user_id = ? AND order_no = ?`,
      [user_id, order_no],
    );
    console.log(order);

    if (order[0].total_price === dto.payment_amount) {
      const payment = await queryDB(
        `UPDATE orders SET status = 'PROCESSING' WHERE user_id = ? AND order_no = ?`,
        [user_id, order_no],
      );
      console.log(payment);
    } else {
      throw new BadRequestException('Payment failed');
    }
  }
}
