import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type GetStaticPageBySlugInput } from '../schema';
import { getStaticPageBySlug } from '../handlers/get_static_page_by_slug';

describe('getStaticPageBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return static page when slug exists', async () => {
    // Create test static page
    const insertResult = await db.insert(staticPagesTable)
      .values({
        slug: 'about-us',
        title: 'About Us',
        content: 'This is our about page content.',
        seo_title: 'About Us - Company',
        seo_description: 'Learn more about our company'
      })
      .returning()
      .execute();

    const testInput: GetStaticPageBySlugInput = {
      slug: 'about-us'
    };

    const result = await getStaticPageBySlug(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertResult[0].id);
    expect(result!.slug).toEqual('about-us');
    expect(result!.title).toEqual('About Us');
    expect(result!.content).toEqual('This is our about page content.');
    expect(result!.seo_title).toEqual('About Us - Company');
    expect(result!.seo_description).toEqual('Learn more about our company');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when slug does not exist', async () => {
    const testInput: GetStaticPageBySlugInput = {
      slug: 'non-existent-page'
    };

    const result = await getStaticPageBySlug(testInput);

    expect(result).toBeNull();
  });

  it('should handle static page with nullable fields', async () => {
    // Create test static page with minimal required fields
    await db.insert(staticPagesTable)
      .values({
        slug: 'contact',
        title: 'Contact Us',
        content: 'Get in touch with us.'
        // seo_title and seo_description are nullable and omitted
      })
      .execute();

    const testInput: GetStaticPageBySlugInput = {
      slug: 'contact'
    };

    const result = await getStaticPageBySlug(testInput);

    expect(result).not.toBeNull();
    expect(result!.slug).toEqual('contact');
    expect(result!.title).toEqual('Contact Us');
    expect(result!.content).toEqual('Get in touch with us.');
    expect(result!.seo_title).toBeNull();
    expect(result!.seo_description).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should be case sensitive for slug matching', async () => {
    // Create test static page
    await db.insert(staticPagesTable)
      .values({
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        content: 'Our privacy policy content.'
      })
      .execute();

    const testInput: GetStaticPageBySlugInput = {
      slug: 'Privacy-Policy' // Different case
    };

    const result = await getStaticPageBySlug(testInput);

    expect(result).toBeNull();
  });

  it('should handle special characters in slug correctly', async () => {
    // Create test static page with slug containing allowed special characters
    await db.insert(staticPagesTable)
      .values({
        slug: 'terms-and-conditions-2024',
        title: 'Terms and Conditions 2024',
        content: 'Updated terms and conditions for 2024.'
      })
      .execute();

    const testInput: GetStaticPageBySlugInput = {
      slug: 'terms-and-conditions-2024'
    };

    const result = await getStaticPageBySlug(testInput);

    expect(result).not.toBeNull();
    expect(result!.slug).toEqual('terms-and-conditions-2024');
    expect(result!.title).toEqual('Terms and Conditions 2024');
  });

  it('should return only one result when multiple pages exist', async () => {
    // Create multiple test static pages
    await db.insert(staticPagesTable)
      .values([
        {
          slug: 'faq',
          title: 'Frequently Asked Questions',
          content: 'FAQ content here.'
        },
        {
          slug: 'help',
          title: 'Help Center',
          content: 'Help content here.'
        }
      ])
      .execute();

    const testInput: GetStaticPageBySlugInput = {
      slug: 'faq'
    };

    const result = await getStaticPageBySlug(testInput);

    expect(result).not.toBeNull();
    expect(result!.slug).toEqual('faq');
    expect(result!.title).toEqual('Frequently Asked Questions');
  });
});