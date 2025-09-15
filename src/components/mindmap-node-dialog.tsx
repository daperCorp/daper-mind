
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';

interface MindMapNodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  mode: 'add' | 'edit';
  defaultValue?: string;
  isPending: boolean;
}

export function MindMapNodeDialog({
  isOpen,
  onClose,
  onSubmit,
  mode,
  defaultValue = '',
  isPending,
}: MindMapNodeDialogProps) {
  const [title, setTitle] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Node' : 'Edit Node'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'add' ? 'Add' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
