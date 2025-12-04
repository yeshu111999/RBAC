import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthUser } from '../auth/auth-user.interface';
import { RequirePermissions } from '../auth/permissions.decorator';
import { TaskStatus, TaskCategory } from './task.types'; // adjust or inline if you don't have this file

// You can also inline these types if you don't have a separate task.types.ts
export class CreateTaskDto {
  title!: string;
  description?: string;
  category!: TaskCategory; // 'WORK' | 'PERSONAL' | 'OTHER'
  assignedToUserId?: string;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus; // 'TODO' | 'IN_PROGRESS' | 'DONE'
  category?: TaskCategory;
  assignedToUserId?: string | null; // null to unassign
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // POST /tasks – Create task (with permission check)
  @Post()
  @RequirePermissions('MANAGE_TASKS')
  async createTask(
    @Req() req: { user: AuthUser },
    @Body() body: CreateTaskDto,
  ) {
    return this.tasksService.createForUser(req.user, body);
  }

  // GET /tasks – List accessible tasks (scoped to role/org)
  @Get()
  @RequirePermissions('VIEW_TASKS')
  async getTasks(@Req() req: { user: AuthUser }) {
    return this.tasksService.findAllForUser(req.user);
  }

  // PUT /tasks/:id – Edit task (if permitted)
  @Put(':id')
  @RequirePermissions('MANAGE_TASKS')
  async updateTask(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
  ) {
    return this.tasksService.updateForUser(req.user, id, body);
  }

  // DELETE /tasks/:id – Delete task (if permitted)
  @Delete(':id')
  @RequirePermissions('MANAGE_TASKS')
  async deleteTask(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.tasksService.deleteForUser(req.user, id);
  }
}
