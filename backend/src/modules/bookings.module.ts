import { Module } from '@nestjs/common';
import { BookingsController } from '../controllers/bookings.controller';
import { BookingsService } from '../services/bookings.service';
import { SlotsModule } from './slots.module';

@Module({
  imports: [SlotsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
