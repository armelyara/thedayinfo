'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider'; // Assurez-vous que ce composant existe
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  Type,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Palette,
  CaseUpper,
  CaseLower,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Label } from './ui/label';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

// Simple color picker component
const ColorPicker = ({ command }: { command: 'foreColor' | 'backColor' }) => {
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#808080', '#C0C0C0', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080'
  ];

  const handleColorChange = (color: string) => {
    document.execCommand(command, false, color);
  };

  return (
    <div className="grid grid-cols-8 gap-1 p-2">
      {colors.map(color => (
        <button
          key={color}
          type="button"
          className="h-6 w-6 rounded-sm border"
          style={{ backgroundColor: color }}
          onClick={() => handleColorChange(color)}
          aria-label={`Set color to ${color}`}
        />
      ))}
    </div>
  );
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Écrivez votre contenu ici...',
  className,
  height = 300
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  
  // Image states
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWidth, setImageWidth] = useState([100]); // Pourcentage (1-100)
  const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right'>('center');
  
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [storage, setStorage] = useState<any>(null);

  useEffect(() => {
    const initFirebase = async () => {
      const app = await initializeFirebaseClient();
      setStorage(getStorage(app));
    };
    initFirebase();
  }, []);


  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      const isEditorFocused = document.activeElement === editorRef.current || 
        editorRef.current?.contains(document.activeElement);
      
      if (!isEditorFocused) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Vérifier si la sélection est dans l'éditeur
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
          setSavedSelection(range.cloneRange());
      }
    }
  };

  const restoreSelection = useCallback(() => {
    if (savedSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelection);
    } else if (editorRef.current) {
        editorRef.current.focus();
        // Si pas de sélection, on place à la fin par défaut
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    }
  }, [savedSelection]);

  const execCommand = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    const html = editorRef.current.innerHTML;
    onChange(html);
  }, [onChange]);

  const changeCase = (caseType: 'upper' | 'lower') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Vérification de sécurité pour ne pas modifier hors de l'éditeur
    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

    const selectedText = range.toString();
    if (selectedText) {
      const newText = caseType === 'upper' ? selectedText.toUpperCase() : selectedText.toLowerCase();
      document.execCommand('insertText', false, newText);
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); execCommand('bold'); break;
        case 'i': e.preventDefault(); execCommand('italic'); break;
        case 'u': e.preventDefault(); execCommand('underline'); break;
        case 'z': if (!e.shiftKey) { e.preventDefault(); execCommand('undo'); } break;
        case 'y': e.preventDefault(); execCommand('redo'); break;
      }
    }
  }, [execCommand]);

  const insertLink = () => {
    saveSelection();
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    setLinkText(selectedText);
    setLinkUrl('');
    setIsLinkDialogOpen(true);
  };

  const handleInsertLink = () => {
    setIsLinkDialogOpen(false);
    setTimeout(() => {
        restoreSelection();
        if (linkUrl) {
            const html = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText || linkUrl}</a>`;
            document.execCommand('insertHTML', false, html);
            handleContentChange();
        }
        setLinkUrl('');
        setLinkText('');
        setSavedSelection(null);
    }, 10);
  };
  
  // Nouvelle fonction d'insertion avec styles précis
  const insertImageWithStyle = () => {
    setIsImageDialogOpen(false);
    
    setTimeout(() => {
        restoreSelection();
        if (imageUrl && imageAlt) {
            let style = `width: ${imageWidth[0]}%; height: auto; border-radius: 8px;`;
            
            // Gestion de l'alignement
            if (imageAlign === 'center') {
                style += ' display: block; margin: 20px auto;';
            } else if (imageAlign === 'left') {
                style += ' float: left; margin: 0 20px 10px 0;';
            } else if (imageAlign === 'right') {
                style += ' float: right; margin: 0 0 10px 20px;';
            }

            // On ajoute un clear:both après l'image si elle flotte pour éviter les débordements
            const html = `<img src="${imageUrl}" alt="${imageAlt}" style="${style}" />`;
            
            document.execCommand('insertHTML', false, html);
            
            // Si c'est flottant, on ajoute un saut de ligne pour faciliter l'écriture à côté
            if (imageAlign !== 'center') {
                // document.execCommand('insertHTML', false, '<br/>'); 
            }
            
            handleContentChange();
        }
        // Reset
        setImageUrl('');
        setImageAlt('');
        setImageWidth([100]);
        setImageAlign('center');
    }, 10);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    saveSelection();

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Fichier invalide', description: 'Veuillez sélectionner un fichier image.' });
        return;
    }
    if (file.size > 10 * 1024 * 1024) { 
        toast({ variant: 'destructive', title: 'Fichier trop volumineux', description: 'L\'image ne doit pas dépasser 10MB.' });
        return;
    }

    if (!storage) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le service de stockage n\'est pas initialisé.' });
      return;
    }

    toast({ title: 'Téléversement en cours...', description: 'Veuillez patienter...' });

    try {
        const imagePath = `article-images/${Date.now()}_${file.name}`;
        const imageStorageRef = storageRef(storage, imagePath);
        const uploadTask = uploadBytesResumable(imageStorageRef, file);

        uploadTask.on('state_changed',
          (snapshot) => {},
          (error) => {
            console.error("Image upload failed:", error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de téléverser l\'image.' });
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              // Au lieu d'insérer directement, on ouvre la modale pour configurer la taille
              setImageUrl(downloadURL);
              setImageAlt(file.name.split('.')[0]);
              setImageWidth([100]);
              setImageAlign('center');
              setIsImageDialogOpen(true);
              
              toast({ title: 'Image prête', description: 'Vous pouvez maintenant ajuster la taille et l\'insérer.' });
            });
          }
        );
    } catch (error) {
        console.error("Image upload failed:", error);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de téléverser l\'image.' });
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  return (
    <TooltipProvider>
      <div className={cn('border rounded-lg flex flex-col', className)} style={{ height: height ? 'auto' : undefined }}>
        {/* Barre d'outils */}
        <div className="sticky top-0 z-10 border-b bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
          {/* ... (Sections Polices et Couleurs inchangées) ... */}
          <div className="flex items-center gap-1">
            <Select onValueChange={(value) => execCommand('fontName', value)}>
              <SelectTrigger className="h-8 w-32 bg-background">
                <SelectValue placeholder="Police" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                <SelectItem value="'Times New Roman', serif">Times</SelectItem>
                <SelectItem value="'Courier New', monospace">Courier</SelectItem>
                <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => execCommand('fontSize', value)}>
              <SelectTrigger className="h-8 w-16 bg-background">
                <SelectValue placeholder="Taille" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Petite</SelectItem>
                <SelectItem value="3">Normale</SelectItem>
                <SelectItem value="5">Grande</SelectItem>
                <SelectItem value="7">Titre</SelectItem>
              </SelectContent>
            </Select>
          </div>
  
          <div className="w-px h-6 bg-border mx-1" />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"><Palette className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground p-1">Couleur du texte</p>
                <ColorPicker command="foreColor" />
                <p className="text-xs font-medium text-muted-foreground p-1 mt-2">Couleur de fond</p>
                <ColorPicker command="backColor" />
              </div>
            </PopoverContent>
          </Popover>
  
          <div className="w-px h-6 bg-border mx-1" />
  
          {/* Formatage de base */}
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('bold')} className="h-8 w-8 p-0"><Bold className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Gras (Ctrl+B)</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('italic')} className="h-8 w-8 p-0"><Italic className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Italique (Ctrl+I)</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('underline')} className="h-8 w-8 p-0"><Underline className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Souligné (Ctrl+U)</p></TooltipContent></Tooltip>
          
          <div className="w-px h-6 bg-border mx-1" />
  
          {/* Alignement */}
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('justifyLeft')} className="h-8 w-8 p-0"><AlignLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Aligner à gauche</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('justifyCenter')} className="h-8 w-8 p-0"><AlignCenter className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Centrer</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('justifyRight')} className="h-8 w-8 p-0"><AlignRight className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Aligner à droite</p></TooltipContent></Tooltip>
  
          <div className="w-px h-6 bg-border mx-1" />

          {/* Listes */}
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="h-8 w-8 p-0"><List className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Liste à puces</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')} className="h-8 w-8 p-0"><ListOrdered className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Liste numérotée</p></TooltipContent></Tooltip>
  
          <div className="w-px h-6 bg-border mx-1" />
  
          {/* Liens et images */}
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={insertLink} className="h-8 w-8 p-0"><Link className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Ajouter un lien</p></TooltipContent></Tooltip>
          
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 p-0"><Upload className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Télécharger une image</p></TooltipContent></Tooltip>
          
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => { saveSelection(); setIsImageDialogOpen(true); }} className="h-8 w-8 p-0"><ImageIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Insérer image par URL</p></TooltipContent></Tooltip>
  
          <div className="w-px h-6 bg-border mx-1" />
  
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('undo')} className="h-8 w-8 p-0"><Undo className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Annuler (Ctrl+Z)</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('redo')} className="h-8 w-8 p-0"><Redo className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Refaire (Ctrl+Y)</p></TooltipContent></Tooltip>
        </div>
  
        {/* Zone d'édition */}
        <div className="flex-1 overflow-hidden min-h-[300px]" style={{ height: height }}>
          <div
            ref={editorRef}
            contentEditable
            className="h-full w-full p-4 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-y-auto prose prose-sm max-w-none dark:prose-invert"
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onBlur={saveSelection}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder}
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          />
        </div>
  
        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Dialog pour les liens */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un lien</DialogTitle>
            <DialogDescription>Saisissez l'URL et le texte.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Texte</Label><Input value={linkText} onChange={(e) => setLinkText(e.target.value)} /></div>
            <div><Label>URL</Label><Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleInsertLink} disabled={!linkUrl}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOUVEAU Dialog pour les images avec contrôles précis */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Propriétés de l'image</DialogTitle>
            <DialogDescription>Ajustez la taille et la position de l'image.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* URL et ALT */}
            <div className="space-y-3">
                <div><Label htmlFor="imgUrl">URL</Label><Input id="imgUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://" /></div>
                <div><Label htmlFor="imgAlt">Description (Alt)</Label><Input id="imgAlt" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Description pour l'accessibilité" /></div>
            </div>

            {/* Contrôle de la taille avec Slider */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <Label>Largeur de l'image</Label>
                    <span className="text-sm font-medium text-muted-foreground">{imageWidth[0]}%</span>
                </div>
                <Slider 
                    value={imageWidth} 
                    onValueChange={setImageWidth} 
                    max={100} 
                    min={5} 
                    step={5} 
                    className="py-2"
                />
                <p className="text-xs text-muted-foreground">Faites glisser pour redimensionner.</p>
            </div>

            {/* Contrôle de l'alignement */}
            <div className="space-y-3">
                <Label>Alignement</Label>
                <div className="flex gap-2">
                    <Button 
                        type="button" 
                        variant={imageAlign === 'left' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setImageAlign('left')}
                        className="flex-1"
                    >
                        <AlignLeft className="h-4 w-4 mr-2" /> Gauche
                    </Button>
                    <Button 
                        type="button" 
                        variant={imageAlign === 'center' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setImageAlign('center')}
                        className="flex-1"
                    >
                        <Maximize2 className="h-4 w-4 mr-2" /> Centre
                    </Button>
                    <Button 
                        type="button" 
                        variant={imageAlign === 'right' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setImageAlign('right')}
                        className="flex-1"
                    >
                        <AlignRight className="h-4 w-4 mr-2" /> Droite
                    </Button>
                </div>
            </div>

            {/* Prévisualisation */}
            {imageUrl && (
                <div className="border rounded-lg p-4 bg-muted/20 mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Aperçu :</p>
                    <div className="bg-white dark:bg-black border border-dashed p-2 relative min-h-[100px] overflow-hidden">
                        <img 
                            src={imageUrl} 
                            alt="Preview" 
                            style={{
                                width: `${imageWidth[0]}%`,
                                display: 'block',
                                marginLeft: imageAlign === 'right' ? 'auto' : (imageAlign === 'center' ? 'auto' : '0'),
                                marginRight: imageAlign === 'left' ? 'auto' : (imageAlign === 'center' ? 'auto' : '0'),
                            }}
                            className="border rounded shadow-sm"
                        />
                    </div>
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>Annuler</Button>
            <Button onClick={insertImageWithStyle} disabled={!imageUrl}>Insérer l'image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}