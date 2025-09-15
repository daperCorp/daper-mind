
import { notFound } from 'next/navigation';
import { getIdeaById } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OutlineDisplay } from '@/components/outline-display';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';

export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const { data: idea, error } = await getIdeaById(params.id);

  if (error || !idea) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-primary">{idea.title}</h1>
            <p className="text-muted-foreground">
                Created on {idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : 'N/A'}
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><Share2 className="mr-2" /> Share</Button>
            <Button><Download className="mr-2" /> Export</Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{idea.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outline</CardTitle>
        </CardHeader>
        <CardContent>
          <OutlineDisplay outline={idea.outline} />
        </CardContent>
      </Card>
    </div>
  );
}
