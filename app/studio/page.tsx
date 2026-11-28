import type { Metadata } from "next";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { ProfileBoard } from "@/components/studio/profile-board";
import { studioViews, type StudioView } from "@/components/studio/types";
import { findUniversity } from "@/data/universities";
import { studioHomeSchoolInfo, studioOptions } from "@/lib/studio/catalogue";
import { essayExercises } from "@/lib/studio/practice";

export const metadata: Metadata = {
  title: "Application studio",
  description:
    "Build your applicant profile, review your essays and activities, and check university requirements.",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; tab?: string; school?: string; exercise?: string }>;
}) {
  const { view, tab, school, exercise } = await searchParams;
  if ((view ?? tab) === "profile")
    return <ProfileBoard countries={studioOptions.countries} />;
  const section: StudioView =
    studioViews.find((candidate) => candidate === view) ?? "overview";
  const selected =
    (section === "fit" || section === "final") && typeof school === "string"
      ? findUniversity(school)
      : undefined;
  return (
    <StudioWorkspace
      view={section}
      schools={studioOptions.schools}
      countries={studioOptions.countries}
      homeSchools={section === "overview" ? studioHomeSchoolInfo : undefined}
      school={selected}
      exercise={
        section === "essays"
          ? essayExercises.find((item) => item.id === exercise)
          : undefined
      }
    />
  );
}
