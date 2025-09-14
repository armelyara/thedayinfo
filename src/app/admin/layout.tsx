
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logout } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

async function LogoutButton() {
    return (
        <form action={logout}>
            <Button variant="ghost">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
            </Button>
        </form>
    )
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = cookies().get('session')?.value;
  const user = session ? await verifySession(session) : null;

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense>
        <div className="min-h-screen">
            <header className="flex justify-between items-center p-4 border-b">
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <LogoutButton />
            </header>
            <main>
                {children}
            </main>
        </div>
    </Suspense>
  );
}
