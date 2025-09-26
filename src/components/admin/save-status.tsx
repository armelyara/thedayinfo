'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SaveStatusProps {
    lastSaved?: string;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
}

export function SaveStatus({ lastSaved, isSaving, hasUnsavedChanges }: SaveStatusProps) {
    if (isSaving) {
        return (
            <div className="flex items-center text-yellow-600 text-sm">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-2"></div>
                Sauvegarde en cours...
            </div>
        );
    }

    if (hasUnsavedChanges) {
        return (
            <div className="flex items-center text-orange-600 text-sm">
                <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
                Modifications non sauvegardées
            </div>
        );
    }

    if (lastSaved) {
        return (
            <div className="flex items-center text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                Sauvegardé à {format(new Date(lastSaved), 'HH:mm', { locale: fr })}
            </div>
        );
    }

    return (
        <div className="text-gray-500 text-sm">
            Pas encore sauvegardé
        </div>
    );
}