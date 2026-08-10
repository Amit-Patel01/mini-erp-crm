import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { NotFoundError, ConflictError, AppError } from '../utils/errors';
import { Role } from '../types/index';

export class UserService {
  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  static async createUser(data: { name: string; email: string; password: string; role: Role }) {
    const cleanEmail = data.email.trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail } },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async resetPassword(userId: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: `Password reset successfully for user ${user.email}` };
  }

  static async deleteUser(adminUserId: string, targetUserId: string) {
    if (adminUserId === targetUserId) {
      throw new AppError('You cannot delete your own active Admin account.', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.delete({ where: { id: targetUserId } });
    return { message: `User ${user.email} deleted successfully.` };
  }
}
