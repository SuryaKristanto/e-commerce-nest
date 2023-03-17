import { Body, Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductListDto } from './dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async productList(
    @Body() dto: ProductListDto,
    @Res() res: Response,
  ): Promise<any> {
    res.status(200).json({
      message: 'Product List',
      data: await this.productService.productList(dto),
      pagination: dto.page ? await this.productService.count(dto) : null,
    });
  }
}
