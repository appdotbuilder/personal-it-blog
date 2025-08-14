import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tagsTable, articlesTable, articleTagsTable } from '../db/schema';
import { getArticles } from '../handlers/get_articles';

describe('getArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no articles exist', async () => {
    const result = await getArticles();
    expect(result).toEqual([]);
  });

  it('should fetch articles with categories and tags', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech articles'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create test tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'JavaScript', slug: 'javascript' },
        { name: 'Web Development', slug: 'web-development' }
      ])
      .returning()
      .execute();
    const [jsTag, webTag] = tagResults;

    // Create test article
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content',
        excerpt: 'Test excerpt',
        cover_image: 'test-image.jpg',
        status: 'published',
        category_id: category.id,
        seo_title: 'Test SEO Title',
        seo_description: 'Test SEO Description'
      })
      .returning()
      .execute();
    const article = articleResult[0];

    // Associate article with tags
    await db.insert(articleTagsTable)
      .values([
        { article_id: article.id, tag_id: jsTag.id },
        { article_id: article.id, tag_id: webTag.id }
      ])
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    
    const fetchedArticle = result[0];
    expect(fetchedArticle.id).toEqual(article.id);
    expect(fetchedArticle.title).toEqual('Test Article');
    expect(fetchedArticle.slug).toEqual('test-article');
    expect(fetchedArticle.content).toEqual('This is test content');
    expect(fetchedArticle.excerpt).toEqual('Test excerpt');
    expect(fetchedArticle.cover_image).toEqual('test-image.jpg');
    expect(fetchedArticle.status).toEqual('published');
    expect(fetchedArticle.category_id).toEqual(category.id);
    expect(fetchedArticle.seo_title).toEqual('Test SEO Title');
    expect(fetchedArticle.seo_description).toEqual('Test SEO Description');
    expect(fetchedArticle.created_at).toBeInstanceOf(Date);
    expect(fetchedArticle.updated_at).toBeInstanceOf(Date);

    // Verify category relationship
    expect(fetchedArticle.category.id).toEqual(category.id);
    expect(fetchedArticle.category.name).toEqual('Technology');
    expect(fetchedArticle.category.slug).toEqual('technology');
    expect(fetchedArticle.category.description).toEqual('Tech articles');

    // Verify tags relationship
    expect(fetchedArticle.tags).toHaveLength(2);
    
    const tagNames = fetchedArticle.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['JavaScript', 'Web Development']);
    
    const tagSlugs = fetchedArticle.tags.map(tag => tag.slug).sort();
    expect(tagSlugs).toEqual(['javascript', 'web-development']);
  });

  it('should return articles ordered by created_at DESC', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech articles'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create multiple articles with different timestamps
    const firstArticle = await db.insert(articlesTable)
      .values({
        title: 'First Article',
        slug: 'first-article',
        content: 'First content',
        status: 'published',
        category_id: category.id
      })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondArticle = await db.insert(articlesTable)
      .values({
        title: 'Second Article',
        slug: 'second-article',
        content: 'Second content',
        status: 'published',
        category_id: category.id
      })
      .returning()
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(2);
    
    // Verify descending order (newest first)
    expect(result[0].title).toEqual('Second Article');
    expect(result[1].title).toEqual('First Article');
    
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle articles without tags', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech articles'
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create article without tags
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Article Without Tags',
        slug: 'article-without-tags',
        content: 'Content without tags',
        status: 'draft',
        category_id: category.id
      })
      .returning()
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Article Without Tags');
    expect(result[0].tags).toEqual([]);
    expect(result[0].category.name).toEqual('Technology');
  });

  it('should handle articles with nullable fields', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Technology',
        slug: 'technology',
        description: null // Test nullable description
      })
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create article with nullable fields
    const articleResult = await db.insert(articlesTable)
      .values({
        title: 'Article with Nulls',
        slug: 'article-with-nulls',
        content: 'Basic content',
        excerpt: null,
        cover_image: null,
        status: 'draft',
        category_id: category.id,
        seo_title: null,
        seo_description: null
      })
      .returning()
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    
    const article = result[0];
    expect(article.title).toEqual('Article with Nulls');
    expect(article.excerpt).toBeNull();
    expect(article.cover_image).toBeNull();
    expect(article.seo_title).toBeNull();
    expect(article.seo_description).toBeNull();
    expect(article.category.description).toBeNull();
    expect(article.tags).toEqual([]);
  });
});