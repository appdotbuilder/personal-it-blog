import { db } from '../db';
import { categoriesTable, articlesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteCategory(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Check if category exists first
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error(`Category with id ${input.id} not found`);
    }

    // Check if category has any articles using it (foreign key constraint check)
    const articlesUsingCategory = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.category_id, input.id))
      .execute();

    if (articlesUsingCategory.length > 0) {
      throw new Error(`Cannot delete category: ${articlesUsingCategory.length} article(s) are using this category`);
    }

    // Delete the category
    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}