import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { ArrowLeft, Calendar, Edit } from 'lucide-react';
import type { StaticPage } from '../../../server/src/schema';

interface StaticPageViewProps {
  slug: string;
  onNavigate: (route: any) => void;
}

export function StaticPageView({ slug, onNavigate }: StaticPageViewProps) {
  const [page, setPage] = useState<StaticPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const pageData = await trpc.getStaticPageBySlug.query({ slug });
      
      if (!pageData) {
        setError('Halaman tidak ditemukan');
        return;
      }

      setPage(pageData);
      
      // Update document title and meta tags for SEO
      document.title = pageData.seo_title || pageData.title;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', pageData.seo_description || 'IT Blog halaman statis');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = pageData.seo_description || 'IT Blog halaman statis';
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
      
    } catch (error) {
      console.error('Failed to load page:', error);
      setError('Gagal memuat halaman');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-muted-foreground">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => onNavigate({ type: 'home' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  // Default content for common static pages if content is empty
  const getDefaultContent = (slug: string) => {
    switch (slug) {
      case 'tentang':
        return `# Tentang IT Blog

Selamat datang di IT Blog pribadi saya! 👋

## Siapa Saya?
Saya adalah seorang developer yang passionate dengan teknologi dan selalu ingin berbagi pengetahuan.

## Apa yang Akan Anda Temukan di Sini?
- Tutorial programming dan development
- Tips & tricks seputar teknologi
- Review tools dan framework terbaru
- Pengalaman dan pembelajaran dalam dunia IT

## Misi
Berbagi pengetahuan dan membantu sesama developer untuk terus belajar dan berkembang.

---
*Blog ini dibuat dengan ❤️ menggunakan React, TypeScript, dan tRPC.*`;

      case 'kontak':
        return `# Kontak

Ingin berdiskusi atau berkolaborasi? Jangan ragu untuk menghubungi saya! 📫

## Cara Menghubungi
- **Email**: your-email@example.com
- **LinkedIn**: [LinkedIn Profile](https://linkedin.com)
- **GitHub**: [GitHub Profile](https://github.com)
- **Twitter**: [@yourusername](https://twitter.com)

## Topik yang Bisa Didiskusikan
- Konsultasi teknologi
- Kolaborasi proyek
- Sharing session
- Mentoring

## Waktu Respons
Biasanya saya merespons dalam 24-48 jam. Untuk urgent matters, silakan mention di Twitter.

---
*Terima kasih telah mengunjungi blog ini! 🙏*`;

      default:
        return page.content;
    }
  };

  const displayContent = page.content.trim() || getDefaultContent(slug);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => onNavigate({ type: 'home' })}
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            
            {/* Admin can edit pages */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate({ type: 'edit-static-page', id: page.id })}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {slug === 'tentang' && '👋 '}
              {slug === 'kontak' && '📧 '}
              {page.title}
            </h1>
            
            <div className="text-muted-foreground flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Terakhir diperbarui: {formatDate(page.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap leading-relaxed text-foreground">
                  {displayContent}
                </div>
              </div>
              
              {!page.content.trim() && (
                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Konten default ditampilkan. Silakan edit halaman ini untuk menambahkan konten kustom.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}