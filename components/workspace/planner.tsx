"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  List,
  Columns3,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { findUniversity } from "@/data/universities";
import { statuses, type SavedUniversity } from "@/types/domain";
import { updateSaved } from "@/lib/storage/state";
import { PageHeading, EmptyState, LocalNote } from "@/components/ui/shared";
import { WorkspaceNav } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { dateLabel } from "@/lib/utils";
import { nextAdmissionDeadline } from "@/lib/admissions";
import { AddChecklist } from "@/components/universities/detail-actions";
import { findDossier } from "@/data/core-admissions";
import {
  RequirementWorkspace,
  RequirementMatrix,
} from "@/components/workspace/requirements";
import { DeadlineTimeline } from "@/components/workspace/timeline";
import { ApplicationBrief } from "@/components/workspace/brief";
import { countLabel } from "@/lib/format";
function PlannerCard({ item }: { item: SavedUniversity }) {
  const { update, toast } = useApp();
  const [task, setTask] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const u = findUniversity(item.universityId);
  const dossier = findDossier(item.universityId);
  if (!u) return null;
  const change = (patch: Partial<Omit<SavedUniversity, "universityId">>) =>
    update((s) => updateSaved(s, u.id, patch));
  return (
    <article className="planner-card">
      <div className="planner-card-head">
        <span
          className="university-monogram"
          style={{ color: u.color, background: `${u.color}10` }}
        >
          {u.initials}
        </span>
        <div>
          <h2>
            <Link href={`/universities/${u.id}`}>
              {u.name}
              <ArrowUpRight size={15} />
            </Link>
          </h2>
          <p>
            {item.tasks.filter((t) => t.done).length} of{" "}
            {countLabel(item.tasks.length, "personal task")} complete
          </p>
        </div>
        <label className="sr-only" htmlFor={`status-${u.id}`}>
          Application status for {u.name}
        </label>
        <select
          id={`status-${u.id}`}
          value={item.status}
          onChange={(e) =>
            change({ status: e.target.value as SavedUniversity["status"] })
          }
        >
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="task-progress" aria-label="Task completion">
        <span
          style={{
            width: `${item.tasks.length ? (100 * item.tasks.filter((t) => t.done).length) / item.tasks.length : 0}%`,
          }}
        />
      </div>
      <div className="planner-form-grid">
        <label className="field-label">
          Your custom deadline
          <input
            type="date"
            aria-label={`Custom deadline for ${u.name}`}
            value={item.deadline ?? ""}
            onChange={(e) =>
              change({
                deadline: e.target.value || null,
                deadlineSource: undefined,
              })
            }
          />
          <small>
            {item.deadlineSource
              ? `${item.deadlineSource.label} · ${item.deadlineSource.cycle} · ${item.deadlineSource.kind}`
              : "User-defined · not an official date"}
          </small>
          {item.deadlineSource && (
            <a
              className="external-link"
              href={item.deadlineSource.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Review deadline source ↗
            </a>
          )}
        </label>
        <label className="field-label">
          Application type
          <select
            value={item.applicationType}
            onChange={(e) => change({ applicationType: e.target.value })}
          >
            <option value="">Not selected</option>
            {(dossier
              ? dossier.rounds.map((r) => r.name)
              : ["Early Action", "Early Decision", "Regular Decision", "Other"]
            ).map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="planner-official-date">
        Official admission deadline:{" "}
        <strong>{dateLabel(nextAdmissionDeadline(u)?.date ?? null)}</strong> ·
        Fall 2027 ·{" "}
        <Link href={`/universities/${u.id}#deadlines`}>
          Check requirements
          <ArrowUpRight size={12} />
        </Link>
      </div>
      {dossier ? (
        <details className="planner-requirements">
          <summary>Requirements, roles and progress</summary>
          <RequirementWorkspace dossier={dossier} />
        </details>
      ) : (
        <AddChecklist universityId={u.id} />
      )}
      <div className="task-list">
        {item.tasks.map((t) => (
          <div className="task-row" key={t.id}>
            {editing === t.id ? (
              <form
                className="task-edit"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editText.trim()) return;
                  change({
                    tasks: item.tasks.map((x) =>
                      x.id === t.id ? { ...x, text: editText.trim() } : x,
                    ),
                  });
                  setEditing(null);
                }}
              >
                <input
                  aria-label="Edit task text"
                  value={editText}
                  maxLength={500}
                  autoFocus
                  onChange={(e) => setEditText(e.target.value)}
                />
                <button className="icon-button" aria-label="Save task edit">
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Cancel task edit"
                  onClick={() => setEditing(null)}
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <>
                <label className={`task-check ${t.done ? "task-done" : ""}`}>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() =>
                      change({
                        tasks: item.tasks.map((x) =>
                          x.id === t.id ? { ...x, done: !x.done } : x,
                        ),
                      })
                    }
                  />
                  <span>{t.text}</span>
                </label>
                {t.sourceUrl && (
                  <a
                    className="task-source"
                    href={t.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Official source for ${t.text}`}
                  >
                    Source ↗
                  </a>
                )}
                <button
                  className="icon-button"
                  aria-label={`Edit task ${t.text}`}
                  onClick={() => {
                    setEditing(t.id);
                    setEditText(t.text);
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete task ${t.text}`}
                  onClick={() =>
                    change({ tasks: item.tasks.filter((x) => x.id !== t.id) })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <form
        className="add-task"
        onSubmit={(e) => {
          e.preventDefault();
          if (!task.trim()) return;
          change({
            tasks: [
              ...item.tasks,
              { id: crypto.randomUUID(), text: task.trim(), done: false },
            ],
          });
          setTask("");
          toast("Task added to your plan.");
        }}
      >
        <Plus size={16} />
        <input
          aria-label={`New task for ${u.name}`}
          placeholder="Add a next step…"
          value={task}
          maxLength={500}
          onChange={(e) => setTask(e.target.value)}
        />
        <Button
          size="sm"
          variant="secondary"
          type="submit"
          disabled={!task.trim()}
        >
          Add task
        </Button>
      </form>
      <label className="field-label notes-field">
        Your notes
        <textarea
          aria-label={`Notes for ${u.name}`}
          placeholder="Questions to ask, links to revisit, ideas to remember…"
          value={item.notes}
          maxLength={10000}
          onChange={(e) => change({ notes: e.target.value })}
        />
      </label>
      <p className="tiny-note">
        Edits save locally. “Submitted” is a status you set yourself; AidMap
        does not send applications.
      </p>
    </article>
  );
}
export default function Planner() {
  const { state, ready, update } = useApp();
  const [view, setView] = useState("timeline");
  const sorted = [...state.saved].sort((a, b) =>
    (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"),
  );
  return (
    <div className="page-container workspace-page">
      <WorkspaceNav />
      <PageHeading
        eyebrow="YOUR WORKSPACE / APPLICATION PLANNER"
        title="Make room for your next move."
        description="Turn a list of possibilities into a plan you can follow."
      >
        <LocalNote />
      </PageHeading>
      <div className="planner-toolbar">
        <div className="segmented-control">
          <button
            aria-pressed={view === "timeline"}
            onClick={() => setView("timeline")}
          >
            <List size={16} />
            Timeline & tasks
          </button>
          <button
            aria-pressed={view === "board"}
            onClick={() => setView("board")}
          >
            <Columns3 size={16} />
            Status board
          </button>
          <button
            aria-pressed={view === "requirements"}
            onClick={() => setView("requirements")}
          >
            Requirements matrix
          </button>
          <button
            aria-pressed={view === "dates"}
            onClick={() => setView("dates")}
          >
            Deadline calendar
          </button>
          <button
            aria-pressed={view === "brief"}
            onClick={() => setView("brief")}
          >
            Print brief
          </button>
        </div>
        <Link className="text-link" href="/explore">
          <Plus size={15} />
          Add a university
        </Link>
      </div>
      {!ready ? (
        <p>Loading your local plan…</p>
      ) : !state.saved.length ? (
        <EmptyState
          title="Good plans begin with a possibility."
          text="Save a university to create its application workspace. Then add your own tasks, notes and dates."
        />
      ) : view === "requirements" ? (
        <RequirementMatrix />
      ) : view === "dates" ? (
        <DeadlineTimeline />
      ) : view === "brief" ? (
        <ApplicationBrief />
      ) : view === "timeline" ? (
        <div className="planner-list">
          {sorted.map((s) => (
            <PlannerCard key={s.universityId} item={s} />
          ))}
        </div>
      ) : (
        <div
          className="kanban-scroll"
          role="region"
          aria-label="Application status board; scroll horizontally"
          tabIndex={0}
        >
          <div className="kanban-board">
            {statuses.map((status) => (
              <section key={status}>
                <h3>
                  <span className="status-dot" />
                  {status}
                  <span>
                    {state.saved.filter((s) => s.status === status).length}
                  </span>
                </h3>
                {state.saved
                  .filter((s) => s.status === status)
                  .map((s) => (
                    <article key={s.universityId}>
                      <Link href={`/universities/${s.universityId}`}>
                        {findUniversity(s.universityId)?.name}
                      </Link>
                      <p>
                        {s.tasks.filter((t) => t.done).length}/{s.tasks.length}{" "}
                        tasks
                      </p>
                      <small>
                        {s.deadline
                          ? `Your date: ${dateLabel(s.deadline)}`
                          : "No custom deadline"}
                      </small>
                      <select
                        aria-label={`Move ${findUniversity(s.universityId)?.name} to status`}
                        value={s.status}
                        onChange={(e) =>
                          update((x) =>
                            updateSaved(x, s.universityId, {
                              status: e.target
                                .value as SavedUniversity["status"],
                            }),
                          )
                        }
                      >
                        {statuses.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                      <button
                        className="text-link"
                        onClick={() => setView("timeline")}
                      >
                        Edit tasks
                        <ArrowRight size={14} />
                      </button>
                    </article>
                  ))}
                {!state.saved.some((s) => s.status === status) && (
                  <p className="board-empty">No applications here yet.</p>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
