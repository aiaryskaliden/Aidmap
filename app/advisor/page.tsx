import type { Metadata } from "next";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { findUniversity } from "@/data/universities";
import { studioOptions } from "@/lib/studio/catalogue";

export const metadata: Metadata = {
  title: "Admissions Advisor",
  description:
    "Compare undergraduate programmes, check official requirements and plan your application with AidMap.",
};

export default async function AdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{
    university?: string | string[];
    question?: string | string[];
  }>;
}) {
  const { university, question } = await searchParams;
  const selected =
    typeof university === "string" && findUniversity(university)
      ? university
      : undefined;
  return (
    <StudioWorkspace
      view="chat"
      schools={studioOptions.schools}
      countries={studioOptions.countries}
      selected={selected}
      initialQuestion={
        typeof question === "string" ? question.slice(0, 700) : undefined
      }
    />
  );
}
