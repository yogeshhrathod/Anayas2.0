import { FileText, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface CollectionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: {
    id: number;
    name: string;
    description?: string;
  } | null;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
}

export function CollectionEditDialog({
  open,
  onOpenChange,
  collection,
  onSuccess,
}: CollectionEditDialogProps) {
  const { showSuccess, showError } = useToastNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue } = useForm<FormData>();

  useEffect(() => {
    if (collection) {
      setValue('name', collection.name);
      setValue('description', collection.description || '');
    }
  }, [collection, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!collection) return;

    setIsSubmitting(true);
    try {
      const result = await window.electronAPI.collection.save({
        ...collection,
        name: data.name,
        description: data.description,
      } as any);

      if (!result.success) {
        throw new Error(result.error);
      }

      showSuccess('Collection updated successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      showError('Failed to update collection', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Collection"
      description="Update the collection details below."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-5 backdrop-blur-sm">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Collection Name
            </Label>
            <Input
              id="name"
              className="bg-background/80 focus:bg-background transition-colors h-10 border-border/50"
              {...register('name', { required: true })}
              placeholder="e.g. My API Collection"
            />
          </div>
          <div className="space-y-2 pt-2">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Description
            </Label>
            <Textarea
              id="description"
              className="bg-background/80 focus:bg-background transition-colors resize-none border-border/50"
              {...register('description')}
              placeholder="Add a brief description about this collection..."
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="hover:bg-muted text-muted-foreground transition-colors"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 hover:-translate-y-[1px]">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
