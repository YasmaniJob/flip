import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiTags, ApiQuery, ApiOperation, ApiBody } from "@nestjs/swagger";
import { InstitutionsService } from "./institutions.service";
import { Request } from "express";
import { auth } from "../auth/auth";

class OnboardDto {
  @IsString()
  codigoModular!: string;

  @IsString()
  nivel!: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  distrito?: string;

  @IsOptional()
  @IsBoolean()
  isManual?: boolean;
}

@ApiTags("institutions")
@Controller("institutions")
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post("onboard")
  @ApiOperation({ summary: "Complete user onboarding (select institution)" })
  @ApiBody({ type: OnboardDto })
  async onboard(@Req() req: Request, @Body() body: OnboardDto) {
    try {
      const session = await auth.api.getSession({
        headers: new Headers(req.headers as any), // Better Auth needs standard Headers object
      });

      if (!session) {
        throw new UnauthorizedException("No session found");
      }

      return await this.institutionsService.onboardUser(session.user.id, body);
    } catch (error) {
      console.error("Onboard error:", error);
      // Log to file for debugging
      const fs = await import("fs");
      const path = await import("path");
      const logPath = path.resolve(process.cwd(), "apps/api/onboard-error.log");
      const errorMessage = `[${new Date().toISOString()}] ${error instanceof Error ? error.stack : JSON.stringify(error)}\n`;
      try {
        fs.appendFileSync(logPath, errorMessage);
      } catch (e) {
        console.error("Failed to write to log file:", e);
      }
      throw error;
    }
  }

  @Get("search")
  @ApiOperation({ summary: "Search MINEDU institutions" })
  @ApiQuery({ name: "q", required: false, description: "Search by name" })
  @ApiQuery({
    name: "nivel",
    required: false,
    description: "Filter by level (Primaria/Secundaria)",
  })
  @ApiQuery({
    name: "departamento",
    required: false,
    description: "Filter by department",
  })
  @ApiQuery({
    name: "provincia",
    required: false,
    description: "Filter by province",
  })
  @ApiQuery({
    name: "distrito",
    required: false,
    description: "Filter by district",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Max results (default 20)",
  })
  async search(
    @Query("q") query?: string,
    @Query("nivel") nivel?: string,
    @Query("departamento") departamento?: string,
    @Query("provincia") provincia?: string,
    @Query("distrito") distrito?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const maxResults = Math.min(parseInt(limit || "20", 10), 100);
    const skip = parseInt(offset || "0", 10);

    return this.institutionsService.search({
      query,
      nivel,
      departamento,
      provincia,
      distrito,
      limit: maxResults,
      offset: skip,
    });
  }

  @Get("departamentos")
  @ApiOperation({ summary: "Get unique departments for filtering" })
  async getDepartamentos() {
    return this.institutionsService.getDepartamentos();
  }

  @Get("provincias")
  @ApiOperation({ summary: "Get provinces for a department" })
  @ApiQuery({ name: "departamento", required: true })
  async getProvincias(@Query("departamento") departamento: string) {
    return this.institutionsService.getProvincias(departamento);
  }

  @Get("distritos")
  @ApiOperation({ summary: "Get districts for a province" })
  @ApiQuery({ name: "departamento", required: true })
  @ApiQuery({ name: "provincia", required: true })
  async getDistritos(
    @Query("departamento") departamento: string,
    @Query("provincia") provincia: string,
  ) {
    return this.institutionsService.getDistritos(departamento, provincia);
  }
  @Get("my-institution")
  @ApiOperation({ summary: "Get current user institution details" })
  async getMyInstitution(@Req() req: Request) {
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as any),
    });

    if (!session || !(session.user as any).institutionId) {
      throw new UnauthorizedException("No linked institution found");
    }

    return this.institutionsService.getById(
      (session.user as any).institutionId,
    );
  }

  @Get("public/branding")
  @ApiOperation({ summary: "Get public branding info for an institution" })
  async getPublicBranding(@Query("id") institutionId: string) {
    if (!institutionId) {
      return { brandColor: null, name: null, logoUrl: null };
    }

    const institution = await this.institutionsService.getById(institutionId);
    if (!institution) {
      return { brandColor: null, name: null, logoUrl: null };
    }

    return {
      brandColor: (institution.settings as any)?.brandColor || null,
      name: institution.name || null,
      logoUrl: (institution.settings as any)?.logoUrl || null,
    };
  }

  @Post("my-institution/brand")
  @ApiOperation({ summary: "Update institution brand (color and logo)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        brandColor: { type: "string" },
        logoUrl: { type: "string" },
      },
    },
  })
  async updateBrand(
    @Req() req: Request,
    @Body() body: { brandColor?: string; logoUrl?: string },
  ) {
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as any),
    });

    if (!session) {
      throw new UnauthorizedException("No session found");
    }

    const user = session.user as any;
    if (!user.institutionId) {
      throw new UnauthorizedException("No linked institution found");
    }

    await this.institutionsService.updateBrand(
      user.institutionId,
      body.brandColor,
      body.logoUrl,
    );
    return { success: true };
  }
}
