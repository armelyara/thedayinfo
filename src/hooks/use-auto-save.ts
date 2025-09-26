'use client';

import { useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';

interface UseAutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave<T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
) {
  const {
    delay = 30000, // 30 secondes par défaut
    enabled = true,
    onSaveSuccess,
    onSaveError
  } = options;

  const saveFunction = useCallback(async (data: T) => {
    if (!enabled) return;
    
    try {
      await onSave(data);
      onSaveSuccess?.();
    } catch (error) {
      onSaveError?.(error as Error);
    }
  }, [onSave, enabled, onSaveSuccess, onSaveError]);

  const debouncedSave = useRef(debounce(saveFunction, delay));

  // Auto-save quand les données changent
  useEffect(() => {
    if (enabled && hasContent(data)) {
      debouncedSave.current(data);
    }
  }, [data, enabled]);

  // Sauvegarde avant fermeture de page
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (enabled && hasContent(data)) {
        // Sauvegarde synchrone
        navigator.sendBeacon('/api/drafts/emergency-save', JSON.stringify(data));
        
        // Message d'avertissement
        event.preventDefault();
        event.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && enabled && hasContent(data)) {
        saveFunction(data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      debouncedSave.current.cancel();
    };
  }, [data, enabled, saveFunction]);

  // Sauvegarde manuelle
  const saveNow = useCallback(() => {
    debouncedSave.current.cancel();
    return saveFunction(data);
  }, [data, saveFunction]);

  return { saveNow };
}

function hasContent(data: any): boolean {
  return (data?.title && data.title.trim().length > 0) || 
         (data?.content && data.content.trim().length > 0);
}