
'use client';

import type { MindMapNode as MindMapNodeType } from '@/ai/flows/generate-idea-mindmap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, LoaderCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

// Use a more specific name to avoid conflict with the component name
type NodeData = MindMapNodeType & { children?: NodeData[] };

interface MindMapDisplayProps {
  mindMap: NodeData;
  onExpandNode?: (parentNodeTitle: string, existingChildren: { title: string }[]) => Promise<void>;
  isExpanding?: boolean;
}

interface MindMapNodeProps {
  node: NodeData;
  level: number;
  isLast: boolean;
  onExpandNode?: (parentNodeTitle: string, existingChildren: { title: string }[]) => Promise<void>;
  isExpanding?: boolean;
}

const levelColors = [
  'bg-primary/20 border-primary/30 text-primary-foreground',
  'bg-secondary border-border',
  'bg-card border-border',
  'bg-muted/50 border-border',
];

const connectorColors = [
  'border-primary/50',
  'border-secondary-foreground/30',
  'border-muted-foreground/30',
  'border-muted-foreground/20',
];

const MAX_DEPTH = 4;

function MindMapNode({ node, level, isLast, onExpandNode, isExpanding }: MindMapNodeProps) {
  const [expandingNode, setExpandingNode] = useState<string | null>(null);
  const hasChildren = node.children && node.children.length > 0;
  const cardColor = levelColors[level] || levelColors[levelColors.length - 1];
  const canExpand = level < MAX_DEPTH -1 && onExpandNode; // Can only expand nodes up to the second to last level

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canExpand) {
      setExpandingNode(node.title);
      onExpandNode(node.title, node.children || []).finally(() => {
        setExpandingNode(null);
      });
    }
  };

  const isCurrentlyExpanding = isExpanding && expandingNode === node.title;

  return (
    <motion.div 
      className="relative flex items-start"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Connector line for children */}
      {hasChildren && (
        <div
          className={cn(
            'absolute left-[10px] top-[52px] w-px h-[calc(100%_-_52px)] bg-border',
          )}
        />
      )}

      {/* Circle and Horizontal line */}
      <div className="flex flex-col items-center self-stretch mr-4">
        <div
          className={cn(
            'w-5 h-5 rounded-full mt-[16px] border-2 bg-background',
             connectorColors[level] || connectorColors[connectorColors.length - 1]
          )}
        />
        {!isLast && level > 0 && <div className={cn('w-px grow bg-border')} />}
      </div>
      
      <div className="flex-1 space-y-3 py-2">
        <Card className={cn("inline-block", cardColor)}>
            <CardContent className="p-3 px-4 flex items-center gap-2">
                <p className="font-medium">{node.title}</p>
                 {canExpand && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={handleExpandClick} disabled={isCurrentlyExpanding}>
                    {isCurrentlyExpanding ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                )}
            </CardContent>
        </Card>
        
        {hasChildren && (
          <div className="space-y-3 pl-4 border-l border-dashed ml-2.5">
             <AnimatePresence>
                {node.children!.map((child, index) => (
                <MindMapNode
                    key={`${child.title}-${index}`} // Use a more stable key
                    node={child}
                    level={level + 1}
                    isLast={index === node.children!.length - 1}
                    onExpandNode={onExpandNode}
                    isExpanding={isExpanding}
                />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function MindMapDisplay({ mindMap, onExpandNode, isExpanding }: MindMapDisplayProps) {
  if (!mindMap) {
    return <p className="text-muted-foreground">No mind map generated.</p>;
  }

  return (
    <div className="space-y-2">
      <MindMapNode 
        node={mindMap}
        level={0}
        isLast={true}
        onExpandNode={onExpandNode}
        isExpanding={isExpanding}
      />
    </div>
  );
}
