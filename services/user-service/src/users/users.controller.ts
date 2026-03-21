import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from './schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  async getMe(@Request() req) {
    const existing = await this.usersService.findMe(req.user.sub);
    if (existing) {
      return existing;
    }

    // First login: user authenticated via Auth0 but not yet in MongoDB.
    // Auto-provision their profile from the JWT claims.
    return this.usersService.upsertFromAuth0({
      auth0Id: req.user.sub,
      email: req.user.email || `${req.user.sub}@auth0.local`,
      name: req.user.name || 'Unknown User',
      role: req.user.role || 'student',
    });
  }

  @Patch('me')
  async updateMe(@Request() req, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  // Static route — must be BEFORE @Get(':id') so 'health' is not treated as a MongoDB ObjectId param
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'user-service', timestamp: new Date().toISOString() };
  }

  // Any authenticated: search users by name or email (for DM creation, collaborator invite)
  @Get('search')
  async searchUsers(@Query('q') q: string) {
    return this.usersService.search(q || '');
  }

  // Any authenticated: get public profile of a user by their Auth0 ID
  @Get('by-auth0/:auth0Id')
  async findByAuth0Id(@Param('auth0Id') auth0Id: string) {
    return this.usersService.findByAuth0Id(auth0Id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }
}
