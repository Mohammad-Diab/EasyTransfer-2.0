import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperatorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all operator message rules for Android app
   * Returns rules grouped by operator with success and failure patterns
   */
  async getOperatorRules() {
    const allRules = await this.prisma.operatorMessageRule.findMany({
      orderBy: {
        operator_code: 'asc',
      },
    });

    // Group rules by operator and separate success/failure patterns
    const groupedRules = this.groupRulesByOperator(allRules);

    return {
      rules: groupedRules,
      last_updated: this.getLatestUpdateTime(allRules),
    };
  }

  /**
   * Get timestamp of last rules update
   * Used by Android to check if rules need refresh
   */
  async getRulesLastUpdated() {
    const latestRule = await this.prisma.operatorMessageRule.findFirst({
      orderBy: {
        created_at: 'desc',
      },
      select: {
        created_at: true,
      },
    });

    return {
      last_updated: latestRule?.created_at || new Date(),
    };
  }

  /**
   * Get rules for a specific operator
   */
  async getOperatorRule(operatorCode: string) {
    const rules = await this.prisma.operatorMessageRule.findMany({
      where: {
        operator_code: operatorCode.toUpperCase(),
      },
    });

    if (rules.length === 0) {
      throw new NotFoundException(`Rules not found for operator: ${operatorCode}`);
    }

    // Separate success and failure patterns
    const successPatterns = rules
      .filter((r) => r.result_status === 'success')
      .map((r) => r.pattern);

    const failurePatterns = rules
      .filter((r) => r.result_status === 'failure')
      .map((r) => r.pattern);

    return {
      operator_code: operatorCode.toUpperCase(),
      success_patterns: successPatterns,
      failure_patterns: failurePatterns,
    };
  }

  /**
   * Admin: Add new operator message rule
   */
  async addOperatorRule(
    operatorCode: string,
    pattern: string,
    resultStatus: 'success' | 'failure',
  ) {
    // Check if operator exists
    const operatorPrefix = await this.prisma.operatorPrefix.findFirst({
      where: { operator_code: operatorCode.toUpperCase() },
    });

    if (!operatorPrefix) {
      throw new NotFoundException(`Operator not found: ${operatorCode}`);
    }

    const rule = await this.prisma.operatorMessageRule.create({
      data: {
        operator_code: operatorCode.toUpperCase(),
        pattern,
        result_status: resultStatus,
      },
    });

    return rule;
  }

  /**
   * Admin: Delete operator message rule
   */
  async deleteOperatorRule(ruleId: number) {
    await this.prisma.operatorMessageRule.delete({
      where: { id: ruleId },
    });

    return { message: 'Rule deleted successfully' };
  }

  /**
   * Get all operator prefixes
   */
  async getOperatorPrefixes() {
    return this.prisma.operatorPrefix.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        operator_code: 'asc',
      },
    });
  }

  /**
   * Helper: Group rules by operator and separate success/failure patterns
   */
  private groupRulesByOperator(rules: any[]) {
    const grouped = new Map<string, { success_patterns: string[]; failure_patterns: string[] }>();

    rules.forEach((rule) => {
      if (!grouped.has(rule.operator_code)) {
        grouped.set(rule.operator_code, {
          success_patterns: [],
          failure_patterns: [],
        });
      }

      const operatorRules = grouped.get(rule.operator_code)!;
      if (rule.result_status === 'success') {
        operatorRules.success_patterns.push(rule.pattern);
      } else if (rule.result_status === 'failure') {
        operatorRules.failure_patterns.push(rule.pattern);
      }
    });

    // Convert Map to array of objects
    return Array.from(grouped.entries()).map(([operator_code, patterns]) => ({
      operator_code,
      ...patterns,
    }));
  }

  /**
   * Helper: Get latest update timestamp from rules array
   */
  private getLatestUpdateTime(rules: Array<{ created_at: Date }>): Date {
    if (rules.length === 0) return new Date();

    return rules.reduce((latest, rule) => {
      return rule.created_at > latest ? rule.created_at : latest;
    }, rules[0].created_at);
  }
}
