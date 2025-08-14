import { db } from '../db';
import { articlesTable, categoriesTable, tagsTable, articleTagsTable } from '../db/schema';
import { type UpdateArticleInput, type ArticleWithRelations } from '../schema';
import { eq, inArray, and } from 'drizzle-orm';

export const updateArticle = async (input: UpdateArticleInput): Promise<ArticleWithRelations> => {
  try {
    // First, check if the article exists
    const existingArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, input.id))
      .execute();

    if (existingArticle.length === 0) {
      throw new Error(`Article with ID ${input.id} not found`);
    }

    // Validate category exists if category_id is being updated
    if (input.category_id !== undefined) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();
      
      if (categoryExists.length === 0) {
        throw new Error(`Category with ID ${input.category_id} not found`);
      }
    }

    // Validate all tag IDs exist if tag_ids are being updated
    if (input.tag_ids && input.tag_ids.length > 0) {
      const existingTags = await db.select()
        .from(tagsTable)
        .where(inArray(tagsTable.id, input.tag_ids))
        .execute();
      
      if (existingTags.length !== input.tag_ids.length) {
        const existingTagIds = existingTags.map(tag => tag.id);
        const missingTagIds = input.tag_ids.filter(id => !existingTagIds.includes(id));
        throw new Error(`Tags with IDs ${missingTagIds.join(', ')} not found`);
      }
    }

    // Build the update values object, only including provided fields
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) updateValues.title = input.title;
    if (input.slug !== undefined) updateValues.slug = input.slug;
    if (input.content !== undefined) updateValues.content = input.content;
    if (input.excerpt !== undefined) updateValues.excerpt = input.excerpt;
    if (input.cover_image !== undefined) updateValues.cover_image = input.cover_image;
    if (input.status !== undefined) updateValues.status = input.status;
    if (input.category_id !== undefined) updateValues.category_id = input.category_id;
    if (input.seo_title !== undefined) updateValues.seo_title = input.seo_title;
    if (input.seo_description !== undefined) updateValues.seo_description = input.seo_description;

    // Update the article
    const updatedArticles = await db.update(articlesTable)
      .set(updateValues)
      .where(eq(articlesTable.id, input.id))
      .returning()
      .execute();

    const updatedArticle = updatedArticles[0];

    // Handle tag relationships if tag_ids are provided
    if (input.tag_ids !== undefined) {
      // Delete existing article-tag relationships
      await db.delete(articleTagsTable)
        .where(eq(articleTagsTable.article_id, input.id))
        .execute();

      // Insert new article-tag relationships if any tags provided
      if (input.tag_ids.length > 0) {
        const articleTagValues = input.tag_ids.map(tagId => ({
          article_id: input.id,
          tag_id: tagId
        }));

        await db.insert(articleTagsTable)
          .values(articleTagValues)
          .execute();
      }
    }

    // Fetch the complete article with relations
    const articleWithRelations = await db.select({
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
    .innerJoin(categoriesTable, eq(articlesTable.category_id, categoriesTable.id))
    .where(eq(articlesTable.id, input.id))
    .execute();

    // Fetch tags separately
    const articleTags = await db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
      created_at: tagsTable.created_at,
      updated_at: tagsTable.updated_at
    })
    .from(tagsTable)
    .innerJoin(articleTagsTable, eq(tagsTable.id, articleTagsTable.tag_id))
    .where(eq(articleTagsTable.article_id, input.id))
    .execute();

    const result = articleWithRelations[0];

    return {
      ...result,
      tags: articleTags
    };
  } catch (error) {
    console.error('Article update failed:', error);
    throw error;
  }
};