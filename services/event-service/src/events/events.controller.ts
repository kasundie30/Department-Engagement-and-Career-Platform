import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventStatusDto } from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  // Alumni/Staff/Admin: create event
  @Post()
  @UseGuards(RolesGuard)
  @Roles('alumni', 'staff', 'admin')
  create(@Request() req, @Body() dto: CreateEventDto) {
    return this.eventsService.create(req.user.sub, dto);
  }

  // Any authenticated: list events
  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  // Any authenticated: get event by id
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  // Alumni/Staff/Admin: update status (upcoming → live → ended)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('alumni', 'staff', 'admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEventStatusDto) {
    return this.eventsService.updateStatus(id, dto);
  }

  // Any authenticated: RSVP (idempotent)
  @Post(':id/rsvp')
  rsvp(@Param('id') id: string, @Request() req) {
    return this.eventsService.rsvp(id, req.user.sub);
  }

  // G4.3: Any authenticated: cancel (remove) their RSVP
  @Delete(':id/rsvp')
  cancelRsvp(@Param('id') id: string, @Request() req) {
    return this.eventsService.cancelRsvp(id, req.user.sub);
  }

  // Alumni (own events)/Staff (all)/Admin (all): view attendees
  @Get(':id/attendees')
  @UseGuards(RolesGuard)
  @Roles('alumni', 'staff', 'admin')
  getAttendees(@Param('id') id: string, @Request() req) {
    return this.eventsService.getAttendees(id, req.user.sub, req.user.role);
  }

  // Creator or Admin: delete event
  @Delete(':id')
  deleteEvent(@Param('id') id: string, @Request() req) {
    return this.eventsService.deleteEvent(id, req.user.sub, req.user.role);
  }
}
