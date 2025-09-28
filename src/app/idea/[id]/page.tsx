'use client';

import { useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getIdeaById, GeneratedIdea, toggleFavorite, updateIdeaContent } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OutlineDisplay } from '@/components/outline-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Share2, LocateFixed, ArrowLeft, Star, Edit3, Save, X, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function IdeaDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [idea, setIdea] = useState<GeneratedIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isEditing, setIsEditing] = useState({ title: false, summary: false });
  const [editValues, setEditValues] = useState({ title: '', summary: '' });
  const [showMindMapPreview, setShowMindMapPreview] = useState(false);
  
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];
  const router = useRouter();

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    async function fetchIdea() {
      const { data, error } = await getIdeaById(id);
      if (error || !data) {
        notFound();
      } else {
        setIdea(data);
        setIsFavorited(data.favorited || false);
        setEditValues({ 
          title: data.title || '', 
          summary: data.summary || '' 
        });
      }
      setLoading(false);
    }
    fetchIdea();
  }, [params]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Success', description: t('linkCopied') });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: t('linkCopyError') });
    }
  };

  const handleToggleFavorite = async () => {
    if (!idea?.id) return;
    
    try {
      await toggleFavorite(idea.id, !isFavorited);
      setIsFavorited(!isFavorited);
      toast({
        title: isFavorited ? t('removedFromFavorites') : t('addedToFavorites'),
        description: isFavorited ? t('ideaRemovedFromFavorites') : t('ideaAddedToFavorites')
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('failedToUpdateFavorite')
      });
    }
  };

  const handleEdit = (field: 'title' | 'summary') => {
    setIsEditing(prev => ({ ...prev, [field]: true }));
  };

  const handleSave = async (field: 'title' | 'summary') => {
    if (!idea?.id) return;

    try {
      await updateIdeaContent(idea.id, {
        [field]: editValues[field]
      });
      
      setIdea(prev => prev ? { ...prev, [field]: editValues[field] } : null);
      setIsEditing(prev => ({ ...prev, [field]: false }));
      
      toast({
        title: t('saved'),
        description: t('ideaUpdated')
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('failedToSaveChanges')
      });
    }
  };

  const handleCancel = (field: 'title' | 'summary') => {
    setEditValues(prev => ({ 
      ...prev, 
      [field]: idea?.[field] || '' 
    }));
    setIsEditing(prev => ({ ...prev, [field]: false }));
  };

  const handleExport = (format: 'txt' | 'md') => {
    if (!idea) return;

    let content = '';
    if (format === 'md') {
      content = `# ${idea.title}\n\n## Summary\n${idea.summary}\n\n## Outline\n${idea.outline}`;
    } else {
      content = `${idea.title}\n\n${idea.summary}\n\n${idea.outline}`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea.title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('exported'),
      description: t('ideaExported')
    });
  };

  // 마인드맵 미리보기 컴포넌트
  const MindMapPreview = ({ mindMap }: { mindMap: any }) => {
    if (!mindMap) return <p className="text-muted-foreground">No mind map available</p>;

    const renderNode = (node: any, level = 0) => (
      <div key={node.title} className={cn("ml-4", level === 0 && "ml-0")}>
        <div className={cn(
          "flex items-center gap-2 p-2 rounded border-l-2",
          level === 0 && "border-l-blue-500 bg-blue-50",
          level === 1 && "border-l-green-500 bg-green-50",
          level >= 2 && "border-l-gray-400 bg-gray-50"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            level === 0 && "bg-blue-500",
            level === 1 && "bg-green-500", 
            level >= 2 && "bg-gray-400"
          )} />
          <span className={cn(
            "text-sm",
            level === 0 && "font-semibold text-blue-900",
            level === 1 && "font-medium text-green-800",
            level >= 2 && "text-gray-700"
          )}>
            {node.title}
          </span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="mt-1 space-y-1">
            {node.children.map((child: any) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {renderNode(mindMap)}
      </div>
    );
  };

  if (loading || !idea) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className='flex items-center gap-4 flex-1 min-w-0'>
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            {isEditing.title ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValues.title}
                  onChange={(e) => setEditValues(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl font-bold"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleSave('title')}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCancel('title')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-bold text-primary truncate">{idea.title}</h1>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleEdit('title')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground">
              {t('createdOn')} {idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-shrink-0 gap-2">
          <Button 
            variant="outline" 
            onClick={handleToggleFavorite}
            className={cn(isFavorited && "text-yellow-600")}
          >
            <Star className={cn("mr-2 h-4 w-4", isFavorited && "fill-current")} />
            {isFavorited ? t('favorited') : t('favorite')}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t('export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('md')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            {t('share')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('summary')}</CardTitle>
            {!isEditing.summary && (
              <Button size="sm" variant="ghost" onClick={() => handleEdit('summary')}>
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing.summary ? (
            <div className="space-y-3">
              <Textarea
                value={editValues.summary}
                onChange={(e) => setEditValues(prev => ({ ...prev, summary: e.target.value }))}
                className="min-h-24"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSave('summary')}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('save')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCancel('summary')}>
                  <X className="mr-2 h-4 w-4" />
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">{idea.summary}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('mindMap')}</CardTitle>
          <div className="flex gap-2">
            {idea.mindMap && (
              <Button 
                variant="ghost" 
                onClick={() => setShowMindMapPreview(true)}
              >
                <LocateFixed className="mr-2 h-4 w-4" />
                Preview
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/idea/${idea.id}/mindmap`}>
                <LocateFixed className="mr-2 h-4 w-4" />
                View Full Mind Map
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {idea.mindMap ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                A mind map visualization is available for this idea. Preview it below or view the full interactive version.
              </p>
              <div className="border rounded-lg p-4 bg-gray-50 max-h-48 overflow-hidden">
                <MindMapPreview mindMap={idea.mindMap} />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No mind map available for this idea yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('outline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <OutlineDisplay outline={idea.outline} />
        </CardContent>
      </Card>

      {/* 마인드맵 미리보기 다이얼로그 */}
      <Dialog open={showMindMapPreview} onOpenChange={setShowMindMapPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Mind Map Preview</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-96">
            <MindMapPreview mindMap={idea.mindMap} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}