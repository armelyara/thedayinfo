# Internationalization (i18n) Guide

This guide explains how to use the internationalization system in this Next.js application.

## 📋 Overview

The website now supports **French (default)** and **English** with automatic language detection based on the user's browser settings.

### Technologies
- **next-intl**: Main i18n library for Next.js App Router
- **Automatic detection**: Based on `Accept-Language` header
- **Clean URLs**: French has no prefix (`/blog`), English uses `/en/blog`

---

## 🚀 Quick Start

### 1. Using Translations in Components

#### Client Components ('use client')

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('loading')}</h1>
      <button>{t('save')}</button>
    </div>
  );
}
```

#### Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyPage() {
  const t = useTranslations('article');

  return (
    <div>
      <h1>{t('views')}: 123</h1>
      <p>{t('publishedOn')}: {date}</p>
    </div>
  );
}
```

### 2. Adding the Language Switcher

Add the `LanguageSwitcher` component to your header/navigation:

```tsx
import { LanguageSwitcher } from '@/components/language-switcher';

export function Header() {
  return (
    <header>
      {/* Other header content */}
      <LanguageSwitcher />
    </header>
  );
}
```

---

## 📁 Translation Files

Translation files are located in `/messages/`:
- `/messages/fr.json` - French (default)
- `/messages/en.json` - English

### Available Translation Keys

```json
{
  "common": { /* Common UI elements */ },
  "nav": { /* Navigation links */ },
  "article": { /* Article-related text */ },
  "subscription": { /* Newsletter subscription */ },
  "comments": { /* Comment system */ },
  "admin": { /* Admin panel */ },
  "feedback": { /* Article feedback */ },
  "ai": { /* AI features */ }
}
```

### Example Translation

**messages/fr.json:**
```json
{
  "common": {
    "loading": "Chargement...",
    "save": "Enregistrer"
  }
}
```

**messages/en.json:**
```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save"
  }
}
```

---

## 🔧 Advanced Usage

### Dynamic Values with Placeholders

```tsx
const t = useTranslations('comments');

// Using placeholders
<p>{t('deletedDesc', { count: 5 })}</p>
// Output (FR): "5 commentaires supprimés (incluant les réponses)"
// Output (EN): "5 comments deleted (including replies)"
```

### Rich Text / HTML in Translations

```tsx
const t = useTranslations('article');

<p>{t.rich('description', {
  strong: (chunks) => <strong>{chunks}</strong>,
  link: (chunks) => <a href="/blog">{chunks}</a>
})}</p>
```

### Multiple Translation Scopes

```tsx
const tCommon = useTranslations('common');
const tArticle = useTranslations('article');

return (
  <>
    <button>{tCommon('save')}</button>
    <h1>{tArticle('title')}</h1>
  </>
);
```

---

## 🎯 Migration Checklist

To fully migrate a component to use i18n:

### ✅ Step-by-Step Process

1. **Import useTranslations**
   ```tsx
   import { useTranslations } from 'next-intl';
   ```

2. **Get translation function**
   ```tsx
   const t = useTranslations('scopeName');
   ```

3. **Replace hardcoded text**
   ```tsx
   // Before
   <button>Enregistrer</button>

   // After
   <button>{t('save')}</button>
   ```

4. **Add missing translations**
   - Add key to `/messages/fr.json`
   - Add translation to `/messages/en.json`

5. **Test both languages**
   - Visit `/` (French)
   - Visit `/en` (English)

---

## 📝 Examples

### Example 1: Article Card Component

**Before:**
```tsx
export function ArticleCard({ article }) {
  return (
    <Card>
      <h3>{article.title}</h3>
      <span>{article.views} vues</span>
      <button>Lire la suite</button>
    </Card>
  );
}
```

**After:**
```tsx
'use client';
import { useTranslations } from 'next-intl';

export function ArticleCard({ article }) {
  const t = useTranslations('article');
  const tCommon = useTranslations('common');

  return (
    <Card>
      <h3>{article.title}</h3>
      <span>{article.views} {t('views')}</span>
      <button>{tCommon('readMore')}</button>
    </Card>
  );
}
```

### Example 2: Subscription Modal

**Before:**
```tsx
<DialogTitle>Abonnement Newsletter</DialogTitle>
<DialogDescription>
  Votre abonnement vous permettra de recevoir...
</DialogDescription>
<Button>S'abonner</Button>
```

**After:**
```tsx
const t = useTranslations('subscription');

<DialogTitle>{t('newsletterTitle')}</DialogTitle>
<DialogDescription>{t('newsletterDesc')}</DialogDescription>
<Button>{t('subscribe')}</Button>
```

---

## 🌍 How Language Detection Works

1. **User visits website** → Middleware checks `Accept-Language` header
2. **Locale detected** → Redirects to appropriate version
   - French browser → `/blog` (no prefix)
   - English browser → `/en/blog` (with prefix)
3. **User switches language** → LanguageSwitcher updates route
4. **Preference stored** → Browser remembers choice via cookie

---

## 🔄 Adding New Languages

To add a new language (e.g., Spanish):

1. **Add locale to config** (`src/i18n.ts`):
   ```ts
   export const locales = ['fr', 'en', 'es'] as const;
   ```

2. **Create translation file**:
   - Create `/messages/es.json`
   - Copy structure from `/messages/en.json`
   - Translate all values

3. **Update language switcher** (`src/components/language-switcher.tsx`):
   ```ts
   const languageNames = {
     fr: 'Français',
     en: 'English',
     es: 'Español'
   };
   ```

4. **Test**: Visit `/es` to see Spanish version

---

## 🐛 Troubleshooting

### Problem: Translations not showing

**Solution 1**: Check import path
```tsx
// ✅ Correct
import { useTranslations } from 'next-intl';

// ❌ Wrong
import { useTranslations } from 'react-intl';
```

**Solution 2**: Verify translation key exists
```tsx
// Check /messages/fr.json has: {"common": {"save": "Enregistrer"}}
const t = useTranslations('common');
t('save'); // Should work
```

### Problem: Language not switching

**Solution**: Clear browser cache and cookies, then try again.

### Problem: Build errors

**Solution**: Restart dev server after adding translations
```bash
npm run dev
```

---

## 📚 Additional Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

---

## ✅ Current Status

- ✅ next-intl installed and configured
- ✅ French and English translations created
- ✅ Middleware with automatic language detection
- ✅ Language switcher component ready
- ✅ Clean URL structure configured
- ⏳ Component migration in progress (use this guide!)

**Next step**: Start migrating components using the examples above!
