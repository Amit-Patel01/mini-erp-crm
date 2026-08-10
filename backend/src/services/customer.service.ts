import { prisma } from '../utils/prisma';
import { NotFoundError, AppError } from '../utils/errors';

export class CustomerService {
  static async getCustomers(query: {
    search?: string;
    status?: string;
    customerType?: string;
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

    if (query.customerType) {
      where.customerType = query.customerType;
    }

    if (query.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { customerName: { contains: searchLower } },
        { businessName: { contains: searchLower } },
        { mobile: { contains: searchLower } },
        { email: { contains: searchLower } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            followUps: true,
            challans: true,
          },
        },
      },
    });

    const total = customers.length;
    const paginated = customers.slice(skip, skip + limit);

    return {
      customers: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  static async createCustomer(data: any) {
    return prisma.customer.create({
      data: {
        customerName: data.customerName,
        mobile: data.mobile,
        email: data.email || null,
        businessName: data.businessName,
        gstNumber: data.gstNumber || null,
        customerType: data.customerType || 'WHOLESALE',
        address: data.address,
        status: data.status || 'LEAD',
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes || null,
      },
    });
  }

  static async updateCustomer(id: string, data: any) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : data.followUpDate === null ? null : existing.followUpDate,
      },
    });
  }

  static async deleteCustomer(id: string) {
    const existing = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { challans: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    if (existing._count.challans > 0) {
      throw new AppError(
        `Cannot delete customer '${existing.customerName}' because they have ${existing._count.challans} sales challan(s) associated with them.`,
        400
      );
    }

    return prisma.customer.delete({
      where: { id },
    });
  }

  static async addFollowUp(customerId: string, notes: string, followUpDate: string, createdBy: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const followUpParsedDate = new Date(followUpDate);

    const [followUp] = await prisma.$transaction([
      prisma.followUp.create({
        data: {
          customerId,
          notes,
          followUpDate: followUpParsedDate,
          createdBy,
        },
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: {
          followUpDate: followUpParsedDate,
        },
      }),
    ]);

    return followUp;
  }

  static async getFollowUps(customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return prisma.followUp.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
