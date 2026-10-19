"use client";
import { Bookmark, Check, Columns3 } from "lucide-react";
import { useApp } from "@/components/providers";
import { toggleCompare, toggleSaved } from "@/lib/storage/state";
import { Button } from "@/components/ui/button";
export function UniversityActions({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  const { state, update, toast, ready, blocked } = useApp();
  const saved = state.saved.find((u) => u.universityId === id);
  const compared = state.compare.includes(id);
  return (
    <div className="university-actions">
      <Button
        disabled={!ready || blocked}
        variant={saved ? "secondary" : "outline"}
        size={compact ? "icon" : "sm"}
        aria-label={`${saved ? "Unsave" : "Save"} university`}
        aria-pressed={!!saved}
        onClick={() => {
          if (
            saved &&
            (saved.tasks.length || saved.notes) &&
            !confirm(
              "Remove this university and its application notes and tasks from your shortlist?",
            )
          )
            return;
          update((s) => toggleSaved(s, id));
          toast(
            saved
              ? "University removed from your shortlist."
              : "University saved. Your planner is ready.",
          );
        }}
      >
        <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        {!compact && (saved ? "Saved" : "Save")}
      </Button>
      <Button
        disabled={!ready || blocked}
        variant={compared ? "secondary" : "outline"}
        size="sm"
        aria-pressed={compared}
        onClick={() => {
          if (!compared && state.compare.length >= 4) {
            toast(
              "Compare up to four universities. Remove one before adding another.",
            );
            return;
          }
          update((s) => toggleCompare(s, id));
        }}
      >
        {compared ? <Check size={16} /> : <Columns3 size={16} />}{" "}
        {compared ? "Added" : "Compare"}
      </Button>
    </div>
  );
}
