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

const LOCALSTORAGE_KEY_PREFIX = 'draft_backup_';

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
      
      // ✅ Supprimer le backup local après sauvegarde réussie
      if (saveData.id) {
        localStorage.removeItem(`${LOCALSTORAGE_KEY_PREFIX}${saveData.id}`);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      onSaveError?.(error as Error);
      
      // ✅ Sauvegarder localement en cas d'échec
      if (saveData.id) {
        try {
          localStorage.setItem(
            `${LOCALSTORAGE_KEY_PREFIX}${saveData.id}`,
            JSON.stringify({
              data: saveData,
              timestamp: Date.now()
            })
          );
        } catch (storageError) {
          console.error('Failed to save to localStorage:', storageError);
        }
      }
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
    return () => {
        debouncedSave.current.cancel();
    }
  }, [data, enabled]);

  // ✅ Sauvegarde avant fermeture de page (améliorée)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (enabled && hasContent(dataRef.current)) {
        // 1. Tentative avec Beacon API (async, ne bloque pas)
        const payload = JSON.stringify(dataRef.current);
        const blob = new Blob([payload], { type: 'application/json' });
        const beaconSent = navigator.sendBeacon('/api/drafts/emergency-save', blob);
        
        // 2. ✅ Backup dans localStorage en parallèle (sécurité)
        if (dataRef.current.id) {
          try {
            localStorage.setItem(
              `${LOCALSTORAGE_KEY_PREFIX}${dataRef.current.id}`,
              JSON.stringify({
                data: dataRef.current,
                timestamp: Date.now()
              })
            );
          } catch (storageError) {
            console.error('Failed to save to localStorage:', storageError);
          }
        }
        
        if (!beaconSent) {
          console.warn('Beacon failed, backup saved to localStorage');
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

  // ✅ Fonction pour récupérer un backup depuis localStorage
  const restoreFromLocalStorage = useCallback((draftId: string) => {
    try {
      const backup = localStorage.getItem(`${LOCALSTORAGE_KEY_PREFIX}${draftId}`);
      if (backup) {
        const parsed = JSON.parse(backup);
        return parsed.data as T;
      }
    } catch (error) {
      console.error('Failed to restore from localStorage:', error);
    }
    return null;
  }, []);

  return { saveNow, restoreFromLocalStorage };
}

function hasContent(data: any): boolean {
  return (data?.title && data.title.trim().length > 0) || 
         (data?.content && data.content.trim().length > 0);
}