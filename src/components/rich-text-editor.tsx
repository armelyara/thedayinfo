// src/components/enhanced-rich-text-editor.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Type,
  Palette,
  Smile,
  Undo,
  Redo,
  Save
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EnhancedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
  '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤏',
  '💪', '🦾', '🖕', '✍️', '🙏', '🦶', '🦵', '🦿', '💄', '💋',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '⭐', '🌟', '💫', '⚡', '💥', '💢', '💨', '💦', '💤', '💨'
];

const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Times, serif', label: 'Times' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Courier, monospace', label: 'Courier' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: 'Comic Sans MS, cursive', label: 'Comic Sans' },
];

const FONT_SIZES = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];

const TEXT_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff6600', '#ff0066', '#6600ff', '#0066ff', '#66ff00', '#ff9900'
];

export function EnhancedRichTextEditor({
  value,
  onChange,
  placeholder = 'Écrivez votre contenu ici...',
  className,
  height = 400
}: EnhancedRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Fonctions pour les commandes d'édition
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertEmoji = useCallback((emoji: string) => {
    execCommand('insertText', emoji);
  }, [execCommand]);

  const insertLink = useCallback(() => {
    if (linkUrl && linkText) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      execCommand('insertHTML', linkHtml);
      setLinkUrl('');
      setLinkText('');
      setIsLinkModalOpen(false);
    }
  }, [linkUrl, linkText, execCommand]);

  const insertImage = useCallback(() => {
    const url = prompt('URL de l\'image:');
    if (url) {
      execCommand('insertImage', url);
    }
  }, [execCommand]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    execCommand('insertText', text);
  }, [execCommand]);

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Barre d'outils */}
      <div className="border-b bg-muted/50 p-2">
        <div className="flex flex-wrap gap-1">
          {/* Styles de texte de base */}
          <div className="flex gap-1 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('bold')}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('italic')}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('underline')}
              className="h-8 w-8 p-0"
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('strikeThrough')}
              className="h-8 w-8 p-0"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Titres */}
          <div className="flex gap-1 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('formatBlock', 'H1')}
              className="h-8 w-8 p-0"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('formatBlock', 'H2')}
              className="h-8 w-8 p-0"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('formatBlock', 'H3')}
              className="h-8 w-8 p-0"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Police et taille */}
          <div className="flex gap-1 mr-2">
            <Select onValueChange={(value) => execCommand('fontName', value)}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <Type className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Police" />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => execCommand('fontSize', value)}>
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue placeholder="12" />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Couleur du texte */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="grid grid-cols-6 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => execCommand('foreColor', color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Alignement */}
          <div className="flex gap-1 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyLeft')}
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyCenter')}
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyRight')}
              className="h-8 w-8 p-0"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyFull')}
              className="h-8 w-8 p-0"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Listes */}
          <div className="flex gap-1 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertUnorderedList')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertOrderedList')}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')}
              className="h-8 w-8 p-0"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Liens et images */}
          <div className="flex gap-1 mr-2">
            <Popover open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Ajouter un lien</h4>
                  <div className="space-y-2">
                    <Label htmlFor="linkText">Texte du lien</Label>
                    <Input
                      id="linkText"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="Texte à afficher"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkUrl">URL</Label>
                    <Input
                      id="linkUrl"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://exemple.com"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLinkModalOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={insertLink}
                      disabled={!linkUrl || !linkText}
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertImage}
              className="h-8 w-8 p-0"
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Code */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('formatBlock', 'PRE')}
            className="h-8 w-8 p-0 mr-2"
          >
            <Code className="h-4 w-4" />
          </Button>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Emojis */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 mr-2"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
                {EMOJI_LIST.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-6 h-6 text-lg hover:bg-accent rounded text-center flex items-center justify-center"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Annuler/Refaire */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('undo')}
              className="h-8 w-8 p-0"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('redo')}
              className="h-8 w-8 p-0"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Zone d'édition */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          'p-4 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-y-auto',
          'prose prose-sm max-w-none'
        )}
        style={{ minHeight: height }}
        onInput={handleContentChange}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* Styles CSS pour les placeholders et l'éditeur */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        
        [contenteditable] h3 {
          font-size: 1.2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
        }
        
        [contenteditable] pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.375rem;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        [contenteditable] li {
          margin: 0.25em 0;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable] a:hover {
          color: #1d4ed8;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
}