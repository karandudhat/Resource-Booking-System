import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './config/database.config';
import { ResourcesModule } from './modules/resources.module';
import { SlotsModule } from './modules/slots.module';
import { BookingsModule } from './modules/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ResourcesModule,
    SlotsModule,
    BookingsModule,
  ],
})
export class AppModule {}
