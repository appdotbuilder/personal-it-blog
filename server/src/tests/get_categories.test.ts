import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

const testCategories: CreateCategoryInput[] = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Articles about technology and innovation'
  },
  {
    name: 'Business',
    slug: 'business', 
    description: 'Business and entrepreneurship content'
  },
  {
    name: 'Design',
    slug: 'design',
    description: null
  }
];

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values(testCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify all categories are returned with correct data
    const categoryNames = result.map(c => c.name);
    expect(categoryNames).toContain('Technology');
    expect(categoryNames).toContain('Business');
    expect(categoryNames).toContain('Design');

    // Check that all required fields are present
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.slug).toBeDefined();
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return categories ordered by name', async () => {
    // Insert categories in non-alphabetical order
    await db.insert(categoriesTable)
      .values([
        { name: 'Zebra', slug: 'zebra', description: null },
        { name: 'Alpha', slug: 'alpha', description: null },
        { name: 'Beta', slug: 'beta', description: null }
      ])
      .execute();

    const result = await getCategories();

    // Verify alphabetical ordering
    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Alpha');
    expect(result[1].name).toEqual('Beta');
    expect(result[2].name).toEqual('Zebra');
  });

  it('should handle categories with null descriptions', async () => {
    await db.insert(categoriesTable)
      .values([
        { name: 'With Description', slug: 'with-desc', description: 'Has description' },
        { name: 'No Description', slug: 'no-desc', description: null }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    
    const withDesc = result.find(c => c.name === 'With Description');
    const noDesc = result.find(c => c.name === 'No Description');
    
    expect(withDesc?.description).toEqual('Has description');
    expect(noDesc?.description).toBeNull();
  });

  it('should return categories with correct field types', async () => {
    await db.insert(categoriesTable)
      .values([testCategories[0]])
      .execute();

    const result = await getCategories();
    const category = result[0];

    expect(typeof category.id).toBe('number');
    expect(typeof category.name).toBe('string');
    expect(typeof category.slug).toBe('string');
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.updated_at).toBeInstanceOf(Date);
    // Description can be string or null
    expect(typeof category.description === 'string' || category.description === null).toBe(true);
  });

  it('should handle large number of categories', async () => {
    // Create many categories to test performance
    const manyCategories = Array.from({ length: 50 }, (_, i) => ({
      name: `Category ${i.toString().padStart(2, '0')}`,
      slug: `category-${i.toString().padStart(2, '0')}`,
      description: i % 2 === 0 ? `Description for category ${i}` : null
    }));

    await db.insert(categoriesTable)
      .values(manyCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(50);
    
    // Verify ordering is maintained with many items
    for (let i = 1; i < result.length; i++) {
      expect(result[i-1].name.localeCompare(result[i].name)).toBeLessThanOrEqual(0);
    }
  });
});