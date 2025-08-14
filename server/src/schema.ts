import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

// Article status enum
export const articleStatusSchema = z.enum(['draft', 'published']);
export type ArticleStatus = z.infer<typeof articleStatusSchema>;

// Article schema
export const articleSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(),
  cover_image: z.string().nullable(),
  status: articleStatusSchema,
  category_id: z.number(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Article = z.infer<typeof articleSchema>;

// Article with relations schema
export const articleWithRelationsSchema = articleSchema.extend({
  category: categorySchema,
  tags: z.array(tagSchema)
});

export type ArticleWithRelations = z.infer<typeof articleWithRelationsSchema>;

// Static page schema
export const staticPageSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StaticPage = z.infer<typeof staticPageSchema>;

// Input schemas for creating entities
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/), // SEO-friendly slug
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createTagInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/) // SEO-friendly slug
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const createArticleInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/), // SEO-friendly slug
  content: z.string().min(1),
  excerpt: z.string().nullable(),
  cover_image: z.string().nullable(),
  status: articleStatusSchema,
  category_id: z.number(),
  tag_ids: z.array(z.number()).optional(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable()
});

export type CreateArticleInput = z.infer<typeof createArticleInputSchema>;

export const createStaticPageInputSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/), // SEO-friendly slug
  title: z.string().min(1),
  content: z.string().min(1),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable()
});

export type CreateStaticPageInput = z.infer<typeof createStaticPageInputSchema>;

// Input schemas for updating entities
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const updateTagInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional()
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

export const updateArticleInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  status: articleStatusSchema.optional(),
  category_id: z.number().optional(),
  tag_ids: z.array(z.number()).optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional()
});

export type UpdateArticleInput = z.infer<typeof updateArticleInputSchema>;

export const updateStaticPageInputSchema = z.object({
  id: z.number(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional()
});

export type UpdateStaticPageInput = z.infer<typeof updateStaticPageInputSchema>;

// Query schemas
export const getArticleBySlugInputSchema = z.object({
  slug: z.string()
});

export type GetArticleBySlugInput = z.infer<typeof getArticleBySlugInputSchema>;

export const getStaticPageBySlugInputSchema = z.object({
  slug: z.string()
});

export type GetStaticPageBySlugInput = z.infer<typeof getStaticPageBySlugInputSchema>;

export const searchArticlesInputSchema = z.object({
  query: z.string().optional(),
  category_id: z.number().optional(),
  tag_ids: z.array(z.number()).optional(),
  status: articleStatusSchema.optional(),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0)
});

export type SearchArticlesInput = z.infer<typeof searchArticlesInputSchema>;

export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;