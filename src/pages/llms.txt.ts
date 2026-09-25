import type { APIRoute } from "astro";
import { buildLlmsTxt } from "../lib/llms";

/** Index of the site for AI assistants (llmstxt.org, BRD S-70). */
export const GET: APIRoute = ({ site }) =>
  new Response(buildLlmsTxt(site!), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
