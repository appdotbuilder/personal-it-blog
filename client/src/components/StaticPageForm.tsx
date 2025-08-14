import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { Save, ArrowLeft, FileType } from 'lucide-react';
import type { 
  CreateStaticPageInput, 
  UpdateStaticPageInput, 
  StaticPage 
} from '../../../server/src/schema';

interface StaticPageFormProps {
  pageId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StaticPageForm({ pageId, onSuccess, onCancel }: StaticPageFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateStaticPageInput>({
    slug: '',
    title: '',
    content: '',
    seo_title: null,
    seo_description: null
  });

  const isEditing = Boolean(pageId);

  const loadPageData = useCallback(async () => {
    if (isEditing && pageId) {
      try {
        // Since we don't have a direct getStaticPage query, we'll use getStaticPages and find the one
        const pagesData = await trpc.getStaticPages.query();
        const page = pagesData.find((p: StaticPage) => p.id === pageId);
        
        if (page) {
          setFormData({
            slug: page.slug,
            title: page.title,
            content: page.content,
            seo_title: page.seo_title,
            seo_description: page.seo_description
          });
        }
      } catch (error) {
        console.error('Failed to load page data:', error);
      }
    }
  }, [isEditing, pageId]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev: CreateStaticPageInput) => ({
      ...prev,
      title,
      slug: isEditing ? prev.slug : generateSlug(title) // Don't auto-update slug when editing
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.slug.trim()) {
      alert('Mohon lengkapi judul, slug, dan konten halaman');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && pageId) {
        const updateData: UpdateStaticPageInput = {
          id: pageId,
          ...formData
        };
        await trpc.updateStaticPage.mutate(updateData);
      } else {
        await trpc.createStaticPage.mutate(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save static page:', error);
      alert('Gagal menyimpan halaman');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? '✏️ Edit Halaman Statis' : '📄 Buat Halaman Statis Baru'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileType className="h-5 w-5" />
                  <span>Konten Halaman</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul Halaman *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTitleChange(e.target.value)}
                    placeholder="Masukkan judul halaman..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData((prev: CreateStaticPageInput) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="url-halaman-ini"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    URL: /page/{formData.slug}
                  </p>
                </div>

                <div>
                  <Label htmlFor="content">Konten Halaman *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setFormData((prev: CreateStaticPageInput) => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="Tulis konten halaman Anda di sini..."
                    rows={15}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Anda bisa menggunakan Markdown untuk formatting.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO Section */}
            <Card>
              <CardHeader>
                <CardTitle>🔍 SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData((prev: CreateStaticPageInput) => ({ ...prev, seo_title: e.target.value || null }))
                    }
                    placeholder="Custom SEO title (default: judul halaman)"
                  />
                </div>

                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setFormData((prev: CreateStaticPageInput) => ({ ...prev, seo_description: e.target.value || null }))
                    }
                    placeholder="Deskripsi untuk meta tag (160 karakter)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Save Actions */}
            <Card>
              <CardHeader>
                <CardTitle>💾 Simpan Halaman</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Menyimpan...' : (isEditing ? 'Update Halaman' : 'Simpan Halaman')}
                </Button>

                <Separator />

                <p className="text-sm text-muted-foreground">
                  {isEditing 
                    ? 'Halaman akan langsung diperbarui setelah disimpan.'
                    : 'Halaman akan langsung tersedia setelah disimpan.'
                  }
                </p>
              </CardContent>
            </Card>

            {/* Page Info */}
            <Card>
              <CardHeader>
                <CardTitle>ℹ️ Info Halaman</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Tipe:</span> Halaman Statis
                </div>
                
                {formData.slug && (
                  <div className="text-sm">
                    <span className="font-medium">URL:</span>
                    <code className="ml-2 bg-muted px-1 py-0.5 rounded text-xs">
                      /page/{formData.slug}
                    </code>
                  </div>
                )}

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Halaman statis cocok untuk konten yang jarang berubah</p>
                  <p>• Ideal untuk halaman About, Contact, Privacy Policy</p>
                  <p>• Otomatis ter-index oleh search engine</p>
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            {!isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>📝 Template Cepat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      title: 'Tentang',
                      slug: 'tentang',
                      content: `# Tentang Saya

Selamat datang di blog pribadi saya! 👋

## Siapa Saya?
[Tulis tentang diri Anda]

## Pengalaman
[Tulis pengalaman Anda]

## Keahlian
[Tulis keahlian Anda]

## Kontak
[Informasi kontak]`
                    }))}
                  >
                    📋 Template "Tentang"
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      title: 'Kontak',
                      slug: 'kontak',
                      content: `# Kontak

Ingin berdiskusi atau berkolaborasi? 📧

## Cara Menghubungi
- Email: your-email@example.com
- LinkedIn: [Your LinkedIn]
- GitHub: [Your GitHub]
- Twitter: @yourusername

## Waktu Respons
Biasanya merespons dalam 24-48 jam.

---
Terima kasih! 🙏`
                    }))}
                  >
                    📧 Template "Kontak"
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}