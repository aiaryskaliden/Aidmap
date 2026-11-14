import Link from "next/link";
import { findDossier } from "@/data/core-admissions";
import { nextAdmissionDeadline } from "@/lib/admissions";
import { dateLabel } from "@/lib/utils";
import type { University } from "@/types/domain";

export function ApplicationRoadmap({ university: u }: { university: University }) {
  const dossier = findDossier(u.id);
  const required = dossier?.requirements.filter((r) => r.stage === "admission" && r.level === "Required") ?? [];
  const schoolItems = required.filter((r) => ["School", "Teacher", "Counselor"].includes(r.owner));
  const studentItems = required.filter((r) => r.owner === "Student");
  const basicDocs = u.requirements.value?.filter((r) => r.status === "Required") ?? [];
  const date = nextAdmissionDeadline(u);
  const directSource = u.sources.find((s) => u.applicationPlatform.sourceIds.includes(s.id));
  const officialUrl = directSource?.url || u.website;
  return (
    <section className="panel" id="application-steps" style={{ marginBottom: "1.5rem" }}>
      <span className="eyebrow">WHAT TO DO NEXT</span>
      <h2>Application roadmap</h2>
      <p>
        Use this plan to understand who submits what. It is a preparation guide, not an application service.
        Check program, curriculum and current round rules on the official website before sending anything.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: "1rem", marginTop: "1rem" }}>
        <div className="requirement-item">
          <strong>1. Choose the correct entry route</strong>
          <p>{u.applicationPlatform.value ?? "Check the university’s official application platform and entry route."}</p>
          <p className="tiny-note">Verified application date: {date?.date ? dateLabel(date.date) : "Confirm the target intake and round on the official portal."}</p>
        </div>
        <div className="requirement-item">
          <strong>2. Prepare your own documents</strong>
          <p>
            {studentItems.length
              ? studentItems.slice(0, 3).map((r) => r.label).join(" · ")
              : basicDocs.length ? basicDocs.slice(0, 3).map((r) => r.label).join(" · ")
              : "Check transcript, personal statement, English evidence and other program-specific documents."}
          </p>
          <p className="tiny-note">Only submit documents required for your specific application route.</p>
        </div>
        <div className="requirement-item">
          <strong>3. Coordinate school submissions</strong>
          <p>
            {schoolItems.length
              ? schoolItems.slice(0, 3).map((r) => `${r.label} (${r.owner})`).join(" · ")
              : "Ask your counselor whether school reports, references or transcripts must be sent directly."}
          </p>
          <p className="tiny-note">Sharing a document with your school does not confirm university receipt.</p>
        </div>
        <div className="requirement-item">
          <strong>4. Track submission and scholarship steps</strong>
          <p>
            Save this university, set your application stage, and check scholarship coverage, separate forms and renewal conditions.
          </p>
          <Link href={`/universities/${u.id}#financial-aid`} className="text-link">Review scholarship policy →</Link>
        </div>
      </div>
      <div className="timeline-actions" style={{ marginTop: "1rem" }}>
        <a className="button button-primary" href={officialUrl} target="_blank" rel="noopener noreferrer">Open official application instructions ↗</a>
        <Link className="button button-outline" href={`/universities/${u.id}#checklist`}>View document checklist →</Link>
      </div>
      <p className="tiny-note">Where university details are incomplete, AidMap explicitly directs you to the official source rather than making up the requirement.</p>
    </section>
  );
}
