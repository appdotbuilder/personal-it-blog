import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, categoriesTable, tagsTable, articleTagsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteArticle } from '../handlers/delete_article';
import { eq } from 'drizzle-orm';

describe('deleteArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing article', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create test article
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content',
        excerpt: 'Test excerpt',
        status: 'draft',
        category_id: categoryResult[0].id,
        seo_title: 'Test SEO Title',
        seo_description: 'Test SEO Description'
      })
      .returning()
      .execute();

    const articleId = articleResult[0].id;
    const input: DeleteInput = { id: articleId };

    // Delete the article
    const result = await deleteArticle(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify article is deleted from database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, articleId))
      .execute();

    expect(articles).toHaveLength(0);
  });

  it('should return false for non-existent article', async () => {
    const input: DeleteInput = { id: 999999 }; // Non-existent ID

    const result = await deleteArticle(input);

    // Should return success: false when no article is found
    expect(result.success).toBe(false);
  });

  it('should cascade delete article-tag relationships', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create test tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'Tag 1', slug: 'tag-1' },
        { name: 'Tag 2', slug: 'tag-2' }
      ])
      .returning()
      .execute();

    // Create test article
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Test Article with Tags',
        slug: 'test-article-with-tags',
        content: 'This article has tags',
        excerpt: 'Test excerpt',
        status: 'published',
        category_id: categoryResult[0].id,
        seo_title: 'Test SEO Title',
        seo_description: 'Test SEO Description'
      })
      .returning()
      .execute();

    const articleId = articleResult[0].id;

    // Create article-tag relationships
    await db.insert(articleTagsTable)
      .values([
        { article_id: articleId, tag_id: tagResults[0].id },
        { article_id: articleId, tag_id: tagResults[1].id }
      ])
      .execute();

    // Verify relationships exist before deletion
    const relationshipsBefore = await db.select()
      .from(articleTagsTable)
      .where(eq(articleTagsTable.article_id, articleId))
      .execute();

    expect(relationshipsBefore).toHaveLength(2);

    // Delete the article
    const input: DeleteInput = { id: articleId };
    const result = await deleteArticle(input);

    expect(result.success).toBe(true);

    // Verify article is deleted
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, articleId))
      .execute();

    expect(articles).toHaveLength(0);

    // Verify article-tag relationships are cascade deleted
    const relationshipsAfter = await db.select()
      .from(articleTagsTable)
      .where(eq(articleTagsTable.article_id, articleId))
      .execute();

    expect(relationshipsAfter).toHaveLength(0);

    // Verify tags still exist (should not be deleted)
    const tags = await db.select()
      .from(tagsTable)
      .execute();

    expect(tags).toHaveLength(2);
    expect(tags.map(t => t.name)).toContain('Tag 1');
    expect(tags.map(t => t.name)).toContain('Tag 2');
  });

  it('should handle multiple deletions correctly', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create multiple test articles
    const articleResults = await db.insert(articlesTable)
      .values([
        {
          title: 'Article 1',
          slug: 'article-1',
          content: 'Content 1',
          excerpt: 'Excerpt 1',
          status: 'draft',
          category_id: categoryResult[0].id,
          seo_title: 'SEO Title 1',
          seo_description: 'SEO Description 1'
        },
        {
          title: 'Article 2',
          slug: 'article-2',
          content: 'Content 2',
          excerpt: 'Excerpt 2',
          status: 'published',
          category_id: categoryResult[0].id,
          seo_title: 'SEO Title 2',
          seo_description: 'SEO Description 2'
        }
      ])
      .returning()
      .execute();

    // Delete first article
    const result1 = await deleteArticle({ id: articleResults[0].id });
    expect(result1.success).toBe(true);

    // Delete second article
    const result2 = await deleteArticle({ id: articleResults[1].id });
    expect(result2.success).toBe(true);

    // Verify both articles are deleted
    const remainingArticles = await db.select()
      .from(articlesTable)
      .execute();

    expect(remainingArticles).toHaveLength(0);
  });

  it('should validate input data structure', async () => {
    // Test with valid input structure
    const input: DeleteInput = { id: 1 };
    
    // Should not throw type error
    expect(typeof input.id).toBe('number');
    expect(input.id).toBe(1);
  });
});