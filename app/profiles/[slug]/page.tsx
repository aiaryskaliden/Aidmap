import { ReadingGuide, type ReadingPageProps } from "@/components/discover/reading-guide";
import { findReading } from "@/lib/discovery/catalogue";

export async function generateMetadata({ params }: ReadingPageProps) {
  return { title: findReading("profile", (await params).slug)?.title ?? "Guide not found" };
}

export default async function Page({ params, searchParams }: ReadingPageProps) {
  const [{ slug }, { billing }] = await Promise.all([params, searchParams]);
  return <ReadingGuide kind="profile" slug={slug} billing={billing} />;
}
