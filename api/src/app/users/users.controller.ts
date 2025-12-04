import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  UsersService,
  CreateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './users.service';
import { AuthUser } from '../auth/auth-user.interface';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Public } from '../auth/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Seed root org + owner@example.com / password123
   * POST /users/seed
   */
  @Public()
  @Post('seed')
  async seed() {
    return this.usersService.seedOwner();
  }

  /**
   * List users in caller's org
   * GET /users
   * Requires MANAGE_USERS permission (Owner/Admin)
   */
  @Get()
  @RequirePermissions('MANAGE_USERS')
  async listUsers(@Req() req: { user: AuthUser }) {
    return this.usersService.listUsersForOrg(req.user);
  }

  /**
   * Create new user in caller's org
   * POST /users
   */
  @Post()
  @RequirePermissions('MANAGE_USERS')
  async createUser(
    @Req() req: { user: AuthUser },
    @Body() body: CreateUserDto,
  ) {
    return this.usersService.createUserForOrg(req.user, body);
  }

  /**
   * Get current user's profile
   * GET /users/me
   */
  @Get('me')
  async getMe(@Req() req: { user: AuthUser }) {
    return this.usersService.getMe(req.user);
  }

  /**
   * Update profile (name)
   * PUT /users/me
   */
  @Put('me')
  async updateMe(
    @Req() req: { user: AuthUser },
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user, body);
  }

  /**
   * Change current user's password
   * POST /users/change-password
   */
  @Post('change-password')
  async changePassword(
    @Req() req: { user: AuthUser },
    @Body() body: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user, body);
  }
}
