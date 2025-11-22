import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DataMasterModule } from './data-master/data-master.module';
import { SensorModule } from './sensor/sensor.module';
import { QueueModule } from './queue/queue.module';
import { WebsocketModule } from './websocket/websocket.module';
import { CmsUserModule } from './cms/user/user.module';
import { CmsModuleModule } from './cms/module/module.module';
import { CmsMenuModule } from './cms/menu/menu.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CommonModule,
    AuthModule,
    DashboardModule,
    DataMasterModule,
    SensorModule,
    CmsUserModule,
    CmsModuleModule,
    CmsMenuModule,
    QueueModule,
    WebsocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
