import { z } from 'zod';

export const createCustomerSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().or(z.literal('')),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('WHOLESALE'),
  address: z.string().min(3, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  notes: z.string().min(2, 'Follow-up notes are required'),
  followUpDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid follow-up date format',
  }),
});
