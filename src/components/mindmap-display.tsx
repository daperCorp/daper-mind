
'use client';

import type { MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MindMapDisplayProps {
  mindMap: MindMapNode;
}

interface MindMapNodeProps {
  node: MindMapNode;
  level: number;
  isLast: boolean;
}

const levelColors = [
  'bg-primary/10 border-primary/20 text-primary-foreground',
  'bg-secondary',
  'bg-muted',
];

const connectorColors = [
  'border-primary/50',
  'border-secondary-foreground/30',
  'border-muted-foreground/30',
];

function Node({ node, level, isLast }: MindMapNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const cardColor = levelColors[level] || levelColors[levelColors.length - 1];

  return (
    <div className="relative flex items-start">
      {/* Connector line for children */}
      {hasChildren && (
        <div
          className={cn(
            'absolute left-[5px] top-[44px] w-[2px] h-[calc(100%-44px)]',
            connectorColors[level]
          )}
        />
      )}

      {/* Circle and Horizontal line */}
      <div className="flex flex-col items-center self-stretch mr-4">
        <div
          className={cn(
            'w-3 h-3 rounded-full mt-[16px] border-2',
            connectorColors[level]
          )}
        />
        {!isLast && level > 0 && <div className={cn('w-[2px] grow', connectorColors[level - 1])} />}
      </div>
      
      <div className="flex-1 space-y-2 py-2">
        <Card className={cn("inline-block", cardColor)}>
            <CardContent className="p-2 px-3">
                <p className="font-medium">{node.title}</p>
            </CardContent>
        </Card>
        
        {hasChildren && (
          <div className="space-y-2">
            {node.children!.map((child, index) => (
              <Node
                key={index}
                node={child as MindMapNode}
                level={level + 1}
                isLast={index === node.children!.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MindMapDisplay({ mindMap }: MindMapDisplayProps) {
  if (!mindMap) {
    return <p className="text-muted-foreground">No mind map generated.</p>;
  }

  return (
    <div className="space-y-2">
      <Node node={mindMap} level={0} isLast={true} />
    </div>
  );
}
