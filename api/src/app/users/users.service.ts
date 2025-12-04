import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './user.entity';
import { Organization } from '../organizations/organization.entity';
import { Role } from '../auth/role.enum';
import { AuthUser } from '../auth/auth-user.interface';
import { AuditLogService } from '../audit-log/audit-log.service';

// Simple DTOs – you can move them to separate files later if you want
export class CreateUserDto {
  email!: string;
  name!: string;
  role!: Role; // OWNER / ADMIN / VIEWER
}

export class UpdateProfileDto {
  name?: string;
}

export class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly auditLog: AuditLogService,
  ) {}

  // ========== Helpers ==========

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email },
      relations: ['organization'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      relations: ['organization'],
    });
  }

  private generateRandomPassword(length = 12): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < length; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    return pwd;
  }

  private ensureCanManageUsers(authUser: AuthUser) {
    if (authUser.role !== Role.OWNER && authUser.role !== Role.ADMIN) {
      throw new UnauthorizedException('You are not allowed to manage users');
    }
    if (!authUser.organizationId) {
      throw new BadRequestException('User is not attached to an organization');
    }
  }

  // ========== Seed ==========

  /**
   * Seed a root organization and an OWNER user.
   * Always ensures owner@example.com exists with password "password123".
   */
  async seedOwner() {
    // 1) Root organization
    let org = await this.orgRepo.findOne({ where: { name: 'Root Org' } });

    if (!org) {
      org = this.orgRepo.create({
        name: 'Root Org',
        parent: null,
      });
      org = await this.orgRepo.save(org);
    }

    // 2) Owner user with known password
    let owner = await this.usersRepo.findOne({
      where: { email: 'owner@example.com' },
      relations: ['organization'],
    });

    const passwordHash = await bcrypt.hash('password123', 10);

    if (!owner) {
      owner = this.usersRepo.create({
        email: 'owner@example.com',
        name: 'Default Owner',
        passwordHash,
        role: Role.OWNER,
        organization: org,
      });
    } else {
      owner.passwordHash = passwordHash;
      owner.role = Role.OWNER;
      owner.organization = org;
    }

    owner = await this.usersRepo.save(owner);

    console.log(
      '[SEED] Owner user ensured:',
      owner.email,
      'in org',
      org.name,
    );

    return {
      owner: {
        id: owner.id,
        email: owner.email,
        role: owner.role,
        organizationId: owner.organization?.id ?? null,
      },
      organization: {
        id: org.id,
        name: org.name,
      },
    };
  }

  // ========== Org-scoped user operations ==========

  /**
   * List users within the caller's organization.
   * OWNER / ADMIN only (PermissionsGuard should also enforce).
   */
  async listUsersForOrg(authUser: AuthUser) {
    this.ensureCanManageUsers(authUser);

    const users = await this.usersRepo.find({
      where: {
        organization: { id: authUser.organizationId! },
      },
      relations: ['organization'],
      order: { createdAt: 'ASC' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      organizationId: u.organization?.id ?? null,
    }));
  }

  /**
   * Create a new user in the same organization as the caller.
   * OWNER only in practice (but ADMIN is also checked via permissions).
   * Returns the created user + a generated password (for sharing).
   */
  async createUserForOrg(authUser: AuthUser, dto: CreateUserDto) {
    this.ensureCanManageUsers(authUser);

    if (!authUser.organizationId) {
      throw new BadRequestException(
        'Caller must belong to an organization to create users',
      );
    }

    if (!dto.email || !dto.name) {
      throw new BadRequestException('Email and name are required');
    }

    if (dto.role === Role.OWNER) {
      throw new BadRequestException('Cannot create additional OWNER users');
    }

    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const org = await this.orgRepo.findOne({
      where: { id: authUser.organizationId },
    });

    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    const plainPassword = this.generateRandomPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    let user = this.usersRepo.create({
      email: dto.email,
      name: dto.name,
      role: dto.role,
      passwordHash,
      organization: org,
    });

    user = await this.usersRepo.save(user);

    this.auditLog.log(authUser, 'USER_CREATED', {
      newUserId: user.id,
      newUserRole: user.role,
      organizationId: org.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: org.id,
      },
      password: plainPassword,
    };
  }

  // ========== "Me" profile ==========

  async getMe(authUser: AuthUser) {
    const user = await this.findById(authUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization?.id ?? null,
    };
  }

  async updateProfile(authUser: AuthUser, dto: UpdateProfileDto) {
    const user = await this.findById(authUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    const saved = await this.usersRepo.save(user);

    this.auditLog.log(authUser, 'PROFILE_UPDATED', {
      userId: saved.id,
    });

    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      role: saved.role,
      organizationId: saved.organization?.id ?? null,
    };
  }

  async changePassword(authUser: AuthUser, dto: ChangePasswordDto) {
    const user = await this.findById(authUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const matches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.save(user);

    this.auditLog.log(authUser, 'PASSWORD_CHANGED', {
      userId: user.id,
    });

    return { success: true };
  }
}
