import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SlotsModule } from '../slots/slots.module';

@Module({
  imports: [SlotsModule],   // needed to validate slot boundaries before booking
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
