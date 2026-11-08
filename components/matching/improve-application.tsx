"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { useApp } from "@/components/providers";
import { findUniversity } from "@/data/universities";
import { applicationAdvice } from "@/lib/matching/advice";
import { PageHeading, LocalNote } from "@/components/ui/shared";

export default function ImproveApplication() {
  const { state, ready, update } = useApp();
  const saved = state.saved.map((s) => findUniversity(s.universityId)).filter((u) => u !== undefined);
  const tips = applicationAdvice(state.profile?.isDemo ? null : state.profile, saved);
  const completed = tips.filter((tip) => state.preparation?.[`improve:${tip.id}`]).length;

  return (
    <main className="page-container">
      <PageHeading
        eyebrow="AIDMAP / APPLICATION WORKSHOP"
        title="Make your application stronger."
        description="A practical, honest preparation checklist. Choose what to improve, collect proof, and track your progress privately."
      />
      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <h2>Your preparation</h2>
        <p><strong>{ready ? completed : "…"} of {tips.length}</strong> preparation areas marked complete</p>
        <p className="muted">
          These are evidence-based general recommendations, not admission guarantees or an AI assessment of documents.
          Your answers stay in your browser. No essay, CV or personal details are sent to an external API.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <Link className="text-link" href="/profile">Update my academic profile <ArrowRight size={14} /></Link>
          <Link className="text-link" href="/planner">Open my application planner <ArrowRight size={14} /></Link>
        </div>
      </div>
      <div style={{ display: "grid", gap: "1rem" }}>
        {tips.map((tip) => {
          const done = !!state.preparation?.[`improve:${tip.id}`];
          return (
            <section className="panel" key={tip.id}>
              <div className="panel-heading">
                <h2>{tip.title}</h2>
                <span className="tag neutral">{tip.priority} priority</span>
              </div>
              <p>{tip.explanation}</p>
              <label className="check-label" style={{ marginTop: "0.8rem" }}>
                <input
                  type="checkbox"
                  checked={done}
                  disabled={!ready}
                  onChange={(event) =>
                    update((s) => ({
                      ...s,
                      preparation: {
                        ...s.preparation,
                        [`improve:${tip.id}`]: event.target.checked,
                      },
                    }))
                  }
                />
                {done ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
                {tip.checklist}
              </label>
            </section>
          );
        })}
      </div>
      <p className="muted" style={{ marginTop: "1.25rem" }}>
        <LockKeyhole size={15} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
        Optional AI-powered essay or CV feedback can be added later with your explicit consent,
        a configured API key and clear privacy controls. It is not connected yet.
      </p>
      <LocalNote />
    </main>
  );
}
