import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Hermes engine (Google Cloud). Without HERMES_BASE_URL the app runs in simulated mode.
const SAMPLE_VIDEO = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

function cfg() {
  const base = process.env["HERMES_BASE_URL"];
  const key = process.env["HERMES_API_KEY"];
  return base ? { base: base.replace(/\/$/, ""), key } : null;
}

async function hermes(path: string, init: RequestInit = {}) {
  const c = cfg()!;
  const res = await fetch(`${c.base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(c.key ? { Authorization: `Bearer ${c.key}` } : {}), ...init.headers },
  });
  if (!res.ok) throw new Error(`Hermes [${res.status}]: ${await res.text()}`);
  return res.json();
}

export type HermesSegment = { label: string; start: number; end: number };
export type HermesJob = {
  jobId: string;
  status: "gerando" | "revisao" | "finalizando" | "pronto" | "erro";
  progress: number;
  previewUrl?: string;
  finalUrl?: string;
  segments?: HermesSegment[];
};

const mockSegments = (d: number): HermesSegment[] => {
  const n = 4, step = d / n;
  return ["Abertura / Gancho", "Desenvolvimento", "Momento-chave", "Fechamento"].slice(0, n).map((label, i) => ({
    label, start: Math.round(i * step), end: Math.round((i + 1) * step),
  }));
};

export const getHermesMode = createServerFn({ method: "GET" }).handler(async () => ({ simulated: !cfg() }));

export const signUpload = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ filename: z.string().max(300), contentType: z.string().max(100) }).parse(d))
  .handler(async ({ data }) => {
    if (!cfg()) return { uploadUrl: null as string | null, gcsPath: `simulado://${data.filename}` };
    return (await hermes("/uploads/sign", { method: "POST", body: JSON.stringify(data) })) as { uploadUrl: string; gcsPath: string };
  });

const jobInput = z.object({
  videos: z.array(z.string()).min(1).max(50),
  music: z.string().nullable(),
  reference: z.string().nullable(),
  editStyle: z.string().max(60),
  templateId: z.string().nullable(),
  durationSeconds: z.number().int().min(5).max(3600),
  subtitleLanguage: z.string().max(20),
  lut: z.string().nullable(),
});

export const createJob = createServerFn({ method: "POST" })
  .inputValidator((d) => jobInput.parse(d))
  .handler(async ({ data }): Promise<HermesJob> => {
    if (!cfg()) {
      return { jobId: `sim-${crypto.randomUUID()}`, status: "revisao", progress: 100, previewUrl: SAMPLE_VIDEO, segments: mockSegments(data.durationSeconds) };
    }
    return hermes("/jobs", { method: "POST", body: JSON.stringify(data) });
  });

export const getJob = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ jobId: z.string().max(200) }).parse(d))
  .handler(async ({ data }): Promise<HermesJob> => {
    if (!cfg()) return { jobId: data.jobId, status: "revisao", progress: 100, previewUrl: SAMPLE_VIDEO };
    return hermes(`/jobs/${encodeURIComponent(data.jobId)}`);
  });

export const sendCorrections = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      jobId: z.string().max(200),
      corrections: z.array(z.object({ label: z.string(), start: z.number(), end: z.number(), comments: z.array(z.string().max(2000)) })).min(1),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<HermesJob> => {
    if (!cfg()) return { jobId: data.jobId, status: "revisao", progress: 100, previewUrl: SAMPLE_VIDEO };
    return hermes(`/jobs/${encodeURIComponent(data.jobId)}/corrections`, { method: "POST", body: JSON.stringify({ corrections: data.corrections }) });
  });

export const finalizeJob = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ jobId: z.string().max(200) }).parse(d))
  .handler(async ({ data }): Promise<HermesJob> => {
    if (!cfg()) return { jobId: data.jobId, status: "pronto", progress: 100, previewUrl: SAMPLE_VIDEO, finalUrl: SAMPLE_VIDEO };
    return hermes(`/jobs/${encodeURIComponent(data.jobId)}/finalize`, { method: "POST" });
  });
