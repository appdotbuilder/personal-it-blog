import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type CreateStaticPageInput } from '../schema';
import { createStaticPage } from '../handlers/create_static_page';
import { eq } from 'drizzle-orm';

// Test input for a basic static page
const testInput: CreateStaticPageInput = {
  slug: 'about-us',
  title: 'About Us',
  content: 'This is our about page content with detailed information about our company.',
  seo_title: 'About Our Company - Learn More',
  seo_description: 'Learn more about our company, our mission, and our team.'
};

// Test input with minimal required fields only
const minimalInput: CreateStaticPageInput = {
  slug: 'contact',
  title: 'Contact Us',
  content: 'Get in touch with us.',
  seo_title: null,
  seo_description: null
};

describe('createStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a static page with all fields', async () => {
    const result = await createStaticPage(testInput);

    // Verify all fields are correctly set
    expect(result.slug).toEqual('about-us');
    expect(result.title).toEqual('About Us');
    expect(result.content).toEqual(testInput.content);
    expect(result.seo_title).toEqual('About Our Company - Learn More');
    expect(result.seo_description).toEqual('Learn more about our company, our mission, and our team.');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a static page with minimal required fields', async () => {
    const result = await createStaticPage(minimalInput);

    // Verify required fields are set
    expect(result.slug).toEqual('contact');
    expect(result.title).toEqual('Contact Us');
    expect(result.content).toEqual('Get in touch with us.');
    expect(result.seo_title).toBeNull();
    expect(result.seo_description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save static page to database', async () => {
    const result = await createStaticPage(testInput);

    // Query the database to verify the static page was saved
    const staticPages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, result.id))
      .execute();

    expect(staticPages).toHaveLength(1);
    const savedPage = staticPages[0];
    expect(savedPage.slug).toEqual('about-us');
    expect(savedPage.title).toEqual('About Us');
    expect(savedPage.content).toEqual(testInput.content);
    expect(savedPage.seo_title).toEqual('About Our Company - Learn More');
    expect(savedPage.seo_description).toEqual('Learn more about our company, our mission, and our team.');
    expect(savedPage.created_at).toBeInstanceOf(Date);
    expect(savedPage.updated_at).toBeInstanceOf(Date);
  });

  it('should handle unique slug constraint violation', async () => {
    // Create first static page
    await createStaticPage(testInput);

    // Try to create another static page with the same slug
    const duplicateInput: CreateStaticPageInput = {
      slug: 'about-us', // Same slug as testInput
      title: 'Another About Page',
      content: 'Different content',
      seo_title: null,
      seo_description: null
    };

    // Should throw an error due to unique constraint
    await expect(createStaticPage(duplicateInput)).rejects.toThrow();
  });

  it('should create multiple static pages with different slugs', async () => {
    const aboutInput: CreateStaticPageInput = {
      slug: 'about',
      title: 'About',
      content: 'About page content',
      seo_title: null,
      seo_description: null
    };

    const contactInput: CreateStaticPageInput = {
      slug: 'contact',
      title: 'Contact',
      content: 'Contact page content',
      seo_title: null,
      seo_description: null
    };

    const privacyInput: CreateStaticPageInput = {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: 'Privacy policy content',
      seo_title: 'Privacy Policy - Our Commitment to Your Privacy',
      seo_description: 'Read our privacy policy to understand how we protect your data.'
    };

    // Create all three pages
    const aboutPage = await createStaticPage(aboutInput);
    const contactPage = await createStaticPage(contactInput);
    const privacyPage = await createStaticPage(privacyInput);

    // Verify all pages were created with unique IDs
    expect(aboutPage.id).toBeDefined();
    expect(contactPage.id).toBeDefined();
    expect(privacyPage.id).toBeDefined();
    expect(aboutPage.id).not.toEqual(contactPage.id);
    expect(contactPage.id).not.toEqual(privacyPage.id);

    // Verify all pages are in the database
    const allPages = await db.select().from(staticPagesTable).execute();
    expect(allPages).toHaveLength(3);

    const slugs = allPages.map(page => page.slug).sort();
    expect(slugs).toEqual(['about', 'contact', 'privacy-policy']);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createStaticPage(testInput);
    const afterCreate = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // created_at and updated_at should be the same for new records
    expect(result.created_at.getTime()).toEqual(result.updated_at.getTime());
  });
});