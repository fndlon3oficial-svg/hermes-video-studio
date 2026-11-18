<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- All Hermes (Google Cloud engine) calls go through `src/lib/hermes.functions.ts`; it falls back to simulated mode when `HERMES_BASE_URL` is unset, so the UI works before the engine is wired.
- Video/audio files never touch Lovable Cloud: they upload straight to Google Cloud via signed URLs from Hermes. Cloud only stores projects, segments, comments, templates and LUTs.
- No final render via GitHub Actions: Hermes produces the final file (`/finalize`).
- Tables use open anon RLS policies (single-user tool, no login yet); add auth before sharing with a team.

- Routes import Hermes through `src/lib/hermes.ts`; Pages aliases this to `hermes-browser.ts` to avoid server RPCs and keep engine secrets off static hosting.
- Use the separate Vite Pages configuration with TanStack hash history for GitHub Pages; preserve the normal TanStack Start bootstrap for Lovable preview and SSR hosting.
