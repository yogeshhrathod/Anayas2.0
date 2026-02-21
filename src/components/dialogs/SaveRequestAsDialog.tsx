import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import logger from '../../lib/logger';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

interface SaveRequestAsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any; // The request to save
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  collectionId: string;
  folderId: string;
}

export function SaveRequestAsDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: SaveRequestAsDialogProps) {
  const { showSuccess, showError } = useToastNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { collections } = useStore();
  const [folders, setFolders] = useState<any[]>([]);
  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      name: request?.name || '',
      collectionId: request?.collectionId?.toString() || '',
      folderId: request?.folderId?.toString() || 'none',
    },
  });

  const selectedCollectionId = watch('collectionId');

  // Load folders when collection changes
  useEffect(() => {
    if (selectedCollectionId) {
      window.electronAPI.folder
        .list(parseInt(selectedCollectionId))
        .then(setFolders)
        .catch((err: any) => {
          logger.error('Failed to load folders for collection', { error: err });
        });
    } else {
      setFolders([]);
    }
  }, [selectedCollectionId]);

  // Reset form when request changes or dialog opens
  useEffect(() => {
    if (open && request) {
      reset({
        name: request.name || '',
        collectionId: request.collectionId?.toString() || '',
        folderId: request.folderId?.toString() || 'none',
      });
    }
  }, [open, request, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const newRequest = {
        ...request,
        name: data.name,
        collectionId: parseInt(data.collectionId),
        folderId:
          data.folderId === 'none' ? undefined : parseInt(data.folderId),
        id: undefined, // Clear ID to create new
      };

      const result = await window.electronAPI.request.save(newRequest);

      if (!result.success) {
        throw new Error(result.error);
      }

      showSuccess('Request saved successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      showError('Failed to save request', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Save Request As"
      description="Save a copy of this request to a collection."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="name">Request Name</Label>
          <Input
            id="name"
            {...register('name', { required: true })}
            placeholder="Request Name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="collection">Collection</Label>
          <Select
            onValueChange={val => setValue('collectionId', val)}
            value={watch('collectionId')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {collections.map(col => (
                <SelectItem key={col.id} value={col.id!.toString()}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="folder">Folder (Optional)</Label>
          <Select
            onValueChange={val => setValue('folderId', val)}
            value={watch('folderId')}
            disabled={!selectedCollectionId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Folder (Root)</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.id.toString()}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedCollectionId}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
