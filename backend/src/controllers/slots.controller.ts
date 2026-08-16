import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SlotsService } from '../services/slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  /**
   * GET /api/slots?resourceId=UUID&date=YYYY-MM-DD&timezone=IANA
   *
   * Returns all slots for a resource on a given date, with availability status.
   * Times are returned in both UTC (for the booking call) and the requested
   * display timezone (for rendering in the UI).
   */
  @Get()
  getSlots(
    @Query('resourceId') resourceId: string,
    @Query('date') date: string,
    @Query('timezone') timezone: string = 'UTC',
  ) {
    if (!resourceId) throw new BadRequestException('resourceId query param is required');
    if (!date)       throw new BadRequestException('date query param is required (YYYY-MM-DD)');
    return this.slotsService.getSlots(resourceId, date, timezone);
  }
}
