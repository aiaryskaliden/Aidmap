"use client";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { matchUniversity } from "@/lib/matching/match";
import { toggleSaved, updateSaved } from "@/lib/storage/state";
import type { University } from "@/types/domain";
import { Button } from "@/components/ui/button";
export function MatchPanel({ university }: { university: University }) {
  const { state } = useApp();
  const reasons = matchUniversity(university, state.profile);
  if (!state.profile)
    return (
      <div className="match-panel">
        <h3>See how this fits your plans.</h3>
        <p>
          Add your interests and destinations to get transparent research
          matches.
        </p>
        <Link href="/profile" className="text-link">
          Set your preferences →
        </Link>
      </div>
    );
  return (
    <div className="match-panel">
      <h3>Why this may fit your preferences</h3>
      {reasons.map((r) => (
        <div key={r.category}>
          <strong>{r.category}</strong>
          <p>{r.text}</p>
        </div>
      ))}
    </div>
  );
}
export function AddChecklist({ universityId }: { universityId: string }) {
  const { state, update, toast, ready, blocked } = useApp();
  return (
    <Button
      disabled={!ready || blocked}
      variant="outline"
      onClick={() => {
        update((s) => {
          const next = s.saved.some((u) => u.universityId === universityId)
            ? s
            : toggleSaved(s, universityId);
          const saved = next.saved.find(
            (u) => u.universityId === universityId,
          )!;
          const texts = [
            "Confirm Fall 2027 admissions deadline",
            "Review transcript and test requirements",
            "Check essays and recommendations",
            "Verify international aid forms and deadline",
          ];
          return updateSaved(next, universityId, {
            tasks: [
              ...saved.tasks,
              ...texts
                .filter((t) => !saved.tasks.some((x) => x.text === t))
                .map((text) => ({
                  id: crypto.randomUUID(),
                  text,
                  done: false,
                })),
            ],
          });
        });
        toast("Research checklist added to your application planner.");
      }}
    >
      Add research checklist to my planner
      {state.saved.some((u) => u.universityId === universityId)
        ? ""
        : " & save university"}
    </Button>
  );
}
