import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ApplicationLock } from "@/components/studio/application-lock";
import { UniversityApplication } from "@/components/studio/university-application";
import { findDossier } from "@/data/core-admissions";
import { findUniversity, opportunities } from "@/data/universities";
import { getMembership } from "@/lib/billing/membership";
import { pricingPath } from "@/lib/billing/plans";
import { officialEssaySource } from "@/lib/studio/application-plan";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ billing?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const school = findUniversity((await params).slug);
  return {
    title: school
      ? `${school.name} application workspace`
      : "University not found",
    robots: { index: false, follow: true },
  };
}

export default async function UniversityApplicationPage({
  params,
  searchParams,
}: PageProps) {
  const school = findUniversity((await params).slug);
  if (!school) notFound();
  const membership = await getMembership();
  if (membership.plan !== "pro") {
    if (
      membership.mode === "stripe" &&
      (await searchParams).billing === "checkout-complete"
    ) {
      redirect(
        pricingPath(`/universities/${school.id}/apply`, "checkout-pending"),
      );
    }
    const { id, name, city, country, initials, color } = school;
    return (
      <ApplicationLock school={{ id, name, city, country, initials, color }} />
    );
  }

  const dossier = findDossier(school.id);
  return (
    <UniversityApplication
      school={school}
      dossier={dossier}
      awards={opportunities.filter((award) => award.universityId === school.id)}
      writingSource={officialEssaySource(school, dossier)}
    />
  );
}
