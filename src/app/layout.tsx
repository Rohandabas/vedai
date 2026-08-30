import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markscheme — AI Assessment Extraction",
  description:
    "Upload a question paper and a handwritten answer sheet to extract, map, and grade answers automatically.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
