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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name', { required: true })}
            placeholder="Collection Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Collection Description"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
