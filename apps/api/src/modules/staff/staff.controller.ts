import { Controller, Post, Body, Get, Patch, Delete, Param, UseGuards, Req, UnauthorizedException, ForbiddenException, Query } from '@nestjs/common';
import { StaffService } from './staff.service';
import { createStaffSchema, CreateStaffInput } from '@flip/shared';
import { AuthGuard } from '../../auth/auth.guard';
import { z } from 'zod';


@Controller('staff')
@UseGuards(AuthGuard)
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Post()
    async create(@Req() req: any, @Body() body: CreateStaffInput) {
        // Parse body with Zod to be safe
        const input = createStaffSchema.parse(body);

        const institutionId = req.user?.institutionId;
        const userIsSuperAdmin = req.user?.isSuperAdmin === true;

        if (!institutionId) {
            throw new UnauthorizedException("No institution ID found in user session");
        }

        // Only SuperAdmin can create SuperAdmins or Admins
        if ((input.role === 'superadmin' || input.role === 'admin') && !userIsSuperAdmin) {
            throw new ForbiddenException("Solo el SuperAdmin puede crear usuarios Admin o SuperAdmin");
        }

        return this.staffService.create(institutionId, input);
    }

    @Post('bulk')
    async bulkCreate(@Req() req: any, @Body() body: { staff: CreateStaffInput[] }) {
        const institutionId = req.user?.institutionId;
        const userIsSuperAdmin = req.user?.isSuperAdmin === true;

        if (!institutionId) {
            throw new UnauthorizedException("No institution ID found in user session");
        }

        // Verify validation for each item
        const cleanData = body.staff.map(s => createStaffSchema.parse(s));

        // Only SuperAdmin can create SuperAdmins or Admins
        const hasRestrictedRole = cleanData.some(s => s.role === 'superadmin' || s.role === 'admin');
        if (hasRestrictedRole && !userIsSuperAdmin) {
            throw new ForbiddenException("Solo el SuperAdmin puede crear usuarios Admin o SuperAdmin");
        }

        return this.staffService.bulkCreate(institutionId, cleanData);
    }

    @Get('recurrent')
    async findRecurrent(
        @Req() req: any,
        @Query('limit') limit?: string,
    ) {
        const institutionId = req.user?.institutionId;
        if (!institutionId) throw new UnauthorizedException("No institution ID found");

        return this.staffService.findRecurrent(
            institutionId, 
            limit ? parseInt(limit) : 6
        );
    }

    @Get()
    async findAll(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('status') status?: string,
        @Query('include_admins') includeAdmins?: string,
    ) {
        const institutionId = req.user?.institutionId;

        if (!institutionId) {
            throw new UnauthorizedException("No institution ID found in user session");
        }

        return this.staffService.findAll(institutionId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            search,
            role,
            status,
            includeAdmins: includeAdmins === 'true',
        });
    }

    @Patch(':id')
    async update(@Req() req: any, @Param('id') id: string, @Body() body: Partial<CreateStaffInput>) {
        const institutionId = req.user?.institutionId;
        const userIsSuperAdmin = req.user?.isSuperAdmin === true;
        
        if (!institutionId) throw new UnauthorizedException("No institution ID found");

        // Only SuperAdmin can assign SuperAdmin or Admin role
        if ((body.role === 'superadmin' || body.role === 'admin') && !userIsSuperAdmin) {
            throw new ForbiddenException("Solo el SuperAdmin puede asignar los roles Admin o SuperAdmin");
        }

        return this.staffService.update(institutionId, id, body);
    }

    @Delete(':id')
    async remove(@Req() req: any, @Param('id') id: string) {
        const institutionId = req.user?.institutionId;
        if (!institutionId) throw new UnauthorizedException("No institution ID found");

        return this.staffService.remove(institutionId, id);
    }
}
