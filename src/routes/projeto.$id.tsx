import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Loader2, Send, Sparkles, Trash2, MessageSquare, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { finalizeJob, sendCorrections } from "@/lib/hermes";
import { STATUS_LABEL, fmtTime } from "@/lib/status";

export const Route = createFileRoute("/projeto/$id")({
  head: () => ({
    meta: [
      { title: "Revisão & Correções — FNL_Edição" },
      { name: "description", content: "Revise o vídeo gerado, comente cada trecho e envie correções à IA." },
      { property: "og:title", content: "Revisão & Correções — FNL_Edição" },
      { property: "og:description", content: "Revise o vídeo gerado, comente cada trecho e envie correções à IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Review,
});

function Review() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSeg, setActiveSeg] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [working, setWorking] = useState<"" | "corr" | "final">("");
  const [time, setTime] = useState(0);
  const sendCorr = sendCorrections;
  const finalize = finalizeJob;

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const [p, s, c] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("segments").select("*").eq("project_id", id).order("start_seconds"),
        supabase.from("segment_comments").select("*").eq("project_id", id).order("created_at"),
      ]);
      if (p.error) throw p.error;
      return { project: p.data, segments: s.data ?? [], comments: c.data ?? [] };
    },
    refetchInterval: (q) => (["gerando", "finalizando"].includes(q.state.data?.project.status ?? "") ? 3000 : false),
  });

  if (isLoading || !data) return <div className="flex min-h-[60vh] items-center justify-center bg-studio"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const { project, segments, comments } = data;
  const seg = segments.find((s) => s.id === activeSeg) ?? segments[0];
  const pending = comments.filter((c) => !c.sent);
  const total = Math.max(project.duration_seconds, ...segments.map((s) => Number(s.end_seconds)), 1);
  const refresh = () => qc.invalidateQueries({ queryKey: ["project", id] });

  const selectSeg = (s: (typeof segments)[number]) => {
    setActiveSeg(s.id);
    if (videoRef.current) videoRef.current.currentTime = Number(s.start_seconds);
  };

  const addComment = async () => {
    if (!seg || !draft.trim()) return;
    await supabase.from("segment_comments").insert({ segment_id: seg.id, project_id: id, body: draft.trim().slice(0, 2000) });
    setDraft(""); refresh();
  };
  const delComment = async (cid: string) => { await supabase.from("segment_comments").delete().eq("id", cid); refresh(); };

  const submitCorrections = async () => {
    if (!pending.length || !project.hermes_job_id) return;
    setWorking("corr");
    try {
      const corrections = segments
        .map((s) => ({ label: s.label, start: Number(s.start_seconds), end: Number(s.end_seconds), comments: pending.filter((c) => c.segment_id === s.id).map((c) => c.body) }))
        .filter((c) => c.comments.length);
      const job = await sendCorr({ data: { jobId: project.hermes_job_id, corrections } });
      await supabase.from("segment_comments").update({ sent: true }).in("id", pending.map((c) => c.id));
      await supabase.from("projects").update({ status: job.status, progress: job.progress, preview_url: job.previewUrl ?? project.preview_url, version: project.version + 1, updated_at: new Date().toISOString() }).eq("id", id);
      toast.success(`Correções enviadas — gerando v${project.version + 1}`);
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao enviar"); }
    finally { setWorking(""); }
  };

  const finalizeAndDownload = async () => {
    if (!project.hermes_job_id) return;
    if (project.final_url) return navigate({ to: "/download/$id", params: { id } });
    setWorking("final");
    try {
      const job = await finalize({ data: { jobId: project.hermes_job_id } });
      await supabase.from("projects").update({ status: job.status, progress: job.progress, final_url: job.finalUrl ?? null, updated_at: new Date().toISOString() }).eq("id", id);
      if (job.finalUrl) navigate({ to: "/download/$id", params: { id } });
      else { toast.success("Finalizando no Hermes… avisaremos aqui quando estiver pronto."); refresh(); }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao finalizar"); }
    finally { setWorking(""); }
  };

  const busy = project.status === "gerando" || project.status === "finalizando";

  return (
    <div className="bg-studio text-studio-foreground">
      <div className="border-b border-studio-raised bg-background text-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/" className="rounded-full p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-xl font-semibold">{project.title} — v{project.version}</h1>
          <span className="rounded-full border border-primary/40 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{STATUS_LABEL[project.status]}</span>
          <div className="ml-auto flex gap-2">
            <button onClick={submitCorrections} disabled={!pending.length || !!working || busy} className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium disabled:opacity-50">
              {working === "corr" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              Enviar Correções <span className="rounded-full bg-accent px-2 text-xs text-accent-foreground">{pending.length} pendentes</span>
            </button>
            <button onClick={finalizeAndDownload} disabled={!!working || busy} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              {working === "final" ? <Loader2 className="h-4 w-4 animate-spin" /> : project.final_url ? <Download className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
              {project.final_url ? "Baixar" : "Finalizar & Baixar"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-studio-panel ring-1 ring-studio-raised">
            {busy ? (
              <div className="flex aspect-video flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>{STATUS_LABEL[project.status]} no Hermes… {project.progress}%</p>
              </div>
            ) : project.preview_url ? (
              <video ref={videoRef} src={project.preview_url} controls className="aspect-video w-full bg-studio" onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} />
            ) : (
              <div className="flex aspect-video items-center justify-center text-studio-muted">Sem prévia</div>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-studio-panel p-4 ring-1 ring-studio-raised">
            <div className="mb-3 flex items-center justify-between text-xs text-studio-muted">
              <span className="font-mono">Linha do tempo · clique para selecionar um trecho</span>
              <span className="font-mono text-primary">{fmtTime(time)}</span>
            </div>
            <div className="relative h-16 rounded-xl bg-studio-raised">
              {segments.map((s) => {
                const left = (Number(s.start_seconds) / total) * 100, width = ((Number(s.end_seconds) - Number(s.start_seconds)) / total) * 100;
                const n = comments.filter((c) => c.segment_id === s.id).length;
                const on = seg?.id === s.id;
                return (
                  <button key={s.id} onClick={() => selectSeg(s)} style={{ left: `${left}%`, width: `${width}%` }}
                    className={`absolute inset-y-1 overflow-hidden rounded-lg border-2 px-2 text-left text-xs transition ${on ? "border-primary bg-primary/25" : "border-studio-panel bg-studio hover:bg-studio-panel"}`}>
                    <span className="block truncate font-medium">{s.label}</span>
                    <span className="font-mono text-studio-muted">{fmtTime(Number(s.start_seconds))}{n > 0 && ` · ${n} nota(s)`}</span>
                  </button>
                );
              })}
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary" style={{ left: `${Math.min(100, (time / total) * 100)}%` }} />
            </div>
          </div>
        </div>

        <aside className="space-y-5 rounded-2xl bg-background p-5 text-foreground">
          {seg && (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Trecho ativo</p>
                <h2 className="mt-1 text-lg font-semibold">{seg.label} [{fmtTime(Number(seg.start_seconds))} – {fmtTime(Number(seg.end_seconds))}]</h2>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comentários do trecho</p>
                <div className="space-y-2">
                  {comments.filter((c) => c.segment_id === seg.id).map((c) => (
                    <div key={c.id} className="rounded-xl bg-muted p-3 text-sm">
                      <p>"{c.body}"</p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className={c.sent ? "text-success" : "text-primary"}>{c.sent ? "Enviado à IA" : "Pendente"}</span>
                        {!c.sent && <button onClick={() => delComment(c.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                      </div>
                    </div>
                  ))}
                  {!comments.some((c) => c.segment_id === seg.id) && <p className="text-sm text-muted-foreground">Nenhum comentário neste trecho.</p>}
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><MessageSquare className="h-4 w-4 text-primary" /> Nova instrução para a IA</p>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={2000}
                  placeholder="Ex: 'remover pausa', 'dar zoom no rosto', 'cortar para o orador'…"
                  className="w-full rounded-xl bg-muted p-3 text-sm outline-none ring-primary focus:ring-2" />
                <button onClick={addComment} disabled={!draft.trim()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  <Send className="h-4 w-4" /> Adicionar ao Trecho
                </button>
              </div>
            </>
          )}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Todos os trechos</p>
            <ul className="space-y-1">
              {segments.map((s) => {
                const n = comments.filter((c) => c.segment_id === s.id && !c.sent).length;
                return (
                  <li key={s.id}>
                    <button onClick={() => selectSeg(s)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm ${seg?.id === s.id ? "bg-accent ring-1 ring-primary/40" : "hover:bg-muted"}`}>
                      <span>{fmtTime(Number(s.start_seconds))} · {s.label}</span>
                      <span className={n ? "text-primary" : "text-muted-foreground"}>{n ? `${n} nota(s)` : "ok"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
