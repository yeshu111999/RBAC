import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Organization]),
    AuditLogModule,  // 👈 REQUIRED so TasksService can inject AuditLogService
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
