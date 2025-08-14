import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, articlesTable } from '../db/schema';
import { type DeleteInput, type CreateCategoryInput, type CreateArticleInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

// Test data
const testCategoryInput: CreateCategoryInput = {
  name: 'Test Category',
  slug: 'test-category',
  description: 'A category for testing'
};

const testArticleInput: CreateArticleInput = {
  title: 'Test Article',
  slug: 'test-article',
  content: 'This is test content',
  excerpt: 'Test excerpt',
  cover_image: null,
  status: 'draft',
  category_id: 1, // Will be updated with actual ID
  tag_ids: [],
  seo_title: null,
  seo_description: null
};

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing category', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        slug: testCategoryInput.slug,
        description: testCategoryInput.description
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Delete the category
    const deleteInput: DeleteInput = { id: categoryId };
    const result = await deleteCategory(deleteInput);

    // Verify result
    expect(result.success).toBe(true);

    // Verify category was actually deleted from database
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(deletedCategory).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent category', async () => {
    const deleteInput: DeleteInput = { id: 999 };

    expect(async () => {
      await deleteCategory(deleteInput);
    }).toThrow(/Category with id 999 not found/i);
  });

  it('should throw error when category has articles using it', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        slug: testCategoryInput.slug,
        description: testCategoryInput.description
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create an article that uses this category
    await db.insert(articlesTable)
      .values({
        title: testArticleInput.title,
        slug: testArticleInput.slug,
        content: testArticleInput.content,
        excerpt: testArticleInput.excerpt,
        cover_image: testArticleInput.cover_image,
        status: testArticleInput.status,
        category_id: categoryId,
        seo_title: testArticleInput.seo_title,
        seo_description: testArticleInput.seo_description
      })
      .execute();

    // Try to delete the category
    const deleteInput: DeleteInput = { id: categoryId };

    expect(async () => {
      await deleteCategory(deleteInput);
    }).toThrow(/Cannot delete category: 1 article\(s\) are using this category/i);

    // Verify category still exists in database
    const category = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(category).toHaveLength(1);
  });

  it('should handle multiple articles using the category', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        slug: testCategoryInput.slug,
        description: testCategoryInput.description
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create multiple articles using this category
    await db.insert(articlesTable)
      .values([
        {
          title: 'First Article',
          slug: 'first-article',
          content: 'First article content',
          excerpt: null,
          cover_image: null,
          status: 'draft',
          category_id: categoryId,
          seo_title: null,
          seo_description: null
        },
        {
          title: 'Second Article',
          slug: 'second-article',
          content: 'Second article content',
          excerpt: null,
          cover_image: null,
          status: 'published',
          category_id: categoryId,
          seo_title: null,
          seo_description: null
        }
      ])
      .execute();

    // Try to delete the category
    const deleteInput: DeleteInput = { id: categoryId };

    expect(async () => {
      await deleteCategory(deleteInput);
    }).toThrow(/Cannot delete category: 2 article\(s\) are using this category/i);
  });

  it('should validate deletion with different category states', async () => {
    // Create two categories
    const category1Result = await db.insert(categoriesTable)
      .values({
        name: 'Category 1',
        slug: 'category-1',
        description: 'First category'
      })
      .returning()
      .execute();

    const category2Result = await db.insert(categoriesTable)
      .values({
        name: 'Category 2',
        slug: 'category-2',
        description: 'Second category'
      })
      .returning()
      .execute();

    const category1Id = category1Result[0].id;
    const category2Id = category2Result[0].id;

    // Create article using category 1 only
    await db.insert(articlesTable)
      .values({
        title: 'Article using category 1',
        slug: 'article-cat-1',
        content: 'Article content',
        excerpt: null,
        cover_image: null,
        status: 'draft',
        category_id: category1Id,
        seo_title: null,
        seo_description: null
      })
      .execute();

    // Should be able to delete category 2 (unused)
    const deleteInput2: DeleteInput = { id: category2Id };
    const result = await deleteCategory(deleteInput2);
    expect(result.success).toBe(true);

    // Should NOT be able to delete category 1 (used)
    const deleteInput1: DeleteInput = { id: category1Id };
    expect(async () => {
      await deleteCategory(deleteInput1);
    }).toThrow(/Cannot delete category: 1 article\(s\) are using this category/i);
  });
});