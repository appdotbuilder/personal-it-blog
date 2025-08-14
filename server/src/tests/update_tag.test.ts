import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type UpdateTagInput } from '../schema';
import { updateTag } from '../handlers/update_tag';
import { eq } from 'drizzle-orm';

describe('updateTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test tag
  const createTestTag = async () => {
    const result = await db.insert(tagsTable)
      .values({
        name: 'Original Tag',
        slug: 'original-tag'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update a tag with all fields', async () => {
    const testTag = await createTestTag();
    
    const updateInput: UpdateTagInput = {
      id: testTag.id,
      name: 'Updated Tag Name',
      slug: 'updated-tag-slug'
    };

    const result = await updateTag(updateInput);

    expect(result.id).toEqual(testTag.id);
    expect(result.name).toEqual('Updated Tag Name');
    expect(result.slug).toEqual('updated-tag-slug');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTag.updated_at).toBe(true);
  });

  it('should update only the name field', async () => {
    const testTag = await createTestTag();
    
    const updateInput: UpdateTagInput = {
      id: testTag.id,
      name: 'New Name Only'
    };

    const result = await updateTag(updateInput);

    expect(result.id).toEqual(testTag.id);
    expect(result.name).toEqual('New Name Only');
    expect(result.slug).toEqual('original-tag'); // Should remain unchanged
    expect(result.created_at).toEqual(testTag.created_at);
    expect(result.updated_at > testTag.updated_at).toBe(true);
  });

  it('should update only the slug field', async () => {
    const testTag = await createTestTag();
    
    const updateInput: UpdateTagInput = {
      id: testTag.id,
      slug: 'new-slug-only'
    };

    const result = await updateTag(updateInput);

    expect(result.id).toEqual(testTag.id);
    expect(result.name).toEqual('Original Tag'); // Should remain unchanged
    expect(result.slug).toEqual('new-slug-only');
    expect(result.created_at).toEqual(testTag.created_at);
    expect(result.updated_at > testTag.updated_at).toBe(true);
  });

  it('should save updated tag to database', async () => {
    const testTag = await createTestTag();
    
    const updateInput: UpdateTagInput = {
      id: testTag.id,
      name: 'Database Test Tag',
      slug: 'database-test-tag'
    };

    await updateTag(updateInput);

    // Verify changes are persisted in database
    const updatedTags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, testTag.id))
      .execute();

    expect(updatedTags).toHaveLength(1);
    expect(updatedTags[0].name).toEqual('Database Test Tag');
    expect(updatedTags[0].slug).toEqual('database-test-tag');
    expect(updatedTags[0].updated_at > testTag.updated_at).toBe(true);
  });

  it('should throw error when tag does not exist', async () => {
    const updateInput: UpdateTagInput = {
      id: 999999, // Non-existent ID
      name: 'Non-existent Tag'
    };

    await expect(updateTag(updateInput)).rejects.toThrow(/Tag with id 999999 not found/i);
  });

  it('should handle unique constraint violation for slug', async () => {
    // Create two tags
    const tag1 = await createTestTag();
    const tag2 = await db.insert(tagsTable)
      .values({
        name: 'Second Tag',
        slug: 'second-tag'
      })
      .returning()
      .execute();

    const updateInput: UpdateTagInput = {
      id: tag2[0].id,
      slug: 'original-tag' // Try to use tag1's slug
    };

    await expect(updateTag(updateInput)).rejects.toThrow();
  });

  it('should update updated_at timestamp even with no field changes', async () => {
    const testTag = await createTestTag();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateTagInput = {
      id: testTag.id
    };

    const result = await updateTag(updateInput);

    expect(result.id).toEqual(testTag.id);
    expect(result.name).toEqual(testTag.name);
    expect(result.slug).toEqual(testTag.slug);
    expect(result.created_at).toEqual(testTag.created_at);
    expect(result.updated_at > testTag.updated_at).toBe(true);
  });
});