import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SCOLARIA",
    template: "%s · SCOLARIA",
  },
  description:
    "Plateforme intelligente de pilotage pédagogique pour établissements d'enseignement.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
