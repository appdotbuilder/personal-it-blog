import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable, categoriesTable, articlesTable, articleTagsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteTag } from '../handlers/delete_tag';
import { eq } from 'drizzle-orm';

// Test input for deletion
const testDeleteInput: DeleteInput = {
  id: 1
};

describe('deleteTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing tag', async () => {
    // Create a test tag first
    const [tag] = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        slug: 'test-tag'
      })
      .returning()
      .execute();

    // Delete the tag
    const result = await deleteTag({ id: tag.id });

    // Verify success
    expect(result.success).toBe(true);

    // Verify tag is removed from database
    const deletedTag = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tag.id))
      .execute();

    expect(deletedTag).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent tag', async () => {
    // Try to delete a tag that doesn't exist
    const result = await deleteTag({ id: 999 });

    // Verify failure
    expect(result.success).toBe(false);
  });

  it('should handle cascade deletion of article-tag relationships', async () => {
    // Create test category first
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    // Create test tag
    const [tag] = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        slug: 'test-tag'
      })
      .returning()
      .execute();

    // Create test article
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Test Article',
        slug: 'test-article',
        content: 'Test content',
        excerpt: null,
        cover_image: null,
        status: 'draft',
        category_id: category.id,
        seo_title: null,
        seo_description: null
      })
      .returning()
      .execute();

    // Create article-tag relationship
    await db.insert(articleTagsTable)
      .values({
        article_id: article.id,
        tag_id: tag.id
      })
      .execute();

    // Verify relationship exists
    const relationshipsBefore = await db.select()
      .from(articleTagsTable)
      .where(eq(articleTagsTable.tag_id, tag.id))
      .execute();

    expect(relationshipsBefore).toHaveLength(1);

    // Delete the tag
    const result = await deleteTag({ id: tag.id });

    // Verify success
    expect(result.success).toBe(true);

    // Verify tag is deleted
    const deletedTag = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tag.id))
      .execute();

    expect(deletedTag).toHaveLength(0);

    // Verify article-tag relationships are automatically deleted due to cascade
    const relationshipsAfter = await db.select()
      .from(articleTagsTable)
      .where(eq(articleTagsTable.tag_id, tag.id))
      .execute();

    expect(relationshipsAfter).toHaveLength(0);

    // Verify article itself is NOT deleted
    const remainingArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article.id))
      .execute();

    expect(remainingArticle).toHaveLength(1);
  });

  it('should handle multiple article-tag relationships correctly', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    // Create test tag
    const [tag] = await db.insert(tagsTable)
      .values({
        name: 'Popular Tag',
        slug: 'popular-tag'
      })
      .returning()
      .execute();

    // Create multiple test articles
    const [article1] = await db.insert(articlesTable)
      .values({
        title: 'First Article',
        slug: 'first-article',
        content: 'First article content',
        excerpt: null,
        cover_image: null,
        status: 'published',
        category_id: category.id,
        seo_title: null,
        seo_description: null
      })
      .returning()
      .execute();

    const [article2] = await db.insert(articlesTable)
      .values({
        title: 'Second Article',
        slug: 'second-article',
        content: 'Second article content',
        excerpt: null,
        cover_image: null,
        status: 'draft',
        category_id: category.id,
        seo_title: null,
        seo_description: null
      })
      .returning()
      .execute();

    // Create multiple article-tag relationships
    await db.insert(articleTagsTable)
      .values([
        { article_id: article1.id, tag_id: tag.id },
        { article_id: article2.id, tag_id: tag.id }
      ])
      .execute();

    // Verify multiple relationships exist
    const relationshipsBefore = await db.select()
      .from(articleTagsTable)
      .where(eq(articleTagsTable.tag_id, tag.id))
      .execute();

    expect(relationshipsBefore).toHaveLength(2);

    // Delete the tag
    const result = await deleteTag({ id: tag.id });

    // Verify success
    expect(result.success).toBe(true);

    // Verify all relationships are deleted
    const relationshipsAfter = await db.select()
      .from(articleTagsTable)
      .where(eq(articleTagsTable.tag_id, tag.id))
      .execute();

    expect(relationshipsAfter).toHaveLength(0);

    // Verify both articles still exist
    const remainingArticles = await db.select()
      .from(articlesTable)
      .execute();

    expect(remainingArticles).toHaveLength(2);
  });
});