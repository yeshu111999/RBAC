import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';
import { AuthUser } from '../auth/auth-user.interface';
import { Role } from '../auth/role.enum';
import { AuditLogService } from '../audit-log/audit-log.service';

// Keep these in sync with frontend
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskCategory = 'WORK' | 'PERSONAL' | 'OTHER';

export interface CreateTaskDto {
  title: string;
  description?: string;
  category: TaskCategory;
  status?: TaskStatus; // default TODO
  assignedToUserId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  assignedToUserId?: string | null;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,

    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Create a task for the authenticated user.
   * - Always belongs to user's organization.
   * - createdBy = current user.
   * - assignedTo = optional user in same org.
   */
  async createForUser(
    authUser: AuthUser,
    dto: CreateTaskDto,
  ): Promise<Task> {
    if (!authUser.organizationId) {
      throw new BadRequestException(
        'User must belong to an organization to create tasks',
      );
    }

    // VIEWER shouldn't even reach here (guard handles it), but double-check.
    if (authUser.role === Role.VIEWER) {
      throw new ForbiddenException('VIEWER cannot create tasks');
    }

    const org = await this.orgRepo.findOne({
      where: { id: authUser.organizationId },
    });

    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    const creator = await this.usersRepo.findOne({
      where: { id: authUser.userId },
    });

    if (!creator) {
      throw new BadRequestException('User not found');
    }

    let assignedTo: User | null = null;
    if (dto.assignedToUserId) {
      assignedTo = await this.usersRepo.findOne({
        where: {
          id: dto.assignedToUserId,
          organization: { id: authUser.organizationId },
        },
        relations: ['organization'],
      });

      if (!assignedTo) {
        throw new BadRequestException(
          'Assigned user not found in your organization',
        );
      }
    }

    const task = this.tasksRepo.create({
      title: dto.title,
      description: dto.description ?? '',
      status: dto.status ?? 'TODO',
      category: dto.category,
      organization: org,
      createdBy: creator,
      assignedTo: assignedTo ?? null,
    });

    const saved = await this.tasksRepo.save(task);

    this.auditLog.log(authUser, 'TASK_CREATED', {
      taskId: saved.id,
      title: saved.title,
      orgId: org.id,
    });

    return this.findByIdForUser(authUser, saved.id);
  }

  /**
   * Get tasks visible to the authenticated user.
   * - Always scoped by organization.
   * - OWNER/ADMIN: all tasks in org.
   * - VIEWER: only tasks they created OR are assigned to.
   */
  async findAllForUser(authUser: AuthUser): Promise<Task[]> {
    if (!authUser.organizationId) {
      return [];
    }

    const qb = this.tasksRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.organization', 'org')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('org.id = :orgId', { orgId: authUser.organizationId });

    if (authUser.role === Role.OWNER || authUser.role === Role.ADMIN) {
      const tasks = await qb.orderBy('task.createdAt', 'DESC').getMany();

      this.auditLog.log(authUser, 'TASK_LIST_VIEW', {
        count: tasks.length,
        scope: 'org',
      });

      return tasks;
    }

    // VIEWER: restricted
    const tasks = await qb
      .andWhere(
        '(createdBy.id = :userId OR assignedTo.id = :userId)',
        { userId: authUser.userId },
      )
      .orderBy('task.createdAt', 'DESC')
      .getMany();

    this.auditLog.log(authUser, 'TASK_LIST_VIEW', {
      count: tasks.length,
      scope: 'viewer-limited',
    });

    return tasks;
  }

  /**
   * Helper: find a single task ensuring it belongs to user's org.
   * Used internally by other methods.
   */
  private async findByIdForUser(
    authUser: AuthUser,
    id: string,
  ): Promise<Task> {
    const task = await this.tasksRepo.findOne({
      where: { id },
      relations: ['organization', 'createdBy', 'assignedTo'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 🔒 Ownership & org-level enforcement (4th point)
    if (task.organization.id !== authUser.organizationId) {
      throw new ForbiddenException(
        'You cannot access tasks from another organization',
      );
    }

    return task;
  }

  /**
   * Update a task for the authenticated user.
   * - Enforces org check.
   * - Only OWNER/ADMIN should reach here (guard + secondary check).
   */
  async updateForUser(
    authUser: AuthUser,
    id: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    if (authUser.role === Role.VIEWER) {
      throw new ForbiddenException('VIEWER cannot update tasks');
    }

    const task = await this.findByIdForUser(authUser, id);

    if (dto.title !== undefined) {
      task.title = dto.title;
    }
    if (dto.description !== undefined) {
      task.description = dto.description;
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }
    if (dto.category !== undefined) {
      task.category = dto.category;
    }

    if (dto.assignedToUserId !== undefined) {
      if (dto.assignedToUserId === null) {
        task.assignedTo = null;
      } else {
        const assignee = await this.usersRepo.findOne({
          where: {
            id: dto.assignedToUserId,
            organization: { id: authUser.organizationId },
          },
          relations: ['organization'],
        });

        if (!assignee) {
          throw new BadRequestException(
            'Assigned user not found in your organization',
          );
        }

        task.assignedTo = assignee;
      }
    }

    const saved = await this.tasksRepo.save(task);

    this.auditLog.log(authUser, 'TASK_UPDATED', {
      taskId: saved.id,
      status: saved.status,
      category: saved.category,
    });

    return this.findByIdForUser(authUser, saved.id);
  }

  /**
   * Delete a task for the authenticated user.
   * - Enforces org check.
   * - Only OWNER/ADMIN should reach here.
   */
  async deleteForUser(
    authUser: AuthUser,
    id: string,
  ): Promise<{ deleted: boolean }> {
    if (authUser.role === Role.VIEWER) {
      throw new ForbiddenException('VIEWER cannot delete tasks');
    }

    const task = await this.findByIdForUser(authUser, id);

    await this.tasksRepo.remove(task);

    this.auditLog.log(authUser, 'TASK_DELETED', {
      taskId: id,
      title: task.title,
    });

    return { deleted: true };
  }
}
