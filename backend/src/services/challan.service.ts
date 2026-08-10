import { prisma } from '../utils/prisma';
import { generateChallanNumber } from '../utils/challanNumber';
import { NotFoundError, AppError, StockError } from '../utils/errors';

export class ChallanService {
  static async getChallans(query: {
    status?: string;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { challanNumber: { contains: searchLower } },
        { customer: { customerName: { contains: searchLower } } },
        { customer: { businessName: { contains: searchLower } } },
      ];
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, customerName: true, businessName: true, mobile: true, email: true },
          },
          items: true,
        },
      }),
      prisma.challan.count({ where }),
    ]);

    return {
      challans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getChallanById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, currentStock: true },
            },
          },
        },
      },
    });

    if (!challan) {
      throw new NotFoundError('Sales Challan not found');
    }

    return challan;
  }

  static async createChallan(
    data: {
      customerId: string;
      items: Array<{ productId: string; quantity: number }>;
      status?: 'DRAFT' | 'CONFIRMED';
    },
    createdBy: string
  ) {
    // 1. Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // 2. Fetch all products to create snapshot data
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundError('One or more selected products do not exist');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3. Prepare line items with snapshots & compute totals
    let totalQuantity = 0;
    let totalAmount = 0;

    const itemsData = data.items.map((item) => {
      const prod = productMap.get(item.productId)!;
      totalQuantity += item.quantity;
      totalAmount += prod.unitPrice * item.quantity;

      return {
        productId: prod.id,
        productName: prod.name, // Snapshot
        sku: prod.sku,         // Snapshot
        unitPrice: prod.unitPrice, // Snapshot
        quantity: item.quantity,
      };
    });

    const requestedStatus = data.status || 'DRAFT';

    // 4. Generate unique Challan Number (e.g. CH-2026-0001)
    const challanNumber = await generateChallanNumber();

    // 5. If requested status is DRAFT, create record without touching stock
    if (requestedStatus === 'DRAFT') {
      const newChallan = await prisma.challan.create({
        data: {
          challanNumber,
          customerId: data.customerId,
          totalQuantity,
          totalAmount,
          status: 'DRAFT',
          createdBy,
          items: {
            create: itemsData,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });
      return newChallan;
    }

    // 6. If requested status is CONFIRMED, create inside a DATABASE TRANSACTION
    return prisma.$transaction(async (tx) => {
      // Check current stock for all items
      for (const item of itemsData) {
        const currentProd = await tx.product.findUnique({ where: { id: item.productId } });
        if (!currentProd || currentProd.currentStock < item.quantity) {
          const avail = currentProd ? currentProd.currentStock : 0;
          throw new StockError(item.productName, avail, item.quantity);
        }
      }

      // Create Challan
      const newChallan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: data.customerId,
          totalQuantity,
          totalAmount,
          status: 'CONFIRMED',
          createdBy,
          items: {
            create: itemsData,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // Reduce stock and log stock movement for each item
      for (const item of itemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan #${challanNumber}`,
            createdBy,
          },
        });
      }

      return newChallan;
    });
  }

  static async confirmChallan(id: string, user: { userId: string; name: string }) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch Challan & Items
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!challan) {
        throw new NotFoundError('Challan not found');
      }

      // 2. Validate state transitions
      if (challan.status === 'CONFIRMED') {
        throw new AppError('Challan is already CONFIRMED', 400);
      }
      if (challan.status === 'CANCELLED') {
        throw new AppError('Cannot confirm a CANCELLED challan', 400);
      }

      // 3. Stock validation check for all line items
      for (const item of challan.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const available = product ? product.currentStock : 0;
        if (!product || available < item.quantity) {
          throw new StockError(item.productName, available, item.quantity);
        }
      }

      // 4. Reduce stock & log OUT Stock Movements
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Confirmed Sales Challan #${challan.challanNumber}`,
            createdBy: user.userId,
          },
        });
      }

      // 5. Update Challan status to CONFIRMED
      const updatedChallan = await tx.challan.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: { customer: true, items: true },
      });

      return updatedChallan;
    });
  }

  static async cancelChallan(id: string, user: { userId: string; name: string }) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!challan) {
        throw new NotFoundError('Challan not found');
      }

      if (challan.status === 'CANCELLED') {
        throw new AppError('Challan is already CANCELLED', 400);
      }

      // If it was CONFIRMED, restore product stock & log IN movement
      if (challan.status === 'CONFIRMED') {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'IN',
              reason: `Cancelled Sales Challan #${challan.challanNumber} (Stock Restocked)`,
              createdBy: user.userId,
            },
          });
        }
      }

      // Set status to CANCELLED
      const updated = await tx.challan.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { customer: true, items: true },
      });

      return updated;
    });
  }
}
