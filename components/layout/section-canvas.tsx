"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Header, Footer } from "./shell";
import styles from "./shell.module.css";

const discoveryRoutes = new Set([
  "/explore",
  "/profiles",
  "/essays",
  "/compare",
  "/match",
]);
const fundingRoutes = new Set(["/funding", "/calculator"]);
const planningRoutes = new Set([
  "/planner",
  "/my-list",
  "/dashboard",
  "/start",
]);

function FoldBanner({
  tone,
}: {
  tone: "plan" | "discover" | "funding" | "studio";
}) {
  return (
    <div className={styles.foldBanner} data-tone={tone} aria-hidden="true">
      <div className={styles.foldArt} />
    </div>
  );
}

function StudioFoldBanner() {
  const params = useSearchParams();
  const view = params.get("view") ?? params.get("tab");
  return view && view !== "overview" && view !== "profile" ? (
    <FoldBanner tone="studio" />
  ) : null;
}

export function AppFrame({
  schoolNames,
  children,
}: {
  schoolNames: Record<string, string>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/pricing") return <main id="main">{children}</main>;
  const tone = fundingRoutes.has(pathname)
    ? "funding"
    : planningRoutes.has(pathname)
      ? "plan"
      : discoveryRoutes.has(pathname) || pathname.startsWith("/universities/")
        ? "discover"
        : "studio";

  return (
    <div className="aidmap-layout">
      <Header schoolNames={schoolNames} />
      <div className="aidmap-content">
        <main id="main" className={styles.canvas}>
          {pathname === "/studio" ? (
            <Suspense>
              <StudioFoldBanner />
            </Suspense>
          ) : pathname !== "/" && !pathname.startsWith("/applications/") ? (
            <FoldBanner tone={tone} />
          ) : null}
          <div className={styles.canvasContent}>{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
