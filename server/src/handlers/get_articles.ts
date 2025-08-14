import { db } from '../db';
import { articlesTable, categoriesTable, tagsTable, articleTagsTable } from '../db/schema';
import { type ArticleWithRelations } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getArticles(): Promise<ArticleWithRelations[]> {
  try {
    // First, get all articles with their categories
    const articlesWithCategories = await db
      .select()
      .from(articlesTable)
      .innerJoin(categoriesTable, eq(articlesTable.category_id, categoriesTable.id))
      .orderBy(desc(articlesTable.created_at))
      .execute();

    // Get all article-tag relationships
    const articleTagRelations = await db
      .select({
        article_id: articleTagsTable.article_id,
        tag: tagsTable
      })
      .from(articleTagsTable)
      .innerJoin(tagsTable, eq(articleTagsTable.tag_id, tagsTable.id))
      .execute();

    // Group tags by article_id for efficient lookup
    const tagsByArticleId = articleTagRelations.reduce((acc, relation) => {
      if (!acc[relation.article_id]) {
        acc[relation.article_id] = [];
      }
      acc[relation.article_id].push(relation.tag);
      return acc;
    }, {} as Record<number, typeof tagsTable.$inferSelect[]>);

    // Combine articles with their categories and tags
    return articlesWithCategories.map(result => ({
      id: result.articles.id,
      title: result.articles.title,
      slug: result.articles.slug,
      content: result.articles.content,
      excerpt: result.articles.excerpt,
      cover_image: result.articles.cover_image,
      status: result.articles.status,
      category_id: result.articles.category_id,
      seo_title: result.articles.seo_title,
      seo_description: result.articles.seo_description,
      created_at: result.articles.created_at,
      updated_at: result.articles.updated_at,
      category: {
        id: result.categories.id,
        name: result.categories.name,
        slug: result.categories.slug,
        description: result.categories.description,
        created_at: result.categories.created_at,
        updated_at: result.categories.updated_at
      },
      tags: tagsByArticleId[result.articles.id] || []
    }));
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    throw error;
  }
}