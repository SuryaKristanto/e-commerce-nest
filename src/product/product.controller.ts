import { Body, Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductListDto } from './dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly appService: ProductService) {}

  @Get()
  async productList(
    @Body() dto: ProductListDto,
    @Res() res: Response,
  ): Promise<any> {
    // console.log(dto);

    const products = await this.appService.productList(dto);
    // console.log(products);

    const isProductExist = products.length > 0;
    if (!isProductExist) {
      // kalo ngga ada data, maka return status
      return res.status(404).json({
        message: 'product not found',
      });
    }
    // console.log(isProductExist);

    const count = await this.appService.count();

    const paginationIndex = {
      totalFindings: count.length,
      currenPage: dto.page,
      nextPage: Math.min(Math.ceil(count.length / dto.limit), dto.page + 1),
      prevPage: Math.max(1, dto.page - 1),
      totalPage: Math.ceil(count.length / dto.limit),
    };

    res.status(200).json({
      message: 'Product List',
      data: products,
      pagination: dto.page ? paginationIndex : null,
    });
  }
}
