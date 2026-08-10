import { prisma } from '../utils/prisma';
import { NotFoundError, ConflictError, AppError } from '../utils/errors';

export class ProductService {
  static async getProducts(query: {
    search?: string;
    category?: string;
    lowStock?: boolean | string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { name: { contains: searchLower } },
        { sku: { contains: searchLower } },
        { category: { contains: searchLower } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    let filtered = products;

    if (query.lowStock === true || query.lowStock === 'true') {
      filtered = products.filter((p) => p.currentStock <= p.minimumStock);
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      products: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  static async createProduct(data: any, createdBy: string) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw new ConflictError(`Product with SKU '${data.sku}' already exists.`);
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          sku: data.sku.toUpperCase(),
          category: data.category,
          unitPrice: Number(data.unitPrice),
          currentStock: Number(data.currentStock) || 0,
          minimumStock: Number(data.minimumStock) || 5,
          warehouse: data.warehouse || 'Main Warehouse',
        },
      });

      if (newProduct.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            quantity: newProduct.currentStock,
            movementType: 'IN',
            reason: 'Initial stock on product creation',
            createdBy,
          },
        });
      }

      return newProduct;
    });

    return product;
  }

  static async updateProduct(id: string, data: any) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    if (data.sku && data.sku !== existing.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (skuCheck) {
        throw new ConflictError(`Product with SKU '${data.sku}' already exists.`);
      }
    }

    return prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku ? data.sku.toUpperCase() : undefined,
        category: data.category,
        unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : undefined,
        minimumStock: data.minimumStock !== undefined ? Number(data.minimumStock) : undefined,
        warehouse: data.warehouse,
      },
    });
  }

  static async deleteProduct(id: string) {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { challanItems: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    if (existing._count.challanItems > 0) {
      throw new AppError(
        `Cannot delete product '${existing.name}' (${existing.sku}) because it is linked to ${existing._count.challanItems} sales delivery challan(s).`,
        400
      );
    }

    return prisma.product.delete({
      where: { id },
    });
  }
}
