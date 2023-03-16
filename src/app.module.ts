import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [ProductModule, AuthModule, OrderModule, WishlistModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
