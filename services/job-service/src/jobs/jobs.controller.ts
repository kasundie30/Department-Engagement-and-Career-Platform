import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import {
  CreateJobDto,
  UpdateJobStatusDto,
  CreateApplicationDto,
  UpdateApplicationStatusDto,
} from './dto/job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Alumni/Staff/Admin: create job
  @Post()
  @UseGuards(RolesGuard)
  @Roles('alumni', 'staff', 'admin')
  create(@Request() req, @Body() dto: CreateJobDto) {
    return this.jobsService.create(req.user.sub, dto);
  }

  // Any authenticated user: list jobs
  // G6.1: ?type=internship|full-time|part-time|contract
  // G6.3: ?status=open (default)|closed|all
  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.jobsService.findAll(type, status);
  }

  // Any authenticated user: job detail
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  // Alumni/Staff/Admin: update job status (open → closed)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('alumni', 'staff', 'admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateJobStatusDto) {
    return this.jobsService.updateStatus(id, dto);
  }

  // Student/Admin: apply for a job
  @Post(':id/apply')
  @UseGuards(RolesGuard)
  @Roles('student', 'admin')
  apply(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.jobsService.apply(id, req.user.sub, dto);
  }

  // Alumni/Staff/Admin: update application status
  @Patch(':id/applications/:appId')
  @UseGuards(RolesGuard)
  @Roles('alumni', 'staff', 'admin')
  updateApplicationStatus(
    @Param('id') id: string,
    @Param('appId') appId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.jobsService.updateApplicationStatus(id, appId, dto);
  }

  // Alumni/Staff/Admin: list applications for a job
  @Get(':id/applications')
  @UseGuards(RolesGuard)
  @Roles('alumni', 'staff', 'admin')
  findApplications(@Param('id') id: string) {
    return this.jobsService.findApplicationsByJob(id);
  }

  // Poster or Admin: delete job
  @Delete(':id')
  async deleteJob(@Param('id') id: string, @Request() req) {
    await this.jobsService.deleteJob(id, req.user.sub, req.user.role);
    return { deleted: true };
  }
}
