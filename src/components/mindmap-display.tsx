'use client';

import type { MindMapNode as MindMapNodeType } from '@/ai/flows/generate-idea-mindmap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, LoaderCircle, MoreVertical, BrainCircuit, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, forwardRef, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

type NodeData = MindMapNodeType & { children?: NodeData[] };

interface MindMapDisplayProps {
  mindMap: NodeData;
  onExpandNode: (nodePath: string, existingChildren: { title: string }[]) => Promise<void>;
  onAddNode: (mode: 'add' | 'edit', nodePath: string, defaultValue?: string) => void;
  onEditNode: (mode: 'add' | 'edit', nodePath: string, defaultValue?: string) => void;
  onDeleteNode: (nodePath: string) => void;
  isProcessing: boolean;
  expandAll?: boolean | null;
  searchQuery?: string;
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
  expandAll?: boolean | null;
  searchQuery?: string;
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

function MindMapNode({
  node, level, path, isLast,
  onExpandNode, onAddNode, onEditNode, onDeleteNode,
  isProcessing, expandAll, searchQuery
}: MindMapNodeProps) {
  const [processingNode, setProcessingNode] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const cardColor = levelColors[level] || levelColors[levelColors.length - 1];
  const isMobile = useIsMobile();

  // 검색어 매칭
  const isMatched = searchQuery && searchQuery.trim() 
    ? node.title.toLowerCase().includes(searchQuery.toLowerCase())
    : false;

  // expandAll prop 변경 시 자동으로 펼침/접기
  useEffect(() => {
    if (expandAll !== null && expandAll !== undefined) {
      setIsExpanded(expandAll);
    }
  }, [expandAll]);

  // 검색어 매칭 시 자동 펼침
  useEffect(() => {
    if (isMatched || (searchQuery && hasChildren)) {
      setIsExpanded(true);
    }
  }, [searchQuery, isMatched, hasChildren]);

  const handleExpandClick = () => {
    setProcessingNode(path);
    onExpandNode(path, node.children || []).finally(() => {
      setProcessingNode(null);
    });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const isCurrentlyProcessing = isProcessing && processingNode === path;
  const isRootNode = level === 0;

  return (
    <motion.div
      className="relative flex items-start mind-map-node"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* 세로 커넥터 */}
      {hasChildren && isExpanded && (
        <div className="absolute left-[10px] top-[52px] w-px h-[calc(100%_-_52px)] bg-border" />
      )}

      {/* 점 + 세로선 */}
      <div className={cn("flex flex-col items-center self-stretch", isMobile ? "mr-2" : "mr-4")}>
        <div className={cn(
          'w-5 h-5 rounded-full mt-[16px] border-2 bg-background',
          connectorColors[level] || connectorColors[connectorColors.length - 1]
        )}/>
        {!isLast && level > 0 && <div className="w-px grow bg-border" />}
      </div>

      <div className="flex-1 space-y-3 py-2">
        <Card className={cn(
          "inline-block transition-all", 
          cardColor, 
          isCurrentlyProcessing && "opacity-70 pointer-events-none",
          isMatched && "ring-2 ring-yellow-400 shadow-lg"
        )}>
          <CardContent className="p-3 pr-2 flex items-center gap-2">
            {/* 펼침/접기 버튼 */}
            {hasChildren && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full flex-shrink-0"
                onClick={toggleExpand}
                disabled={isCurrentlyProcessing}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            <p className={cn(
              "font-medium flex-1",
              isMatched && "text-yellow-700 font-semibold"
            )}>
              {node.title}
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full flex-shrink-0"
                  disabled={isCurrentlyProcessing}
                >
                  {isCurrentlyProcessing
                    ? <LoaderCircle className="h-4 w-4 animate-spin" />
                    : <MoreVertical className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleExpandClick}
                  disabled={isCurrentlyProcessing}
                >
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  <span>Add with AI</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddNode('add', path)} disabled={isCurrentlyProcessing}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Add Manually</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditNode('edit', path, node.title)} disabled={isCurrentlyProcessing}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Node</span>
                </DropdownMenuItem>
                {!isRootNode && (
                  <DropdownMenuItem
                    onClick={() => onDeleteNode(path)}
                    className="text-destructive focus:text-destructive"
                    disabled={isCurrentlyProcessing}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Node</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        {/* 노드 단위 로딩 힌트 */}
        {isCurrentlyProcessing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Generating…
          </div>
        )}

        {/* 자식들 */}
        {hasChildren && isExpanded && (
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
                  expandAll={expandAll}
                  searchQuery={searchQuery}
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
  ({ mindMap, onExpandNode, onAddNode, onEditNode, onDeleteNode, isProcessing, expandAll, searchQuery }, ref) => {
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
            expandAll={expandAll}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    );
  }
);
MindMapDisplay.displayName = 'MindMapDisplay';