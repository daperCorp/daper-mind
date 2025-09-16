
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type OutlineNode = {
  title: string;
  children: OutlineNode[];
};

function parseOutline(text: string): OutlineNode[] {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (!lines.length) return [];

  const getIndent = (line: string) => line.search(/\S|$/);

  const root: OutlineNode = { title: 'root', children: [] };
  const stack: { node: OutlineNode; indent: number }[] = [{ node: root, indent: -1 }];

  for (const line of lines) {
    const indent = getIndent(line);
    const node: OutlineNode = {
      title: line.trim().replace(/^-|\*|\d+\.\s*/g, '').trim(),
      children: [],
    };

    while (stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ node, indent });
  }

  return root.children;
}


function RecursiveAccordion({ nodes }: { nodes: OutlineNode[] }) {
  if (!nodes || nodes.length === 0) {
    return null;
  }
  
  const singleItem = nodes.length === 1;

  return (
    <Accordion type={singleItem ? "single" : "multiple"} {...(singleItem ? { collapsible: true } : {})} className="w-full">
      {nodes.map((node, index) => (
        <AccordionItem value={`item-${node.title}-${index}`} key={index} className="border-b-0">
          {node.children.length > 0 ? (
            <>
              <AccordionTrigger>{node.title}</AccordionTrigger>
              <AccordionContent className="pl-4 border-l ml-2">
                <RecursiveAccordion nodes={node.children} />
              </AccordionContent>
            </>
          ) : (
            <div className="py-4 font-medium">{node.title}</div>
          )}
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function OutlineDisplay({ outline }: { outline: string }) {
  const outlineTree = parseOutline(outline);

  if (outlineTree.length === 0) {
    return <p className="text-muted-foreground">No outline generated.</p>;
  }

  return <RecursiveAccordion nodes={outlineTree} />;
}
