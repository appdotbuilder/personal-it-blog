import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, categoriesTable, tagsTable, articleTagsTable } from '../db/schema';
import { type UpdateArticleInput } from '../schema';
import { updateArticle } from '../handlers/update_article';
import { eq } from 'drizzle-orm';

describe('updateArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let secondCategoryId: number;
  let articleId: number;
  let tagId1: number;
  let tagId2: number;
  let tagId3: number;

  beforeEach(async () => {
    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Technology', slug: 'technology', description: 'Tech articles' },
        { name: 'Science', slug: 'science', description: 'Science articles' }
      ])
      .returning()
      .execute();
    
    categoryId = categories[0].id;
    secondCategoryId = categories[1].id;

    // Create test tags
    const tags = await db.insert(tagsTable)
      .values([
        { name: 'JavaScript', slug: 'javascript' },
        { name: 'TypeScript', slug: 'typescript' },
        { name: 'React', slug: 'react' }
      ])
      .returning()
      .execute();
    
    tagId1 = tags[0].id;
    tagId2 = tags[1].id;
    tagId3 = tags[2].id;

    // Create test article
    const articles = await db.insert(articlesTable)
      .values({
        title: 'Original Article',
        slug: 'original-article',
        content: 'Original content',
        excerpt: 'Original excerpt',
        cover_image: 'original-image.jpg',
        status: 'draft',
        category_id: categoryId,
        seo_title: 'Original SEO Title',
        seo_description: 'Original SEO Description'
      })
      .returning()
      .execute();
    
    articleId = articles[0].id;

    // Add initial tags
    await db.insert(articleTagsTable)
      .values([
        { article_id: articleId, tag_id: tagId1 },
        { article_id: articleId, tag_id: tagId2 }
      ])
      .execute();
  });

  it('should update basic article fields', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      title: 'Updated Article Title',
      content: 'Updated content here',
      status: 'published'
    };

    const result = await updateArticle(updateInput);

    expect(result.id).toEqual(articleId);
    expect(result.title).toEqual('Updated Article Title');
    expect(result.content).toEqual('Updated content here');
    expect(result.status).toEqual('published');
    expect(result.slug).toEqual('original-article'); // Should remain unchanged
    expect(result.excerpt).toEqual('Original excerpt'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update article slug and SEO fields', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      slug: 'new-article-slug',
      seo_title: 'New SEO Title',
      seo_description: 'New SEO Description'
    };

    const result = await updateArticle(updateInput);

    expect(result.slug).toEqual('new-article-slug');
    expect(result.seo_title).toEqual('New SEO Title');
    expect(result.seo_description).toEqual('New SEO Description');
    expect(result.title).toEqual('Original Article'); // Should remain unchanged
  });

  it('should update article category', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      category_id: secondCategoryId
    };

    const result = await updateArticle(updateInput);

    expect(result.category_id).toEqual(secondCategoryId);
    expect(result.category.id).toEqual(secondCategoryId);
    expect(result.category.name).toEqual('Science');
    expect(result.category.slug).toEqual('science');
  });

  it('should update article tags by replacing existing ones', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      tag_ids: [tagId2, tagId3] // Remove tagId1, keep tagId2, add tagId3
    };

    const result = await updateArticle(updateInput);

    expect(result.tags).toHaveLength(2);
    const tagIds = result.tags.map(tag => tag.id).sort();
    expect(tagIds).toEqual([tagId2, tagId3].sort());
    
    const tagNames = result.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['TypeScript', 'React'].sort());
  });

  it('should remove all tags when tag_ids is empty array', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      tag_ids: []
    };

    const result = await updateArticle(updateInput);

    expect(result.tags).toHaveLength(0);
  });

  it('should not modify tags when tag_ids is not provided', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      title: 'Updated Title Only'
    };

    const result = await updateArticle(updateInput);

    expect(result.tags).toHaveLength(2);
    const tagIds = result.tags.map(tag => tag.id).sort();
    expect(tagIds).toEqual([tagId1, tagId2].sort());
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      excerpt: null,
      cover_image: null,
      seo_title: null,
      seo_description: null
    };

    const result = await updateArticle(updateInput);

    expect(result.excerpt).toBeNull();
    expect(result.cover_image).toBeNull();
    expect(result.seo_title).toBeNull();
    expect(result.seo_description).toBeNull();
  });

  it('should update multiple fields simultaneously', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      title: 'Comprehensive Update',
      slug: 'comprehensive-update',
      content: 'Comprehensive new content',
      excerpt: 'New excerpt',
      cover_image: 'new-cover.jpg',
      status: 'published',
      category_id: secondCategoryId,
      tag_ids: [tagId3],
      seo_title: 'Comprehensive SEO Title',
      seo_description: 'Comprehensive SEO Description'
    };

    const result = await updateArticle(updateInput);

    expect(result.title).toEqual('Comprehensive Update');
    expect(result.slug).toEqual('comprehensive-update');
    expect(result.content).toEqual('Comprehensive new content');
    expect(result.excerpt).toEqual('New excerpt');
    expect(result.cover_image).toEqual('new-cover.jpg');
    expect(result.status).toEqual('published');
    expect(result.category_id).toEqual(secondCategoryId);
    expect(result.category.name).toEqual('Science');
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toEqual('React');
    expect(result.seo_title).toEqual('Comprehensive SEO Title');
    expect(result.seo_description).toEqual('Comprehensive SEO Description');
  });

  it('should save updated data to database', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      title: 'Database Test Update',
      status: 'published'
    };

    await updateArticle(updateInput);

    // Verify changes were persisted
    const savedArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, articleId))
      .execute();

    expect(savedArticle[0].title).toEqual('Database Test Update');
    expect(savedArticle[0].status).toEqual('published');
    expect(savedArticle[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when article does not exist', async () => {
    const updateInput: UpdateArticleInput = {
      id: 99999,
      title: 'Non-existent Article'
    };

    await expect(updateArticle(updateInput)).rejects.toThrow(/Article with ID 99999 not found/);
  });

  it('should throw error when category_id does not exist', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      category_id: 99999
    };

    await expect(updateArticle(updateInput)).rejects.toThrow(/Category with ID 99999 not found/);
  });

  it('should throw error when one or more tag_ids do not exist', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      tag_ids: [tagId1, 99999, 99998]
    };

    await expect(updateArticle(updateInput)).rejects.toThrow(/Tags with IDs 99999, 99998 not found/);
  });

  it('should handle partial tag validation failure', async () => {
    const updateInput: UpdateArticleInput = {
      id: articleId,
      tag_ids: [tagId1, 99999] // One valid, one invalid
    };

    await expect(updateArticle(updateInput)).rejects.toThrow(/Tags with IDs 99999 not found/);
  });
});