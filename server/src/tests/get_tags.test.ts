import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { getTags } from '../handlers/get_tags';

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getTags();
    
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all tags ordered by name', async () => {
    // Create test tags in non-alphabetical order
    await db.insert(tagsTable)
      .values([
        {
          name: 'Web Development',
          slug: 'web-development'
        },
        {
          name: 'AI',
          slug: 'ai'
        },
        {
          name: 'TypeScript',
          slug: 'typescript'
        },
        {
          name: 'Backend',
          slug: 'backend'
        }
      ])
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(4);
    
    // Verify alphabetical ordering by name
    expect(result[0].name).toBe('AI');
    expect(result[1].name).toBe('Backend');
    expect(result[2].name).toBe('TypeScript');
    expect(result[3].name).toBe('Web Development');
    
    // Verify all required fields are present
    result.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(typeof tag.id).toBe('number');
      expect(tag.name).toBeDefined();
      expect(typeof tag.name).toBe('string');
      expect(tag.slug).toBeDefined();
      expect(typeof tag.slug).toBe('string');
      expect(tag.created_at).toBeInstanceOf(Date);
      expect(tag.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle single tag', async () => {
    // Create single tag
    await db.insert(tagsTable)
      .values({
        name: 'JavaScript',
        slug: 'javascript'
      })
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('JavaScript');
    expect(result[0].slug).toBe('javascript');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should maintain consistent ordering with mixed case names', async () => {
    // Create tags with mixed case
    await db.insert(tagsTable)
      .values([
        {
          name: 'zend',
          slug: 'zend'
        },
        {
          name: 'Angular',
          slug: 'angular'
        },
        {
          name: 'react',
          slug: 'react'
        },
        {
          name: 'Vue.js',
          slug: 'vuejs'
        }
      ])
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(4);
    
    // Verify alphabetical ordering (case-sensitive)
    const names = result.map(tag => tag.name);
    expect(names).toEqual(['Angular', 'Vue.js', 'react', 'zend']);
  });

  it('should return tags with all database fields populated', async () => {
    // Create tag and verify all fields
    const insertResult = await db.insert(tagsTable)
      .values({
        name: 'Node.js',
        slug: 'nodejs'
      })
      .returning()
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(1);
    const tag = result[0];
    
    // Verify field types and values
    expect(tag.id).toBe(insertResult[0].id);
    expect(tag.name).toBe('Node.js');
    expect(tag.slug).toBe('nodejs');
    expect(tag.created_at).toEqual(insertResult[0].created_at);
    expect(tag.updated_at).toEqual(insertResult[0].updated_at);
    
    // Verify timestamps are reasonable (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    expect(tag.created_at >= oneMinuteAgo).toBe(true);
    expect(tag.created_at <= now).toBe(true);
  });
});