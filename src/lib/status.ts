export type ProjectStatus = "gerando" | "revisao" | "finalizando" | "pronto" | "baixado" | "erro";
export const STATUS_LABEL: Record<string, string> = {
  gerando: "Gerando com IA",
  revisao: "Em Revisão",
  finalizando: "Finalizando",
  pronto: "Pronto para Baixar",
  baixado: "Baixado",
  erro: "Erro",
};
export const fmtTime = (s: number) => {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};
export const EDIT_STYLES = [
  { id: "viral", name: "Viral / Reels", desc: "Cortes rápidos, zooms e legendas chamativas" },
  { id: "podcast", name: "Podcast", desc: "Foco em quem fala, split de câmeras" },
  { id: "cinematico", name: "Cinematográfico", desc: "Ritmo calmo, transições suaves" },
  { id: "dinamico", name: "Dinâmico", desc: "Equilíbrio entre ritmo e respiro" },
];
export const LANGUAGES = [
  { id: "pt-BR", name: "Português (BR)" },
  { id: "en", name: "Inglês" },
  { id: "es", name: "Espanhol" },
  { id: "none", name: "Sem legenda" },
];
