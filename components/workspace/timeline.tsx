"use client";
import { useState } from "react";
import { useApp } from "@/components/providers";
import { findDossier } from "@/data/core-admissions";
import { findUniversity } from "@/data/universities";
import { timelineEvents, calendarICS } from "@/lib/calendar";
import { updateSaved } from "@/lib/storage/state";
import { downloadText, countLabel } from "@/lib/format";
import { dateLabel } from "@/lib/utils";
export function DeadlineTimeline() {
  const { state, update } = useApp();
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const events = state.saved
    .flatMap((s) => timelineEvents(s, findDossier(s.universityId)))
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  const visible = events.filter(
    (e) =>
      (!category || e.category === category) &&
      (filter === "all" ||
        (filter === "unresolved"
          ? !e.date
          : !!e.date &&
            (filter === "upcoming" ? e.date >= today : e.date < today))),
  );
  return (
    <section className="panel timeline-panel">
      <h2>Dates and next steps</h2>
      <p>
        Official dates and your personal target stay separate. Recurring
        guidance and event-triggered dates remain unresolved until a date is
        known.
      </p>
      <div className="form-grid">
        <label className="field-label">
          Show dates
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Past due</option>
            <option value="unresolved">Date unresolved</option>
          </select>
        </label>
        <label className="field-label">
          Date category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {[
              "admission",
              "aid",
              "testing",
              "documents",
              "supplement",
              "enrollment",
              "personal",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="timeline-actions">
        <button
          className="button button-outline"
          onClick={() =>
            setSelected(visible.filter((e) => e.date).map((e) => e.id))
          }
        >
          Select dated items in this view
        </button>
        <button
          className="button button-primary"
          disabled={
            !selected.some((id) => events.some((e) => e.id === id && e.date))
          }
          onClick={() =>
            downloadText(
              calendarICS(events.filter((e) => selected.includes(e.id))),
              "aidmap-selected-dates.ics",
              "text/calendar;charset=utf-8",
            )
          }
        >
          Export{" "}
          {countLabel(
            selected.filter((id) => events.some((e) => e.id === id && e.date))
              .length,
            "date",
          )}{" "}
          (.ics)
        </button>
      </div>
      <p className="tiny-note">
        No background reminders or live sync. Dates without a verified cutoff
        timezone export as all-day entries; source wording stays in the calendar
        description.
      </p>
      {!visible.length && (
        <p>
          No dates match this view. Add a personal target in your plan or check
          the university’s instructions.
        </p>
      )}
      <div className="timeline-list">
        {visible.map((e) => {
          const d = findDossier(e.universityId);
          const deadline = d?.deadlines.find(
            (x) => `${e.universityId}-${x.id}` === e.id,
          );
          return (
            <article key={e.id}>
              <label className="check-label">
                <input
                  type="checkbox"
                  aria-label={`Export ${e.universityId} ${e.label}`}
                  disabled={!e.date}
                  checked={selected.includes(e.id)}
                  onChange={(ev) =>
                    setSelected(
                      ev.target.checked
                        ? [...selected, e.id]
                        : selected.filter((id) => id !== e.id),
                    )
                  }
                />
                <strong>
                  {findUniversity(e.universityId)?.shortName} · {e.label}
                </strong>
              </label>
              <p>
                {e.date
                  ? dateLabel(e.date)
                  : (e.relative ?? "Exact date not verified")}{" "}
                <span className="tag neutral">{e.category}</span>
                {e.time &&
                  ` · ${e.time} ${e.timezone ?? "timezone unresolved"}`}
              </p>
              <p>{e.note}</p>
              {e.source && (
                <a href={e.source} target="_blank" rel="noopener noreferrer">
                  Official date instructions ↗
                </a>
              )}
              {deadline?.relative && (
                <label className="field-label">
                  Your event date: {deadline.relative.event}
                  <input
                    type="date"
                    value={
                      state.saved.find((s) => s.universityId === e.universityId)
                        ?.triggerDates?.[deadline.id] ?? ""
                    }
                    onChange={(ev) =>
                      update((s) => {
                        const item = s.saved.find(
                          (x) => x.universityId === e.universityId,
                        )!;
                        const dates = { ...item.triggerDates };
                        if (ev.target.value)
                          dates[deadline.id] = ev.target.value;
                        else delete dates[deadline.id];
                        return updateSaved(s, e.universityId, {
                          triggerDates: dates,
                        });
                      })
                    }
                  />
                </label>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
