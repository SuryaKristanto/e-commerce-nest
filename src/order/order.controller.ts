import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { Roles } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { CreateOrderDto } from './dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Post()
  @Roles('admin', 'member')
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    await this.orderService.createOrder(dto, req.user.user_id);
    res.status(201).json({
      message: 'Success create order',
    });
  }
}
