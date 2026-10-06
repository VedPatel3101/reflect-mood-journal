"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CollectionSchema } from '@/app/lib/schema';
import { BarLoader } from 'react-spinners';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

const ColllectionForm = ({ onSuccess, open, setOpen, loading }) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(CollectionSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })
  
  const onSubmit = handleSubmit(async (data) => {
    await onSuccess({
      name: data.name,
      description: data.description ?? "",
    });
    reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>

        {loading && <BarLoader color="orange" width={"100%"} />}

        <form onSubmit={onSubmit} className="space-y-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Collection Name</label>
            <Input
              disabled={loading}
              {...register("name")}
              placeholder="Enter collection name..."
              className={`${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  disabled={loading}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Describe your collection..."
                  className={`${errors.description ? "border-red-500" : ""}`}
                />
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="journal" disabled={loading}>
              Create Collection
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ColllectionForm;