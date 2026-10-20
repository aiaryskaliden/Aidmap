import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  ShieldCheck,
  MapPin,
  Bookmark,
  Compass,
  Columns3,
  Route,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { universities } from "@/data/universities";
import { UniversityCard } from "@/components/universities/card";
import { searchUniversities } from "@/lib/search";
export default function Home() {
  return (
    <>
      <section className="hero page-container">
        <div className="hero-copy">
          <div className="pill">
            <span /> YOUR FALL 2027 STARTS HERE
          </div>
          <h1>
            Your future,
            <br />
            <span>mapped.</span>
          </h1>
          <p className="hero-description">
            Discover universities, understand financial aid, and build an
            application plan that fits your goals and budget.
          </p>
          <div className="hero-ctas">
            <Button asChild>
              <Link href="/explore">
                Explore universities <ArrowRight size={18} />
              </Link>
            </Button>
            <a className="text-link" href="#how-it-works">
              How AidMap works
              <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="hero-trust">
            <ShieldCheck size={16} />
            <span>Official sources. Clear costs. No false promises.</span>
          </div>
          <Link className="text-link onboarding-link" href="/start">
            New to university applications? Start here <ArrowRight size={16} />
          </Link>
        </div>
        <div className="hero-map">
          <div className="map-grid" />
          <div className="map-label">
            <span className="map-marker" /> A WORLD OF POSSIBILITIES
          </div>
          <svg
            className="route-art"
            viewBox="0 0 560 480"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M60 420C90 420 112 388 112 350V292C112 246 178 253 210 253H390C435 253 440 212 440 180V130C440 90 395 86 370 86H280"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5 6"
            />
            <circle cx="60" cy="420" r="7" fill="currentColor" />
            <circle cx="280" cy="86" r="7" fill="currentColor" />
          </svg>
          <div className="map-school map-school-one">
            <span
              className="university-monogram"
              style={{ color: "#A51C30", background: "#fbf0f1" }}
            >
              H
            </span>
            <div>
              <span className="eyebrow">DISCOVER YOUR POSSIBILITIES</span>
              <h3>Harvard University</h3>
              <p>
                <MapPin size={12} /> Cambridge, Massachusetts
              </p>
              <span className="tag green">
                Need-based aid for international students
              </span>
            </div>
            <Link
              href="/universities/harvard"
              className="map-link"
              aria-label="Explore Harvard University"
            >
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="map-school map-school-two">
            <span
              className="university-monogram"
              style={{ color: "#00356b", background: "#edf2f8" }}
            >
              Y
            </span>
            <div>
              <h3>Yale University</h3>
              <p>Understand what funding could cover.</p>
              <Link
                href="/universities/yale#financial-aid"
                className="text-link"
              >
                See the financial aid policy
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <Link className="map-plan" href="/planner">
            <span className="plan-icon">
              <Route size={23} />
            </span>
            <div>
              <span>One step closer.</span>
              <strong>Turn your shortlist into a plan</strong>
            </div>
            <ArrowUpRight size={18} />
          </Link>
          <span className="map-coordinate">DISCOVER → COMPARE → PLAN</span>
          <div className="map-source">
            <ShieldCheck size={14} /> Real institutions. Official policy
            sources.
          </div>
        </div>
      </section>
      <section className="home-search page-container">
        <div>
          <span className="eyebrow">BIG PLANS START WITH A SMALL SEARCH</span>
          <h2>Where do you want to go?</h2>
        </div>
        <form action="/explore" className="hero-search-form">
          <Search size={20} />
          <input
            aria-label="Search universities, countries, or majors"
            name="q"
            placeholder="Search universities, countries, or majors…"
          />
          <Button type="submit">
            Find your direction
            <ArrowRight size={16} />
          </Button>
        </form>
        <div className="quick-search">
          <span>Start with</span>
          {[
            ["United States", "region=United+States"],
            ["Europe", "region=Europe"],
            ["Computer Science", "major=Computer+Science"],
            ["Business", "major=Business+%2F+Management"],
            ["Full tuition opportunities", "aid=tuition"],
          ].map(([label, query]) => {
            const count = searchUniversities(
              universities,
              Object.fromEntries(new URLSearchParams(query)),
            ).length;
            return count ? (
              <Link key={label} href={`/explore?${query}`}>
                {label} · {count}
                <ArrowUpRight size={12} />
              </Link>
            ) : (
              <span key={label}>{label} · no verified records yet</span>
            );
          })}
        </div>
      </section>
      <section className="how-section page-container" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LESS GUESSWORK. MORE DIRECTION.</span>
            <h2>A clearer path to your next chapter.</h2>
          </div>
          <p>
            From your first search to your final checklist.
            <br />
            Make each decision with the full picture.
          </p>
        </div>
        <div className="steps-grid">
          {[
            {
              icon: Compass,
              n: "01",
              title: "Find your possibilities",
              text: "Explore institutions by subject, location and international funding policy.",
              href: "/explore",
              action: "Discover universities",
            },
            {
              icon: Columns3,
              n: "02",
              title: "Look beyond tuition",
              text: "Compare funding policies and uncover the costs that an award may leave behind.",
              href: "/calculator",
              action: "Understand your funding gap",
            },
            {
              icon: Route,
              n: "03",
              title: "Make your next move",
              text: "Save your shortlist, track requirements and build an application plan of your own.",
              href: "/planner",
              action: "Build your application plan",
            },
          ].map((s) => (
            <article key={s.n} className="step-card">
              <div>
                <span className="step-icon">
                  <s.icon size={24} />
                </span>
                <span className="step-number">{s.n}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <Link className="text-link" href={s.href}>
                {s.action}
                <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="featured-section">
        <div className="page-container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A CONSIDERED STARTING POINT</span>
              <h2>Ambition deserves a place to grow.</h2>
              <p>
                Explore institutions with source-backed international aid
                policies.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/explore">
                View all {universities.length} universities
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="university-grid">
            {["harvard", "princeton", "yale"].map((id) => (
              <UniversityCard
                key={id}
                university={universities.find((u) => u.id === id)!}
              />
            ))}
          </div>
          <p className="section-footnote">
            <ShieldCheck size={14} /> A small, carefully researched collection.
            These are highly selective institutions; funding eligibility does
            not predict admission.
          </p>
        </div>
      </section>
      <section className="calculator-preview page-container">
        <div className="calculator-preview-copy">
          <span className="eyebrow">MEET YOUR FUNDING GAP</span>
          <h2>
            “Full tuition” isn’t
            <br />
            the full picture.
          </h2>
          <p>
            Housing, meals, insurance, travel. They add up. See what’s covered,
            what remains, and what still needs an answer.
          </p>
          <Button asChild>
            <Link href="/calculator">
              Calculate your funding gap
              <ArrowRight size={17} />
            </Link>
          </Button>
          <span className="tiny-note">Your numbers stay in your browser.</span>
        </div>
        <div className="funding-lesson">
          <div className="lesson-head">
            <span className="icon-box">
              <Columns3 size={21} />
            </span>
            <span>Know the difference</span>
            <span className="tag neutral">Funding 101</span>
          </div>
          <div className="lesson-row">
            <span className="lesson-dot blue" />
            <div>
              <h3>Full tuition</h3>
              <p>Tuition covered. Living and additional costs may remain.</p>
            </div>
          </div>
          <div className="lesson-row">
            <span className="lesson-dot teal" />
            <div>
              <h3>Full cost of attendance</h3>
              <p>
                May include tuition and living costs. Verify the award’s exact
                terms.
              </p>
            </div>
          </div>
          <div className="lesson-row">
            <span className="lesson-dot amber" />
            <div>
              <h3>Full demonstrated need</h3>
              <p>
                The university calculates what your family can contribute. It
                may not be zero.
              </p>
            </div>
          </div>
          <Link href="/funding" className="lesson-footer">
            Understand the language of funding
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="planning-banner page-container">
        <div>
          <span className="eyebrow">
            A LITTLE ORGANIZATION. A LOT MORE CLARITY.
          </span>
          <h2>Your applications, all in one place.</h2>
          <p>
            A shortlist that becomes a checklist. Notes, tasks, and your own
            deadlines.
          </p>
          <Link className="text-link" href="/dashboard">
            Open your workspace
            <ArrowRight size={16} />
          </Link>
        </div>
        <div
          className="planning-demo"
          aria-label="Example application checklist"
        >
          <span className="tiny-note">
            EXAMPLE CHECKLIST · NOT YOUR SAVED PROGRESS
          </span>
          {[
            "Explore funding requirements",
            "Draft your personal statement",
            "Ask for a recommendation",
          ].map((t, i) => (
            <div key={t}>
              <span className={i === 0 ? "demo-check done" : "demo-check"}>
                {i === 0 && <Check size={13} />}
              </span>
              {t}
              <span className="demo-status">
                {i === 0 ? "Researched" : "To do"}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="transparency page-container">
        <div className="transparency-icon">
          <ShieldCheck size={30} />
        </div>
        <div>
          <span className="eyebrow">CONFIDENCE STARTS WITH CONTEXT</span>
          <h2>Every claim should have a source.</h2>
          <p>
            We link to official university information, show when it was
            checked, and say when we don’t know. No invented awards. No
            admission predictions.
          </p>
          <Link href="/about" className="text-link">
            Read our research methodology
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <section className="final-cta page-container">
        <span>
          <Sparkles size={20} /> YOUR NEXT CHAPTER IS YOURS TO WRITE
        </span>
        <h2>
          Start with possibility.
          <br />
          Move forward with a plan.
        </h2>
        <Button asChild>
          <Link href="/explore">
            Find your direction
            <ArrowRight size={17} />
          </Link>
        </Button>
        <p>
          <Bookmark size={14} /> Free to explore. No account required.
        </p>
      </section>
    </>
  );
}
