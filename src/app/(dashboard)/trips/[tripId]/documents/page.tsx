"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  FileText,
  ExternalLink,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
import {
  useDocuments,
  useCreateDocument,
  useDeleteDocument,
} from "@/hooks/useDocuments";
import { formatDate } from "@/lib/utils";
import { DOCUMENT_CATEGORIES } from "@/constants";

export default function DocumentsPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: documents, isLoading } = useDocuments(tripId);
  const createDoc = useCreateDocument();
  const deleteDoc = useDeleteDocument();

  const [addOpen, setAddOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: "",
    category: "OTHER" as string,
    fileUrl: "",
  });

  if (isLoading) {
    return <LoadingPage message="Loading documents..." />;
  }

  const handleAdd = async () => {
    if (!newDoc.title.trim() || !newDoc.fileUrl.trim()) return;
    try {
      await createDoc.mutateAsync({
        tripId,
        title: newDoc.title,
        category: newDoc.category,
        fileUrl: newDoc.fileUrl,
      });
      setNewDoc({ title: "", category: "OTHER", fileUrl: "" });
      setAddOpen(false);
    } catch {
      // Error on createDoc.error
    }
  };

  const handleDelete = async (documentId: string) => {
    await deleteDoc.mutateAsync({ tripId, documentId });
  };

  const getCategoryInfo = (cat: string) =>
    DOCUMENT_CATEGORIES.find((c) => c.value === cat) || DOCUMENT_CATEGORIES[4];

  const categoryOptions = DOCUMENT_CATEGORIES.map((c) => ({
    value: c.value,
    label: `${c.icon} ${c.label}`,
  }));

  // Group by category
  const docsByCategory = (documents || []).reduce(
    (acc: Record<string, NonNullable<typeof documents>>, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    },
    {} as Record<string, NonNullable<typeof documents>>
  );

  const sortedCategories = DOCUMENT_CATEGORIES.filter(
    (c) => docsByCategory[c.value]?.length > 0
  );

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
            <h1 className="text-2xl font-bold text-slate-100">Documents</h1>
            <p className="text-sm text-slate-400">
              {documents?.length || 0} document{documents?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Document
        </Button>
      </div>

      {/* Category Stats */}
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_CATEGORIES.map((cat) => {
          const count = docsByCategory[cat.value]?.length || 0;
          if (count === 0) return null;
          return (
            <Badge key={cat.value} variant="secondary" className="gap-1.5 px-3 py-1.5">
              <span>{cat.icon}</span>
              {cat.label}
              <span className="ml-1 font-bold">{count}</span>
            </Badge>
          );
        })}
      </div>

      {/* Documents */}
      {sortedCategories.length > 0 ? (
        <div className="space-y-6">
          {sortedCategories.map((cat) => {
            const catDocs = docsByCategory[cat.value] || [];

            return (
              <div key={cat.value}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-200">
                  <span className="text-xl">{cat.icon}</span>
                  {cat.label}
                </h2>
                <div className="space-y-2">
                  {catDocs.map((doc) => {
                    const uploaderName =
                      doc.uploadedBy?.user?.name ||
                      doc.uploadedBy?.guestName ||
                      null;

                    return (
                      <Card key={doc.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-lg">
                              {getCategoryInfo(doc.category).icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-slate-100">
                                {doc.title}
                              </h3>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(doc.createdAt)}
                                </span>
                                {uploaderName && (
                                  <span className="flex items-center gap-1">
                                    <UserAvatar
                                      name={uploaderName}
                                      src={doc.uploadedBy?.user?.avatarUrl}
                                      size="sm"
                                    />
                                    {uploaderName}
                                  </span>
                                )}
                                {doc.fileType && (
                                  <Badge variant="outline">
                                    {doc.fileType}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Open document"
                                >
                                  <ExternalLink className="h-4 w-4 text-teal-400" />
                                </Button>
                              </a>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDelete(doc.id)}
                                className="text-red-400 hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Store reservations, boarding passes, insurance docs, and other important files for your trip."
          actionLabel="Add Document"
          onAction={() => setAddOpen(true)}
        />
      )}

      {/* Add Document Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-400" />
              Add Document
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title" required>
                Title
              </Label>
              <Input
                id="doc-title"
                placeholder="e.g., Airbnb Reservation"
                value={newDoc.title}
                onChange={(e) =>
                  setNewDoc({ ...newDoc, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-category">Category</Label>
              <Select
                id="doc-category"
                options={categoryOptions}
                value={newDoc.category}
                onChange={(e) =>
                  setNewDoc({ ...newDoc, category: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-url" required>
                File URL
              </Label>
              <Input
                id="doc-url"
                type="url"
                placeholder="https://..."
                value={newDoc.fileUrl}
                onChange={(e) =>
                  setNewDoc({ ...newDoc, fileUrl: e.target.value })
                }
              />
              <p className="text-xs text-slate-500">
                Paste a link to a Google Doc, PDF, or other hosted file
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              isLoading={createDoc.isPending}
              disabled={!newDoc.title.trim() || !newDoc.fileUrl.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
