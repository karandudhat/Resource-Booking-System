import { Controller, Get, Param } from '@nestjs/common';
import { ResourcesService } from './resources.service';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  findAll() {
    return this.resourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.resourcesService.getAvailabilityWindows(id);
  }
}
