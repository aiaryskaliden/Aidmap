import Link from "next/link";
import { ArrowRight, ShieldCheck, BookOpen, CircleHelp } from "lucide-react";
import { PageHeading, ExternalLink } from "@/components/ui/shared";
export const metadata = {
  title: "About & methodology",
  description:
    "How AidMap researches university policies, tracks evidence and treats funding uncertainty.",
};
export default function AboutPage() {
  return (
    <div className="page-container about-page">
      <PageHeading
        eyebrow="ABOUT AIDMAP / TRUST THROUGH TRANSPARENCY"
        title="Better decisions start with honest information."
        description="Find universities. Understand funding. Plan your future."
      />
      <div className="about-lead">
        <ShieldCheck size={36} />
        <p>
          AidMap helps international undergraduate applicants see beyond tuition
          and turn university research into a practical application plan. We
          built it around a simple principle: an unknown answer is more useful
          than a false promise.
        </p>
      </div>
      <div className="about-grid">
        <article>
          <span className="eyebrow">01 / THE RESEARCH</span>
          <h2>A smaller database, carefully sourced.</h2>
          <p>
            This initial release contains eight US institutions with official
            evidence for international aid policies. It focuses on Fall 2027
            planning, but source dates and admission-cycle coverage are recorded
            separately.
          </p>
          <p>
            Official admissions, financial aid and academic pages support each
            field. Every source records a URL, a check date, the fields it
            supports, its cycle where available, and the important conditions.
            Initial research was checked on October 18, 2026.
          </p>
          <p>
            These institutions are highly selective and are not a representative
            set of all affordable options. Build a broader application strategy,
            including local options, as you research.
          </p>
          <h3>What the labels mean</h3>
          <dl className="methodology-labels">
            <div>
              <dt>
                <ShieldCheck size={16} />
                Verified from official source
              </dt>
              <dd>
                The stated policy appears in the linked official source. It is
                not a promise of admission, aid, or continued policy
                availability.
              </dd>
            </div>
            <div>
              <dt>
                <BookOpen size={16} />
                Needs rechecking
              </dt>
              <dd>
                The evidence is historical, ambiguous, or lacks the relevant
                cycle. General policies remain general until the institution
                confirms their application to Fall 2027.
              </dd>
            </div>
            <div>
              <dt>
                <CircleHelp size={16} />
                Not yet verified
              </dt>
              <dd>
                No sufficient evidence was collected. We store null, display the
                uncertainty, and exclude the field from filters requiring a
                known value.
              </dd>
            </div>
          </dl>
        </article>
        <article>
          <span className="eyebrow">02 / THE NUMBERS</span>
          <h2>Funding is not a guarantee.</h2>
          <p>
            <strong>Full tuition</strong> covers tuition under the award’s
            terms; housing, food, fees, insurance and travel may remain.{" "}
            <strong>Full cost of attendance</strong> can include those
            categories only when the specific award says so.
          </p>
          <p>
            <strong>Full demonstrated need</strong> means the institution
            determines a contribution using its own methodology. It does not
            necessarily mean zero cost. Employment expectations are not the same
            as grant aid.
          </p>
          <p>
            The calculator adds every annual cost category, subtracts only an
            explicitly entered confirmed award, then compares the remainder with
            your annual contribution. If a category is unknown, the total and
            gap stay unknown. A hypothetical award appears as a separate what-if
            result.
          </p>
          <p>
            Institutional Fall 2027 costs have not yet been verified in this
            release. Calculator values you enter are labeled as your estimates,
            even if you consulted an official page. Your self-reported written
            award remains distinct from AidMap-verified data.
          </p>
          <p>
            Currencies remain separate. No exchange-rate feed or automatic
            conversion is used; switching currencies clears monetary inputs.
          </p>
        </article>
        <article id="matching">
          <span className="eyebrow">03 / EXPLAINABLE MATCHING</span>
          <h2>A research match, with reasons.</h2>
          <p>
            Rules check preferred study countries, documented academic subjects
            and available international aid policies. Each match explains
            itself. The system flags unknown funding, mismatched merit
            preferences and unestablished affordability.
          </p>
          <p>
            Citizenship-specific exceptions, year-specific requirements, test
            exemptions and deadline compatibility still require individual
            review. SAT, ACT and grades are saved as context; they do not
            produce probabilities or rankings. Extracurricular activity counts
            are not collected or penalized.
          </p>
          <p>
            There are no admissions “safety” labels, hidden scores or paid AI
            services. A future matching release can add more rules once the
            evidence supports them.
          </p>
        </article>
        <article>
          <span className="eyebrow">04 / YOUR PRIVACY</span>
          <h2>Local by design.</h2>
          <p>
            Shortlists, comparison selections, preferences, notes, tasks, theme
            and scenarios remain in your browser. There is no required account
            or applicant-data backend. Core features work without API keys.
          </p>
          <p>
            Use JSON exports to back up or move your workspace. Exports contain
            the data you entered: store them privately. Importing a validated
            backup replaces your current workspace. CSV export contains your
            shortlist and custom dates.
          </p>
          <p>
            Clearing browser data removes the workspace. Anyone with access to
            the same browser profile may be able to read it. You can delete
            everything from Preferences.
          </p>
          <Link href="/profile#data" className="text-link">
            Manage your saved data
            <ArrowRight size={16} />
          </Link>
        </article>
      </div>
      <section className="panel about-limitations">
        <h2>What this first release does and doesn’t know.</h2>
        <p>
          Admission deadlines, application fees/platforms, complete costs, some
          merit policies and renewal conditions remain unverified. Aid deadlines
          are labeled separately and shown only where research supports the
          relevant cycle. European universities and competitive scholarship
          awards are not yet in the verified collection.
        </p>
        <p>
          Policies can change. Always read the official page again before
          applying. AidMap has no affiliation with the listed institutions.
        </p>
        <div className="resource-links">
          <ExternalLink href="https://educationusa.state.gov/">
            EducationUSA: official US study guidance
          </ExternalLink>
          <ExternalLink href="https://cssprofile.collegeboard.org/">
            College Board: CSS Profile
          </ExternalLink>
        </div>
      </section>
      <div className="bottom-callout">
        <div>
          <h2>Make your next decision with more context.</h2>
          <p>Start exploring, and keep the questions visible.</p>
        </div>
        <Link className="button button-primary" href="/explore">
          Explore universities
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
