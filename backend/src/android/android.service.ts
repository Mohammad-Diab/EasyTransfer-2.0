import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AndroidService {
  constructor(private prisma: PrismaService) {}

  async getPendingJobs() {
    // Upgrade delayed → pending if execute_after passed
    await this.prisma.transferRequest.updateMany({
      where: {
        status: 'delayed',
        execute_after: { lte: new Date() },
      },
      data: { status: 'pending' },
    });

    // Return pending transfers
    return this.prisma.transferRequest.findMany({
      where: { status: 'pending' },
      orderBy: { execute_after: 'asc' },
      take: 10,
    });
  }

  async reportResult(requestId: number, status: string, response: string) {
    return this.prisma.transferRequest.update({
      where: { id: requestId },
      data: {
        status: status as any,
        carrier_response: response,
        executed_at: new Date(),
      },
    });
  }
}
