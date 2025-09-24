
'use client';

import type { MindMapNode as MindMapNodeType } from '@/ai/flows/generate-idea-mindmap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, LoaderCircle, MoreVertical, BrainCircuit, Edit, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, forwardRef } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

// Use a more specific name to avoid conflict with the component name
type NodeData = MindMapNodeType & { children?: NodeData[] };

interface MindMapDisplayProps {
  mindMap: NodeData;
  onExpandNode: (nodePath: string, existingChildren: { title: string }[]) => Promise<void>;
  onAddNode: (mode: 'add' | 'edit', nodePath: string, defaultValue?: string) => void;
  onEditNode: (mode: 'add' | 'edit', nodePath: string, defaultValue?: string) => void;
  onDeleteNode: (nodePath: string) => void;
  isProcessing: boolean;
}

interface MindMapNodeProps {
  node: NodeData;
  level: number;
  path: string;
  isLast: boolean;
  onExpandNode: (nodePath: string, existingChildren: { title: string }[]) => Promise<void>;
  onAddNode: (mode: 'add' | 'edit', nodePath: string, defaultValue?: string) => void;
  onEditNode: (mode: 'add' | 'edit', nodePath: string, defaultValue?: string) => void;
  onDeleteNode: (nodePath: string) => void;
  isProcessing: boolean;
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

function MindMapNode({ node, level, path, isLast, onExpandNode, onAddNode, onEditNode, onDeleteNode, isProcessing }: MindMapNodeProps) {
  const [processingNode, setProcessingNode] = useState<string | null>(null);
  const hasChildren = node.children && node.children.length > 0;
  const cardColor = levelColors[level] || levelColors[levelColors.length - 1];
  const isMobile = useIsMobile();
  
  const handleExpandClick = () => {
    setProcessingNode(path);
    onExpandNode(path, node.children || []).finally(() => {
      setProcessingNode(null);
    });
  };

  const isCurrentlyProcessing = isProcessing && processingNode === path;
  const isRootNode = level === 0;

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
      <div className={cn("flex flex-col items-center self-stretch", isMobile ? "mr-2" : "mr-4")}>
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
            <CardContent className="p-3 pr-2 flex items-center gap-2">
                <p className="font-medium">{node.title}</p>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" disabled={isCurrentlyProcessing}>
                            {isCurrentlyProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem
  onClick={(e) => {
    e.stopPropagation();     // 여기서 전파 막기
    handleExpandClick();     // 이벤트 인자 없이 호출
  }}
>
  <BrainCircuit className="mr-2 h-4 w-4" />
  <span>Add with AI</span>
</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNode('add', path)}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Add Manually</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditNode('edit', path, node.title)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Node</span>
                        </DropdownMenuItem>
                        {!isRootNode && (
                            <DropdownMenuItem onClick={() => onDeleteNode(path)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Node</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardContent>
        </Card>
        
        {hasChildren && (
          <div className={cn("space-y-3 border-l border-dashed", isMobile ? "pl-2 ml-1.5" : "pl-4 ml-2.5")}>
             <AnimatePresence>
                {node.children!.map((child, index) => (
                <MindMapNode
                    key={`${path}>${child.title}`}
                    node={child}
                    level={level + 1}
                    path={`${path}>${child.title}`}
                    isLast={index === node.children!.length - 1}
                    onExpandNode={onExpandNode}
                    onAddNode={onAddNode}
                    onEditNode={onEditNode}
                    onDeleteNode={onDeleteNode}
                    isProcessing={isProcessing}
                />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const MindMapDisplay = forwardRef<HTMLDivElement, MindMapDisplayProps>(
    ({ mindMap, onExpandNode, onAddNode, onEditNode, onDeleteNode, isProcessing }, ref) => {
    if (!mindMap) {
        return <p className="text-muted-foreground">No mind map generated.</p>;
    }

    return (
        <div ref={ref} className="overflow-x-auto">
            <div className="space-y-2 inline-block">
                <MindMapNode 
                    node={mindMap}
                    level={0}
                    path={mindMap.title}
                    isLast={true}
                    onExpandNode={onExpandNode}
                    onAddNode={onAddNode}
                    onEditNode={onEditNode}
                    onDeleteNode={onDeleteNode}
                    isProcessing={isProcessing}
                />
            </div>
        </div>
    );
});
MindMapDisplay.displayName = 'MindMapDisplay';
