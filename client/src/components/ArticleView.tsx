import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { ArrowLeft, Calendar, Folder, Tag, Clock, User } from 'lucide-react';
import type { ArticleWithRelations } from '../../../server/src/schema';

interface ArticleViewProps {
  slug: string;
  onNavigate: (route: any) => void;
}

export function ArticleView({ slug, onNavigate }: ArticleViewProps) {
  const [article, setArticle] = useState<ArticleWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const articleData = await trpc.getArticleBySlug.query({ slug });
      
      // Check if article exists and is published (for public view)
      if (!articleData) {
        setError('Artikel tidak ditemukan');
        return;
      }
      
      if (articleData.status !== 'published') {
        setError('Artikel ini belum dipublikasi');
        return;
      }

      setArticle(articleData);
      
      // Update document title and meta tags for SEO
      document.title = articleData.seo_title || articleData.title;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', articleData.seo_description || articleData.excerpt || 'IT Blog artikel');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = articleData.seo_description || articleData.excerpt || 'IT Blog artikel';
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
      
    } catch (error) {
      console.error('Failed to load article:', error);
      setError('Gagal memuat artikel');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-muted-foreground">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold mb-2">Artikel Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => onNavigate({ type: 'home' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Cover Image */}
      <div className="relative">
        {article.cover_image ? (
          <div className="h-64 md:h-96 bg-gradient-to-b from-transparent to-background/50 overflow-hidden">
            <img 
              src={article.cover_image} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-32 md:h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center">
            <div className="text-4xl md:text-6xl text-white">💻</div>
          </div>
        )}
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button
            variant="secondary"
            onClick={() => onNavigate({ type: 'home' })}
            className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <article className="space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  {article.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(article.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{getReadingTime(article.content)} menit baca</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Folder className="h-4 w-4" />
                    <span>{article.category.name}</span>
                  </div>
                </div>

                {/* Excerpt */}
                {article.excerpt && (
                  <div className="text-lg text-muted-foreground italic border-l-4 border-blue-500 pl-4 py-2 bg-muted/30 rounded-r-md">
                    {article.excerpt}
                  </div>
                )}
              </div>

              <Separator />

              {/* Content */}
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap leading-relaxed text-foreground">
                  {article.content}
                </div>
              </div>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center space-x-2">
                      <Tag className="h-4 w-4" />
                      <span>Tag</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </article>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Article Info Card */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">📊 Info Artikel</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dipublikasi:</span>
                      <span>{formatDate(article.created_at)}</span>
                    </div>
                    
                    {article.updated_at.getTime() !== article.created_at.getTime() && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Diperbarui:</span>
                        <span>{formatDate(article.updated_at)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Waktu baca:</span>
                      <span>{getReadingTime(article.content)} menit</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kata:</span>
                      <span>{article.content.split(' ').length}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">📁 Kategori</h3>
                  <Badge variant="outline" className="w-full justify-center">
                    {article.category.name}
                  </Badge>
                </div>
                
                {article.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">🏷️ Tag</h3>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Share Card */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">🔗 Bagikan Artikel</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const url = window.location.href;
                      navigator.clipboard.writeText(url);
                      alert('Link artikel disalin!');
                    }}
                  >
                    📋 Salin Link
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(`Baca artikel: ${article.title}`);
                      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                    }}
                  >
                    🐦 Tweet
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                    }}
                  >
                    📘 Facebook
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}