'use client';

import { useEditor, EditorContent, Extension, Node, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { Underline as TiptapUnderline } from '@tiptap/extension-underline';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link as LinkIcon,
  Image as ImageIcon, Undo, Redo, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Palette, Quote, Code, Code2, Heading1, Heading2, Heading3, Sparkles, Table as TableIcon,
  Highlighter, Minus, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebaseClient } from '@/lib/firebase-client';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { Editor } from '@tiptap/react';

// =============================================================================
// Custom extension: font size as a textStyle attribute (pt unit)
// =============================================================================
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) =>
              el.style.fontSize ? el.style.fontSize.replace(/['"]/g, '') : null,
            renderHTML: (attrs: { fontSize?: string | null }) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: any) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

// =============================================================================
// Custom Node: HtmlEmbed (sandboxed iframe with srcdoc) — for HTML+JS animations
// =============================================================================
const HtmlEmbed = Node.create({
  name: 'htmlEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      srcdoc: { default: '' },
      height: { default: '500px' },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'iframe[srcdoc]',
        getAttrs: (el: HTMLElement) => ({
          srcdoc: (el as HTMLIFrameElement).getAttribute('srcdoc') || '',
          height:
            (el as HTMLIFrameElement).style.height ||
            (el as HTMLIFrameElement).getAttribute('height') ||
            '500px',
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const { srcdoc, height } = HTMLAttributes as { srcdoc: string; height: string };
    return [
      'iframe',
      mergeAttributes({
        srcdoc,
        sandbox: 'allow-scripts',
        loading: 'lazy',
        style: `width: 100%; height: ${height}; border: 0; border-radius: 8px; display: block; margin: 1rem 0;`,
        class: 'tiptap-html-embed',
      }),
    ];
  },
});

// =============================================================================
// Custom Image extension with upload-tracking and style attrs
// =============================================================================
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-upload-id': { default: null, rendered: true },
      style: {
        default: 'max-width: 100%; height: auto; border-radius: 8px;',
        parseHTML: (el: HTMLElement) => el.getAttribute('style'),
        renderHTML: (attrs: { style?: string }) =>
          attrs.style ? { style: attrs.style } : {},
      },
      width: { default: null },
    };
  },
});

// =============================================================================
// Helpers
// =============================================================================
const FONT_FAMILIES = [
  { label: 'Système', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Palatino', value: '"Palatino Linotype", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'Monaco', value: 'Monaco, monospace' },
  { label: 'Comic Sans', value: '"Comic Sans MS", cursive' },
  { label: 'Impact', value: 'Impact, sans-serif' },
];

const FONT_SIZES = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt', '28pt', '32pt', '36pt', '48pt', '60pt', '72pt'];

const COLOR_PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

// =============================================================================
// Toolbar
// =============================================================================
function Toolbar({
  editor,
  onPickImage,
  onInsertEmbed,
  onInsertLink,
}: {
  editor: Editor;
  onPickImage: () => void;
  onInsertEmbed: () => void;
  onInsertLink: () => void;
}) {
  const setColor = (color: string) => editor.chain().focus().setColor(color).run();
  const setHighlight = (color: string) => editor.chain().focus().toggleHighlight({ color }).run();
  const insertTable = () =>
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  // Detect current font family / size for the Select value
  const currentFamily = (editor.getAttributes('textStyle') as any)?.fontFamily || '';
  const currentSize = (editor.getAttributes('textStyle') as any)?.fontSize || '';

  const Btn = ({
    onClick,
    active,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={active ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );

  const Sep = () => <div className="w-px h-6 bg-border mx-1" />;

  return (
    <div className="sticky top-0 z-10 border-b bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
      {/* Font family */}
      <Select
        value={currentFamily}
        onValueChange={(v) => {
          if (v === '') editor.chain().focus().unsetFontFamily().run();
          else editor.chain().focus().setFontFamily(v).run();
        }}
      >
        <SelectTrigger className="h-8 w-36 bg-background text-sm">
          <SelectValue placeholder="Police" />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((f) => (
            <SelectItem key={f.label} value={f.value || '__default__'}>
              <span style={{ fontFamily: f.value || undefined }}>{f.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font size */}
      <Select
        value={currentSize}
        onValueChange={(v) => {
          if (v === '__default__') (editor.chain().focus() as any).unsetFontSize().run();
          else (editor.chain().focus() as any).setFontSize(v).run();
        }}
      >
        <SelectTrigger className="h-8 w-24 bg-background text-sm">
          <SelectValue placeholder="Taille" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__default__">Auto</SelectItem>
          {FONT_SIZES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Sep />

      {/* Headings */}
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        label="Titre 1"
      >
        <Heading1 className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        label="Titre 2"
      >
        <Heading2 className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        label="Titre 3"
      >
        <Heading3 className="h-4 w-4" />
      </Btn>

      <Sep />

      {/* Inline formatting */}
      <Btn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        label="Gras (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        label="Italique (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        label="Souligné (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        label="Barré"
      >
        <Strikethrough className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        label="Code inline"
      >
        <Code className="h-4 w-4" />
      </Btn>

      <Sep />

      {/* Color picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Couleur du texte">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Couleur du texte</p>
          <div className="grid grid-cols-10 gap-1">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className="h-5 w-5 rounded-sm border border-muted-foreground/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Label className="text-xs">Personnalisé :</Label>
            <input
              type="color"
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-14 cursor-pointer rounded border"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              Réinitialiser
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Highlight */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Surligner">
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Couleur de surlignage</p>
          <div className="grid grid-cols-10 gap-1">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className="h-5 w-5 rounded-sm border border-muted-foreground/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                onClick={() => setHighlight(c)}
                aria-label={c}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7 mt-2 w-full"
            onClick={() => editor.chain().focus().unsetHighlight().run()}
          >
            Retirer le surlignage
          </Button>
        </PopoverContent>
      </Popover>

      <Sep />

      {/* Alignment */}
      <Btn
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        label="Aligner à gauche"
      >
        <AlignLeft className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        label="Centrer"
      >
        <AlignCenter className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        label="Aligner à droite"
      >
        <AlignRight className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        active={editor.isActive({ textAlign: 'justify' })}
        label="Justifier"
      >
        <AlignJustify className="h-4 w-4" />
      </Btn>

      <Sep />

      {/* Lists & blocks */}
      <Btn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        label="Liste à puces"
      >
        <List className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        label="Liste numérotée"
      >
        <ListOrdered className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        label="Citation"
      >
        <Quote className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        label="Bloc de code"
      >
        <Code2 className="h-4 w-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} label="Séparateur horizontal">
        <Minus className="h-4 w-4" />
      </Btn>

      <Sep />

      {/* Link / Image / Embed / Table */}
      <Btn onClick={onInsertLink} active={editor.isActive('link')} label="Insérer un lien">
        <LinkIcon className="h-4 w-4" />
      </Btn>
      <Btn onClick={onPickImage} label="Insérer une image (ou glisser-déposer)">
        <ImageIcon className="h-4 w-4" />
      </Btn>
      <Btn onClick={onInsertEmbed} label="Insérer une animation HTML/JS">
        <Sparkles className="h-4 w-4" />
      </Btn>
      <Btn onClick={insertTable} label="Insérer un tableau">
        <TableIcon className="h-4 w-4" />
      </Btn>

      <Sep />

      <Btn onClick={() => editor.chain().focus().undo().run()} label="Annuler (Ctrl+Z)">
        <Undo className="h-4 w-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} label="Refaire (Ctrl+Y)">
        <Redo className="h-4 w-4" />
      </Btn>
    </div>
  );
}

// =============================================================================
// Main editor
// =============================================================================
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Écrivez votre contenu ici…',
  className,
  height = 500,
}: RichTextEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storage, setStorage] = useState<any>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [embedHeight, setEmbedHeight] = useState('500');

  useEffect(() => {
    let cancelled = false;
    initializeFirebaseClient().then((app) => {
      if (!cancelled) setStorage(getStorage(app));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const uploadImageFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Fichier invalide', description: 'Seules les images sont acceptées.' });
        return null;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Fichier trop volumineux', description: 'Maximum 10 MB.' });
        return null;
      }
      if (!storage) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Stockage non initialisé.' });
        return null;
      }
      const path = `article-images/${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
      const sref = storageRef(storage, path);
      const task = uploadBytesResumable(sref, file);
      return new Promise<string | null>((resolve) => {
        task.on(
          'state_changed',
          undefined,
          (err) => {
            console.error('Upload failed:', err);
            toast({ variant: 'destructive', title: 'Échec', description: 'Téléversement de l\'image échoué.' });
            resolve(null);
          },
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          }
        );
      });
    },
    [storage, toast]
  );

  // Insert image with placeholder, upload in background, then swap src
  const insertImageWithUpload = useCallback(
    (file: File, editor: Editor) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        editor
          .chain()
          .focus()
          .setImage({ src: dataUrl, alt: file.name } as any)
          .run();
        // Tag the just-inserted image with our upload id
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === dataUrl && !node.attrs['data-upload-id']) {
            const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              'data-upload-id': uploadId,
            });
            editor.view.dispatch(tr);
            return false;
          }
        });

        toast({ title: 'Téléversement en cours…' });
        const url = await uploadImageFile(file);
        if (!url) return;
        // Replace src by uploaded URL
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs['data-upload-id'] === uploadId) {
            const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              src: url,
              'data-upload-id': null,
            });
            editor.view.dispatch(tr);
            return false;
          }
        });
        toast({ title: 'Image téléversée' });
      };
      reader.readAsDataURL(file);
    },
    [uploadImageFile, toast]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      TiptapUnderline,
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder, showOnlyWhenEditable: true, showOnlyCurrent: true }),
      CharacterCount,
      Typography,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      ResizableImage.configure({ allowBase64: true, inline: false }),
      HtmlEmbed,
    ],
    content: value || '',
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'tiptap-content prose prose-sm md:prose-base max-w-none dark:prose-invert focus:outline-none px-4 py-3',
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file && editor) {
              event.preventDefault();
              insertImageWithUpload(file, editor);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const files = (event as DragEvent).dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        if (editor) {
          imageFiles.forEach((f) => insertImageWithUpload(f, editor));
        }
        return true;
      },
    },
  });

  // Sync external `value` changes (e.g. autosave reset, locale switch)
  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return; // avoid clobbering active typing
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    } else if (!value && current && current !== '<p></p>') {
      editor.commands.clearContent();
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={cn('border rounded-lg flex items-center justify-center text-muted-foreground', className)}
        style={{ height }}
      >
        Chargement de l'éditeur…
      </div>
    );
  }

  const onPickImage = () => fileInputRef.current?.click();

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) insertImageWithUpload(file, editor);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onInsertLink = () => {
    const sel = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(sel.from, sel.to, ' ');
    setLinkText(selectedText || '');
    const existing = editor.getAttributes('link')?.href || '';
    setLinkUrl(existing);
    setLinkOpen(true);
  };

  const applyLink = () => {
    if (!linkUrl) return;
    if (linkText && editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`)
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkOpen(false);
  };

  const onInsertEmbed = () => {
    setEmbedCode('');
    setEmbedHeight('500');
    setEmbedOpen(true);
  };

  const applyEmbed = () => {
    const code = embedCode.trim();
    if (!code) return;
    if (code.length > 500_000) {
      toast({ variant: 'destructive', title: 'Trop volumineux', description: 'Animation > 500 KB. Hébergez-la séparément.' });
      return;
    }
    const h = `${parseInt(embedHeight || '500', 10) || 500}px`;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'htmlEmbed',
        attrs: { srcdoc: code, height: h },
      })
      .run();
    setEmbedOpen(false);
    setEmbedCode('');
  };

  const wordCount = editor.storage.characterCount?.words?.() ?? 0;
  const charCount = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <TooltipProvider>
      <div className={cn('border rounded-lg flex flex-col bg-background', className)}>
        <Toolbar
          editor={editor}
          onPickImage={onPickImage}
          onInsertEmbed={onInsertEmbed}
          onInsertLink={onInsertLink}
        />

        <div className="flex-1 overflow-y-auto" style={{ minHeight: height }}>
          <EditorContent editor={editor} />
        </div>

        <div className="border-t px-3 py-1 text-xs text-muted-foreground flex justify-between bg-muted/30">
          <span>Glissez-déposez une image ou collez-la (Ctrl+V) — upload Firebase automatique</span>
          <span>
            {wordCount} mots · {charCount} caractères
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Link dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer / modifier un lien</DialogTitle>
            <DialogDescription>L'URL s'ouvrira dans un nouvel onglet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {editor.state.selection.empty && !editor.isActive('link') && (
              <div>
                <Label>Texte du lien</Label>
                <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Texte affiché" />
              </div>
            )}
            <div>
              <Label>URL</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" />
            </div>
          </div>
          <DialogFooter>
            {editor.isActive('link') && (
              <Button variant="outline" onClick={removeLink}>
                Retirer le lien
              </Button>
            )}
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              Annuler
            </Button>
            <Button onClick={applyLink} disabled={!linkUrl}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embed dialog */}
      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Insérer une animation HTML / JS</DialogTitle>
            <DialogDescription>
              Collez le code complet (HTML + CSS + JS) généré par Claude design. Il sera intégré dans une iframe sandboxée — isolée du reste de l'article.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Code HTML / JS complet</Label>
                <Textarea
                  value={embedCode}
                  onChange={(e) => setEmbedCode(e.target.value)}
                  placeholder={`<!DOCTYPE html>\n<html>\n  <body>\n    <canvas id="c"></canvas>\n    <script>/* … */</script>\n  </body>\n</html>`}
                  className="font-mono text-xs min-h-[280px]"
                />
              </div>
              <div>
                <Label>Hauteur (px)</Label>
                <Input
                  type="number"
                  value={embedHeight}
                  onChange={(e) => setEmbedHeight(e.target.value)}
                  placeholder="500"
                />
              </div>
            </div>
            {embedCode && (
              <div>
                <Label className="text-xs text-muted-foreground">Aperçu</Label>
                <iframe
                  srcDoc={embedCode}
                  sandbox="allow-scripts"
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: `${parseInt(embedHeight || '500', 10) || 500}px`,
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmbedOpen(false)}>
              Annuler
            </Button>
            <Button onClick={applyEmbed} disabled={!embedCode.trim()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Insérer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
