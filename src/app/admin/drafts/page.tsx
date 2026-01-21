import { getDraftsAction } from './action';
import { DraftsList } from './drafts-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';

export default async function DraftsPage() {
    const drafts = await getDraftsAction();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <Link 
                    href="/admin" 
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour au Tableau de Bord
                </Link>
                
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Brouillons et Articles Programmés</h1>
                        <p className="text-muted-foreground mt-2">
                            {drafts.length} élément{drafts.length > 1 ? 's' : ''} en attente
                        </p>
                    </div>
                    
                    <Button asChild>
                        <Link href="/admin/create-article">
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvel Article
                        </Link>
                    </Button>
                </div>
            </div>

            <DraftsList initialDrafts={drafts} />
        </div>
    );
}
