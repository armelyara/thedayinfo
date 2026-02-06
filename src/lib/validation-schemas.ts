/**
 * Centralized Zod validation schemas for API routes
 *
 * This file contains all validation schemas used across the application
 * to ensure consistent input validation and type safety.
 */

import { z } from 'zod';

// ============================================================================
// Authentication Schemas
// ============================================================================

export const LoginSchema = z.object({
  idToken: z
    .string()
    .min(100, 'Token invalide - trop court')
    .max(5000, 'Token invalide - trop long'),
});

// ============================================================================
// Subscriber Schemas
// ============================================================================

export const SubscriberSchema = z.object({
  email: z
    .string()
    .email('Adresse email invalide')
    .toLowerCase()
    .trim(),
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom est trop long')
    .trim()
    .optional(),
  preferences: z
    .object({
      categories: z.array(z.string()).optional(),
      frequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
    })
    .optional(),
});

// ============================================================================
// Comment Schemas
// ============================================================================

export const CommentSchema = z.object({
  id: z.number(),
  author: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom est trop long')
    .trim(),
  text: z
    .string()
    .min(1, 'Le commentaire ne peut pas être vide')
    .max(1000, 'Le commentaire est trop long (max 1000 caractères)')
    .trim(),
  avatar: z.string(),
  email: z.string().email('Email invalide').toLowerCase().trim(),
  parentId: z.number().nullable().optional(),
  likes: z.number().optional(),
});

// ============================================================================
// Draft/Article Schemas
// ============================================================================

export const ArticleImageSchema = z.object({
  src: z.string().url('URL d\'image invalide'),
  alt: z.string().min(1, 'Le texte alternatif est requis'),
  aiHint: z.string().optional(),
});

export const DraftSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre est trop long')
    .trim(),
  author: z
    .string()
    .min(1, 'L\'auteur est requis')
    .max(100, 'Le nom de l\'auteur est trop long')
    .trim(),
  category: z
    .string()
    .min(1, 'La catégorie est requise')
    .trim(),
  content: z
    .string()
    .min(1, 'Le contenu est requis'),
  image: ArticleImageSchema.optional(),
  scheduledFor: z
    .string()
    .datetime('Date de publication invalide')
    .optional()
    .nullable(),
});

// ============================================================================
// Helper function to validate and return errors
// ============================================================================

export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { success: false, errors: ['Validation échouée'] };
  }
}
