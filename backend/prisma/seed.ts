import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Prisma database seeding...');

  // 1. Clean existing records
  try {
    await prisma.challanItem.deleteMany();
    await prisma.challan.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.product.deleteMany();
    await prisma.followUp.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('Initializing database tables for the first time...');
  }

  // 2. Create Users
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const salesPassword = await bcrypt.hash('Sales@123', 10);
  const warehousePassword = await bcrypt.hash('Warehouse@123', 10);
  const accountsPassword = await bcrypt.hash('Accounts@123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: 'Sarah Sales Manager',
      email: 'sales@example.com',
      password: salesPassword,
      role: 'SALES',
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: 'Wayne Warehouse Ops',
      email: 'warehouse@example.com',
      password: warehousePassword,
      role: 'WAREHOUSE',
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: 'Alex Accounts Lead',
      email: 'accounts@example.com',
      password: accountsPassword,
      role: 'ACCOUNTS',
    },
  });

  console.log('Created 4 Role-based Users (Admin, Sales, Warehouse, Accounts)');

  // 3. Create Sample Customers
  const today = new Date();
  const c1 = await prisma.customer.create({
    data: {
      customerName: 'Rajesh Kumar',
      mobile: '9876543210',
      email: 'rajesh@apexwholesales.com',
      businessName: 'Apex Wholesale Traders',
      gstNumber: '27AAAAA1111A1Z5',
      customerType: 'WHOLESALE',
      address: 'Shop 104, Grain Market, APMC Complex, Navi Mumbai',
      status: 'ACTIVE',
      followUpDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Interested in bulk orders for Q3 barcode inventory scanners.',
    },
  });

  const c2 = await prisma.customer.create({
    data: {
      customerName: 'Priya Sharma',
      mobile: '9812345678',
      email: 'priya@sharmaretail.com',
      businessName: 'Sharma Super Mart',
      gstNumber: '27BBBBB9999B2Z0',
      customerType: 'RETAIL',
      address: 'Plot 45, MG Road, Pune',
      status: 'ACTIVE',
      followUpDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Regular retail customer. Requires monthly delivery challan updates.',
    },
  });

  const c3 = await prisma.customer.create({
    data: {
      customerName: 'Vikram Singh',
      mobile: '9711223344',
      email: 'vikram@globaldistributors.com',
      businessName: 'Global Logistics & Distribution Co',
      gstNumber: '27CCCCC2222C3Z1',
      customerType: 'DISTRIBUTOR',
      address: 'Warehouse 9, Freight Complex, Pune',
      status: 'LEAD',
      followUpDate: today,
      notes: 'Initial quotation sent for thermal paper rolls and barcode labels.',
    },
  });

  console.log('Created Sample Customers');

  // 4. Create Follow-Up Logs
  await prisma.followUp.create({
    data: {
      customerId: c1.id,
      notes: 'Discussed volume discount for 50+ thermal label printers.',
      followUpDate: today,
      createdBy: sales.name,
    },
  });

  await prisma.followUp.create({
    data: {
      customerId: c3.id,
      notes: 'Followed up on email quote. Customer requested revised credit terms.',
      followUpDate: today,
      createdBy: sales.name,
    },
  });

  console.log('Created Customer Follow-ups');

  // 5. Create Sample Products
  const p1 = await prisma.product.create({
    data: {
      name: 'Wireless Bluetooth Barcode Scanner',
      sku: 'SKU-SCAN-01',
      category: 'Electronics & Hardware',
      unitPrice: 3500.0,
      currentStock: 25,
      minimumStock: 5,
      warehouse: 'Main Warehouse A',
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Direct Thermal Label Printer 4-Inch',
      sku: 'SKU-PRN-02',
      category: 'Electronics & Hardware',
      unitPrice: 12500.0,
      currentStock: 4, // LOW STOCK ALERT!
      minimumStock: 8,
      warehouse: 'Main Warehouse A',
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Heavy Duty Thermal Paper Rolls (Pack of 50)',
      sku: 'SKU-PPR-03',
      category: 'Consumables',
      unitPrice: 1800.0,
      currentStock: 100,
      minimumStock: 20,
      warehouse: 'Consumables Annex B',
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Industrial Handheld Inventory Terminal',
      sku: 'SKU-TRM-04',
      category: 'Electronics & Hardware',
      unitPrice: 28500.0,
      currentStock: 2, // LOW STOCK ALERT!
      minimumStock: 5,
      warehouse: 'Main Warehouse A',
    },
  });

  console.log('Created Sample Products with Low Stock Indicators');

  // 6. Create Initial Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: p1.id,
        quantity: 25,
        movementType: 'IN',
        reason: 'Initial Inventory Inward Receiving',
        createdBy: warehouse.name,
      },
      {
        productId: p2.id,
        quantity: 10,
        movementType: 'IN',
        reason: 'Initial Purchase Stock Entry',
        createdBy: warehouse.name,
      },
      {
        productId: p3.id,
        quantity: 100,
        movementType: 'IN',
        reason: 'Supplier Batch Shipment Inward',
        createdBy: warehouse.name,
      },
      {
        productId: p4.id,
        quantity: 5,
        movementType: 'IN',
        reason: 'Demonstration Unit Stock Entry',
        createdBy: warehouse.name,
      },
    ],
  });

  console.log('Logged Initial Stock Movements');

  // 7. Create Sample Sales Challans
  // Challan 1: Confirmed Challan
  const challan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-0001',
      customerId: c1.id,
      totalQuantity: 6,
      totalAmount: 12500 * 6,
      status: 'CONFIRMED',
      createdBy: sales.name,
      items: {
        create: [
          {
            productId: p2.id,
            productName: p2.name,
            sku: p2.sku,
            unitPrice: p2.unitPrice,
            quantity: 6,
          },
        ],
      },
    },
  });

  // Deduct stock for confirmed challan 1
  await prisma.product.update({
    where: { id: p2.id },
    data: { currentStock: { decrement: 6 } },
  });

  await prisma.stockMovement.create({
    data: {
      productId: p2.id,
      quantity: 6,
      movementType: 'OUT',
      reason: `Dispatched for Confirmed Delivery Challan #${challan1.challanNumber}`,
      createdBy: sales.name,
    },
  });

  // Challan 2: Draft Challan
  await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-0002',
      customerId: c2.id,
      totalQuantity: 15,
      totalAmount: p1.unitPrice * 5 + p3.unitPrice * 10,
      status: 'DRAFT',
      createdBy: sales.name,
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            sku: p1.sku,
            unitPrice: p1.unitPrice,
            quantity: 5,
          },
          {
            productId: p3.id,
            productName: p3.name,
            sku: p3.sku,
            unitPrice: p3.unitPrice,
            quantity: 10,
          },
        ],
      },
    },
  });

  console.log('Created Sample Sales Challans (1 Confirmed, 1 Draft)');
  console.log('Seeding successfully finished.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
