'use server';
import { z } from 'zod';
import { getPrismaClient } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const prisma = getPrismaClient();

const FormSchema = z.object({
  id: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  customerId: z.string().uuid(),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'],{
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {

  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  }); //Object.fromEntries(formData.entries())
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  try {
    await prisma.invoices.create({
      data: {
        customer_id: customerId,
        amount: amountInCents,
        status,
        date,
      },
    });
  } catch (error) {
    return { message:`Error creating invoice`};
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string,prevState: State, formData: FormData) {

  const validateFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if(!validateFields.success){
    return{
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.'
    }
  }
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  try {
    await prisma.invoices.update({
      where: {
        id,
      },
      data: {
        customer_id: customerId,
        amount: amountInCents,
        status,
      },
    });
  } catch (error) {
    return {
      message: `Error updating invoice`,
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string){
    try{
  await prisma.invoices.delete({
      where: {
          id,
      }
  });
} catch(error){
    return{
        message: `Error deleting invoice`,
    }
}
  revalidatePath('/dashboard/invoices');
}