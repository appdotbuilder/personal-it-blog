import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test category
  const createTestCategory = async () => {
    const result = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        slug: 'original-category',
        description: 'Original description'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update category name', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      name: 'Updated Category'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Updated Category');
    expect(result.slug).toEqual('original-category'); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.updated_at > category.updated_at).toBe(true);
  });

  it('should update category slug', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      slug: 'new-slug'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Original Category'); // Unchanged
    expect(result.slug).toEqual('new-slug');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.updated_at > category.updated_at).toBe(true);
  });

  it('should update category description', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      description: 'New description'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Original Category'); // Unchanged
    expect(result.slug).toEqual('original-category'); // Unchanged
    expect(result.description).toEqual('New description');
    expect(result.updated_at > category.updated_at).toBe(true);
  });

  it('should set description to null', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      description: null
    };

    const result = await updateCategory(input);

    expect(result.description).toBeNull();
    expect(result.updated_at > category.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      name: 'Completely New Name',
      slug: 'completely-new-slug',
      description: 'Completely new description'
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Completely New Name');
    expect(result.slug).toEqual('completely-new-slug');
    expect(result.description).toEqual('Completely new description');
    expect(result.updated_at > category.updated_at).toBe(true);
  });

  it('should save updates to database', async () => {
    const category = await createTestCategory();
    const input: UpdateCategoryInput = {
      id: category.id,
      name: 'Database Test Category'
    };

    await updateCategory(input);

    // Verify the update was persisted to database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Database Test Category');
    expect(categories[0].updated_at > category.updated_at).toBe(true);
  });

  it('should throw error when category does not exist', async () => {
    const input: UpdateCategoryInput = {
      id: 99999,
      name: 'Non-existent Category'
    };

    await expect(updateCategory(input)).rejects.toThrow(/Category with id 99999 not found/i);
  });

  it('should handle unique constraint violation for slug', async () => {
    // Create two categories
    const category1 = await createTestCategory();
    await db.insert(categoriesTable)
      .values({
        name: 'Second Category',
        slug: 'second-category',
        description: null
      })
      .execute();

    // Try to update category1 with the slug of category2
    const input: UpdateCategoryInput = {
      id: category1.id,
      slug: 'second-category'
    };

    await expect(updateCategory(input)).rejects.toThrow();
  });

  it('should update only updated_at when no other fields provided', async () => {
    const category = await createTestCategory();
    const originalUpdatedAt = category.updated_at;
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const input: UpdateCategoryInput = {
      id: category.id
    };

    const result = await updateCategory(input);

    expect(result.id).toEqual(category.id);
    expect(result.name).toEqual('Original Category'); // Unchanged
    expect(result.slug).toEqual('original-category'); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});