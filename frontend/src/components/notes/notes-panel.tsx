"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { NoteResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NoteItem({
  note,
  studentId,
  onUpdated,
}: {
  note: NoteResponse;
  studentId: string;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editing]);

  async function handleSaveEdit() {
    if (!editContent.trim() || editContent.trim() === note.content) {
      setEditing(false);
      setEditContent(note.content);
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/students/${studentId}/notes/${note.id}`, {
        content: editContent.trim(),
      });
      onUpdated();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/api/students/${studentId}/notes/${note.id}`);
      onUpdated();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-md border bg-muted/30 px-3 py-2 space-y-2">
        <Textarea
          ref={editRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={3}
          className="text-sm"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setEditContent(note.content);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-md border bg-muted/30 px-3 py-2">
      <p
        className="whitespace-pre-wrap text-sm cursor-pointer"
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {note.content}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {formatDate(note.created_at)}
          {note.updated_at !== note.created_at && " (edited)"}
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <Button
                variant="destructive"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "..." : "Confirm"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotesPanel({ studentId }: { studentId: string }) {
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchNotes = useCallback(async () => {
    const data = await api.get<NoteResponse[]>(
      `/api/students/${studentId}/notes`,
    );
    setNotes(data);
  }, [studentId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await api.post(`/api/students/${studentId}/notes`, {
        content: content.trim(),
      });
      setContent("");
      setExpanded(false);
      await fetchNotes();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder="Add a note about this student..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            rows={expanded ? 3 : 1}
            className="text-sm transition-all"
          />
          {expanded && (
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={saving || !content.trim()}
              >
                {saving ? "Saving..." : "Save note"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setExpanded(false);
                  setContent("");
                  textareaRef.current?.blur();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>

        {notes.length > 0 && (
          <div className="space-y-3 pt-2">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                studentId={studentId}
                onUpdated={fetchNotes}
              />
            ))}
          </div>
        )}

        {notes.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Add notes to track observations about this student.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
