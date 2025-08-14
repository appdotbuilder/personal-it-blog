import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, categoriesTable, tagsTable, articleTagsTable } from '../db/schema';
import { type CreateArticleInput } from '../schema';
import { createArticle } from '../handlers/create_article';
import { eq, and } from 'drizzle-orm';

describe('createArticle', () => {
  let testCategoryId: number;
  let testTagIds: number[];

  beforeEach(async () => {
    await createDB();
    
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    testCategoryId = categoryResult[0].id;

    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values({
        name: 'Test Tag 1',
        slug: 'test-tag-1'
      })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({
        name: 'Test Tag 2',
        slug: 'test-tag-2'
      })
      .returning()
      .execute();

    testTagIds = [tag1Result[0].id, tag2Result[0].id];
  });

  afterEach(resetDB);

  const baseTestInput: CreateArticleInput = {
    title: 'Test Article',
    slug: 'test-article',
    content: 'This is test content for the article.',
    excerpt: 'Test excerpt',
    cover_image: 'https://example.com/image.jpg',
    status: 'draft',
    category_id: 0, // Will be set in tests
    tag_ids: [],
    seo_title: 'SEO Title',
    seo_description: 'SEO Description'
  };

  it('should create an article without tags', async () => {
    const testInput = {
      ...baseTestInput,
      category_id: testCategoryId
    };

    const result = await createArticle(testInput);

    // Validate article properties
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Test Article');
    expect(result.slug).toEqual('test-article');
    expect(result.content).toEqual('This is test content for the article.');
    expect(result.excerpt).toEqual('Test excerpt');
    expect(result.cover_image).toEqual('https://example.com/image.jpg');
    expect(result.status).toEqual('draft');
    expect(result.category_id).toEqual(testCategoryId);
    expect(result.seo_title).toEqual('SEO Title');
    expect(result.seo_description).toEqual('SEO Description');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Validate category relation
    expect(result.category).toBeDefined();
    expect(result.category.id).toEqual(testCategoryId);
    expect(result.category.name).toEqual('Test Category');
    expect(result.category.slug).toEqual('test-category');

    // Validate tags are empty
    expect(result.tags).toEqual([]);
  });

  it('should create an article with tags', async () => {
    const testInput = {
      ...baseTestInput,
      category_id: testCategoryId,
      tag_ids: testTagIds
    };

    const result = await createArticle(testInput);

    // Validate basic article properties
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Test Article');
    expect(result.category_id).toEqual(testCategoryId);

    // Validate tags relation
    expect(result.tags).toHaveLength(2);
    expect(result.tags.map(tag => tag.id)).toEqual(expect.arrayContaining(testTagIds));
    expect(result.tags.map(tag => tag.name)).toEqual(expect.arrayContaining(['Test Tag 1', 'Test Tag 2']));
  });

  it('should save article to database', async () => {
    const testInput = {
      ...baseTestInput,
      category_id: testCategoryId,
      tag_ids: [testTagIds[0]]
    };

    const result = await createArticle(testInput);

    // Verify article is in database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toEqual('Test Article');
    expect(articles[0].slug).toEqual('test-article');
    expect(articles[0].content).toEqual('This is test content for the article.');
    expect(articles[0].status).toEqual('draft');
    expect(articles[0].category_id).toEqual(testCategoryId);

    // Verify article-tag relationships are in database
    const articleTags = await db.select()
      .from(articleTagsTable)
      .where(eq(articleTagsTable.article_id, result.id))
      .execute();

    expect(articleTags).toHaveLength(1);
    expect(articleTags[0].tag_id).toEqual(testTagIds[0]);
  });

  it('should handle nullable fields correctly', async () => {
    const testInput = {
      title: 'Minimal Article',
      slug: 'minimal-article',
      content: 'Minimal content',
      excerpt: null,
      cover_image: null,
      status: 'published' as const,
      category_id: testCategoryId,
      seo_title: null,
      seo_description: null
    };

    const result = await createArticle(testInput);

    expect(result.excerpt).toBeNull();
    expect(result.cover_image).toBeNull();
    expect(result.seo_title).toBeNull();
    expect(result.seo_description).toBeNull();
    expect(result.status).toEqual('published');
  });

  it('should throw error when category does not exist', async () => {
    const testInput = {
      ...baseTestInput,
      category_id: 99999 // Non-existent category
    };

    await expect(createArticle(testInput)).rejects.toThrow(/Category with id 99999 not found/);
  });

  it('should throw error when tag does not exist', async () => {
    const testInput = {
      ...baseTestInput,
      category_id: testCategoryId,
      tag_ids: [testTagIds[0], 99999] // One valid, one invalid tag
    };

    await expect(createArticle(testInput)).rejects.toThrow(/Tags with ids 99999 not found/);
  });

  it('should throw error when multiple tags do not exist', async () => {
    const testInput = {
      ...baseTestInput,
      category_id: testCategoryId,
      tag_ids: [99998, 99999] // Both invalid tags
    };

    await expect(createArticle(testInput)).rejects.toThrow(/Tags with ids 99998, 99999 not found/);
  });

  it('should create article with published status', async () => {
    const testInput = {
      ...baseTestInput,
      category_id: testCategoryId,
      status: 'published' as const
    };

    const result = await createArticle(testInput);

    expect(result.status).toEqual('published');

    // Verify in database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(articles[0].status).toEqual('published');
  });

  it('should handle empty tag_ids array', async () => {
    const testInput = {
      ...baseTestInput,
      category_id: testCategoryId,
      tag_ids: []
    };

    const result = await createArticle(testInput);

    expect(result.tags).toEqual([]);

    // Verify no article-tag relationships in database
    const articleTags = await db.select()
      .from(articleTagsTable)
      .where(eq(articleTagsTable.article_id, result.id))
      .execute();

    expect(articleTags).toHaveLength(0);
  });
});