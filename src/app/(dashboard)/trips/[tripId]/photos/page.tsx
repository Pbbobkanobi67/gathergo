"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Camera,
  Trash2,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/avatar";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePhotos, useCreatePhoto, useDeletePhoto } from "@/hooks/usePhotos";
import { formatDate } from "@/lib/utils";

export default function PhotosPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: photos, isLoading } = usePhotos(tripId);
  const createPhoto = useCreatePhoto();
  const deletePhoto = useDeletePhoto();

  const [addOpen, setAddOpen] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    imageUrl: "",
    caption: "",
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingPage message="Loading photos..." />;
  }

  const handleAdd = async () => {
    if (!newPhoto.imageUrl.trim()) return;
    try {
      await createPhoto.mutateAsync({
        tripId,
        imageUrl: newPhoto.imageUrl,
        caption: newPhoto.caption || undefined,
      });
      setNewPhoto({ imageUrl: "", caption: "" });
      setAddOpen(false);
    } catch {
      // Error on createPhoto.error
    }
  };

  const handleDelete = async (photoId: string) => {
    await deletePhoto.mutateAsync({ tripId, photoId });
    setSelectedPhoto(null);
  };

  const selected = photos?.find((p) => p.id === selectedPhoto);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/trips/${tripId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Photos</h1>
            <p className="text-sm text-slate-400">
              {photos?.length || 0} photo{photos?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Photo
        </Button>
      </div>

      {/* Photo Grid */}
      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => {
            const uploaderName =
              photo.uploadedBy?.user?.name ||
              photo.uploadedBy?.guestName ||
              null;

            return (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo.id)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-700 bg-slate-800 transition-all hover:border-teal-500"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || "Trip photo"}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="truncate text-xs text-white">{photo.caption}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Camera}
          title="No photos yet"
          description="Share photos from your trip! Add URLs to images to build your trip album."
          actionLabel="Add Photo"
          onAction={() => setAddOpen(true)}
        />
      )}

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          {selected && (
            <>
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={selected.imageUrl}
                  alt={selected.caption || "Trip photo"}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  {selected.caption && (
                    <p className="text-sm text-slate-200">{selected.caption}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(selected.createdAt)}
                    </span>
                    {selected.uploadedBy && (
                      <span className="flex items-center gap-1">
                        <UserAvatar
                          name={selected.uploadedBy.user?.name || selected.uploadedBy.guestName || ""}
                          src={selected.uploadedBy.user?.avatarUrl}
                          size="sm"
                        />
                        {selected.uploadedBy.user?.name || selected.uploadedBy.guestName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={selected.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon-sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(selected.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Photo Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-teal-400" />
              Add Photo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo-url" required>Image URL</Label>
              <Input
                id="photo-url"
                type="url"
                placeholder="https://..."
                value={newPhoto.imageUrl}
                onChange={(e) => setNewPhoto({ ...newPhoto, imageUrl: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                Paste a link to an image hosted online
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-caption">Caption</Label>
              <Input
                id="photo-caption"
                placeholder="What's in this photo?"
                value={newPhoto.caption}
                onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
              />
            </div>

            {newPhoto.imageUrl && (
              <div className="overflow-hidden rounded-lg border border-slate-700">
                <img
                  src={newPhoto.imageUrl}
                  alt="Preview"
                  className="max-h-48 w-full object-contain bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              isLoading={createPhoto.isPending}
              disabled={!newPhoto.imageUrl.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
