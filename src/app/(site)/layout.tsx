import { SiteHeader } from '@/components/layout/site-header';
import { Footer } from '@/components/layout/footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
        </div>
    );
}
