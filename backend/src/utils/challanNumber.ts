import { prisma } from './prisma';

export const generateChallanNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `CH-${currentYear}-`;

  // Find latest challan number matching prefix
  const latestChallan = await prisma.challan.findFirst({
    where: {
      challanNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      challanNumber: true,
    },
  });

  if (!latestChallan) {
    return `${prefix}0001`;
  }

  const parts = latestChallan.challanNumber.split('-');
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  const paddedSeq = nextSeq.toString().padStart(4, '0');

  return `${prefix}${paddedSeq}`;
};
