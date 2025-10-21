
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase-client'; // Assurez-vous que db est exporté
import { Progress } from '@/components/ui/progress';

interface ImageUploadProps {
  onImageSelect: (imageData: { src: string; alt: string }) => void;
  currentImage?: string;
}

export function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner un fichier image valide' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({ variant: 'destructive', title: 'Fichier trop volumineux', description: 'La taille de l\'image ne doit pas dépasser 10MB' });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    const storage = getStorage();
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setIsProcessing(false);
        setUploadProgress(0);
        console.error("Upload failed:", error);
        toast({
          variant: 'destructive',
          title: 'Erreur de téléversement',
          description: "Un problème de réseau ou de permission est survenu. Vérifiez la console pour les détails.",
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setPreview(downloadURL);
          onImageSelect({
            src: downloadURL,
            alt: file.name,
          });
          setIsProcessing(false);
          toast({
            title: 'Image téléversée',
            description: 'L\'image est prête à être sauvegardée.',
          });
        });
      }
    );
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
            PNG, JPG, GIF jusqu'à 10MB
          </p>
        </div>
      )}

      {isProcessing && <Progress value={uploadProgress} className="w-full" />}

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
          {isProcessing ? `Téléversement... ${Math.round(uploadProgress)}%` : 'Choisir une image'}
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
    </div>
  );
}
