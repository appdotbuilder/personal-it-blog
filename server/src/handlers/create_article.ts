import { db } from '../db';
import { articlesTable, categoriesTable, tagsTable, articleTagsTable } from '../db/schema';
import { type CreateArticleInput, type ArticleWithRelations } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export async function createArticle(input: CreateArticleInput): Promise<ArticleWithRelations> {
  try {
    // Validate that category exists
    const category = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (category.length === 0) {
      throw new Error(`Category with id ${input.category_id} not found`);
    }

    // Validate that all tags exist if tag_ids provided
    let validTags: any[] = [];
    if (input.tag_ids && input.tag_ids.length > 0) {
      validTags = await db.select()
        .from(tagsTable)
        .where(inArray(tagsTable.id, input.tag_ids))
        .execute();

      if (validTags.length !== input.tag_ids.length) {
        const foundTagIds = validTags.map(tag => tag.id);
        const missingTagIds = input.tag_ids.filter(id => !foundTagIds.includes(id));
        throw new Error(`Tags with ids ${missingTagIds.join(', ')} not found`);
      }
    }

    // Insert the article
    const articleResult = await db.insert(articlesTable)
      .values({
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        cover_image: input.cover_image,
        status: input.status,
        category_id: input.category_id,
        seo_title: input.seo_title,
        seo_description: input.seo_description
      })
      .returning()
      .execute();

    const newArticle = articleResult[0];

    // Create article-tag relationships if tag_ids provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const articleTagValues = input.tag_ids.map(tagId => ({
        article_id: newArticle.id,
        tag_id: tagId
      }));

      await db.insert(articleTagsTable)
        .values(articleTagValues)
        .execute();
    }

    // Return the article with relations
    return {
      ...newArticle,
      category: category[0],
      tags: validTags
    };
  } catch (error) {
    console.error('Article creation failed:', error);
    throw error;
  }
}