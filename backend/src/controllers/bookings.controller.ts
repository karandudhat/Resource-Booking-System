import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto } from '../models';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * POST /api/bookings
   * Body: { resourceId, startUtc, endUtc, userId? }
   * → 201 Created (booking object) or 409 Conflict
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(dto);
  }

  /**
   * GET /api/bookings?resourceId=UUID
   * Returns all bookings, optionally filtered by resource.
   */
  @Get()
  getBookings(@Query('resourceId') resourceId?: string) {
    return this.bookingsService.getBookings(resourceId);
  }
}
