// Remplace le contenu de src/components/ui/image-upload.tsx par ceci :

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageSelect: (imageData: { src: string; alt: string }) => void;
  currentImage?: string;
}

/**
 * Compresse une image en utilisant Canvas
 * @param file - Fichier image à compresser
 * @param maxWidth - Largeur maximale (par défaut 1200px)
 * @param maxHeight - Hauteur maximale (par défaut 1200px)
 * @param quality - Qualité JPEG (0-1, par défaut 0.8)
 * @returns Promise<string> - Image en base64
 */
async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions en conservant le ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Créer un canvas pour redimensionner
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en base64 avec compression
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: 'Veuillez sélectionner un fichier image valide' 
      });
      return;
    }

    // Limite avant compression
    if (file.size > 50 * 1024 * 1024) { // 50MB avant compression
      toast({ 
        variant: 'destructive', 
        title: 'Fichier trop volumineux', 
        description: 'La taille de l\'image ne doit pas dépasser 50MB' 
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Compresser l'image
      const compressedBase64 = await compressImage(file, 1200, 1200, 0.8);
      
      // Vérifier la taille après compression
      const compressedSize = (compressedBase64.length * 3) / 4; // Taille approximative en octets
      const compressedSizeMB = (compressedSize / (1024 * 1024)).toFixed(2);
      
      console.log(`Image compressée: ${compressedSizeMB}MB`);
      
      if (compressedSize > 8 * 1024 * 1024) { // 8MB après compression
        toast({ 
          variant: 'destructive', 
          title: 'Image trop volumineuse', 
          description: `Même après compression, l'image fait ${compressedSizeMB}MB. Essayez une image plus petite.` 
        });
        setIsProcessing(false);
        return;
      }
      
      setPreview(compressedBase64);
      onImageSelect({
        src: compressedBase64,
        alt: file.name
      });
      
      toast({
        title: 'Image optimisée',
        description: `Image compressée à ${compressedSizeMB}MB et prête à être sauvegardée.`,
      });
    } catch (error) {
      console.error('Erreur de compression:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de traitement',
        description: 'Impossible de traiter l\'image. Essayez un autre fichier.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setPreview('');
    onImageSelect({ src: '', alt: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label>Image</Label>
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearImage}
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Cliquez pour sélectionner une image
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF - L'image sera automatiquement optimisée
          </p>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isProcessing}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          {isProcessing ? 'Optimisation...' : 'Choisir une image'}
        </Button>
        {preview && !isProcessing && (
          <Button
            type="button"
            variant="ghost"
            onClick={clearImage}
          >
            Supprimer
          </Button>
        )}
      </div>
      
      {isProcessing && (
        <p className="text-sm text-muted-foreground">
          Compression en cours... Cela peut prendre quelques secondes.
        </p>
      )}
    </div>
  );
}