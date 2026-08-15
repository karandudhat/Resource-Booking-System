import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ResourcesModule } from './resources/resources.module';
import { SlotsModule } from './slots/slots.module';
import { BookingsModule } from './bookings/bookings.module';

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
