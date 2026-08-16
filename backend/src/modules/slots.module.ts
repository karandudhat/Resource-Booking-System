import { Module } from '@nestjs/common';
import { SlotsController } from '../controllers/slots.controller';
import { SlotsService } from '../services/slots.service';
import { ResourcesModule } from './resources.module';

@Module({
  imports: [ResourcesModule],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
