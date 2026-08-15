import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { BookingsService, CreateBookingDto } from './bookings.service';

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
