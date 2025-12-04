import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { AuthUser } from './auth-user.interface';
import { Role } from './role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate a user by email + password.
   * Throws UnauthorizedException if invalid.
   */
  private async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  /**
   * Login and return a JWT + public user info.
   */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload: AuthUser = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      organizationId: user.organization?.id ?? null,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: payload.organizationId,
      },
    };
  }
}
