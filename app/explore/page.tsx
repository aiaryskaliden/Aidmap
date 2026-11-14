import Explorer from "@/components/universities/explorer";
export const metadata = {
  title: "Explore universities",
  description:
    "Filter source-backed undergraduate universities by subject, location and international funding policy.",
};
export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const input = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") params.set(key, value);
    else for (const item of value ?? []) params.append(key, item);
  }
  return <Explorer initialSearch={params.size ? `?${params}` : ""} />;
}
