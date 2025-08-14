import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTagInput = {
  name: 'Test Tag',
  slug: 'test-tag'
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag', async () => {
    const result = await createTag(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Tag');
    expect(result.slug).toEqual('test-tag');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    const result = await createTag(testInput);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Test Tag');
    expect(tags[0].slug).toEqual('test-tag');
    expect(tags[0].created_at).toBeInstanceOf(Date);
    expect(tags[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different tag names and slugs', async () => {
    const alternativeInput: CreateTagInput = {
      name: 'JavaScript Programming',
      slug: 'javascript-programming'
    };

    const result = await createTag(alternativeInput);

    expect(result.name).toEqual('JavaScript Programming');
    expect(result.slug).toEqual('javascript-programming');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle unicode characters in name', async () => {
    const unicodeInput: CreateTagInput = {
      name: 'Programação em JavaScript',
      slug: 'programacao-javascript'
    };

    const result = await createTag(unicodeInput);

    expect(result.name).toEqual('Programação em JavaScript');
    expect(result.slug).toEqual('programacao-javascript');
    expect(result.id).toBeDefined();
  });

  it('should throw error on duplicate slug', async () => {
    // Create first tag
    await createTag(testInput);

    // Try to create another tag with the same slug
    const duplicateInput: CreateTagInput = {
      name: 'Another Tag',
      slug: 'test-tag' // Same slug as first tag
    };

    await expect(createTag(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should allow same name with different slug', async () => {
    // Create first tag
    await createTag(testInput);

    // Create another tag with same name but different slug
    const sameNameInput: CreateTagInput = {
      name: 'Test Tag', // Same name
      slug: 'test-tag-2' // Different slug
    };

    const result = await createTag(sameNameInput);

    expect(result.name).toEqual('Test Tag');
    expect(result.slug).toEqual('test-tag-2');
    expect(result.id).toBeDefined();

    // Verify both tags exist in database
    const allTags = await db.select()
      .from(tagsTable)
      .execute();

    expect(allTags).toHaveLength(2);
    const slugs = allTags.map(tag => tag.slug);
    expect(slugs).toContain('test-tag');
    expect(slugs).toContain('test-tag-2');
  });

  it('should set proper timestamps', async () => {
    const beforeCreate = new Date();
    const result = await createTag(testInput);
    const afterCreate = new Date();

    expect(result.created_at >= beforeCreate).toBe(true);
    expect(result.created_at <= afterCreate).toBe(true);
    expect(result.updated_at >= beforeCreate).toBe(true);
    expect(result.updated_at <= afterCreate).toBe(true);
    
    // For a new record, created_at and updated_at should be very close
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});