import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Film, Music, Upload, Sparkles, Loader2, X, Clapperboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createJob, signUpload } from "@/lib/hermes";
import { EDIT_STYLES, LANGUAGES } from "@/lib/status";

export const Route = createFileRoute("/novo")({
  head: () => ({
    meta: [
      { title: "Novo Vídeo IA — FNL_Edição" },
      { name: "description", content: "Envie seus vídeos, escolha estilo, LUT e legenda, e gere com IA." },
      { property: "og:title", content: "Novo Vídeo IA — FNL_Edição" },
      { property: "og:description", content: "Envie seus vídeos, escolha estilo, LUT e legenda, e gere com IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewVideo,
});

const STEPS = ["Mídias & Áudio", "Estilo / Template", "Ajustes", "Resumo"];
const DURATIONS = [15, 30, 60, 90, 180];

function NewVideo() {
  const navigate = useNavigate();
  const sign = useServerFn(signUpload);
  const create = useServerFn(createJob);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [videos, setVideos] = useState<File[]>([]);
  const [music, setMusic] = useState<File | null>(null);
  const [reference, setReference] = useState<File | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [editStyle, setEditStyle] = useState("dinamico");
  const [duration, setDuration] = useState(60);
  const [lang, setLang] = useState("pt-BR");
  const [lutId, setLutId] = useState<string | null>(null);

  const { data: templates = [] } = useQuery({ queryKey: ["templates"], queryFn: async () => (await supabase.from("templates").select("*").order("created_at")).data ?? [] });
  const { data: luts = [] } = useQuery({ queryKey: ["luts"], queryFn: async () => (await supabase.from("luts").select("*").order("created_at")).data ?? [] });

  const pickTemplate = (t: (typeof templates)[number]) => {
    if (templateId === t.id) return setTemplateId(null);
    setTemplateId(t.id); setEditStyle(t.edit_style); setDuration(t.duration_seconds); setLutId(t.lut_id);
  };

  const upload = async (f: File) => {
    const r = await sign({ data: { filename: f.name, contentType: f.type || "application/octet-stream" } });
    if (r.uploadUrl) {
      const res = await fetch(r.uploadUrl, { method: "PUT", body: f, headers: { "Content-Type": f.type || "application/octet-stream" } });
      if (!res.ok) throw new Error(`Falha ao enviar ${f.name}`);
    }
    return r.gcsPath;
  };

  const generate = async () => {
    setBusy(true);
    try {
      const vPaths = await Promise.all(videos.map(upload));
      const mPath = music ? await upload(music) : null;
      const rPath = reference ? await upload(reference) : null;
      const lut = luts.find((l) => l.id === lutId);
      const job = await create({ data: { videos: vPaths, music: mPath, reference: rPath, editStyle, templateId, durationSeconds: duration, subtitleLanguage: lang, lut: lut?.name ?? null } });
      const { data: proj, error } = await supabase.from("projects").insert({
        title: title || videos[0]?.name.replace(/\.[^.]+$/, "") || "Novo vídeo",
        status: job.status, progress: job.progress, hermes_job_id: job.jobId, preview_url: job.previewUrl ?? null,
        duration_seconds: duration,
        config: { videos: vPaths, music: mPath, reference: rPath, editStyle, templateId, subtitleLanguage: lang, lut: lut?.name ?? null },
      }).select().single();
      if (error) throw error;
      const segs = job.segments ?? [{ label: "Vídeo completo", start: 0, end: duration }];
      await supabase.from("segments").insert(segs.map((s) => ({ project_id: proj.id, label: s.label, start_seconds: s.start, end_seconds: s.end })));
      toast.success("Vídeo enviado ao Hermes!");
      navigate({ to: "/projeto/$id", params: { id: proj.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar vídeo");
    } finally { setBusy(false); }
  };

  const canNext = step !== 0 || videos.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl font-bold">Novo Vídeo IA</h1>
      <ol className="mt-6 flex gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <button onClick={() => (i < step || canNext) && setStep(i)} className="w-full text-left">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
              <span className={`mt-2 block text-xs font-medium ${i === step ? "text-primary" : "text-muted-foreground"}`}>Etapa {i + 1} · {s}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl bg-card p-8 ring-1 ring-border">
        {step === 0 && (
          <div className="space-y-6">
            <Field label="Nome do projeto">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Podcast Tech Talk #43" className="w-full rounded-xl bg-muted px-4 py-3 outline-none ring-primary focus:ring-2" />
            </Field>
            <Drop icon={Film} label="Vídeos brutos" hint="MP4, MOV — vários arquivos" accept="video/*" multiple onFiles={(f) => setVideos((v) => [...v, ...f])} />
            {videos.length > 0 && (
              <ul className="space-y-2">
                {videos.map((v, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl bg-muted px-4 py-2 text-sm">
                    <span className="truncate">{v.name}</span>
                    <button onClick={() => setVideos(videos.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
            <Drop icon={Music} label="Música (opcional)" hint={music?.name ?? "MP3, WAV"} accept="audio/*" onFiles={(f) => setMusic(f[0] ?? null)} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h3 className="font-display text-lg font-semibold">Templates prontos</h3>
              <p className="text-sm text-muted-foreground">Já vêm com estilo, LUT e duração.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {templates.map((t) => (
                  <Choice key={t.id} active={templateId === t.id} onClick={() => pickTemplate(t)} title={t.name} desc={t.description} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Ou escolha o estilo de edição</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {EDIT_STYLES.map((s) => (
                  <Choice key={s.id} active={editStyle === s.id} onClick={() => { setEditStyle(s.id); setTemplateId(null); }} title={s.name} desc={s.desc} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <Drop icon={Clapperboard} label="Vídeo de referência (opcional)" hint={reference?.name ?? "A IA copia o ritmo de corte"} accept="video/*" onFiles={(f) => setReference(f[0] ?? null)} />
            <Field label="Duração do vídeo final">
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => setDuration(d)} className={`rounded-full px-4 py-2 text-sm font-medium ${duration === d ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}>
                    {d < 60 ? `${d}s` : `${d / 60} min`}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Idioma da legenda">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button key={l.id} onClick={() => setLang(l.id)} className={`rounded-full px-4 py-2 text-sm font-medium ${lang === l.id ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}>{l.name}</button>
                ))}
              </div>
            </Field>
            <Field label="LUT (color grading + melhora de resolução)">
              <div className="grid gap-3 sm:grid-cols-4">
                {luts.map((l) => (
                  <button key={l.id} onClick={() => setLutId(lutId === l.id ? null : l.id)} className={`overflow-hidden rounded-2xl text-left ring-2 ${lutId === l.id ? "ring-primary" : "ring-transparent"}`}>
                    <div className="h-16" style={{ background: l.preview_gradient }} />
                    <div className="bg-muted p-2"><p className="text-sm font-semibold">{l.name}</p><p className="text-xs text-muted-foreground">{l.description}</p></div>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Sum k="Projeto" v={title || videos[0]?.name || "—"} />
            <Sum k="Vídeos" v={`${videos.length} arquivo(s)`} />
            <Sum k="Música" v={music?.name ?? "Nenhuma"} />
            <Sum k="Referência" v={reference?.name ?? "Nenhuma"} />
            <Sum k="Template" v={templates.find((t) => t.id === templateId)?.name ?? "Nenhum"} />
            <Sum k="Estilo" v={EDIT_STYLES.find((s) => s.id === editStyle)?.name ?? editStyle} />
            <Sum k="Duração" v={`${duration}s`} />
            <Sum k="Legenda" v={LANGUAGES.find((l) => l.id === lang)?.name ?? lang} />
            <Sum k="LUT" v={luts.find((l) => l.id === lutId)?.name ?? "Nenhum"} />
          </dl>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-full bg-muted px-6 py-3 font-medium disabled:opacity-40">Voltar</button>
        {step < 3 ? (
          <button disabled={!canNext} onClick={() => setStep(step + 1)} className="rounded-full bg-secondary px-6 py-3 font-semibold text-secondary-foreground disabled:opacity-40">
            {canNext ? "Continuar" : "Envie ao menos 1 vídeo"}
          </button>
        ) : (
          <button disabled={busy || videos.length === 0} onClick={generate} className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Gerar Vídeo
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-3 text-sm font-semibold">{label}</p>{children}</div>;
}
function Sum({ k, v }: { k: string; v: string }) {
  return <div className="rounded-2xl bg-muted p-4"><dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt><dd className="mt-1 truncate font-medium">{v}</dd></div>;
}
function Choice({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={`relative rounded-2xl p-4 text-left ring-2 transition ${active ? "bg-accent ring-primary" : "bg-muted ring-transparent hover:ring-border"}`}>
      {active && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
      <p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </button>
  );
}
function Drop({ icon: Icon, label, hint, accept, multiple, onFiles }: { icon: typeof Upload; label: string; hint: string; accept: string; multiple?: boolean; onFiles: (f: File[]) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-border p-6 transition hover:border-primary hover:bg-accent/40">
      <span className="rounded-xl bg-accent p-3 text-accent-foreground"><Icon className="h-6 w-6" /></span>
      <span><span className="block font-semibold">{label}</span><span className="text-sm text-muted-foreground">{hint}</span></span>
      <Upload className="ml-auto h-5 w-5 text-muted-foreground" />
      <input type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </label>
  );
}
