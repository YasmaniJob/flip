import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Delete,
    Param,
    Query,
    UseGuards,
    Req,
    HttpException,
    HttpStatus,
    Inject,
} from '@nestjs/common';
import { AuthGuard } from '../../../auth/auth.guard';
import { CreateReservationCommand } from '../../../application/use-cases/reservations/commands/create-reservation.command';
import { CancelReservationCommand } from '../../../application/use-cases/reservations/commands/cancel-reservation.command';
import { CancelSlotCommand } from '../../../application/use-cases/reservations/commands/cancel-slot.command';
import { MarkAttendanceCommand } from '../../../application/use-cases/reservations/commands/mark-attendance.command';
import { RescheduleSlotCommand } from '../../../application/use-cases/reservations/commands/reschedule-slot.command';
import { RescheduleBlockCommand } from '../../../application/use-cases/reservations/commands/reschedule-block.command';
import { FindReservationsQuery } from '../../../application/use-cases/reservations/queries/find-reservations.query';
import { IReservationRepository } from '../../../core/ports/outbound/reservation.repository';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';

export interface CreateReservationDto {
    staffId: string;
    classroomId?: string;
    slots: { pedagogicalHourId: string; date: string }[];
    gradeId?: string;
    sectionId?: string;
    curricularAreaId?: string;
    purpose?: string;
    type?: 'class' | 'workshop';
    title?: string;
}

export interface RescheduleSlotDto {
    newDate: string;
    newPedagogicalHourId: string;
}

export interface RescheduleBlockDto {
    slots: { date: string; pedagogicalHourId: string }[];
}

@Controller('classroom-reservations')
@UseGuards(AuthGuard)
export class ClassroomReservationsController {
    constructor(
        private readonly createReservation: CreateReservationCommand,
        private readonly cancelReservation: CancelReservationCommand,
        private readonly cancelSlot: CancelSlotCommand,
        private readonly markAttendance: MarkAttendanceCommand,
        private readonly rescheduleSlot: RescheduleSlotCommand,
        private readonly rescheduleBlock: RescheduleBlockCommand,
        private readonly findReservations: FindReservationsQuery,
        @Inject('IReservationRepository')
        private readonly reservationRepo: IReservationRepository,
    ) { }

    @Get()
    async findAll(
        @CurrentTenant() institutionId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('classroomId') classroomId?: string,
        @Query('shift') shift?: string,
    ) {
        return this.findReservations.execute({
            institutionId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            classroomId,
            shift,
        });
    }

    @Get('my-today')
    async getMyTodaySlots(
        @CurrentTenant() institutionId: string,
        @Req() req: any,
    ) {
        const user = req.user;
        return this.findReservations.findMyTodaySlots(institutionId, user.id);
    }

    @Post()
    async create(
        @CurrentTenant() institutionId: string,
        @Body() body: CreateReservationDto,
    ) {
        try {
            const slots = body.slots.map(s => {
                const dateStr = s.date.includes('T') ? s.date : `${s.date}T00:00:00`;
                return {
                    pedagogicalHourId: s.pedagogicalHourId,
                    date: new Date(dateStr),
                };
            });

            return await this.createReservation.execute({
                institutionId,
                staffId: body.staffId,
                classroomId: body.classroomId,
                slots,
                gradeId: body.gradeId,
                sectionId: body.sectionId,
                curricularAreaId: body.curricularAreaId,
                purpose: body.purpose,
                type: body.type,
                title: body.title,
            });
        } catch (error: any) {
            const status = error.getStatus ? error.getStatus() : (error.status || HttpStatus.INTERNAL_SERVER_ERROR);
            throw new HttpException(
                error.message || 'Error creating reservation',
                status
            );
        }
    }

    @Put(':id/cancel')
    async cancel(
        @CurrentTenant() institutionId: string,
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const user = req.user;
        return this.cancelReservation.execute({
            institutionId,
            reservationId: id,
            userId: user.id,
            userRole: user.role || 'docente',
            isSuperAdmin: user.isSuperAdmin || false,
        });
    }

    @Delete('slots/:slotId')
    async cancelSlotEndpoint(
        @CurrentTenant() institutionId: string,
        @Param('slotId') slotId: string,
        @Req() req: any,
    ) {
        const user = req.user;
        return this.cancelSlot.execute({
            institutionId,
            slotId,
            userId: user.id,
            userRole: user.role || 'docente',
            isSuperAdmin: user.isSuperAdmin || false,
        });
    }

    @Put('slots/:slotId/attendance')
    async markSlotAttendance(
        @CurrentTenant() institutionId: string,
        @Param('slotId') slotId: string,
        @Req() req: any,
        @Body() body: { attended: boolean },
    ) {
        const user = req.user;
        return this.markAttendance.execute({
            institutionId,
            slotId,
            staffId: user.id,
            attended: body.attended ?? true,
            userRole: user.role,
            isSuperAdmin: user.isSuperAdmin,
        });
    }

    @Put('slots/:slotId/reschedule')
    async rescheduleSlotEndpoint(
        @CurrentTenant() institutionId: string,
        @Param('slotId') slotId: string,
        @Req() req: any,
        @Body() body: RescheduleSlotDto,
    ) {
        const user = req.user;
        const dateStr = body.newDate.includes('T') ? body.newDate : `${body.newDate}T00:00:00`;
        return this.rescheduleSlot.execute({
            institutionId,
            slotId,
            userId: user.id,
            userRole: user.role || 'docente',
            newDate: new Date(dateStr),
            newPedagogicalHourId: body.newPedagogicalHourId,
            isSuperAdmin: user.isSuperAdmin || false,
        });
    }

    @Put(':id/reschedule-block')
    async rescheduleBlockEndpoint(
        @CurrentTenant() institutionId: string,
        @Param('id') reservationId: string,
        @Req() req: any,
        @Body() body: RescheduleBlockDto,
    ) {
        const user = req.user;

        const newSlots = body.slots.map(s => {
            const dateStr = s.date.includes('T') ? s.date : `${s.date}T00:00:00`;
            return {
                newDate: new Date(dateStr),
                newPedagogicalHourId: s.pedagogicalHourId,
            };
        });

        return this.rescheduleBlock.execute({
            institutionId,
            reservationId,
            userId: user.id,
            userRole: user.role || 'docente',
            newSlots,
            isSuperAdmin: user.isSuperAdmin || false,
        });
    }

    // ============================================
    // RESERVATION ATTENDANCE (per-person for workshops)
    // ============================================

    @Get(':id/attendance')
    async getAttendance(@Param('id') id: string) {
        return this.reservationRepo.findAttendanceByReservation(id);
    }

    @Post(':id/attendance')
    async addAttendee(
        @Param('id') id: string,
        @Body() body: { staffId: string },
    ) {
        return this.reservationRepo.saveAttendance(id, body.staffId);
    }

    @Put(':id/attendance/bulk')
    async bulkUpdateAttendance(
        @Param('id') id: string,
        @Body() body: { updates: { attendanceId: string; status: string }[] },
    ) {
        await this.reservationRepo.bulkUpdateAttendanceStatus(body.updates);
        return { success: true };
    }

    @Delete('attendance/:attendanceId')
    async removeAttendee(@Param('attendanceId') attendanceId: string) {
        await this.reservationRepo.removeAttendance(attendanceId);
        return { success: true };
    }

    // ============================================
    // RESERVATION TASKS (agreements for workshops)
    // ============================================

    @Get(':id/tasks')
    async getTasks(@Param('id') id: string) {
        return this.reservationRepo.findTasksByReservation(id);
    }

    @Post(':id/tasks')
    async createTask(
        @Param('id') id: string,
        @Body() body: { description: string; assignedStaffId?: string; dueDate?: string; status?: string },
    ) {
        return this.reservationRepo.saveTask(id, {
            description: body.description,
            assignedStaffId: body.assignedStaffId,
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        });
    }

    @Put('tasks/:taskId')
    async updateTask(
        @Param('taskId') taskId: string,
        @Body() body: { description?: string; status?: string; assignedStaffId?: string; dueDate?: string },
    ) {
        const data: any = {};
        if (body.description !== undefined) data.description = body.description;
        if (body.status !== undefined) data.status = body.status;
        if (body.assignedStaffId !== undefined) data.assignedStaffId = body.assignedStaffId;
        if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate);
        return this.reservationRepo.updateTask(taskId, data);
    }

    @Delete('tasks/:taskId')
    async deleteTask(@Param('taskId') taskId: string) {
        await this.reservationRepo.deleteTask(taskId);
        return { success: true };
    }
}
