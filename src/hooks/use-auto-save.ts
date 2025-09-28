'use client';

import { useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';
import type { Draft } from '@/lib/data-types';

interface UseAutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave<T extends Partial<Draft>>(
  data: T,
  onSave: (data: T) => Promise<any>,
  options: UseAutoSaveOptions = {}
) {
  const {
    delay = 30000,
    enabled = true,
    onSaveSuccess,
    onSaveError
  } = options;

  const saveFunction = useCallback(async (saveData: T) => {
    if (!enabled) return;
    
    try {
      await onSave(saveData);
      onSaveSuccess?.();
    } catch (error) {
      onSaveError?.(error as Error);
    }
  }, [onSave, enabled, onSaveSuccess, onSaveError]);

  const debouncedSave = useRef(debounce(saveFunction, delay));
  const dataRef = useRef(data);
  dataRef.current = data;

  // Auto-save quand les données changent
  useEffect(() => {
    if (enabled && hasContent(data)) {
      debouncedSave.current(data);
    }
    // Nettoyer le debounce à la fin
    return () => {
        debouncedSave.current.cancel();
    }
  }, [data, enabled]);

  // Sauvegarde avant fermeture de page
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (enabled && hasContent(dataRef.current)) {
        // La sauvegarde se fait via Beacon API, qui est asynchrone mais fiable pour ça.
        // On ne peut pas attendre de réponse. C'est une sauvegarde de "dernier recours".
        const payload = JSON.stringify(dataRef.current);
        if (navigator.sendBeacon('/api/drafts/emergency-save', payload)) {
             // Beacon sent successfully
        } else {
            // Beacon not sent, try to save synchronously (less reliable)
            saveFunction(dataRef.current);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      debouncedSave.current.cancel();
    };
  }, [enabled, saveFunction]);

  // Sauvegarde manuelle
  const saveNow = useCallback(() => {
    debouncedSave.current.cancel();
    return saveFunction(dataRef.current);
  }, [saveFunction]);

  return { saveNow };
}

function hasContent(data: any): boolean {
  return (data?.title && data.title.trim().length > 0) || 
         (data?.content && data.content.trim().length > 0);
}
