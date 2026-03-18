"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { NoteResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
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
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-3">
        <Textarea
          ref={editRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={3}
          className="text-sm border-border/40 bg-background"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="h-7 text-xs">
            {saving ? (
              <>
                <svg className="mr-1 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving
              </>
            ) : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
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
    <div className="group relative rounded-xl border border-border/60 bg-card px-4 py-3 transition-all hover:border-border hover:shadow-sm">
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-amber-400/60" />
      <p
        className="whitespace-pre-wrap text-sm leading-relaxed cursor-pointer pl-2"
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {note.content}
      </p>
      <div className="mt-2 flex items-center justify-between pl-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {timeAgo(note.created_at)}
          {note.updated_at !== note.created_at && (
            <span className="text-muted-foreground/50">edited</span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-md px-2 py-0.5 text-[11px] text-white bg-destructive hover:bg-destructive/90 transition-colors"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "..." : "Confirm"}
              </button>
              <button
                type="button"
                className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="rounded-md px-2 py-0.5 text-[11px] text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
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
        <CardTitle className="flex items-center gap-2 text-base">
          <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Notes
          {notes.length > 0 && (
            <span className="ml-auto rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              {notes.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className={`rounded-xl border transition-all ${expanded ? "border-primary/30 shadow-sm bg-muted/30" : "border-border/60"} p-2`}>
            <Textarea
              ref={textareaRef}
              placeholder="Add a note about this student..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setExpanded(true)}
              rows={expanded ? 3 : 1}
              className="text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:outline-none resize-none transition-all"
            />
            {expanded && (
              <div className="flex justify-end gap-2 pt-1 border-t border-border/40 mt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    setExpanded(false);
                    setContent("");
                    textareaRef.current?.blur();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || !content.trim()}
                  className="h-7 text-xs"
                >
                  {saving ? (
                    <>
                      <svg className="mr-1 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving
                    </>
                  ) : (
                    <>
                      <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Note
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </form>

        {notes.length > 0 && (
          <div className="space-y-2">
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
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              No notes yet. Track observations, reminders, or follow-ups.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
