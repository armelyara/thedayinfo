
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase-client'; // Importer l'app Firebase

interface ImageUploadProps {
  onImageSelect: (imageData: { src: string; alt: string }) => void;
  currentImage?: string;
}

export function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const storage = getStorage(app);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner un fichier image valide' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Fichier trop volumineux', description: 'La taille de l\'image ne doit pas dépasser 5MB' });
      return;
    }

    setIsUploading(true);

    try {
      // Afficher une preview locale immédiate
      const localPreviewUrl = URL.createObjectURL(file);
      setPreview(localPreviewUrl);

      // Téléverser vers Firebase Storage
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Mettre à jour le formulaire parent avec l'URL finale de Firebase
      onImageSelect({
        src: downloadURL,
        alt: file.name
      });
      
      // Remplacer la preview locale par l'URL finale pour la cohérence
      setPreview(downloadURL);

      toast({
        title: 'Image téléversée',
        description: 'L\'image a été sauvegardée dans le cloud.'
      });

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur de téléversement',
        description: 'Impossible de sauvegarder l\'image. Veuillez réessayer.'
      });
      setPreview(''); // Nettoyer la preview en cas d'erreur
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
            disabled={isUploading}
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
          <ImageIcon className="w-4 h-4 mr-2" />
          {isUploading ? 'Téléversement...' : 'Choisir une image'}
        </Button>
        {preview && !isUploading && (
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
