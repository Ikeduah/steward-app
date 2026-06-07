import type { NextApiRequest, NextApiResponse } from "next";

/**
 * AI Chat endpoint — temporarily disabled.
 * Full implementation preserved below for future release.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(503).json({ error: "AI features are not available yet. Coming soon." });
}

export const config = { api: { responseLimit: false } };

/* ─── AI IMPLEMENTATION (COMING SOON) ──────────────────────────────────────
 *
 * Uncomment the block below and remove the stub handler above to re-enable.
 *
 * import { getAuth } from "@clerk/nextjs/server";
 * import Anthropic from "@anthropic-ai/sdk";
 *
 * const anthropic = new Anthropic({
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   defaultHeaders: { "anthropic-beta": "prompt-caching-2024-07-31" },
 * });
 *
 * const MAX_HISTORY = 20;
 * const MAX_CONTENT_LEN = 4000;
 * const MAX_MESSAGE_LEN = 2000;
 * const MAX_TOOL_TURNS = 5;
 *
 * // --- In-memory tool result cache ---
 * const toolCache = new Map<string, { data: string; expiresAt: number }>();
 *
 * function cacheGet(key: string): string | null {
 *   const entry = toolCache.get(key);
 *   if (!entry || Date.now() > entry.expiresAt) {
 *     toolCache.delete(key);
 *     return null;
 *   }
 *   return entry.data;
 * }
 *
 * function cacheSet(key: string, data: string, ttlMs: number) {
 *   toolCache.set(key, { data, expiresAt: Date.now() + ttlMs });
 * }
 *
 * function cacheClearOrg(orgId: string) {
 *   const prefix = `${orgId}:`;
 *   for (const key of toolCache.keys()) {
 *     if (key.startsWith(prefix)) toolCache.delete(key);
 *   }
 * }
 *
 * function apiUrl(path: string, req: NextApiRequest): string {
 *   if (process.env.NODE_ENV === "development") return `http://127.0.0.1:8000${path}`;
 *   return `https://${req.headers.host}/api${path}`;
 * }
 *
 * const MEMBER_TOOLS: Anthropic.Messages.Tool[] = [
 *   {
 *     name: "get_my_assignments",
 *     description: "Get the current user's active asset assignments including asset name, status, checkout time, and expected return date.",
 *     input_schema: { type: "object" as const, properties: {} },
 *   },
 * ];
 *
 * const ADMIN_READ_TOOLS: Anthropic.Messages.Tool[] = [
 *   {
 *     name: "search_assets",
 *     description: "Search or list assets in the organization by name or filter by status.",
 *     input_schema: {
 *       type: "object" as const,
 *       properties: {
 *         search: { type: "string", description: "Partial asset name to search for" },
 *         status: { type: "string", enum: ["Available", "Checked Out", "Maintenance", "Retired"], description: "Filter by status" },
 *       },
 *     },
 *   },
 *   {
 *     name: "get_asset",
 *     description: "Get full details of a single asset by its numeric ID.",
 *     input_schema: { type: "object" as const, properties: { asset_id: { type: "integer", description: "The asset ID" } }, required: ["asset_id"] },
 *   },
 *   {
 *     name: "get_incidents",
 *     description: "List incidents in the organization, optionally filtered by status or severity.",
 *     input_schema: {
 *       type: "object" as const,
 *       properties: {
 *         status: { type: "string", enum: ["Open", "In Progress", "Resolved", "Closed"] },
 *         severity: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
 *       },
 *     },
 *   },
 *   {
 *     name: "get_incident",
 *     description: "Get full details of a single incident including all notes and linked asset.",
 *     input_schema: { type: "object" as const, properties: { incident_id: { type: "integer", description: "The incident ID" } }, required: ["incident_id"] },
 *   },
 *   {
 *     name: "get_active_assignments",
 *     description: "Get all currently active (checked out) assignments across the organization.",
 *     input_schema: { type: "object" as const, properties: {} },
 *   },
 *   {
 *     name: "get_assignment_history",
 *     description: "Get the full checkout and return history for a specific asset.",
 *     input_schema: { type: "object" as const, properties: { asset_id: { type: "integer", description: "The asset ID" } }, required: ["asset_id"] },
 *   },
 *   {
 *     name: "get_activity_log",
 *     description: "Get the organization's audit log. Filter by asset or event type.",
 *     input_schema: {
 *       type: "object" as const,
 *       properties: {
 *         asset_id: { type: "integer", description: "Filter to a specific asset" },
 *         event_type: { type: "string", description: "Filter by event type" },
 *         limit: { type: "integer", description: "Max entries to return (default 20, max 50)" },
 *       },
 *     },
 *   },
 *   {
 *     name: "generate_report",
 *     description: "Generate a structured data report. Types: asset_summary, overdue_checkouts, incident_report, maintenance_queue.",
 *     input_schema: {
 *       type: "object" as const,
 *       properties: {
 *         report_type: { type: "string", enum: ["asset_summary", "overdue_checkouts", "incident_report", "maintenance_queue"] },
 *       },
 *       required: ["report_type"],
 *     },
 *   },
 * ];
 *
 * const ADMIN_WRITE_TOOLS: Anthropic.Messages.Tool[] = [
 *   {
 *     name: "update_incident_status",
 *     description: "Update an incident's status. Valid transitions: Open → In Progress → Resolved → Closed.",
 *     input_schema: {
 *       type: "object" as const,
 *       properties: {
 *         incident_id: { type: "integer" },
 *         status: { type: "string", enum: ["Open", "In Progress", "Resolved", "Closed"] },
 *       },
 *       required: ["incident_id", "status"],
 *     },
 *   },
 *   {
 *     name: "add_incident_note",
 *     description: "Append a note to an incident for tracking progress, diagnosis steps, or resolution details.",
 *     input_schema: {
 *       type: "object" as const,
 *       properties: {
 *         incident_id: { type: "integer" },
 *         note: { type: "string", description: "The note text to add" },
 *       },
 *       required: ["incident_id", "note"],
 *     },
 *   },
 * ];
 *
 * const TOOL_LABELS: Record<string, string> = {
 *   get_my_assignments: "Fetching your assignments",
 *   search_assets: "Searching assets",
 *   get_asset: "Loading asset details",
 *   get_incidents: "Fetching incidents",
 *   get_incident: "Loading incident details",
 *   get_active_assignments: "Loading active assignments",
 *   get_assignment_history: "Fetching assignment history",
 *   get_activity_log: "Loading activity log",
 *   generate_report: "Generating report",
 *   update_incident_status: "Updating incident status",
 *   add_incident_note: "Adding note to incident",
 * };
 *
 * const ADMIN_TOOL_NAMES = new Set([
 *   ...ADMIN_READ_TOOLS.map((t) => t.name),
 *   ...ADMIN_WRITE_TOOLS.map((t) => t.name),
 * ]);
 *
 * const TOOL_TTL: Record<string, number> = {
 *   get_my_assignments: 30_000,
 *   search_assets: 30_000,
 *   get_asset: 30_000,
 *   get_incidents: 30_000,
 *   get_incident: 30_000,
 *   get_active_assignments: 30_000,
 *   get_assignment_history: 30_000,
 *   get_activity_log: 30_000,
 *   generate_report: 60_000,
 * };
 *
 * function getTools(isAdmin: boolean): Anthropic.Messages.Tool[] {
 *   return isAdmin ? [...ADMIN_READ_TOOLS, ...ADMIN_WRITE_TOOLS] : MEMBER_TOOLS;
 * }
 *
 * type AuthHeaders = { Authorization: string };
 *
 * async function runTool(name: string, input: Record<string, unknown>, orgId: string, isAdmin: boolean, headers: AuthHeaders, req: NextApiRequest): Promise<string> {
 *   if (!isAdmin && ADMIN_TOOL_NAMES.has(name)) return JSON.stringify({ error: "Unauthorized: admin access required" });
 *   const isMutation = name === "update_incident_status" || name === "add_incident_note";
 *   const cacheKey = `${orgId}:${name}:${JSON.stringify(input)}`;
 *   if (!isMutation) { const cached = cacheGet(cacheKey); if (cached) return cached; }
 *   const url = (path: string) => apiUrl(path, req);
 *   const get = async (path: string) => { const r = await fetch(url(path), { headers }); if (!r.ok) return { error: `HTTP ${r.status}` }; return r.json(); };
 *   try {
 *     let result: string;
 *     switch (name) {
 *       case "get_my_assignments": result = JSON.stringify(await get("/assignments/active")); break;
 *       case "search_assets": { const p = new URLSearchParams(); if (input.search) p.set("search", String(input.search)); if (input.status) p.set("status", String(input.status)); result = JSON.stringify(await get(`/assets?${p}`)); break; }
 *       case "get_asset": result = JSON.stringify(await get(`/assets/${input.asset_id}`)); break;
 *       case "get_incidents": { const p = new URLSearchParams(); if (input.status) p.set("status", String(input.status)); if (input.severity) p.set("severity", String(input.severity)); result = JSON.stringify(await get(`/incidents?${p}`)); break; }
 *       case "get_incident": result = JSON.stringify(await get(`/incidents/${input.incident_id}`)); break;
 *       case "get_active_assignments": result = JSON.stringify(await get("/assignments/active")); break;
 *       case "get_assignment_history": result = JSON.stringify(await get(`/assignments/history/${input.asset_id}`)); break;
 *       case "get_activity_log": { const p = new URLSearchParams(); if (input.asset_id) p.set("asset_id", String(input.asset_id)); if (input.event_type) p.set("event_type", String(input.event_type)); p.set("limit", String(Math.min(Number(input.limit ?? 20), 50))); result = JSON.stringify(await get(`/activity?${p}`)); break; }
 *       case "generate_report": result = JSON.stringify(await buildReport(String(input.report_type), headers, req)); break;
 *       case "update_incident_status": { const r = await fetch(url(`/incidents/${input.incident_id}`), { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ status: input.status }) }); if (!r.ok) return JSON.stringify({ error: `HTTP ${r.status}` }); cacheClearOrg(orgId); result = JSON.stringify({ success: true, incident: await r.json() }); break; }
 *       case "add_incident_note": { const r = await fetch(url(`/incidents/${input.incident_id}`), { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ notes: [{ text: input.note }] }) }); if (!r.ok) return JSON.stringify({ error: `HTTP ${r.status}` }); cacheClearOrg(orgId); result = JSON.stringify({ success: true, incident: await r.json() }); break; }
 *       default: return JSON.stringify({ error: `Unknown tool: ${name}` });
 *     }
 *     if (!isMutation && TOOL_TTL[name]) cacheSet(cacheKey, result, TOOL_TTL[name]);
 *     return result;
 *   } catch { return JSON.stringify({ error: "Tool execution failed" }); }
 * }
 *
 * async function buildReport(type: string, headers: AuthHeaders, req: NextApiRequest): Promise<object> {
 *   const safe = async (path: string) => { try { const r = await fetch(apiUrl(path, req), { headers }); return r.ok ? r.json() : []; } catch { return []; } };
 *   switch (type) {
 *     case "asset_summary": { const assets: { status: string }[] = await safe("/assets"); const count = (s: string) => assets.filter((a) => a.status === s).length; return { report_type: "asset_summary", total: assets.length, available: count("Available"), checked_out: count("Checked Out"), maintenance: count("Maintenance"), retired: count("Retired") }; }
 *     case "overdue_checkouts": { const all: { expected_return_at: string | null; asset?: { name: string }; assigned_to: string }[] = await safe("/assignments/active"); const now = Date.now(); const overdue = all.filter((a) => a.expected_return_at && new Date(a.expected_return_at).getTime() < now); return { report_type: "overdue_checkouts", total_active: all.length, overdue_count: overdue.length, overdue_assignments: overdue.map((a) => ({ asset_name: a.asset?.name ?? "Unknown", assigned_to: a.assigned_to, expected_return_at: a.expected_return_at })) }; }
 *     case "incident_report": { const inc: { status: string; severity: string }[] = await safe("/incidents"); const cnt = (field: "status" | "severity", val: string) => inc.filter((i) => i[field] === val).length; return { report_type: "incident_report", total: inc.length, by_status: { open: cnt("status", "Open"), in_progress: cnt("status", "In Progress"), resolved: cnt("status", "Resolved"), closed: cnt("status", "Closed") }, by_severity: { critical: cnt("severity", "Critical"), high: cnt("severity", "High"), medium: cnt("severity", "Medium"), low: cnt("severity", "Low") } }; }
 *     case "maintenance_queue": { const [assets, incidents] = await Promise.all([safe("/assets?status=Maintenance"), safe("/incidents?status=Open")]); return { report_type: "maintenance_queue", assets_in_maintenance: (assets as { id: number; name: string }[]).map((a) => ({ id: a.id, name: a.name })), open_incidents: (incidents as { id: number; title: string; severity: string; asset_id: number }[]).map((i) => ({ id: i.id, title: i.title, severity: i.severity, asset_id: i.asset_id })) }; }
 *     default: return { error: `Unknown report type: ${type}` };
 *   }
 * }
 *
 * function buildSystemPrompt(orgId: string, isAdmin: boolean): string {
 *   return `You are Steward AI, an intelligent assistant embedded in Steward — an asset management platform for organizations that track equipment, assignments, and incidents.\n\n## Context\n- Organization ID: ${orgId}\n- User role: ${isAdmin ? "Admin" : "Member"}\n- Current time: ${new Date().toISOString()}\n\n## Your Capabilities\n${isAdmin ? `**Admin — full access:**\n- Search and inspect any asset, incident, assignment, or activity log\n- Generate structured reports: asset summary, overdue checkouts, incident report, maintenance queue\n- Update incident status (Open → In Progress → Resolved → Closed)\n- Add notes to incidents for tracking progress` : `**Member — restricted access:**\n- View your own currently checked-out assets\n- Get equipment troubleshooting and diagnostic help for your assigned assets`}\n\n## Instructions\n- Do NOT write any text before calling tools. Call tools first, then write your response after receiving results.\n- Always use tools to fetch real data before answering any data question. Never guess or fabricate.\n- For equipment diagnosis: use your assigned assets for context, then apply your domain knowledge of that equipment type for step-by-step troubleshooting.\n- For reports: format with clear headings (##) and bullet points. Include key numbers prominently.\n- For mutations (admin only): execute the tool, then confirm what was done in one sentence.\n- If a tool returns an error or empty results, say so clearly rather than speculating.\n- Keep responses concise and scannable.`;
 * }
 *
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
 *   const { userId, orgId, orgRole, getToken } = getAuth(req);
 *   if (!userId) return res.status(401).json({ error: "Unauthorized" });
 *   if (!orgId) return res.status(401).json({ error: "No active organization context" });
 *   const { message, history = [] } = req.body ?? {};
 *   if (typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "message is required" });
 *   if (message.length > MAX_MESSAGE_LEN) return res.status(400).json({ error: "message too long" });
 *   if (!Array.isArray(history)) return res.status(400).json({ error: "history must be an array" });
 *   const sanitizedHistory: Anthropic.Messages.MessageParam[] = (history as unknown[]).filter((m): m is { role: "user" | "assistant"; content: string } => typeof m === "object" && m !== null && "role" in m && (m.role === "user" || m.role === "assistant") && "content" in m && typeof m.content === "string").map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT_LEN) })).slice(-MAX_HISTORY);
 *   const token = await getToken();
 *   const isAdmin = orgRole === "org:admin";
 *   const authHeaders: AuthHeaders = { Authorization: `Bearer ${token}` };
 *   res.setHeader("Content-Type", "text/event-stream");
 *   res.setHeader("Cache-Control", "no-cache");
 *   res.setHeader("Connection", "keep-alive");
 *   if (res.socket) { res.socket.setTimeout(0); res.socket.setKeepAlive(true); }
 *   res.flushHeaders();
 *   const send = (payload: object) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
 *   try {
 *     const tools = getTools(isAdmin);
 *     const systemPrompt = buildSystemPrompt(orgId, isAdmin);
 *     const messages: Anthropic.Messages.MessageParam[] = [...sanitizedHistory, { role: "user", content: message }];
 *     for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
 *       const pendingTools: { id: string; name: string; input: Record<string, unknown> }[] = [];
 *       let currentTool: { id: string; name: string; json: string } | null = null;
 *       const stream = anthropic.messages.stream({ model: "claude-haiku-4-5-20251001", max_tokens: 1024, system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }] as any, tools, messages });
 *       for await (const event of stream) {
 *         if (event.type === "content_block_start") { if (event.content_block.type === "tool_use") { currentTool = { id: event.content_block.id, name: event.content_block.name, json: "" }; send({ t: "s", v: TOOL_LABELS[event.content_block.name] ?? event.content_block.name }); } }
 *         else if (event.type === "content_block_delta") { if (event.delta.type === "text_delta") { send({ t: "d", v: event.delta.text }); } else if (event.delta.type === "input_json_delta" && currentTool) { currentTool.json += event.delta.partial_json; } }
 *         else if (event.type === "content_block_stop" && currentTool) { let parsed: Record<string, unknown> = {}; try { parsed = JSON.parse(currentTool.json); } catch {} pendingTools.push({ id: currentTool.id, name: currentTool.name, input: parsed }); currentTool = null; }
 *       }
 *       const finalMsg = await stream.finalMessage();
 *       if (finalMsg.stop_reason !== "tool_use") break;
 *       messages.push({ role: "assistant", content: finalMsg.content });
 *       const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
 *       for (const t of pendingTools) { const result = await runTool(t.name, t.input, orgId, isAdmin, authHeaders, req); toolResults.push({ type: "tool_result", tool_use_id: t.id, content: result }); }
 *       messages.push({ role: "user", content: toolResults });
 *     }
 *     res.write("data: [DONE]\n\n");
 *   } catch { send({ t: "e", v: "Something went wrong. Please try again." }); res.write("data: [ERROR]\n\n"); }
 *   finally { res.end(); }
 * }
 *
 * ─── END AI IMPLEMENTATION ───────────────────────────────────────────────── */
