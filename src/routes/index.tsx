import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Download, MessageSquare, Search, Loader2, CheckCircle2, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, fmtTime } from "@/lib/status";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meus Projetos — FNL_Edição" },
      { name: "description", content: "Seus vídeos editados por IA: em revisão, prontos e baixados." },
      { property: "og:title", content: "Meus Projetos — FNL_Edição" },
      { property: "og:description", content: "Seus vídeos editados por IA: em revisão, prontos e baixados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [q, setQ] = useState("");
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });
  const ready = projects.filter((p) => p.status === "pronto").length;
  const review = projects.filter((p) => p.status === "revisao").length;
  const list = projects.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <section className="bg-hero">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-5xl font-bold">Olá!</h1>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">
              Você tem <b className="text-primary">{ready} vídeo(s) prontos</b> para baixar e{" "}
              <b className="text-foreground">{review} em revisão</b>.
            </p>
          </div>
          <Link to="/novo" className="inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-5 text-lg font-semibold text-primary-foreground shadow-glow transition hover:-translate-y-0.5">
            Criar Novo Vídeo com IA <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-3xl bg-muted p-4">
          <h2 className="pl-2 font-display text-xl font-semibold">Meus Projetos</h2>
          <label className="flex w-full max-w-sm items-center gap-2 rounded-full bg-card px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título…" className="w-full bg-transparent text-sm outline-none" />
          </label>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-20 text-center">
            <Film className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Nenhum projeto ainda.</p>
            <Link to="/novo" className="mt-4 inline-block font-semibold text-primary">Criar o primeiro vídeo →</Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </>
  );
}

type P = { id: string; title: string; status: string; progress: number; duration_seconds: number; version: number; preview_url: string | null; downloaded_at: string | null };

function ProjectCard({ p }: { p: P }) {
  const busy = p.status === "gerando" || p.status === "finalizando";
  return (
    <div className="flex flex-col rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
      <Link to="/projeto/$id" params={{ id: p.id }} className="relative block aspect-video overflow-hidden rounded-2xl bg-studio">
        {p.preview_url && !busy ? (
          <video src={p.preview_url} muted preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-studio-muted">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Film className="h-6 w-6" />}
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium">
          {p.status === "baixado" && <CheckCircle2 className="h-3 w-3 text-success" />}
          {STATUS_LABEL[p.status] ?? p.status}{busy && ` (${p.progress}%)`}
        </span>
        <span className="absolute bottom-2 right-2 rounded-md bg-card/95 px-1.5 py-0.5 font-mono text-xs">{fmtTime(p.duration_seconds)}</span>
      </Link>
      <p className="mt-3 text-xs text-muted-foreground">Versão v{p.version}</p>
      <h3 className="mt-1 line-clamp-1 font-display text-lg font-semibold">{p.title}</h3>
      {busy && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
        </div>
      )}
      <div className="mt-auto flex gap-2 pt-4">
        <Link to="/projeto/$id" params={{ id: p.id }} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-muted px-3 py-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" /> Correções
        </Link>
        {(p.status === "pronto" || p.status === "baixado") && (
          <Link to="/download/$id" params={{ id: p.id }} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <Download className="h-4 w-4" /> Baixar
          </Link>
        )}
      </div>
    </div>
  );
}
