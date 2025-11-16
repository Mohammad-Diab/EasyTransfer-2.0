import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TierValidationResult {
  valid: boolean;
  requestedAmount: number;
  matchedTier: number | null;
  message: string;
}

@Injectable()
export class TiersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate if an amount matches a tier or find the nearest tier
   * Returns matched tier if exact match or within 20% range
   */
  async validateAmount(amount: number): Promise<TierValidationResult> {
    // Get all active tiers
    const tiers = await this.prisma.transferTier.findMany({
      where: { is_active: true },
      orderBy: { amount: 'asc' },
      select: { amount: true },
    });

    const tierAmounts = tiers.map((t) => t.amount);

    // Check for exact match
    if (tierAmounts.includes(amount)) {
      return {
        valid: true,
        requestedAmount: amount,
        matchedTier: amount,
        message: 'Exact tier match',
      };
    }

    // Find nearest tier within 20% range
    let nearestTier: number | null = null;
    let minDifference = Infinity;

    for (const tierAmount of tierAmounts) {
      const difference = Math.abs(amount - tierAmount);
      const percentageDiff = (difference / tierAmount) * 100;

      // Within 20% range
      if (percentageDiff <= 20 && difference < minDifference) {
        minDifference = difference;
        nearestTier = tierAmount;
      }
    }

    if (nearestTier !== null) {
      return {
        valid: true,
        requestedAmount: amount,
        matchedTier: nearestTier,
        message: `Nearest tier found: ${nearestTier}`,
      };
    }

    // No valid tier found
    return {
      valid: false,
      requestedAmount: amount,
      matchedTier: null,
      message: 'لا يمكن تحويل هذا المبلغ',
    };
  }

  /**
   * Get all active tiers
   */
  async getActiveTiers(): Promise<number[]> {
    const tiers = await this.prisma.transferTier.findMany({
      where: { is_active: true },
      orderBy: { amount: 'asc' },
      select: { amount: true },
    });

    return tiers.map((t) => t.amount);
  }
}
