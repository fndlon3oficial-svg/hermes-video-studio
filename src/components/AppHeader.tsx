import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

const nav = [
  { to: "/", label: "Meus Projetos" },
  { to: "/novo", label: "Novo Vídeo IA" },
  { to: "/templates", label: "Biblioteca de Templates" },
] as const;

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Link to="/" className="font-display text-xl font-bold">
          FNL<span className="text-primary">_Edição</span>
        </Link>
        <nav className="hidden gap-1 md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
              className="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground hover:text-secondary-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/novo" className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> Novo Projeto
        </Link>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
        <span><b className="text-foreground">FNL<span className="text-primary">_Edição</span></b> — Plataforma Criativa de Edição Automatizada</span>
        <span>Motor: Hermes AI · Google Cloud</span>
      </div>
    </footer>
  );
}
