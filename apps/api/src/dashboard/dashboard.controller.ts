import { Controller, Get, UnauthorizedException, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { auth } from '../auth/auth';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('super-stats')
    @ApiOperation({ summary: 'Get platform-wide stats for SuperAdmin' })
    async getSuperAdminStats(@Req() req: Request) {
        const session = await auth.api.getSession({
            headers: new Headers(req.headers as any),
        });

        if (!session) throw new UnauthorizedException('Not authenticated');
        if (!(session.user as any).isSuperAdmin) throw new ForbiddenException('SuperAdmin only');

        return this.dashboardService.getSuperAdminStats();
    }

    @Get('institution-stats')
    @ApiOperation({ summary: 'Get institution stats for standard users' })
    async getInstitutionStats(@Req() req: Request) {
        const session = await auth.api.getSession({
            headers: new Headers(req.headers as any),
        });

        if (!session) throw new UnauthorizedException('Not authenticated');

        const user = session.user as any;
        if (!user.institutionId) throw new ForbiddenException('No linked institution');

        return this.dashboardService.getInstitutionStats(user.institutionId);
    }
}
