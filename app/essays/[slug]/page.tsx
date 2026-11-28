import { ReadingGuide, type ReadingPageProps } from "@/components/discover/reading-guide";
import { findReading } from "@/lib/discovery/catalogue";

export async function generateMetadata({ params }: ReadingPageProps) {
  return { title: findReading("essay", (await params).slug)?.title ?? "Guide not found" };
}

export default async function Page({ params, searchParams }: ReadingPageProps) {
  const [{ slug }, { billing }] = await Promise.all([params, searchParams]);
  return <ReadingGuide kind="essay" slug={slug} billing={billing} />;
}
