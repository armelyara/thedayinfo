'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Image as ImageIcon, // Renamed to avoid conflict with Image component
  Type,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Palette,
  CaseSensitive,
  CaseUpper,
  CaseLower
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

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
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchroniser le contenu sans causer de re-render intempestifs
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      const selection = window.getSelection();
      let range = null;
      
      try {
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        }
      } catch (e) {
        // Ignorer l'erreur si pas de range disponible
      }
      
      const isEditorFocused = document.activeElement === editorRef.current || 
        editorRef.current?.contains(document.activeElement);
      
      if (!isEditorFocused) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const execCommand = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    document.execCommand(command, false, value);
    
    // Mettre à jour le contenu après l'exécution
    setTimeout(() => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, 10);
  }, [onChange]);

  const changeCase = (caseType: 'upper' | 'lower') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const newText = caseType === 'upper' ? selectedText.toUpperCase() : selectedText.toLowerCase();
      document.execCommand('insertText', false, newText);
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

  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection?.toString() || '';
  };

  const insertLink = () => {
    const selected = getSelectedText();
    setSelectedText(selected);
    setLinkText(selected || '');
    setLinkUrl('');
    setIsLinkDialogOpen(true);
  };

  const handleInsertLink = () => {
    if (linkUrl && linkText) {
      const html = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      execCommand('insertHTML', html);
    }
    setIsLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleInsertImage = () => {
    if (imageUrl && imageAlt) {
      const html = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      execCommand('insertHTML', html);
    }
    setIsImageDialogOpen(false);
    setImageUrl('');
    setImageAlt('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        setImageAlt(file.name);
        setIsImageDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn('border rounded-lg overflow-hidden', className)}>
        {/* Barre d'outils */}
        <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
          {/* Styles de police */}
          <div className="flex items-center gap-1">
            <Select onValueChange={(value) => execCommand('fontName', value)}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Police" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                <SelectItem value="'Times New Roman', serif">Times</SelectItem>
                <SelectItem value="'Courier New', monospace">Courier</SelectItem>
                <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => execCommand('fontSize', value)}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue placeholder="Taille" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">8pt</SelectItem>
                <SelectItem value="2">10pt</SelectItem>
                <SelectItem value="3">12pt</SelectItem>
                <SelectItem value="4">14pt</SelectItem>
                <SelectItem value="5">18pt</SelectItem>
                <SelectItem value="6">24pt</SelectItem>
                <SelectItem value="7">36pt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Couleurs */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Palette className="h-4 w-4" />
              </Button>
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

          {/* Changement de casse */}
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => changeCase('upper')} className="h-8 w-8 p-0"><CaseUpper className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Majuscules</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => changeCase('lower')} className="h-8 w-8 p-0"><CaseLower className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Minuscules</p></TooltipContent></Tooltip>

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
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => setIsImageDialogOpen(true)} className="h-8 w-8 p-0"><ImageIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Insérer image par URL</p></TooltipContent></Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Annuler/Refaire */}
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('undo')} className="h-8 w-8 p-0"><Undo className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Annuler (Ctrl+Z)</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="sm" onClick={() => execCommand('redo')} className="h-8 w-8 p-0"><Redo className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Refaire (Ctrl+Y)</p></TooltipContent></Tooltip>
        </div>

        {/* Zone d'édition */}
        <div
          ref={editorRef}
          contentEditable
          className="p-4 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-y-auto prose prose-sm max-w-none"
          style={{ minHeight: height }}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        />

        {/* Input file caché */}
        <input
          ref={fileInputref}
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
            <DialogDescription>Saisissez l'URL et le texte à afficher pour votre lien.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Texte du lien</label><Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Texte à afficher" /></div>
            <div><label className="text-sm font-medium">URL</label><Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://exemple.com" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleInsertLink} disabled={!linkUrl || !linkText}>Ajouter le lien</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour les images */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer une image</DialogTitle>
            <DialogDescription>Saisissez l'URL de l'image et sa description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">URL de l'image</label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://exemple.com/image.jpg" /></div>
            <div><label className="text-sm font-medium">Description (alt text)</label><Input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Description de l'image" /></div>
            {imageUrl && (<div className="border rounded p-2"><img src={imageUrl} alt={imageAlt} className="max-w-full h-auto max-h-32 object-contain" onError={() => setImageUrl('')} /></div>)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleInsertImage} disabled={!imageUrl || !imageAlt}>Insérer l'image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
