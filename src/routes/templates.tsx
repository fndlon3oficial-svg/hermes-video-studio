import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EDIT_STYLES } from "@/lib/status";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Templates — FNL_Edição" },
      { name: "description", content: "Gerencie templates de edição e LUTs de color grading." },
      { property: "og:title", content: "Biblioteca de Templates — FNL_Edição" },
      { property: "og:description", content: "Gerencie templates de edição e LUTs de color grading." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Templates,
});

function Templates() {
  const qc = useQueryClient();
  const { data: templates = [] } = useQuery({ queryKey: ["templates"], queryFn: async () => (await supabase.from("templates").select("*").order("created_at")).data ?? [] });
  const { data: luts = [] } = useQuery({ queryKey: ["luts"], queryFn: async () => (await supabase.from("luts").select("*").order("created_at")).data ?? [] });
  const [t, setT] = useState({ name: "", description: "", edit_style: "dinamico", lut_id: "", duration_seconds: 60 });
  const [lutName, setLutName] = useState("");

  const addTemplate = async () => {
    if (!t.name.trim()) { toast.error("Dê um nome ao template"); return; }
    const { error } = await supabase.from("templates").insert({ ...t, name: t.name.trim(), lut_id: t.lut_id || null });
    if (error) { toast.error(error.message); return; }
    setT({ ...t, name: "", description: "" }); qc.invalidateQueries({ queryKey: ["templates"] });
  };
  const addLut = async (file: File) => {
    if (file.size > 5_000_000) { toast.error("Arquivo .cube muito grande (máx 5MB)"); return; }
    const cube = await file.text();
    const { error } = await supabase.from("luts").insert({ name: lutName.trim() || file.name.replace(/\.cube$/i, ""), description: "LUT personalizado", cube_data: cube });
    if (error) { toast.error(error.message); return; }
    setLutName(""); qc.invalidateQueries({ queryKey: ["luts"] }); toast.success("LUT adicionado");
  };
  const del = async (table: "templates" | "luts", id: string) => { await supabase.from(table).delete().eq("id", id); qc.invalidateQueries({ queryKey: [table] }); };

  const input = "w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none ring-primary focus:ring-2";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-4xl font-bold">Biblioteca de Templates</h1>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Templates</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {templates.map((x) => (
            <div key={x.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
              <div className="flex justify-between"><p className="font-semibold">{x.name}</p><button onClick={() => del("templates", x.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button></div>
              <p className="mt-1 text-sm text-muted-foreground">{x.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">{EDIT_STYLES.find((s) => s.id === x.edit_style)?.name} · {x.duration_seconds}s · {luts.find((l) => l.id === x.lut_id)?.name ?? "sem LUT"}</p>
            </div>
          ))}
          <div className="space-y-2 rounded-2xl border-2 border-dashed border-border p-4">
            <input className={input} placeholder="Nome" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} />
            <input className={input} placeholder="Descrição" value={t.description} onChange={(e) => setT({ ...t, description: e.target.value })} />
            <select className={input} value={t.edit_style} onChange={(e) => setT({ ...t, edit_style: e.target.value })}>
              {EDIT_STYLES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className={input} value={t.lut_id} onChange={(e) => setT({ ...t, lut_id: e.target.value })}>
              <option value="">Sem LUT</option>
              {luts.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <input type="number" min={5} className={input} value={t.duration_seconds} onChange={(e) => setT({ ...t, duration_seconds: Number(e.target.value) || 60 })} />
            <button onClick={addTemplate} className="flex w-full items-center justify-center gap-1 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Criar template</button>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">LUTs</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {luts.map((l) => (
            <div key={l.id} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
              <div className="h-20" style={{ background: l.preview_gradient }} />
              <div className="flex items-start justify-between p-3">
                <div><p className="font-semibold">{l.name}</p><p className="text-xs text-muted-foreground">{l.description}</p></div>
                <button onClick={() => del("luts", l.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            </div>
          ))}
          <div className="space-y-2 rounded-2xl border-2 border-dashed border-border p-4">
            <input className={input} placeholder="Nome do LUT" value={lutName} onChange={(e) => setLutName(e.target.value)} />
            <label className="flex cursor-pointer items-center justify-center gap-1 rounded-full bg-secondary py-2 text-sm font-semibold text-secondary-foreground">
              <Upload className="h-4 w-4" /> Enviar .cube
              <input type="file" hidden accept=".cube" onChange={(e) => { const f = e.target.files?.[0]; if (f) addLut(f); e.target.value = ""; }} />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
