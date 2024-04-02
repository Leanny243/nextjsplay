import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';
import { UUID } from 'crypto';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: { id: UUID}}) {
  const id = params.id;
  const [invoice, customers] = await Promise.all([fetchInvoiceById(id), fetchCustomers()]);
  if (!invoice || ! Array.isArray(customers)) notFound(); 
  const coercedInvoice = {
    ...invoice,
    status: invoice.status as 'pending' | 'paid',
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={coercedInvoice} customers={customers} />
    </main>
  );
}