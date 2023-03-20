import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { ProductListDto } from './dto';
import { CreateProductDto } from './dto/create-product';
import { UpdateProductDto } from './dto/update-product';
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

  @UseGuards(JwtGuard, RolesGuard)
  @Post('create')
  @Roles('admin')
  async createProduct(
    @Body() dto: CreateProductDto,
    @Res() res: Response,
  ): Promise<any> {
    await this.productService.createProduct(dto);
    res.status(200).json({
      message: 'Success create product',
      data: {
        name: dto.name,
        price: dto.price,
        weight: dto.weight,
        qty: dto.qty,
      },
    });
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Delete('/delete/:code')
  @Roles('admin')
  async deleteProduct(
    @Param('code') code: number,
    @Res() res: Response,
  ): Promise<any> {
    await this.productService.deleteProduct(code);
    res.status(200).json({
      message: 'Success remove product',
    });
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Patch('/update/:code')
  @Roles('admin')
  async updateProduct(
    @Body() dto: UpdateProductDto,
    @Param('code') code: number,
    @Res() res: Response,
  ): Promise<any> {
    await this.productService.updateProduct(code, dto);
    res.status(200).json({
      message: 'Success update product',
    });
  }

  @Get(':name')
  async productDetail(
    @Param('name') name: string,
    @Res() res: Response,
  ): Promise<any> {
    res.status(200).json({
      message: 'Product Detail',
      data: await this.productService.productDetail(name),
    });
  }

  @Post('search')
  async searchProduct(@Query('name') query: string): Promise<any> {
    return this.productService.searchProduct(query);
  }
}
