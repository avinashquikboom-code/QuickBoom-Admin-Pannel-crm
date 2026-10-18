import { redirect } from 'next/navigation';

export default async function SubscribePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawId = resolvedParams?.customerId;
  const parsedId = rawId ? Number(rawId) : null;
  const customerId =
    typeof parsedId === 'number' && Number.isSafeInteger(parsedId) && parsedId > 0
      ? parsedId
      : null;

  if (customerId) {
    redirect(`/customers/${customerId}`);
  }

  redirect('/customers');
}

