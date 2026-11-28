import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppFrame } from "@/components/layout/section-canvas";
import { universities } from "@/data/universities";

const schoolNames = Object.fromEntries(
  universities.map(({ id, shortName }) => [id, shortName]),
);
export const metadata: Metadata = {
  title: {
    default: "AidMap — Undergraduate universities and funding",
    template: "%s | AidMap",
  },
  description:
    "Discover universities, understand international financial aid, and build an application plan that fits your goals and budget.",
  openGraph: {
    title: "AidMap — Undergraduate universities and funding",
    description:
      "A transparent university research and financial aid planning tool for international students.",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <AppFrame schoolNames={schoolNames}>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
