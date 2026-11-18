import { z } from "zod";
import type { HermesJob } from "./hermes.functions";
const jobSchema = z.object({ jobId: z.string().min(1), status: z.enum(["gerando", "revisao", "finalizando", "pronto", "erro"]), progress: z.number().min(0).max(100), previewUrl: z.string().url().optional(), finalUrl: z.string().url().optional(), segments: z.array(z.object({ label: z.string(), start: z.number(), end: z.number() })).optional() });
function parseJob(value: unknown): HermesJob {
  const job = jobSchema.parse(value);
  return { jobId: job.jobId, status: job.status, progress: job.progress,
    ...(job.previewUrl ? { previewUrl: job.previewUrl } : {}),
    ...(job.finalUrl ? { finalUrl: job.finalUrl } : {}),
    ...(job.segments ? { segments: job.segments } : {}) };
}
export function validateHermesUrl(value: string | undefined) {
  if (!value) throw new Error("Configure a URL pública do Hermes no GitHub para gerar vídeos.");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("A URL pública do Hermes deve usar HTTPS e não conter credenciais.");
  return url.href.replace(/\/$/, "");
}
async function request(path: string, data?: unknown) {
  const base = validateHermesUrl(import.meta.env['VITE_HERMES_PUBLIC_URL']);
  const response = await fetch(`${base}${path}`, { method: data === undefined ? "GET" : "POST", headers: data === undefined ? {} : { "Content-Type": "application/json" }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  if (!response.ok) throw new Error(`Hermes [${response.status}]: ${await response.text()}`);
  return response.json();
}
export const getHermesMode = async () => ({ simulated: false });
export const signUpload = async ({ data }: { data: { filename: string; contentType: string } }) => {
  const result = z.object({ uploadUrl: z.string().url(), gcsPath: z.string().min(1) }).parse(await request("/uploads/sign", data));
  if (new URL(result.uploadUrl).protocol !== "https:") throw new Error("O endereço de envio deve usar HTTPS.");
  return result;
};
type CreateInput = { videos: string[]; music: string | null; reference: string | null; editStyle: string; templateId: string | null; durationSeconds: number; subtitleLanguage: string; lut: string | null };
export const createJob = async ({ data }: { data: CreateInput }): Promise<HermesJob> => parseJob(await request("/jobs", data));
export const getJob = async ({ data }: { data: { jobId: string } }): Promise<HermesJob> => parseJob(await request(`/jobs/${encodeURIComponent(data.jobId)}`));
export const sendCorrections = async ({ data }: { data: { jobId: string; corrections: { label: string; start: number; end: number; comments: string[] }[] } }): Promise<HermesJob> => parseJob(await request(`/jobs/${encodeURIComponent(data.jobId)}/corrections`, { corrections: data.corrections }));
export const finalizeJob = async ({ data }: { data: { jobId: string } }): Promise<HermesJob> => parseJob(await request(`/jobs/${encodeURIComponent(data.jobId)}/finalize`, {}));
