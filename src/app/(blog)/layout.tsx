import { MainLayout } from '@/components/layout/main-layout';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <MainLayout>{children}</MainLayout>;
}
