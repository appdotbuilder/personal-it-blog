import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { ArrowLeft, Plus, Edit, Trash2, Tag, Save, X } from 'lucide-react';
import type { Tag as TagType, CreateTagInput, UpdateTagInput } from '../../../server/src/schema';

interface TagManagerProps {
  onBack: () => void;
}

export function TagManager({ onBack }: TagManagerProps) {
  const [tags, setTags] = useState<TagType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<CreateTagInput>({
    name: '',
    slug: ''
  });

  const loadTags = useCallback(async () => {
    try {
      const tagsData = await trpc.getTags.query();
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData((prev: CreateTagInput) => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: ''
    });
    setEditingTag(null);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('Nama dan slug tag harus diisi');
      return;
    }

    setIsLoading(true);
    try {
      const newTag = await trpc.createTag.mutate(formData);
      setTags((prev: TagType[]) => [...prev, newTag]);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Gagal membuat tag');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTag || !formData.name.trim() || !formData.slug.trim()) {
      alert('Nama dan slug tag harus diisi');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdateTagInput = {
        id: editingTag.id,
        name: formData.name,
        slug: formData.slug
      };
      
      const updatedTag = await trpc.updateTag.mutate(updateData);
      setTags((prev: TagType[]) =>
        prev.map((tag: TagType) => tag.id === editingTag.id ? updatedTag : tag)
      );
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to update tag:', error);
      alert('Gagal mengupdate tag');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tag ini?')) return;

    try {
      await trpc.deleteTag.mutate({ id });
      setTags((prev: TagType[]) => prev.filter((tag: TagType) => tag.id !== id));
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Gagal menghapus tag');
    }
  };

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTagColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Tag className="h-8 w-8" />
              <span>🏷️ Kelola Tag</span>
            </h1>
            <p className="text-muted-foreground mt-2">Atur tag untuk kategorisasi artikel</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Edit Tag' : 'Tambah Tag Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Tag *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
                  placeholder="Contoh: JavaScript"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData((prev: CreateTagInput) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="javascript"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  URL: /tag/{formData.slug}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleDialogClose} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                <Button
                  onClick={editingTag ? handleUpdate : handleCreate}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Menyimpan...' : (editingTag ? 'Update' : 'Simpan')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags List */}
      {tags.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Belum Ada Tag</h3>
            <p className="text-muted-foreground mb-6">
              Buat tag untuk memudahkan kategorisasi dan pencarian artikel
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tag Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tags Grid */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>🏷️ Semua Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {tags.map((tag: TagType, index: number) => (
                  <div key={tag.id} className="group relative">
                    <Badge 
                      className={`text-sm py-1 px-3 cursor-pointer transition-all hover:scale-105 ${getTagColor(index)}`}
                    >
                      {tag.name}
                    </Badge>
                    
                    {/* Action buttons on hover */}
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(tag)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full transition-colors"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags Table */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Detail Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tags.map((tag: TagType, index: number) => (
                  <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Badge className={`${getTagColor(index)}`}>
                        {tag.name}
                      </Badge>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Slug: <code className="bg-muted px-1 py-0.5 rounded">{tag.slug}</code></p>
                        <p>Dibuat: {formatDate(tag.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(tag.id)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Stats */}
      {tags.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📊 Statistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{tags.length}</div>
                <div className="text-sm text-muted-foreground">Total Tag</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(tags.length / Math.max(1, Math.ceil(tags.length / 10)) * 10)}%
                </div>
                <div className="text-sm text-muted-foreground">Tingkat Penggunaan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {tags.length > 0 ? (() => {
                    const latestTag = tags.reduce((latest: TagType, current: TagType) => 
                      latest.created_at.getTime() > current.created_at.getTime() ? latest : current
                    );
                    return formatDate(latestTag.created_at);
                  })() : '-'}
                </div>
                <div className="text-sm text-muted-foreground">Terakhir Dibuat</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {tags.length > 0 && (
        <Card className="mt-8 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center space-x-2">
              <span>💡</span>
              <span>Tips Penggunaan Tag</span>
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Gunakan tag yang spesifik dan relevan dengan konten</li>
              <li>• Hindari membuat terlalu banyak tag serupa</li>
              <li>• Tag yang konsisten membantu pembaca menemukan konten</li>
              <li>• Maksimal 5-8 tag per artikel untuk hasil optimal</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}