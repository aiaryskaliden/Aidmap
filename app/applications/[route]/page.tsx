import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApplicationRouteChecklist } from "@/components/studio/application-route-checklist";
import { applicationRoutes } from "@/lib/studio/application-routes";

type RoutePageProps = { params: Promise<{ route: string }> };

export function generateStaticParams() {
  return applicationRoutes.map(({ id }) => ({ route: id }));
}

export async function generateMetadata({
  params,
}: RoutePageProps): Promise<Metadata> {
  const { route } = await params;
  const application = applicationRoutes.find(({ id }) => id === route);
  return {
    title: application
      ? `${application.name} preparation`
      : "Application not found",
  };
}

export default async function ApplicationRoutePage({ params }: RoutePageProps) {
  const { route } = await params;
  const application = applicationRoutes.find(({ id }) => id === route);
  if (!application) notFound();
  return <ApplicationRouteChecklist route={application} />;
}
