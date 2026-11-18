import { afterEach, describe, expect, it, vi } from "vitest";
import { finalizeJob, signUpload, validateHermesUrl } from "@/lib/hermes-browser";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("GitHub Pages Hermes connection", () => {
  it("requires a configured gateway rather than silently returning a sample", async () => {
    vi.stubEnv("VITE_HERMES_PUBLIC_URL", "");
    await expect(finalizeJob({ data: { jobId: "job-1" } })).rejects.toThrow("Configure");
  });
  it("does not accept credentials embedded in the public URL", () => {
    expect(() => validateHermesUrl("https://user:secret@example.com")).toThrow("credenciais");
    expect(() => validateHermesUrl("http://example.com")).toThrow("HTTPS");
  });
  it("finalizes via Hermes without a GitHub request or secret header", async () => {
    vi.stubEnv("VITE_HERMES_PUBLIC_URL", "https://hermes.example.com/");
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ jobId: "job-1", status: "pronto", progress: 100, finalUrl: "https://storage.googleapis.com/result.mp4" }) });
    vi.stubGlobal("fetch", fetcher);
    expect((await finalizeJob({ data: { jobId: "job-1" } })).status).toBe("pronto");
    expect(fetcher).toHaveBeenCalledWith("https://hermes.example.com/jobs/job-1/finalize", expect.objectContaining({ method: "POST", headers: { "Content-Type": "application/json" } }));
  });
  it("only signs uploads, keeping media off Lovable Cloud", async () => {
    vi.stubEnv("VITE_HERMES_PUBLIC_URL", "https://hermes.example.com");
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ uploadUrl: "https://storage.googleapis.com/upload", gcsPath: "gs://videos/input.mp4" }) });
    vi.stubGlobal("fetch", fetcher);
    expect((await signUpload({ data: { filename: "input.mp4", contentType: "video/mp4" } })).gcsPath).toBe("gs://videos/input.mp4");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
