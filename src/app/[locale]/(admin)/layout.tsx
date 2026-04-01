import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const cookieStore = cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    redirect(`/${params.locale}/login`);
  }

  const decoded = await verifySession(session);
  if (!decoded) {
    redirect(`/${params.locale}/login`);
  }

  return <>{children}</>;
}
