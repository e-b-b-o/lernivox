import { Global, Module } from '@nestjs/common';
import { WorkerWakeService } from './worker-wake.service';

@Global()
@Module({
  providers: [WorkerWakeService],
  exports: [WorkerWakeService],
})
export class WorkerWakeModule {}

