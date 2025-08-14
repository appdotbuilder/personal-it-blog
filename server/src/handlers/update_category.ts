import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type Category } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof categoriesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update the category
    const result = await db.update(categoriesTable)
      .set(updateData)
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    // Check if category was found and updated
    if (result.length === 0) {
      throw new Error(`Category with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Category update failed:', error);
    throw error;
  }
}