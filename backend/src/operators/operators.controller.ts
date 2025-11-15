import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  HttpCode, 
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OperatorsService } from './operators.service';

@Controller('api/operators')
export class OperatorsController {
  constructor(private operatorsService: OperatorsService) {}

  /**
   * GET /api/operators/rules
   * Get all operator message rules
   * Used by Android app on startup
   */
  @Get('rules')
  async getRules() {
    return this.operatorsService.getOperatorRules();
  }

  /**
   * GET /api/operators/rules/last-updated
   * Check if rules have been updated
   * Android uses this for efficient caching
   */
  @Get('rules/last-updated')
  async getLastUpdated() {
    return this.operatorsService.getRulesLastUpdated();
  }

  /**
   * GET /api/operators/rules/:operatorCode
   * Get rules for specific operator
   */
  @Get('rules/:operatorCode')
  async getOperatorRule(@Param('operatorCode') operatorCode: string) {
    return this.operatorsService.getOperatorRule(operatorCode);
  }

  /**
   * GET /api/operators/prefixes
   * Get all operator prefixes
   */
  @Get('prefixes')
  async getPrefixes() {
    return this.operatorsService.getOperatorPrefixes();
  }

  /**
   * POST /api/operators/rules
   * Admin: Add new operator message rule
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  async addRule(
    @Body()
    body: {
      operator_code: string;
      pattern: string;
      result_status: 'success' | 'failure';
    },
  ) {
    return this.operatorsService.addOperatorRule(
      body.operator_code,
      body.pattern,
      body.result_status,
    );
  }

  /**
   * DELETE /api/operators/rules/:id
   * Admin: Delete operator message rule
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete('rules/:id')
  @HttpCode(HttpStatus.OK)
  async deleteRule(@Param('id') id: string) {
    return this.operatorsService.deleteOperatorRule(parseInt(id));
  }
}
