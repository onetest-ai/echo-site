// Echo plugins — types for `ctx`, the manifest and what Echo hands a plugin's code.
// https://echo.onetest.ai/extend/ · Echo 0.9.14; members marked "after 0.9.14" come with the next Echo release.
//
// A plugin is a folder: echo-plugin.json (EchoPluginManifest), a host half (`main`, runs inside Echo) and a client
// half (`client`, runs in the Echo window). Each half is an ES module exporting `apply(ctx)`:
//
//   /** @param {import('./echo-plugin').HostContext} ctx */
//   export function apply(ctx) { ... }          // main.js
//   /** @param {import('./echo-plugin').ClientContext} ctx */
//   export function apply(ctx) { ... }          // client.js

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

// ── the manifest (echo-plugin.json) ─────────────────────────────────────────────────────────────────────────────

export interface EchoPluginManifest {
  /** 1–40 of a–z 0–9 and "-", not starting with "-"; never changes. */
  id: string
  /** Up to 60 characters. */
  name: string
  /** "X.Y.Z" or "X.Y.Z-pre". */
  version: string
  /** The Echo it needs, e.g. ">=0.9.14". */
  echo?: string
  /** One line for its card, up to 240 characters. */
  summary?: string
  /** What it may touch: each key becomes a line of the install sheet; functions that need one refuse without it. */
  uses?: Uses
  /** Its host half: a .js / .mjs in the plugin's folder, one file with no imports. */
  main?: string
  /** Its client half, an ES module path. */
  client?: string
  /** Values the user sets in its card in Settings → Plugins. */
  settings?: SettingDef[]
  /** Widgets for Today and dashboards (at most 24; needs `main`, and `client` for a `page`). */
  widgets?: WidgetDef[]
  /** Ready-made dashboards it offers, at most 6. */
  dashboards?: DashboardDef[]
  /** After 0.9.14: Claude Code routines it ships, at most 4 (needs uses.claude); off until the user switches each on. */
  routines?: RoutineDef[]
  /** Its package skill folders, e.g. ["skills/staffing"] (at most 10 with its runtime skills). */
  skills?: string[]
  /** Its part for Claude in Echo (the agent/ folder): `summary` one line ≤ 200; `prefix` 2–4 of a–z 0–9. */
  agent?: { summary?: string; prefix?: string }
  /** An .svg in its folder (≤ 16 KB), beside its work rows and ⌘K entries. */
  icon?: string
}

export interface SettingDef {
  /** a–z 0–9 - _, unique. */
  key: string
  label: string
  /** Default "string". A secret is stored apart, readable only by the user, and never sent to the window. */
  type?: 'string' | 'bool' | 'folder' | 'secret'
  default?: unknown
  help?: string
}

export interface Uses {
  /** ctx.claude.run, folder runs, ctx.claude.session (with folders), routines. `skip: true`: a run may ask tools "skip". */
  claude?: { skip?: boolean }
  /** ctx.every */
  schedule?: {}
  /** ctx.on for these events. */
  events?: { on: EventName[] }
  /** ctx.deliver.send to these ways ("teams", "mail", or one a plugin adds). */
  deliver?: { to: string[] }
  /** ctx.deliver.provide for these kinds (never teams or mail). */
  deliver_provider?: { kinds: string[] }
  /** hosts: https to these hosts. hosts_from: string settings (no default) where the user lists addresses.
   *  ask (after 0.9.14): ctx.http.askAddress. */
  network?: { hosts?: string[]; hosts_from?: string[]; ask?: boolean }
  /** ctx.system.pickFolder and ctx.fs; `what` names them on the sheet ("Obsidian vaults"); `write` lets it change them. */
  folders?: { what?: string; write?: boolean }
  /** ctx.system.readFile for 1–5 files of other apps, each named in full (~/…, %APPDATA%/…, %LOCALAPPDATA%/…). */
  files?: { read: string[] }
  /** read: ctx.echo.read kinds; write: what it writes; jobs: Echo's background jobs (client half). */
  echo?: { read?: EchoReadKind[]; write?: Array<'dictionary' | 'thread_stage' | 'tasks'>; jobs?: boolean }
  /** After 0.9.14: ctx.m365, read-only through Echo's sign-in. */
  m365?: { read: Array<'mail' | 'chats'> }
  /** ctx.signin for 1–4 plain host names; keep: Echo keeps a sign-in the plugin makes itself. */
  signin?: { hosts: string[]; keep?: boolean }
  /** What it gives Claude in Echo; commands: its commands Echo's sessions may run (up to 20). */
  sessions?: { skills?: boolean; read?: boolean; hints?: boolean; commands?: string[] }
  /** ctx.sessions.channel for this Claude Code channel plugin ("name@claude-plugins-official"). */
  channel?: { plugin: string }
  /** The scripts of its package skills Echo may run (1–20); timeout 1–3600 s, 300 by default. */
  scripts?: Array<{ skill: string; script: string; timeout?: number }>
  /** ctx.work: its rows on My work and in threads' Work. */
  work?: {}
  /** An AI profile it offers: `command` one program name on the user's PATH, `name` ≤ 40. */
  ai?: { wrapper: { name: string; command: string } }
  /** After 0.9.14: its window half hears the microphone (ctx.microphone). */
  microphone?: {}
}

export type EchoReadKind = 'clients' | 'threads' | 'people' | 'dictionary' | 'sources' | 'source' | 'calls' | 'calendar' | 'me'

/** After 0.9.14. On its sheet, off until the user switches it on; its id among Echo's jobs is `<plugin>.<id>`. */
export interface RoutineDef {
  /** a–z 0–9 -, ≤ 40, once. */
  id: string
  /** One line, ≤ 60. */
  name: string
  /** One line, ≤ 200. */
  what: string
  /** A .md file of its package (UTF-8, not empty, ≤ 16 KB). */
  prompt: string
  /** Minutes, 15–1440: the default the user may change. */
  every: number
  /** Paused at night by default (true when not said). */
  night?: boolean
  /** As ctx.claude.run's; left out: the user's setting for routines. */
  tools?: 'auto' | 'skip' | 'none'
  /** Minutes, 1–60 (20). */
  timeout?: number
}

export interface DashboardDef {
  /** a–z 0–9 -, unique in the plugin. */
  id: string
  kind: 'thread' | 'client'
  /** 1–40 characters. */
  name: string
  /** ≤ 160: the row's tooltip. */
  about?: string
  /** A thread's only: the stage groups it shows on; none: every thread. */
  for?: Array<'pursuit' | 'delivery' | 'closed'>
  /** 1–24, each widget once: its own by id, or `plugin:<id>:<widget>` of a plugin of its marketplace. */
  items: Array<{ widget: string; size?: WidgetSize; height?: 1 | 2; row?: boolean; params?: Record<string, string | boolean> }>
}

// ── widgets ─────────────────────────────────────────────────────────────────────────────────────────────────────

export type WidgetSize = 'S' | 'M' | 'L'
export type WidgetKind = 'stat' | 'stats' | 'chart' | 'list' | 'status' | 'card' | 'table' | 'page'

/** A widget; on Today its id is `plugin:<plugin id>:<id>`. */
export interface WidgetDef {
  /** Lowercase letters, digits and dashes, unique in the plugin. */
  id: string
  /** Its name on Today, 1–40 characters. */
  label: string
  /** A line in Add a widget's catalog, up to 120. */
  about?: string
  kind: WidgetKind
  /** The sizes it takes (S one column of Today, M two, L three); default ["M"]; a table only M and L. */
  sizes?: WidgetSize[]
  /** The rows of Today's grid it may take, with 1; default [1]. */
  heights?: Array<1 | 2>
  /** "hug" (default): as tall as its content; "fill": as tall as its row. */
  height?: 'hug' | 'fill'
  /** Seconds between Echo's asks of its provider, at least 60. */
  refresh?: number
  /** Its settings (⚙ in Today's edit mode, `echoctl today set`, Filters), at most 6. */
  params?: WidgetParam[]
}

export interface WidgetParam {
  /** a–z 0–9 - _, unique. */
  key: string
  /** 1–40 characters. */
  label: string
  /** choice: one of `options` (1–12); thread / client: one of the user's (its id), each at most once. */
  type: 'choice' | 'bool' | 'thread' | 'client'
  options?: string[]
  default?: string | boolean
}

export type Tone = 'good' | 'warn' | 'bad'
export type ToneM = Tone | 'muted'

/** What any widget's data but a page's may add. */
export interface WidgetExtras {
  /** An echo:// place, or an https:// page opened in the browser on the user's click. */
  open?: string
  /** Up to 3 buttons running the host half's commands. */
  actions?: Array<{ label: string; command: string; args?: Record<string, Json> }>
  /** An ISO time: shown instead of when the plugin answered. */
  asOf?: string
}

export type ChartType = 'line' | 'area' | 'bar' | 'stacked' | 'bars' | 'stacked-bars' | 'pie' | 'donut' | 'funnel'

export interface ChartData {
  type: ChartType
  /** One series: {label, value}; several: {label, values: {<key>: number}}. */
  points: Array<{ label: string; value: number } | { label: string; values: Record<string, number> }>
  /** Up to 6 (one on pie, donut, funnel). */
  series?: Array<{ key: string; label: string; tone?: ToneM }>
  unit?: string
  note?: string
  /** Shares of 100% on stacked and stacked-bars. */
  percent?: boolean
  /** In a donut's hole. */
  center?: { value: string | number; label?: string }
  headline?: { value: string | number; label?: string; change?: { by: number; than?: string; good?: boolean } }
}

export type TableCell = string | number | { text: string; tone?: ToneM } | { values: number[]; text?: string } | { parts: Array<{ key?: string; value: number; tone?: ToneM }>; text?: string }

export interface TableData {
  /** 1–10 columns (and up to 12 heat columns besides). */
  columns: Array<{ key: string; label: string; kind?: 'text' | 'number' | 'pill' | 'date' | 'spark' | 'heat' | 'mix'; hide?: 'M'; group?: string; series?: Array<{ key: string; label: string; tone?: ToneM }> }>
  /** Up to 200 rows; `link` echo:// or https://. */
  rows: Array<{ id: string; cells: Record<string, TableCell>; link?: string; group?: string; detail?: Array<{ text: string; sub?: string }> }>
  groups?: Array<{ id: string; label: string }>
  total?: { label?: string; cells: Record<string, TableCell> }
  note?: string
  empty?: string
}

/** A widget's data by its kind (plain JSON, 64 KB at most; Echo escapes every text). */
export interface WidgetData {
  stat: WidgetExtras & { value: number | string; unit?: string; label?: string; tone?: Tone; note?: string; progress?: { used: number; of: number } }
  stats: WidgetExtras & { items: Array<{ label: string; value: number | string; tone?: Tone; trend?: number[]; link?: string }> }
  chart: WidgetExtras & ChartData
  list: WidgetExtras & { items: Array<{ title: string; sub?: string; link?: string }>; empty?: string }
  status: WidgetExtras & { state: 'ok' | 'warn' | 'bad'; title: string; text?: string }
  card: WidgetExtras & { title?: string; text?: string; link?: string }
  table: WidgetExtras & TableData
  /** Any JSON: the client half draws it (ClientContext.widgets.draw). */
  page: Json
}

/** What Echo asks a provider with, and what a page widget's draw gets. */
export interface WidgetAsk {
  size: WidgetSize
  height: 1 | 2
  /** What Echo draws at that size and height: send that many, the most important first. */
  fits: { rows: number; items: number; bars: number }
  params: Record<string, string | boolean>
}

// ── events ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** What a plugin may hear (uses.events.on): ids and titles, never what was said. `call` is the call's folder name. */
export interface EventPayload {
  meeting_soon: { id: string; subject: string | null; start: string | null; threads: string[] }
  call_started: { app: string }
  call_ended: { app: string; recording: boolean }
  recording_started: { call: string; title: string | null; memo: boolean }
  recording_stopped: { call: string; duration_s: number; reason: string }
  transcribed: { call: string; ok: boolean }
  minutes_written: { id: string; link: string; call: string; title: string | null }
  thread_synced: { thread: string; processed: number; left: number }
  sources_changed: { changed: string[]; removed: string[] }
  threads_changed:
    | { thread: string; born: string; change: 'renamed'; name: string; from: string }
    | { thread: string; born: string; change: 'merged'; into: string; dropped: string[] }
    | { thread: string; born: string; change: 'deleted'; values: Record<string, Json> }
  shared_changed: { namespace: string; key: string; thread?: string; by: string }
}
export type EventName = keyof EventPayload

// ── the host half (main.js): runs inside Echo ──────────────────────────────────────────────────────────────────
// QuickJS, 64 MB shared by all host halves, 5 s of JavaScript between awaits. Promises run outside the slice.

/** A file the user handed the plugin (after 0.9.14): an id of its own, never the path; kept an hour. */
export interface FileHandle { file: string; name: string; size: number }

export interface ClaudeResult {
  answer: string
  model: string
  /** Tokens, cost and time. */
  usage: Json
  /** The changes and sends it made through Echo. */
  actions: Json[]
  /** A copy run's snapshot (mode "copy"). */
  snapshot?: Snapshot
}

export interface ClaudeRun {
  prompt: string
  /** For the user: what this run is. */
  title?: string
  /** An AI profile id; the default when left out (a wrapper only when it is the default). */
  profile?: string
  model?: string
  /** After 0.9.14: left out, the user's setting for routines; "auto"; "skip" (only with uses.claude.skip);
   *  "none" (no tools). "read" and "folder", from before, are taken as "auto". Ignored in a folder run. */
  tools?: 'auto' | 'skip' | 'none' | 'read' | 'folder'
  /** Its working folder, relative to the plugin's store (default runs/<time>). */
  dir?: string
  /** Minutes, 1–60 (default 20). */
  timeout?: number
  /** After 0.9.14, with uses.folders: a root as ctx.fs.folders() names it — the run is that folder's own project. */
  folder?: string
  /** A subfolder of `folder` ("" the root). */
  path?: string
  /** read (default); edit (needs folders.write); copy (an edit run on a snapshot in its store). */
  mode?: 'read' | 'edit' | 'copy'
}

export interface Snapshot { path: string; files: number; bytes: number; skipped: number; why: { large: number; unreadable: number } }

export interface InboxItem {
  title: string
  why?: string
  urgent?: boolean
  /** Where a click on the item leads: a window route such as "settings/<plugin>:main". */
  go?: string
  /** Each runs one of the plugin's commands. */
  actions?: Array<{ label: string; command: string; args?: Json; primary?: boolean }>
}

export interface MarkdownOpts {
  /** A single newline is a line break. */
  breaks?: boolean
  /** Destination as written → href (https://, an echo:// link Echo knows, its own #<id>: or #brain/<id>: route), or null: missing. */
  links?: Record<string, string | null>
  /** Destination → src from its folder route plugin/<id>/folder/…, or null. */
  images?: Record<string, string | null>
}

export interface WorkRow {
  /** 1–200 chars, unique. */
  id: string
  /** 1–300 chars. */
  title: string
  /** 1–30 chars. */
  kind: string
  where?: string
  /** https:// */
  url?: string
  /** YYYY-MM-DD */
  due?: string
  late?: boolean
  /** A thread id: a "me" row is also in that thread's Work. */
  thread?: string
}

export interface WebSocketConn {
  protocol: string
  /** Text; base64 with {binary: true}; or a file handle, as one binary message. */
  send(data: string | FileHandle, opts?: { binary?: boolean }): void
  /** 1000 or 3000–4999. */
  close(code?: number, reason?: string): void
  onMessage?: (data: string, info: { binary: boolean }) => void
  onClose?: (e: { code: number; reason: string }) => void
  onError?: (e: { message: string }) => void
}

export interface HttpStream {
  status: number
  /** Lower-case names, once the answer's head arrived. */
  headers: Record<string, string>
  done: Promise<{ status: number; bytes: number; cancelled: boolean }>
  cancel(): void
}

export interface HttpOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: string | Json
  /** A path in its store to keep the answer in (512 MB, 15 min). */
  save?: string
  /** After 0.9.14: a handed file sent as the body with POST, PUT or PATCH (512 MB, 15 min). */
  file?: FileHandle | string
}

export interface FsStat { kind: 'file' | 'dir' | 'link' | 'other'; size: number; mtime: number; real: string | null; sha?: string }

export interface HostContext {
  /** The plugin's id. */
  id: string
  /** True in a terminal (echoctl plugin call, deliver, widget show, work show): skip start-up work. */
  terminal: boolean
  /** A line in Echo's log. */
  log(...args: unknown[]): void
  /** A command the client half (ctx.call), an Inbox button, a widget action or `echoctl plugin call` runs. A window call has 30 s.
   *  `files` (after 0.9.14): the handles its caller passed. */
  command(name: string, fn: (args: Record<string, Json>, ctx: { files: FileHandle[] }) => Json | void | Promise<Json | void>): void
  /** Every `seconds` (at least 10) while Echo runs. Needs uses.schedule. */
  every(seconds: number, fn: () => void | Promise<void>): void
  /** Hear an event the manifest names (uses.events.on); refused for one it doesn't. */
  on<E extends EventName>(event: E, fn: (payload: EventPayload[E]) => void | Promise<void>): Promise<true>
  /** Text files in its own folder in the data folder; relative paths only. Every write takes its lock across processes. */
  store: {
    read(path: string): string | null
    /** After 0.9.14: {ifSha} only while the file's sha256 is still that; {createNew} only where no file is. */
    write(path: string, text: string, opts?: { ifSha?: string; createNew?: boolean }): void
    /** After 0.9.14: read, fn, write only over what was read (fn may run again); → the text kept. */
    update(path: string, fn: (text: string | null) => string | null | undefined): string | null
    list(dir?: string): string[]
    remove(path: string): void
    /** The absolute path of a file in it. */
    path(path?: string): string
    /** What it keeps there (its own files only). */
    size(dir?: string): { bytes: number; files: number }
  }
  /** Its cache/ (Echo removes what is there over 7 days). */
  cache: { size(): { bytes: number; files: number } }
  /** After 0.9.14. */
  crypto: { sha256(text: string): string }
  /** Its manifest's settings. */
  settings: { get(key: string): Json; set(key: string, value: Json): void }
  /** Its own installed files, read-only. */
  package: { read(path: string): string | null; list(dir?: string): string[] }
  http: {
    /** Needs uses.network: https to its hosts, the addresses the user listed, or the one typed address. 60 s, 10 MB. */
    fetch(url: string, opts?: HttpOpts): Promise<{ status: number; body: string }>
    /** After 0.9.14: an answer as it comes (SSE, chunked); no time limit, 512 MB. */
    stream(url: string, opts: Omit<HttpOpts, 'save'> | undefined, onChunk: (text: string, s: HttpStream) => void): HttpStream
    /** After 0.9.14, uses.network.ask: Echo's own box asks the user for an address; that one may be fetched once (GET). */
    askAddress(): Promise<string | null>
  }
  /** After 0.9.14: ws:// and wss:// to an address the user listed. */
  net: { websocket(url: string, opts?: { headers?: Record<string, string>; protocols?: string[] }): Promise<WebSocketConn> }
  /** Echo's safe Markdown writer. With opts (after 0.9.14): a vault page with wikilinks and images, 1 MB at most. */
  markdown: ((md: string, opts?: MarkdownOpts) => string) & {
    /** After 0.9.14: what to resolve first, each destination once as written. */
    links(md: string): { links: string[]; images: string[] }
  }
  /** A system notification from Echo. */
  notify(title: string, body?: string): void
  /** Items in Echo's Inbox until cleared (key ≤ 80 chars). */
  inbox: { set(key: string, item: InboxItem): void; clear(key: string): void }
  /** The user's AI profiles. */
  profiles(): { default: string; profiles: Array<{ id: string; name: string }> }
  claude: {
    /** Needs uses.claude; a folder run also uses.folders. */
    run(opts: ClaudeRun): Promise<ClaudeResult>
    /** Is the channel plugin uses.channel names installed for the default profile? */
    hasPlugin(spec: string, profile?: string): Promise<Json>
    /** Install it at the default profile's user scope; only that spec. */
    installPlugin(spec: string): Promise<Json>
  }
  sessions: {
    /** The Echo folder session listens to the channel uses.channel names (env: no CLAUDE* / ANTHROPIC*). */
    channel(opts: { plugin: string; env?: Record<string, string> }): void
    clearChannel(): void
    /** Runtime skills (text only) for Echo's own sessions; [] removes them. Needs uses.sessions.skills. Set from apply. */
    skills(list: Array<{ name: string; description: string; body: string }>): void
    /** Which of its granted folders Echo's sessions may read. Needs uses.sessions.read. */
    read(folders: string[]): void
  }
  /** A line Claude is told when that client or thread is open (replaces all). Needs uses.sessions.hints. */
  view: { hints(list: Array<{ client?: string; thread?: string; text: string }>): void }
  /** What changes at run time for Claude in Echo (needs `agent` in the manifest); replaces all. */
  agent: { set(part: { summary?: string; entries: Array<{ name: string; summary: string; guide: string }> }): void }
  echo: {
    /** Read-only, kinds in uses.echo.read. calls, calendar, me, and the richer source: after 0.9.14. */
    read(kind: 'clients' | 'threads' | 'people' | 'dictionary' | 'calendar' | 'me'): Json
    read(kind: 'sources', opts?: { kind?: string; thread?: string; since?: string; limit?: number }): Json
    read(kind: 'source', id: string): Json
    read(kind: 'calls', opts?: { q?: string; since?: string; limit?: number }): Json
    /** uses.echo.write: dictionary. */
    dictionary: { add(term: { name: string; synonyms?: string[]; spellings?: string[]; kind?: string; client?: string }): Json }
  }
  /** Its own values per thread (no grant); a `<ns>.<name>` key is shared with its marketplace's plugins. */
  threads: {
    get(thread: string, key: string): Json
    /** JSON ≤ 16 KB, 64 keys a thread, 4 MB in all; null removes it. */
    set(thread: string, key: string, value: Json): void
    list(key: string): Array<{ thread: string; value: Json }>
    /** uses.echo.write: thread_stage. */
    setStage(thread: string, stage: ThreadStage, reason?: string): { applied: boolean; why?: string }
  }
  /** Values its marketplace's plugins share, one for the computer: key `<ns>.<name>`. */
  shared: { get(key: string): Json; set(key: string, value: Json): void }
  /** Its own tasks in a thread, by its key (uses.echo.write: tasks). */
  tasks: {
    upsert(thread: string, task: { key: string; title?: string; due?: string | null; owner?: string; state?: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled'; url?: string; reason?: string; propose?: boolean }): { task: Json; applied: boolean; proposed: boolean; ignored: string[]; why?: string }
    close(thread: string, key: string, reason?: string, opts?: { propose?: boolean }): { task: Json; applied: boolean; proposed: boolean; ignored: string[]; why?: string }
  }
  /** Inside the folders the user gave it (uses.folders); writes need folders.write. Paths relative to a root. */
  fs: {
    folders(): string[]
    forget(root: string): void
    list(root: string, path?: string): Array<{ name: string; dir: boolean }>
    /** Up to `max` bytes (default 1 MB, at most 4 MB). */
    read(root: string, path: string, max?: number): string
    readMany(root: string, paths: string[], max?: number): Promise<Array<string | null>>
    /** `sha` (after 0.9.14): each file's sha256, up to 64 MB. */
    walk(root: string, opts?: { path?: string; ext?: string[]; hidden?: boolean; max?: number; sha?: boolean }): Promise<Array<{ path: string; size: number; mtime: number; sha?: string }>>
    /** After 0.9.14. */
    stat(root: string, path: string, opts?: { sha?: boolean }): FsStat | null
    /** After 0.9.14: lines holding `query` as typed. */
    search(root: string, query: string, opts?: { path?: string; ext?: string[]; hidden?: boolean; max?: number; caseSensitive?: boolean }): Promise<Array<{ path: string; line: number; text: string }>>
    /** After 0.9.14: a copy in its store's cache/snapshots/. */
    snapshot(root: string, opts?: { exclude?: string[]; hidden?: boolean; maxFiles?: number; maxBytes?: number }): Promise<Snapshot>
    /** ifSha / createNew after 0.9.14. */
    write(root: string, path: string, text: string, opts?: { ifSha?: string | null; createNew?: boolean }): void
    /** After 0.9.14. */
    append(root: string, path: string, text: string): void
    /** After 0.9.14. */
    mkdir(root: string, path: string): void
    move(root: string, from: string, to: string): void
    remove(root: string, path: string): void
    /** After 0.9.14: a handed file's bytes into a granted folder (50 MB), never over a file unless createNew: false. */
    copyIn(file: FileHandle | string, root: string, path: string, opts?: { createNew?: boolean }): Promise<{ path: string; size: number }>
  }
  /** After 0.9.14: git in a folder it was given; init and commit need folders.write. */
  git: {
    info(root: string): Promise<{ repo: false } | { repo: true; branch: string | null; head: string | null; detached: boolean; busy: 'merge' | 'rebase' | 'cherry-pick' | 'revert' | 'bisect' | null; subfolder: boolean }>
    status(root: string, opts?: { paths?: string[] }): Promise<Array<{ path: string; code: string; from?: string }>>
    log(root: string, opts?: { path?: string; max?: number }): Promise<Array<{ rev: string; author: string; email: string; date: string; subject: string; echo: string | null; path?: string }>>
    show(root: string, rev: string, path: string, opts?: { max?: number }): Promise<{ text: string; size: number; truncated: boolean } | null>
    init(root: string, opts?: { branch?: string }): Promise<Json>
    commit(root: string, opts: { paths: string[]; message: string }): Promise<{ rev: string | null }>
  }
  /** After 0.9.14: files the user handed it. */
  files: { read(file: FileHandle | string, opts?: { max?: number }): string }
  /** After 0.9.14, uses.m365.read: through Echo's sign-in, read-only. */
  m365: {
    search(query: string, opts?: { kinds?: string[]; days?: number; limit?: number }): Promise<{ query: string; results: Json; errors: Json }>
    mailThread(message: string): Promise<{ subject: string; picked: Json; messages: Json[] }>
    chat(chat: string, opts?: { since?: string; until?: string }): Promise<Json>
  }
  system: {
    which(name: string): string | null
    /** A file of another app its manifest names in uses.files.read: its text (1 MB), or null. */
    readFile(entry: string): string | null
    /** The system's folder picker; the folder picked is given to the plugin. Needs uses.folders. */
    pickFolder(prompt?: string): Promise<string | null>
    /** After 0.9.14: the system's file picker → handles ([] cancelled); only from a command. */
    pickFiles(prompt?: string, opts?: { multiple?: boolean; ext?: string[] }): Promise<FileHandle[]>
  }
  /** uses.signin. */
  signin: {
    get(host: string, opts?: { fresh?: boolean }): Promise<{ token: string; from: 'echo' | 'gh' | 'git'; user?: string } | null>
    sources(host: string): { gh: boolean; git: boolean }
    keep(host: string, token: string): void
    forget(host: string): boolean
  }
  /** uses.scripts. */
  scripts: {
    run(skill: string, script: string, args?: string[], opts?: { timeout?: number }): Promise<{ status: number | null; stdout: string; stderr: string; truncated?: boolean; timed_out?: boolean }>
  }
  widgets: {
    /** Answer Echo's ask within 5 s (again after `refresh`, a size or a setting change). */
    provide(id: string, fn: (ask: WidgetAsk) => Json | Promise<Json>): void
    /** Push a widget's data now, for every copy. */
    set(id: string, data: Json): void
    /** Nothing to show: off Today and every dashboard until it has data again. */
    clear(id: string): void
    /** Echo asks again (that widget, or each), at most once in 10 s a widget. */
    changed(id?: string): void
  }
  /** uses.work. */
  work: {
    provide(fn: (ask: { scope: 'me' | 'thread'; thread?: string }) => WorkRow[] | Promise<WorkRow[]>): void
    changed(): void
  }
  deliver: {
    status(): Json
    /** Needs uses.deliver naming `kind`. */
    send(kind: string, msg: { title: string; markdown: string }): Promise<Json>
    /** Needs uses.deliver_provider naming `kind`. */
    provide(kind: string, opts: { label?: string; send(msg: { title: string; markdown: string; about?: string; ai?: boolean }): Promise<unknown> | unknown }): void
    ready(kind: string, yes: boolean, why?: string): void
  }
}

export type ThreadStage = 'lead' | 'proposal' | 'negotiation' | 'kickoff' | 'active' | 'on_hold' | 'wrap_up' | 'done' | 'lost' | 'cancelled'

// ── the client half (client.js): runs in the Echo window ────────────────────────────────────────────────────────

export type Slot = 'calendar.event' | 'call.menu' | 'task.actions' | 'thread.profile' | 'call.row' | 'knowledge.tab' | 'knowledge.settings'

export interface SlotTargets {
  'calendar.event': { kind: 'event'; event: CalendarEvent }
  'call.menu': { kind: 'call'; call: Call }
  'task.actions':
    | { kind: 'story' | 'task' | 'decision' | 'risk' | 'question'; node: WorkItem; project: string }
    | { kind: 'plugin'; source: string; row: WorkRow }
}

/** A button in calendar.event, call.menu or task.actions. */
export interface SlotItem<S extends keyof SlotTargets> {
  label: string
  /** An SVG string before the label. */
  icon?: string
  /** Its tooltip. */
  title?: string
  /** Whether it shows (left out: always). */
  when?(target: SlotTargets[S]): boolean
  /** The click; an error it throws is shown to the user with the label. */
  run(target: SlotTargets[S]): unknown
}

/** A row on a thread's Profile, under its Sources. */
export interface ThreadProfileItem {
  id: string
  label: string
  /** Synchronous HTML (escape every text). */
  render(thread: { id: string; name: string; client: string | null }): string
  /** Once per box drawn afresh: fetch, then ctx.render(). */
  after?(box: HTMLElement, thread: { id: string; name: string; client: string | null }): void
}

/** After 0.9.14: a chip on each call's row. */
export interface CallRowItem {
  id: string
  /** The chip's tooltip. */
  label: string
  /** Synchronous: a short text (24 chars), or nothing for no chip. */
  chip(call: { name: string; title: string; started_at: string | null; status: string; memo: boolean }): string | null | undefined
}

export interface CalendarEvent {
  id: string
  subject: string
  /** ISO times. */
  start: string
  end: string
  all_day: boolean
  online: boolean
  join_url?: string | null
  organizer?: string | null
  /** How many are invited. */
  people?: number | null
  location?: string | null
  declined: boolean
  cancelled: boolean
  /** Echo has the call. */
  recorded?: { name: string; status: string; minutes: number | null; imported?: boolean } | null
  /** Echo will record it. */
  scheduled?: boolean
  /** The threads it belongs to. */
  projects?: Json[]
}

export interface Call {
  /** The call's folder name: how commands and the CLI name it. */
  name: string
  title: string
  started_at: string
  minutes: number | null
  /** recording, transcribing, done… */
  status: string
  people: string[]
  /** Its folder on disk. */
  path: string
  /** The invite: subject, attendees. */
  meeting?: Json
  [k: string]: unknown
}

export interface WorkItem {
  /** e.g. T001, S001, D001. */
  id: string
  title: string
  kind: 'epic' | 'story' | 'task' | 'decision' | 'risk' | 'question'
  state: string
  owners?: string[]
  due?: string | null
  description?: string
  links?: Array<{ title: string; url: string }>
  history?: Json[]
  [k: string]: unknown
}

/** What the ⌘K palette is on (the chip in its box), if anything. */
export type PaletteTarget = { kind: 'call'; c: Call; label: string } | { kind: 'event'; e: CalendarEvent; label: string } | null

export interface ClientContext {
  id: string
  /** Run a command of its host half. After 0.9.14: a POST of {args, files}, 4 MB at most; `files` handles it was given. */
  call(command: string, args?: Record<string, Json>, opts?: { files?: Array<FileHandle | string> }): Promise<Json>
  /** A document listener removed with the plugin. */
  listen(type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): void
  /** After 0.9.14: a window listener removed with the plugin. */
  listenWindow(type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): void
  /** After 0.9.14: its own cleanup, run first when it unloads. */
  onUnload(fn: () => void): void
  /** After 0.9.14, macOS: files dropped while its activity or Knowledge tab is shown. */
  onFileDrop(fn: (files: FileHandle[]) => void): void
  /** After 0.9.14: Echo's writer from the window, async. */
  markdown: ((md: string, opts?: MarkdownOpts) => Promise<string>) & { links(md: string): Promise<{ links: string[]; images: string[] }> }
  slots: {
    list(): Slot[]
    add<S extends keyof SlotTargets>(slot: S, item: SlotItem<S>): void
    add(slot: 'thread.profile', item: ThreadProfileItem): void
    add(slot: 'call.row', item: CallRowItem): void
    add(slot: 'knowledge.tab' | 'knowledge.settings', item: Record<string, unknown>): void
  }
  panels: {
    add(view: { id: string; label: string; icon?: string; area?: 'right' | 'bottom'; when?(): boolean; render(): string }): void
  }
  widgets: {
    /** Draw a `page` widget from its data only (the same data gives the same HTML); escape every text with ui.esc. */
    draw(id: string, fn: (w: { data: Json; size: WidgetSize; height: 1 | 2; fits: WidgetAsk['fits']; theme: 'light' | 'dark' }) => string): void
  }
  /** Open one of its panel views. */
  showPanel(id: string): void
  /** Open one of Echo's own panel views, e.g. "claude-folder". */
  openEchoPanel(view: string): void
  settings: {
    /** Its own page in Settings → From plugins; address #settings/<plugin>:<id>. */
    section(s: { id?: string; label: string; icon?: string; badge?(): string | number; render(): string }): void
    /** Extra content on its card in Settings → Plugins. */
    add(card: unknown): void
  }
  activities: {
    /** A page of its own in the left bar; address #<plugin>:<id>/<its route>. after(box) runs after each render. */
    add(a: { id: string; label: string; icon?: string; render(): string; after?(box: HTMLElement): void }): void
  }
  palette: {
    add(item: { label: string; group?: string; keywords?: string; run(target: PaletteTarget): unknown }): void
  }
  claude: {
    /** After 0.9.14, uses.claude + uses.folders: Claude Code in a folder it was given, in Echo's terminal, on the user's
     *  click or key (else it throws). The user's session: the plugin can't type into it or read it. */
    session(opts: { folder: string; path?: string; mode?: 'read' | 'edit'; profile?: string }): void
  }
  echo: {
    /** uses.echo.jobs: Echo's background jobs. */
    jobs: {
      list(): Promise<Json>
      runs(job: string, opts?: { limit?: number }): Promise<Json[]>
      /** Only on the user's click or key; checked as `echoctl jobs set`; resolves to the list after. */
      set(job: string, settings: string[]): Promise<Json>
    }
    /** uses.echo.jobs: Echo's jobs and plugins' routines in the routines' one shape. */
    routines: {
      list(): Promise<{ routines: Json[]; night: Json }>
      runs(id: string, opts?: { limit?: number }): Promise<Json[]>
    }
  }
  /** After 0.9.14, uses.microphone: only on the user's click in its own view, never while Echo records. */
  microphone: {
    open(audio?: boolean | MediaTrackConstraints): Promise<MediaStream>
    close(): void
    isOpen(): boolean
  }
  /** Where the window is. */
  where(): { view: string; section: string; route: string; tab?: string }
  go(hash: string): void
  /** Draw the window again after its data changed. */
  render(): void
  /** Echo's own pieces, so a plugin looks like Echo. */
  ui: {
    esc(s: string): string
    /** Its CSS, removed with the plugin. */
    style(css: string): void
    /** After 0.9.14: a .css file of its package by a plain relative path, resolved once loaded. */
    stylesheet(path: string): Promise<void>
    /** After 0.9.14: replace a box's HTML unless it is what patch last wrote there (focus, typed text and scroll stay). */
    patch(el: HTMLElement, html: string): void
    /** The clipboard, on the user's click or key (else it throws); 10,000 characters at most. */
    copy(text: string): void
    /** A message in the window's status line. */
    notice(text: string): void
    relDay(isoDay: string): string
    ago(iso: string): string
    /** Echo's graph view (Sigma over graphology): draw(box, key, build, {click}) lays a graph out once per key. */
    graph: {
      draw(box: HTMLElement | null, key: string, build: () => unknown, opts?: { click?(id: string, attrs: Record<string, unknown>): void }): unknown
      find(box: string, q: string): unknown
      focus(box: string, ids: unknown): number
      select(box: string, id: string | null): void
    }
    /** A new graphology Graph for draw's build(). */
    newGraph(): any
    [k: string]: unknown
  }
}
