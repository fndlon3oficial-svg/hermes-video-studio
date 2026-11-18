import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/download/$id")({
  head: () => ({
    meta: [
      { title: "Exportação concluída — FNL_Edição" },
      { name: "description", content: "Seu vídeo está pronto para baixar." },
      { property: "og:title", content: "Exportação concluída — FNL_Edição" },
      { property: "og:description", content: "Seu vídeo está pronto para baixar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: p } = useQuery({ queryKey: ["project", id, "dl"], queryFn: async () => (await supabase.from("projects").select("*").eq("id", id).single()).data });
  if (!p) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const url = p.final_url ?? p.preview_url;

  const markDownloaded = async () => {
    await supabase.from("projects").update({ status: "baixado", downloaded_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h1 className="mt-4 font-display text-4xl font-bold">Exportação concluída</h1>
      <p className="mt-2 text-muted-foreground">{p.title} — v{p.version}</p>
      {url && <video src={url} controls className="mt-8 aspect-video w-full rounded-3xl bg-studio" />}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {url && (
          <a href={url} download target="_blank" rel="noreferrer" onClick={markDownloaded}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-glow">
            <Download className="h-5 w-5" /> Baixar vídeo
          </a>
        )}
        <Link to="/projeto/$id" params={{ id }} className="inline-flex items-center gap-2 rounded-full bg-muted px-6 py-3 font-medium">
          <MessageSquare className="h-5 w-5" /> Fazer alterações
        </Link>
        <Link to="/" className="inline-flex items-center rounded-full px-6 py-3 font-medium text-muted-foreground hover:text-foreground">Voltar ao início</Link>
      </div>
    </div>
  );
}
