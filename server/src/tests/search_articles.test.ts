import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, categoriesTable, tagsTable, articleTagsTable } from '../db/schema';
import { type SearchArticlesInput } from '../schema';
import { searchArticles } from '../handlers/search_articles';

describe('searchArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let categoryId1: number;
  let categoryId2: number;
  let tagId1: number;
  let tagId2: number;
  let tagId3: number;
  let articleId1: number;
  let articleId2: number;
  let articleId3: number;

  const setupTestData = async () => {
    // Create categories
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Technology', slug: 'technology', description: 'Tech articles' },
        { name: 'Health', slug: 'health', description: 'Health articles' }
      ])
      .returning()
      .execute();

    categoryId1 = categories[0].id;
    categoryId2 = categories[1].id;

    // Create tags
    const tags = await db.insert(tagsTable)
      .values([
        { name: 'JavaScript', slug: 'javascript' },
        { name: 'React', slug: 'react' },
        { name: 'Fitness', slug: 'fitness' }
      ])
      .returning()
      .execute();

    tagId1 = tags[0].id;
    tagId2 = tags[1].id;
    tagId3 = tags[2].id;

    // Create articles
    const articles = await db.insert(articlesTable)
      .values([
        {
          title: 'JavaScript Best Practices',
          slug: 'javascript-best-practices',
          content: 'This article covers JavaScript programming best practices.',
          excerpt: 'Learn JavaScript best practices',
          status: 'published',
          category_id: categoryId1
        },
        {
          title: 'React Components Guide',
          slug: 'react-components-guide',
          content: 'A comprehensive guide to React components and hooks.',
          excerpt: 'Master React components',
          status: 'published',
          category_id: categoryId1
        },
        {
          title: 'Fitness Tips for Developers',
          slug: 'fitness-tips-developers',
          content: 'Stay healthy while coding with these fitness tips.',
          excerpt: 'Health tips for programmers',
          status: 'draft',
          category_id: categoryId2
        }
      ])
      .returning()
      .execute();

    articleId1 = articles[0].id;
    articleId2 = articles[1].id;
    articleId3 = articles[2].id;

    // Create article-tag relationships
    await db.insert(articleTagsTable)
      .values([
        { article_id: articleId1, tag_id: tagId1 }, // JavaScript article has JavaScript tag
        { article_id: articleId2, tag_id: tagId2 }, // React article has React tag
        { article_id: articleId2, tag_id: tagId1 }, // React article also has JavaScript tag
        { article_id: articleId3, tag_id: tagId3 }  // Fitness article has Fitness tag
      ])
      .execute();
  };

  it('should return all published articles by default', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(3); // All articles should be returned
    
    // Should include category and tags
    expect(results[0].category).toBeDefined();
    expect(results[0].category.name).toBeDefined();
    expect(results[0].tags).toBeInstanceOf(Array);

    // Verify all expected articles are present
    const titles = results.map(article => article.title);
    expect(titles).toContain('JavaScript Best Practices');
    expect(titles).toContain('React Components Guide');
    expect(titles).toContain('Fitness Tips for Developers');

    // Verify ordering is by created_at desc - timestamps should be in descending order
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].created_at >= results[i + 1].created_at).toBe(true);
    }
  });

  it('should search by text query in title', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      query: 'JavaScript',
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('JavaScript Best Practices');
    expect(results[0].category.name).toBe('Technology');
    expect(results[0].tags).toHaveLength(1);
    expect(results[0].tags[0].name).toBe('JavaScript');
  });

  it('should search by text query in content', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      query: 'React components',
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Components Guide');
    expect(results[0].tags).toHaveLength(2); // Should have both React and JavaScript tags
  });

  it('should search case-insensitively', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      query: 'JAVASCRIPT',
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('JavaScript Best Practices');
  });

  it('should filter by category_id', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      category_id: categoryId1,
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(2);
    results.forEach(article => {
      expect(article.category_id).toBe(categoryId1);
      expect(article.category.name).toBe('Technology');
    });
  });

  it('should filter by status', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      status: 'published',
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(2);
    results.forEach(article => {
      expect(article.status).toBe('published');
    });
  });

  it('should filter by single tag_id', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      tag_ids: [tagId1], // JavaScript tag
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(2); // Both JS article and React article have JavaScript tag
    
    // Verify each result has the JavaScript tag
    results.forEach(article => {
      const hasJavaScriptTag = article.tags.some(tag => tag.id === tagId1);
      expect(hasJavaScriptTag).toBe(true);
    });
  });

  it('should filter by multiple tag_ids (OR operation)', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      tag_ids: [tagId2, tagId3], // React OR Fitness tags
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(2);
    
    // Should include React article and Fitness article
    const titles = results.map(article => article.title);
    expect(titles).toContain('React Components Guide');
    expect(titles).toContain('Fitness Tips for Developers');
  });

  it('should combine multiple filters', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      query: 'guide',
      category_id: categoryId1,
      status: 'published',
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Components Guide');
    expect(results[0].status).toBe('published');
    expect(results[0].category_id).toBe(categoryId1);
  });

  it('should handle pagination with limit and offset', async () => {
    await setupTestData();

    // Test first page
    const firstPage: SearchArticlesInput = {
      limit: 2,
      offset: 0
    };

    const firstResults = await searchArticles(firstPage);
    expect(firstResults).toHaveLength(2);

    // Test second page
    const secondPage: SearchArticlesInput = {
      limit: 2,
      offset: 2
    };

    const secondResults = await searchArticles(secondPage);
    expect(secondResults).toHaveLength(1);

    // Should not have overlapping results
    const firstIds = firstResults.map(article => article.id);
    const secondIds = secondResults.map(article => article.id);
    expect(firstIds).not.toContain(secondIds[0]);
  });

  it('should return empty array when no articles match', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      query: 'nonexistent content',
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array for non-existent category', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      category_id: 999, // Non-existent category
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array for non-existent tags', async () => {
    await setupTestData();

    const input: SearchArticlesInput = {
      tag_ids: [999], // Non-existent tag
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(0);
  });

  it('should handle articles without tags', async () => {
    // Create category first
    const category = await db.insert(categoriesTable)
      .values({ name: 'Test Category', slug: 'test-category' })
      .returning()
      .execute();

    // Create article without tags
    await db.insert(articlesTable)
      .values({
        title: 'Article Without Tags',
        slug: 'article-without-tags',
        content: 'This article has no tags',
        status: 'published',
        category_id: category[0].id
      })
      .execute();

    const input: SearchArticlesInput = {
      limit: 10,
      offset: 0
    };

    const results = await searchArticles(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Article Without Tags');
    expect(results[0].tags).toHaveLength(0);
    expect(results[0].category).toBeDefined();
  });
});