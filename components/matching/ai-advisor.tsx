"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { universities } from "@/data/universities";
import { Button } from "@/components/ui/button";

export function AIAdvisor({ universityId }: { universityId?: string }) {
  const [selected, setSelected] = useState(universityId ?? "mbzuai");
  const [configured, setConfigured] = useState(false);
  const [checkedConfig, setCheckedConfig] = useState(false);
  const [consent, setConsent] = useState(false);
  const [question, setQuestion] = useState("What are the three most useful things I should do to strengthen my application for this university?");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/advisor", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (active) setConfigured(data.enabled === true); })
      .catch(() => { if (active) setConfigured(false); })
      .finally(() => { if (active) setCheckedConfig(true); });
    return () => { active = false; };
  }, []);

  async function ask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || !consent) return;
    setLoading(true);
    setAnswer("");
    setError("");
    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId: selected, question: question.trim(), consent: true }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.answer !== "string") {
        setError(result.error ?? "AI is temporarily unavailable.");
      } else setAnswer(result.answer);
    } catch {
      setError("AI request failed. Your local checklist remains available.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel" id="ai-advisor" style={{ marginTop: "1.5rem" }}>
      <div className="panel-heading">
        <h2><Sparkles size={20} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />Ask AidMap AI</h2>
        <span className="tag neutral">Optional</span>
      </div>
      <p>
        Get university-specific next steps from the evidence we have collected.
        This is research guidance, not an admission prediction or a substitute for the official admissions portal.
      </p>
      {!checkedConfig ? (
        <p className="muted">Checking AI availability…</p>
      ) : !configured ? (
        <div className="notice">
          <p><strong>Live AI is not activated yet.</strong> The local application checklist and sourced university guidance work without it. To activate, the project owner must configure a model, a secure API key, spending limits and abuse protection in Vercel.</p>
        </div>
      ) : (
        <form onSubmit={ask} style={{ display: "grid", gap: "0.8rem" }}>
          <label className="field-label">
            University
            <select value={selected} onChange={(e) => { setSelected(e.target.value); setAnswer(""); }}>
              {universities.map((u) => <option value={u.id} key={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="field-label">
            Your question
            <textarea
              rows={3}
              maxLength={700}
              minLength={5}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Which application materials matter, and what should I prepare?"
            />
          </label>
          <label className="check-label">
            <input checked={consent} onChange={(e) => setConsent(e.target.checked)} type="checkbox"/>
            I consent to sending this question and the selected university\u2019s public research data to the model provider.
          </label>
          <p className="tiny-note">
            <ShieldCheck size={14} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
            No saved profile, scores, documents, or personal notes are transmitted automatically.
            Avoid entering passports, private contact details, financial records or passwords.
          </p>
          <Button type="submit" disabled={!consent || loading || question.trim().length < 5}>
            {loading ? "Generating advice…" : "Get tailored guidance"}
          </Button>
          {error && <p role="alert" className="form-error">{error}</p>}
          {answer && (
            <div className="notice" role="status" style={{ whiteSpace: "pre-wrap" }}>
              <strong>Suggested next steps</strong>
              <p>{answer}</p>
              <p className="tiny-note">Verify each claim using the official sources. AI can be mistaken.</p>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
