import  {getPrismaClient} from '@/app/lib/prisma';

import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  CardDataRaw,
  DashboardCardData,
  InvoiceCountResult,
  CustomerCountResult,
  InvoiceStatusResult,
  FetchedFilteredInvoices

} from './definitions';
import { formatCurrency } from './utils';
import { unstable_noStore as noStore } from 'next/cache';
import { UUID } from 'crypto';

const prisma = getPrismaClient();

export async function fetchRevenue() {
  
  noStore();
  
  try {
   
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await prisma.revenue.findMany();


    return data;
  } catch (error) {
    throw new Error('Failed to fetch revenue data.');
  }
}



export async function fetchLatestInvoices() {
  noStore();
  try {
    const data = await prisma.$queryRaw<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;
   

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.

  
    
    const invoiceCountPromise: Promise<InvoiceCountResult> = prisma.$queryRaw`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise: Promise<CustomerCountResult> = prisma.$queryRaw`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise: Promise<InvoiceStatusResult> = prisma.$queryRaw`
        SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;
    


    const data: DashboardCardData = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);
    
    const numberOfInvoices = Number(data[0][0]?.count ?? 0);
    const numberOfCustomers = Number(data[1][0]?.count ?? 0);
    const totalPaidInvoices = formatCurrency(data[2][0]?.paid ?? 0);
    const totalPendingInvoices = formatCurrency(data[2][0]?.pending ?? 0);


    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}


const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query: string,currentPage: number,): Promise<InvoicesTable>{
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    return  await prisma.$queryRaw<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `
    .then((data) => data)
    
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

type Count = {
  count: bigint | number;
}
export async function fetchInvoicesPages(query: string) {
  try {

    const count = await prisma.$queryRaw<Count[]>`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `
  .then(data => data)

    const totalPages = Math.ceil(Number(count[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}



export async function fetchInvoiceById(id: string) {
  
    return await prisma.invoices.findUnique({
      where: {
        id,  // Use id directly without casting
      },
    })
    .then((data) => {
      if (!data) {
       return null;
      }
      return {
      ...data,
      // Convert amount from cents to dollars
      amount: Number(data?.amount) / 100,
    }})
    .catch((error) => {
      throw Error('Failed to fetch invoice.');
    });
}

export async function fetchCustomers() {
  try {
    const data = prisma.$queryRaw<CustomerField>`
      SELECT 
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    return data;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}
/*
export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
*/