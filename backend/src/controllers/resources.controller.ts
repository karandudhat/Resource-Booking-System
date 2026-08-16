import { Controller, Get, Param } from '@nestjs/common';
import { ResourcesService } from '../services/resources.service';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  /** GET /api/resources — list all resources */
  @Get()
  findAll() {
    return this.resourcesService.findAll();
  }

  /** GET /api/resources/:id — get one resource */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  /** GET /api/resources/:id/availability — get weekly windows */
  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.resourcesService.getAvailabilityWindows(id);
  }
}
