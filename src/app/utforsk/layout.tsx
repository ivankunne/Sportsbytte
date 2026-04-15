import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Utforsk utstyr",
  description: "Finn brukt sportsutstyr fra klubber over hele Norge. Filtrer på kategori, pris og tilstand.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
