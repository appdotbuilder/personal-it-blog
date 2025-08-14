import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Technology',
  slug: 'technology',
  description: 'Articles about technology and programming'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Technology');
    expect(result.slug).toEqual('technology');
    expect(result.description).toEqual('Articles about technology and programming');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Technology');
    expect(categories[0].slug).toEqual('technology');
    expect(categories[0].description).toEqual('Articles about technology and programming');
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create category with null description', async () => {
    const inputWithNullDescription: CreateCategoryInput = {
      name: 'Sports',
      slug: 'sports',
      description: null
    };

    const result = await createCategory(inputWithNullDescription);

    expect(result.name).toEqual('Sports');
    expect(result.slug).toEqual('sports');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].description).toBeNull();
  });

  it('should handle duplicate slug errors', async () => {
    // Create first category
    await createCategory(testInput);

    // Attempt to create another category with same slug
    const duplicateInput: CreateCategoryInput = {
      name: 'Tech News',
      slug: 'technology', // Same slug as first category
      description: 'Latest technology news'
    };

    await expect(createCategory(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should create multiple categories with different slugs', async () => {
    const firstCategory = await createCategory(testInput);
    
    const secondInput: CreateCategoryInput = {
      name: 'Sports',
      slug: 'sports',
      description: 'Sports and fitness articles'
    };
    
    const secondCategory = await createCategory(secondInput);

    // Verify both categories exist
    expect(firstCategory.id).not.toEqual(secondCategory.id);
    expect(firstCategory.slug).toEqual('technology');
    expect(secondCategory.slug).toEqual('sports');

    // Verify in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
  });

  it('should generate timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createCategory(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});