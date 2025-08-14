import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, categoriesTable, tagsTable, articleTagsTable } from '../db/schema';
import { type GetArticleBySlugInput } from '../schema';
import { getArticleBySlug } from '../handlers/get_article_by_slug';

describe('getArticleBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return article with relations when found', async () => {
    // Create prerequisite data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Tech',
        slug: 'tech',
        description: 'Technology articles'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    const tagResult = await db.insert(tagsTable)
      .values([
        { name: 'JavaScript', slug: 'javascript' },
        { name: 'Node.js', slug: 'nodejs' }
      ])
      .returning()
      .execute();

    const tags = tagResult;

    // Create article
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is a test article content',
        excerpt: 'Test excerpt',
        cover_image: 'test-image.jpg',
        status: 'published',
        category_id: category.id,
        seo_title: 'SEO Title',
        seo_description: 'SEO Description'
      })
      .returning()
      .execute();

    const article = articleResult[0];

    // Associate tags with the article
    await db.insert(articleTagsTable)
      .values([
        { article_id: article.id, tag_id: tags[0].id },
        { article_id: article.id, tag_id: tags[1].id }
      ])
      .execute();

    const input: GetArticleBySlugInput = {
      slug: 'test-article'
    };

    const result = await getArticleBySlug(input);

    // Verify article data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(article.id);
    expect(result!.title).toEqual('Test Article');
    expect(result!.slug).toEqual('test-article');
    expect(result!.content).toEqual('This is a test article content');
    expect(result!.excerpt).toEqual('Test excerpt');
    expect(result!.cover_image).toEqual('test-image.jpg');
    expect(result!.status).toEqual('published');
    expect(result!.category_id).toEqual(category.id);
    expect(result!.seo_title).toEqual('SEO Title');
    expect(result!.seo_description).toEqual('SEO Description');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify category relation
    expect(result!.category).toBeDefined();
    expect(result!.category.id).toEqual(category.id);
    expect(result!.category.name).toEqual('Tech');
    expect(result!.category.slug).toEqual('tech');
    expect(result!.category.description).toEqual('Technology articles');
    expect(result!.category.created_at).toBeInstanceOf(Date);
    expect(result!.category.updated_at).toBeInstanceOf(Date);

    // Verify tags relation
    expect(result!.tags).toHaveLength(2);
    expect(result!.tags.map(t => t.name).sort()).toEqual(['JavaScript', 'Node.js']);
    expect(result!.tags.map(t => t.slug).sort()).toEqual(['javascript', 'nodejs']);
    result!.tags.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(tag.created_at).toBeInstanceOf(Date);
      expect(tag.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return null when article not found', async () => {
    const input: GetArticleBySlugInput = {
      slug: 'non-existent-article'
    };

    const result = await getArticleBySlug(input);

    expect(result).toBeNull();
  });

  it('should return article with empty tags array when no tags associated', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Tech',
        slug: 'tech',
        description: 'Technology articles'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create article without tags
    await db.insert(articlesTable)
      .values({
        title: 'Article Without Tags',
        slug: 'article-without-tags',
        content: 'Content without tags',
        excerpt: null,
        cover_image: null,
        status: 'draft',
        category_id: category.id,
        seo_title: null,
        seo_description: null
      })
      .execute();

    const input: GetArticleBySlugInput = {
      slug: 'article-without-tags'
    };

    const result = await getArticleBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Article Without Tags');
    expect(result!.excerpt).toBeNull();
    expect(result!.cover_image).toBeNull();
    expect(result!.status).toEqual('draft');
    expect(result!.seo_title).toBeNull();
    expect(result!.seo_description).toBeNull();
    expect(result!.category).toBeDefined();
    expect(result!.tags).toHaveLength(0);
  });

  it('should handle articles with different statuses', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Tech',
        slug: 'tech',
        description: 'Technology articles'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create draft article
    await db.insert(articlesTable)
      .values({
        title: 'Draft Article',
        slug: 'draft-article',
        content: 'Draft content',
        excerpt: 'Draft excerpt',
        cover_image: null,
        status: 'draft',
        category_id: category.id,
        seo_title: null,
        seo_description: null
      })
      .execute();

    const input: GetArticleBySlugInput = {
      slug: 'draft-article'
    };

    const result = await getArticleBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('draft');
    expect(result!.title).toEqual('Draft Article');
  });

  it('should handle slug case sensitivity correctly', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Tech',
        slug: 'tech',
        description: 'Technology articles'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create article with lowercase slug
    await db.insert(articlesTable)
      .values({
        title: 'Case Test Article',
        slug: 'case-test-article',
        content: 'Case test content',
        excerpt: null,
        cover_image: null,
        status: 'published',
        category_id: category.id,
        seo_title: null,
        seo_description: null
      })
      .execute();

    // Test exact match
    const exactInput: GetArticleBySlugInput = {
      slug: 'case-test-article'
    };

    const exactResult = await getArticleBySlug(exactInput);
    expect(exactResult).not.toBeNull();
    expect(exactResult!.title).toEqual('Case Test Article');

    // Test different case - should not match
    const caseInput: GetArticleBySlugInput = {
      slug: 'Case-Test-Article'
    };

    const caseResult = await getArticleBySlug(caseInput);
    expect(caseResult).toBeNull();
  });
});