'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageSelect: (imageData: { src: string; alt: string }) => void;
  currentImage?: string;
}

export function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier image valide'
      });
      return;
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Fichier trop volumineux',
        description: 'La taille de l\'image ne doit pas dépasser 5MB'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Créer une preview locale
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        
        // La chaîne base64 est passée au formulaire parent
        onImageSelect({
          src: result,
          alt: file.name
        });
      };
      reader.readAsDataURL(file);

      toast({
        title: 'Image chargée',
        description: 'L\'image a été ajoutée à votre article'
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger l\'image'
      });
    } finally {
      setIsUploading(false);
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
      <Label>Image de l'article</Label>
      
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
            PNG, JPG, GIF jusqu'à 5MB
          </p>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Image className="w-4 h-4 mr-2" />
          {isUploading ? 'Chargement...' : 'Choisir une image'}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            onClick={clearImage}
          >
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
