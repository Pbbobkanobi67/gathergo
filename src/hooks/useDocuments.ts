"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/trips";

// --- Types ---

interface MemberInfo {
  id: string;
  guestName: string | null;
  role: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

interface TripDocument {
  id: string;
  tripId: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string | null;
  uploadedByMemberId: string | null;
  uploadedBy: MemberInfo | null;
  createdAt: string;
}

interface CreateDocumentInput {
  tripId: string;
  title: string;
  category?: string;
  fileUrl: string;
  fileType?: string;
}

interface UpdateDocumentInput {
  tripId: string;
  documentId: string;
  data: Partial<{
    title: string;
    category: string;
    fileUrl: string;
    fileType: string;
  }>;
}

interface DeleteDocumentInput {
  tripId: string;
  documentId: string;
}

// --- API functions ---

async function fetchDocuments(tripId: string): Promise<TripDocument[]> {
  const res = await fetch(`${API_BASE}/${tripId}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  const json = await res.json();
  return json.data;
}

async function createDocument(input: CreateDocumentInput): Promise<TripDocument> {
  const { tripId, ...body } = input;
  const res = await fetch(`${API_BASE}/${tripId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to create document");
  }
  const json = await res.json();
  return json.data;
}

async function updateDocument(input: UpdateDocumentInput): Promise<TripDocument> {
  const { tripId, documentId, data } = input;
  const res = await fetch(`${API_BASE}/${tripId}/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to update document");
  }
  const json = await res.json();
  return json.data;
}

async function deleteDocument(input: DeleteDocumentInput): Promise<void> {
  const { tripId, documentId } = input;
  const res = await fetch(`${API_BASE}/${tripId}/documents/${documentId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error?.message || "Failed to delete document");
  }
}

// --- Hooks ---

export function useDocuments(tripId: string | undefined) {
  return useQuery({
    queryKey: ["documents", tripId],
    queryFn: () => fetchDocuments(tripId!),
    enabled: !!tripId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.tripId] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.tripId] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.tripId] });
    },
  });
}

export type { TripDocument, CreateDocumentInput, UpdateDocumentInput, DeleteDocumentInput, MemberInfo };
