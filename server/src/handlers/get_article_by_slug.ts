import { db } from '../db';
import { articlesTable, categoriesTable, articleTagsTable, tagsTable } from '../db/schema';
import { type GetArticleBySlugInput, type ArticleWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export async function getArticleBySlug(input: GetArticleBySlugInput): Promise<ArticleWithRelations | null> {
  try {
    // First, get the article with its category
    const articleResult = await db.select()
      .from(articlesTable)
      .innerJoin(categoriesTable, eq(articlesTable.category_id, categoriesTable.id))
      .where(eq(articlesTable.slug, input.slug))
      .execute();

    if (articleResult.length === 0) {
      return null;
    }

    const articleData = articleResult[0];
    
    // Get tags for this article
    const tagsResult = await db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
      created_at: tagsTable.created_at,
      updated_at: tagsTable.updated_at
    })
      .from(articleTagsTable)
      .innerJoin(tagsTable, eq(articleTagsTable.tag_id, tagsTable.id))
      .where(eq(articleTagsTable.article_id, articleData.articles.id))
      .execute();

    // Construct the response with proper structure
    return {
      id: articleData.articles.id,
      title: articleData.articles.title,
      slug: articleData.articles.slug,
      content: articleData.articles.content,
      excerpt: articleData.articles.excerpt,
      cover_image: articleData.articles.cover_image,
      status: articleData.articles.status,
      category_id: articleData.articles.category_id,
      seo_title: articleData.articles.seo_title,
      seo_description: articleData.articles.seo_description,
      created_at: articleData.articles.created_at,
      updated_at: articleData.articles.updated_at,
      category: {
        id: articleData.categories.id,
        name: articleData.categories.name,
        slug: articleData.categories.slug,
        description: articleData.categories.description,
        created_at: articleData.categories.created_at,
        updated_at: articleData.categories.updated_at
      },
      tags: tagsResult
    };
  } catch (error) {
    console.error('Get article by slug failed:', error);
    throw error;
  }
}