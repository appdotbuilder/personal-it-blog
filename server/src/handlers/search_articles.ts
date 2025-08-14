import { db } from '../db';
import { articlesTable, categoriesTable, tagsTable, articleTagsTable } from '../db/schema';
import { type SearchArticlesInput, type ArticleWithRelations } from '../schema';
import { eq, ilike, or, and, inArray, SQL, desc } from 'drizzle-orm';

export const searchArticles = async (input: SearchArticlesInput): Promise<ArticleWithRelations[]> => {
  try {
    // Build conditions array first
    const conditions: SQL<unknown>[] = [];

    // Text search in title and content
    if (input.query) {
      conditions.push(
        or(
          ilike(articlesTable.title, `%${input.query}%`),
          ilike(articlesTable.content, `%${input.query}%`)
        )!
      );
    }

    // Filter by category
    if (input.category_id !== undefined) {
      conditions.push(eq(articlesTable.category_id, input.category_id));
    }

    // Filter by status
    if (input.status !== undefined) {
      conditions.push(eq(articlesTable.status, input.status));
    }

    // Filter by tags - articles that have ANY of the provided tags
    if (input.tag_ids && input.tag_ids.length > 0) {
      const articlesWithTags = db.select({ article_id: articleTagsTable.article_id })
        .from(articleTagsTable)
        .where(inArray(articleTagsTable.tag_id, input.tag_ids));

      conditions.push(
        inArray(articlesTable.id, articlesWithTags)
      );
    }

    // Build the complete query in one chain to avoid TypeScript issues
    const baseQuery = db.select({
      // Article fields
      id: articlesTable.id,
      title: articlesTable.title,
      slug: articlesTable.slug,
      content: articlesTable.content,
      excerpt: articlesTable.excerpt,
      cover_image: articlesTable.cover_image,
      status: articlesTable.status,
      category_id: articlesTable.category_id,
      seo_title: articlesTable.seo_title,
      seo_description: articlesTable.seo_description,
      created_at: articlesTable.created_at,
      updated_at: articlesTable.updated_at,
      // Category fields
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
        created_at: categoriesTable.created_at,
        updated_at: categoriesTable.updated_at
      }
    })
    .from(articlesTable)
    .innerJoin(categoriesTable, eq(articlesTable.category_id, categoriesTable.id));

    // Apply where conditions, orderBy, and pagination in a single chain
    const finalQuery = conditions.length > 0
      ? baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(articlesTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
      : baseQuery
          .orderBy(desc(articlesTable.created_at))
          .limit(input.limit)
          .offset(input.offset);

    const results = await finalQuery.execute();

    // For each article, get its tags
    const articlesWithTags = await Promise.all(
      results.map(async (result) => {
        const tags = await db.select({
          id: tagsTable.id,
          name: tagsTable.name,
          slug: tagsTable.slug,
          created_at: tagsTable.created_at,
          updated_at: tagsTable.updated_at
        })
        .from(tagsTable)
        .innerJoin(articleTagsTable, eq(tagsTable.id, articleTagsTable.tag_id))
        .where(eq(articleTagsTable.article_id, result.id))
        .execute();

        return {
          id: result.id,
          title: result.title,
          slug: result.slug,
          content: result.content,
          excerpt: result.excerpt,
          cover_image: result.cover_image,
          status: result.status,
          category_id: result.category_id,
          seo_title: result.seo_title,
          seo_description: result.seo_description,
          created_at: result.created_at,
          updated_at: result.updated_at,
          category: result.category,
          tags: tags
        };
      })
    );

    return articlesWithTags;
  } catch (error) {
    console.error('Article search failed:', error);
    throw error;
  }
};