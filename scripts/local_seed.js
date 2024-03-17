const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const {
  invoices,
  customers,
  revenue,
  users,
} = require('../app/lib/placeholder-data.js');

async function seedUsers() {
    try {
      // Ensure uuid-ossp extension is created
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
      // Create users table if it doesn't exist
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        );
      `;
  
      console.log(`Created "users" table`);
  
      // Insert data into the "users" table
      const insertedUsers = await Promise.all(
        users.map(async (user) => {
          const hashedPassword = await bcrypt.hash(user.password, 10);
          return prisma.$executeRaw`
            INSERT INTO users (id, name, email, password)
            VALUES (CAST (${user.id} AS UUID), ${user.name}, ${user.email}, ${hashedPassword})
            ON CONFLICT (id) DO NOTHING;
          `;
        }),
      );
  
      console.log(`Seeded ${insertedUsers.length} users`);
    } catch (error) {
      console.error('Error seeding users:', error);
      throw error;
    }
  }
  
  async function seedInvoices() {
    try {
      // Create invoices table if it doesn't exist
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          customer_id UUID NOT NULL,
          amount INT NOT NULL,
          status VARCHAR(255) NOT NULL,
          date DATE NOT NULL
        );
      `;
  
      console.log(`Created "invoices" table`);
  
      // Insert data into the "invoices" table
      const insertedInvoices = await Promise.all(
        invoices.map(async (invoice) => {
          return prisma.$executeRaw`
            INSERT INTO invoices (id, customer_id, amount, status, date)
            VALUES (uuid_generate_v4(), CAST(${invoice.customer_id} AS UUID), ${invoice.amount}, ${invoice.status}, ${invoice.date}::DATE)
            ON CONFLICT (id) DO NOTHING;
          `;
        }),
      );
  
      console.log(`Seeded ${insertedInvoices.length} invoices`);
    } catch (error) {
      console.error('Error seeding invoices:', error);
      throw error;
    }
  }
  
  
  async function seedCustomers() {
    try {
      // Create customers table if it doesn't exist
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS customers (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          image_url VARCHAR(255) NOT NULL
        );
      `;
  
      console.log(`Created "customers" table`);
  
      // Insert data into the "customers" table
      const insertedCustomers = await Promise.all(
        customers.map(async (customer) => {
          return prisma.$executeRaw`
            INSERT INTO customers (id, name, email, image_url)
            VALUES (uuid_generate_v4(), ${customer.name}, ${customer.email}, ${customer.image_url})
            ON CONFLICT (id) DO NOTHING;
          `;
        }),
      );
  
      console.log(`Seeded ${insertedCustomers.length} customers`);
    } catch (error) {
      console.error('Error seeding customers:', error);
      throw error;
    }
  }
  
  async function seedRevenue() {
    try {
      // Create revenue table if it doesn't exist
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS revenue (
          month VARCHAR(4) NOT NULL UNIQUE,
          revenue INT NOT NULL
        );
      `;
  
      console.log(`Created "revenue" table`);
  
      // Insert data into the "revenue" table
      const insertedRevenue = await Promise.all(
        revenue.map(async (rev) => {
          return prisma.$executeRaw`
            INSERT INTO revenue (month, revenue)
            VALUES (${rev.month}, ${rev.revenue})
            ON CONFLICT (month) DO NOTHING;
          `;
        }),
      );
  
      console.log(`Seeded ${insertedRevenue.length} revenue`);
    } catch (error) {
      console.error('Error seeding revenue:', error);
      throw error;
    }
  }
  
  async function main() {
    try {
      await seedUsers();
      await seedCustomers();
      await seedInvoices();
      await seedRevenue();
    } catch (error) {
      console.error('An error occurred while attempting to seed the database:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  main();