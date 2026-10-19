import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header, Footer } from "@/components/layout/shell";
export const metadata: Metadata = {
  title: { default: "AidMap — Your future, mapped.", template: "%s | AidMap" },
  description:
    "Discover universities, understand international financial aid, and build an application plan that fits your goals and budget.",
  openGraph: {
    title: "AidMap — Your future, mapped.",
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
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
