import { z } from 'zod';

const challanItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID format'),
  items: z.array(challanItemSchema).min(1, 'Challan must contain at least one product line item'),
  status: z.enum(['DRAFT', 'CONFIRMED']).optional().default('DRAFT'),
});
