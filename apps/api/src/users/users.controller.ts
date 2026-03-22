import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { Request } from "express";
import { auth } from "../auth/auth";
import { AuthGuard } from "../auth/auth.guard";
import { PaginationDto } from "../common/dto/pagination.dto";
import { CurrentInstitution } from "../common/decorators/current-institution.decorator";
import { IsBoolean, IsString, MinLength } from "class-validator";

class ToggleSuperAdminDto {
  @IsBoolean()
  enabled!: boolean;
}

class UpdateNameDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll(
    @CurrentInstitution() institutionId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.findAll(institutionId, pagination);
  }

  @Post(":id/toggle-super-admin")
  @ApiOperation({ summary: "Toggle SuperAdmin status (SuperAdmin only)" })
  @ApiBody({ type: ToggleSuperAdminDto })
  async toggleSuperAdmin(
    @Req() req: Request,
    @Param("id") userId: string,
    @Body() body: ToggleSuperAdminDto,
  ) {
    // Get current session
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as any),
    });

    if (!session) {
      throw new UnauthorizedException("No session found");
    }

    // Check if current user is SuperAdmin
    const currentUser = session.user as any;
    if (!currentUser.isSuperAdmin) {
      throw new ForbiddenException(
        "Only SuperAdmins can toggle SuperAdmin status",
      );
    }

    await this.usersService.toggleSuperAdmin(userId, body.enabled);

    return {
      success: true,
      message: `SuperAdmin status ${body.enabled ? "enabled" : "disabled"} for user ${userId}`,
    };
  }

  @Get("me/settings")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Get current user settings" })
  async getMySettings(@Req() req: Request) {
    const user = (req as any).user;
    const userData = await this.usersService.getById(user.id);
    return userData?.settings || {};
  }

  @Post("me/settings")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Update current user settings" })
  async updateMySettings(@Req() req: Request, @Body() settings: any) {
    const user = (req as any).user;
    await this.usersService.updateSettings(user.id, settings);
    return { success: true };
  }

  @Patch("me")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Update current user name" })
  @ApiBody({ type: UpdateNameDto })
  async updateMyName(@Req() req: Request, @Body() body: UpdateNameDto) {
    const user = (req as any).user;
    await this.usersService.updateName(user.id, body.name);
    return { success: true };
  }

  @Post("me/password")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Change user password" })
  @ApiBody({ type: ChangePasswordDto })
  async changeMyPassword(@Req() req: Request, @Body() body: ChangePasswordDto) {
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as any),
    });

    if (!session) {
      throw new UnauthorizedException("No session found");
    }

    try {
      await auth.api.changePassword({
        headers: new Headers(req.headers as any),
        body: {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        },
      });
      return { success: true };
    } catch (error: any) {
      throw new BadRequestException(
        error.message || "Error al cambiar contraseña",
      );
    }
  }
}
