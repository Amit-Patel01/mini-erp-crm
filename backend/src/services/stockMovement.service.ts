import { prisma } from '../utils/prisma';
import { NotFoundError, AppError } from '../utils/errors';

export class StockMovementService {
  static async getStockMovements(query: {
    productId?: string;
    movementType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.productId) where.productId = query.productId;
    if (query.movementType) where.movementType = query.movementType;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { name: true, sku: true, category: true },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async createStockMovement(data: {
    productId: string;
    quantity: number;
    movementType: 'IN' | 'OUT';
    reason: string;
    createdBy: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      if (data.movementType === 'OUT' && product.currentStock < data.quantity) {
        throw new AppError(
          `Cannot perform OUT stock movement. Available stock: ${product.currentStock}, Requested: ${data.quantity}`,
          400,
          { available: product.currentStock, requested: data.quantity }
        );
      }

      const newStock =
        data.movementType === 'IN'
          ? product.currentStock + data.quantity
          : product.currentStock - data.quantity;

      const [updatedProduct, movement] = await Promise.all([
        tx.product.update({
          where: { id: data.productId },
          data: { currentStock: newStock },
        }),
        tx.stockMovement.create({
          data: {
            productId: data.productId,
            quantity: data.quantity,
            movementType: data.movementType,
            reason: data.reason,
            createdBy: data.createdBy,
          },
        }),
      ]);

      return { movement, updatedStock: updatedProduct.currentStock };
    });
  }
}
