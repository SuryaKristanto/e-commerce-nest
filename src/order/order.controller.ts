import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { query, Request, Response } from 'express';
import { Roles } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { CreateOrderDto } from './dto';
import { OrderService } from './order.service';

@Controller('order')
@UseGuards(JwtGuard, RolesGuard)
@Roles('admin', 'member')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
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

  @Get('list')
  async orderList(@Req() req: Request, @Res() res: Response): Promise<any> {
    res.status(200).json({
      message: 'Order List',
      data: await this.orderService.orderList(req.user.user_id),
    });
  }

  @Get('status')
  async statusOrder(@Query('id') query: string): Promise<any> {
    return this.orderService.orderStatus(query);
  }
}
