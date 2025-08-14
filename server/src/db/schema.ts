import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Article status enum
export const articleStatusEnum = pgEnum('article_status', ['draft', 'published']);

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Articles table
export const articlesTable = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'), // Nullable by default
  cover_image: text('cover_image'), // Nullable by default
  status: articleStatusEnum('status').notNull().default('draft'),
  category_id: integer('category_id').notNull().references(() => categoriesTable.id),
  seo_title: text('seo_title'), // Nullable by default
  seo_description: text('seo_description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Junction table for many-to-many relationship between articles and tags
export const articleTagsTable = pgTable('article_tags', {
  id: serial('id').primaryKey(),
  article_id: integer('article_id').notNull().references(() => articlesTable.id, { onDelete: 'cascade' }),
  tag_id: integer('tag_id').notNull().references(() => tagsTable.id, { onDelete: 'cascade' })
});

// Static pages table (for About, Contact, etc.)
export const staticPagesTable = pgTable('static_pages', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  seo_title: text('seo_title'), // Nullable by default
  seo_description: text('seo_description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  articles: many(articlesTable)
}));

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  articleTags: many(articleTagsTable)
}));

export const articlesRelations = relations(articlesTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [articlesTable.category_id],
    references: [categoriesTable.id]
  }),
  articleTags: many(articleTagsTable)
}));

export const articleTagsRelations = relations(articleTagsTable, ({ one }) => ({
  article: one(articlesTable, {
    fields: [articleTagsTable.article_id],
    references: [articlesTable.id]
  }),
  tag: one(tagsTable, {
    fields: [articleTagsTable.tag_id],
    references: [tagsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Tag = typeof tagsTable.$inferSelect;
export type NewTag = typeof tagsTable.$inferInsert;

export type Article = typeof articlesTable.$inferSelect;
export type NewArticle = typeof articlesTable.$inferInsert;

export type ArticleTag = typeof articleTagsTable.$inferSelect;
export type NewArticleTag = typeof articleTagsTable.$inferInsert;

export type StaticPage = typeof staticPagesTable.$inferSelect;
export type NewStaticPage = typeof staticPagesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  categories: categoriesTable,
  tags: tagsTable,
  articles: articlesTable,
  articleTags: articleTagsTable,
  staticPages: staticPagesTable
};