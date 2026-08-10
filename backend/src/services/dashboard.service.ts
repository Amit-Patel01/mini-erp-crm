import { prisma } from '../utils/prisma';

export class DashboardService {
  static async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalCustomers,
      totalProducts,
      allProducts,
      draftChallans,
      confirmedChallans,
      todaysChallans,
      recentChallans,
      recentStockMovements,
      todaysFollowUps,
      confirmedChallanTotals,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.findMany(),
      prisma.challan.count({ where: { status: 'DRAFT' } }),
      prisma.challan.count({ where: { status: 'CONFIRMED' } }),
      prisma.challan.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { customerName: true, businessName: true } },
        },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
        },
      }),
      prisma.customer.findMany({
        where: {
          followUpDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        select: {
          id: true,
          customerName: true,
          businessName: true,
          mobile: true,
          email: true,
          status: true,
          customerType: true,
          address: true,
          followUpDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { followUpDate: 'asc' },
      }),
      prisma.challan.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalAmount: true },
      }),
    ]);

    const lowStockProducts = allProducts.filter(
      (p) => p.currentStock <= p.minimumStock
    );

    const totalRevenue = confirmedChallanTotals._sum.totalAmount || 0;

    const metrics = {
      totalCustomers,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      draftChallans,
      confirmedChallans,
      todayFollowUpsCount: todaysFollowUps.length,
      totalRevenue,
    };

    return {
      metrics,
      lowStockProducts,
      followUpsDueToday: todaysFollowUps,
      recentChallans,
      recentStockMovements,
      // Backward compatibility aliases
      summary: metrics,
      lowStockAlerts: lowStockProducts,
      todaysFollowUps,
    };
  }
}
