import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user';

import { AnalysesService } from './analyses.service';
import { CreateAnalysisDto, ListAnalysesQueryDto } from './dto';

@ApiTags('Analyses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'analyses',
  version: '1',
})
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create analysis request',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAnalysisDto,
  ) {
    return this.analysesService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List user analyses',
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAnalysesQueryDto,
  ) {
    return this.analysesService.findAll({
      userId: user.userId,
      page: query.page,
      limit: query.limit,
      status: query.status,
      domain: query.domain,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get analysis by ID',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.analysesService.findById(id, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete analysis',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.analysesService.delete(id, user.userId);
  }
}
