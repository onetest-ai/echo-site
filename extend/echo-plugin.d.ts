// Echo plugins — types for `ctx`, the manifest and what Echo hands a plugin's code.
// https://echo.onetest.ai/extend/ · Echo 0.7.4 and later.
//
// A plugin is a folder: echo-plugin.json (EchoPluginManifest), a host half (`main`, runs inside Echo) and a client
// half (`client`, runs in the Echo window). Each half is an ES module exporting `apply(ctx)`:
//
//   /** @param {import('./echo-plugin').HostContext} ctx */
//   export function apply(ctx) { ... }          // main.js
//   /** @param {import('./echo-plugin').ClientContext} ctx */
//   export function apply(ctx) { ... }          // client.js

// ── the manifest (echo-plugin.json) ─────────────────────────────────────────────────────────────────────────────

export interface EchoPluginManifest {
  /** Lowercase letters, digits and dashes; never changes. */
  id: string
  name: string
  /** A plain version, "1.2.0". */
  version: string
  /** The Echo it needs, e.g. ">=0.7.4". */
  echo?: string
  /** One line for its card. */
  summary?: string
  /** What it may touch: each key becomes a line of the install sheet; host functions that need one refuse without it. */
  uses?: Uses
  /** Its host half, an ES module path. */
  main?: string
  /** Its client half, an ES module path. */
  client?: string
  /** Values the user sets in its card in Settings → Plugins. */
  settings?: SettingDef[]
}

export interface Uses {
  /** ctx.claude.run */
  claude?: {}
  /** ctx.every */
  schedule?: {}
  /** ctx.deliver.send to these ways ("teams", "mail", or one a plugin adds). */
  deliver?: { to: string[] }
  /** ctx.deliver.provide for these kinds. */
  deliver_provider?: { kinds: string[] }
  /** ctx.http.fetch to these hosts only (HTTPS). */
  network?: { hosts: string[] }
  /** ctx.system.pickFolder and read-only ctx.fs; `what` names them on the install sheet ("Obsidian vaults"). */
  folders?: { what?: string }
  /** Each part on its own: skills → ctx.sessions.skills, read → ctx.sessions.read, hints → ctx.view.hints. */
  sessions?: { skills?: boolean; read?: boolean; hints?: boolean }
  /** ctx.sessions.channel for this Claude Code channel plugin ("name@marketplace"). */
  channel?: { plugin: string }
  /** ctx.echo.read for these kinds. */
  echo?: { read: Array<'clients' | 'threads'> }
}

export interface SettingDef {
  key: string
  label: string
  /** Default "string". A secret is stored apart, readable only by the user, and never sent to the window. */
  type?: 'string' | 'bool' | 'folder' | 'secret'
  default?: unknown
  help?: string
}

// ── the host half (main.js): runs inside Echo ──────────────────────────────────────────────────────────────────
// One sandbox per plugin (QuickJS, 64 MB, 5 s of JavaScript per slice). Calls returning a Promise run outside the slice.

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

export interface HostContext {
  /** The plugin's id. */
  id: string
  /** A line in Echo's log. */
  log(...args: unknown[]): void
  /** A command the client half (ctx.call), an Inbox button or `echoctl plugin call <id> <name> [json]` runs. */
  command(name: string, fn: (args: Record<string, Json>) => Json | Promise<Json>): void
  /** Every `seconds` (at least 10) while Echo runs. Needs uses.schedule. Command-line calls never start timers. */
  every(seconds: number, fn: () => void | Promise<void>): void
  /** Reserved: Echo raises no events to plugins yet. */
  on(event: string, fn: (payload: Json) => void): void
  /** Text files in its own folder in the data folder (<home>/.echo/plugins/<id>/); relative paths only. */
  store: {
    read(path: string): string | null
    write(path: string, text: string): void
    list(dir?: string): string[]
    remove(path: string): void
    /** The absolute path of a file in it. */
    path(path?: string): string
  }
  /** Its manifest's settings. */
  settings: {
    get(key: string): Json
    set(key: string, value: Json): void
  }
  /** Its own installed files, read-only (templates, prompts it ships). */
  package: {
    read(path: string): string | null
    list(dir?: string): string[]
  }
  /** HTTPS to the hosts uses.network names; 60 s, 10 MB. Needs uses.network. */
  http: {
    fetch(url: string, opts?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; headers?: Record<string, string>; body?: string | Json }): Promise<{ status: number; body: string }>
  }
  /** Echo's safe Markdown writer: HTML with everything escaped, https links only. */
  markdown(md: string): string
  /** A system notification from Echo. */
  notify(title: string, body?: string): void
  /** Items in Echo's Inbox until cleared. */
  inbox: {
    set(key: string, item: InboxItem): void
    clear(key: string): void
  }
  /** The user's AI profiles. */
  profiles(): { default: string; profiles: Array<{ id: string; name: string }> }
  claude: {
    /** Claude Code headless on one of the user's AI profiles. Needs uses.claude. */
    run(opts: ClaudeRun): Promise<{ answer: string; model: string; usage: Json }>
    /** Is a Claude Code plugin ("name@marketplace") installed for a profile ('' = the default)? */
    hasPlugin(spec: string, profile?: string): Promise<Json>
    /** Install it at that profile's user scope. */
    installPlugin(spec: string, profile?: string): Promise<Json>
  }
  sessions: {
    /** The Echo folder session listens to the channel uses.channel names, with these env keys (no CLAUDE* / ANTHROPIC*). */
    channel(opts: { plugin: string; env?: Record<string, string> }): void
    clearChannel(): void
    /** Skills (text only) for Echo's own Claude sessions, never the user's Claude Code; [] removes them. Needs uses.sessions.skills. */
    skills(list: Array<{ name: string; description: string; body: string }>): void
    /** Which of its granted folders Echo's sessions may read. Needs uses.sessions.read. */
    read(folders: string[]): void
  }
  /** A plain line Claude is told when that client or thread is open in the window (replaces all). Needs uses.sessions.hints. */
  view: { hints(list: Array<{ client?: string; thread?: string; text: string }>): void }
  /** Echo's own data, read-only. Needs uses.echo. */
  echo: { read(kind: 'clients' | 'threads'): Json }
  /** Read-only, inside the folders the user picked for it; paths relative to a granted root. Needs uses.folders. */
  fs: {
    folders(): string[]
    forget(root: string): void
    /** A folder's entries (links left out). */
    list(root: string, path?: string): Array<{ name: string; dir: boolean }>
    /** Up to `max` bytes (default 1 MB, at most 4 MB); throws when it can't be read. */
    read(root: string, path: string, max?: number): string
    readMany(root: string, paths: string[], max?: number): Promise<Array<string | null>>
    walk(root: string, opts?: { path?: string; ext?: string[]; hidden?: boolean; max?: number }): Promise<Array<{ path: string; size: number; mtime: number }>>
  }
  system: {
    /** Where a program is on this computer, if it is. */
    which(name: string): string | null
    /** The system's folder picker; the folder picked is granted to the plugin. Needs uses.folders. */
    pickFolder(prompt?: string): Promise<string | null>
  }
  deliver: {
    /** The ways Echo can send to the user now. */
    status(): Json
    /** Send to the user. Needs uses.deliver naming `kind`. */
    send(kind: string, msg: { title: string; markdown: string }): Promise<Json>
    /** Become a way to send: Echo calls opts.send(msg). Needs uses.deliver_provider naming `kind`. */
    provide(kind: string, opts: { label?: string; send(msg: { title: string; markdown: string; about?: string; ai?: boolean }): Promise<unknown> | unknown }): void
    /** Whether it can send now, and why not. */
    ready(kind: string, yes: boolean, why?: string): void
  }
}

export interface ClaudeRun {
  prompt: string
  /** For the user: what this run is. */
  title?: string
  /** An AI profile id; the default when left out. */
  profile?: string
  model?: string
  /** "none"; "read" (default) — the data folder, Echo's read-only commands, the Brain; "folder" — the user's own
   *  Claude Code settings, refusing anything that would ask; "skip" — everything, unattended. */
  tools?: 'none' | 'read' | 'folder' | 'skip'
  /** Its working folder, relative to the plugin's store (default runs/<timestamp>). */
  dir?: string
  /** Minutes, 1–60 (default 20). */
  timeout?: number
}

export interface InboxItem {
  title: string
  why?: string
  /** Where a click on the item leads: a window route such as "settings/<plugin>:main". */
  go?: string
  urgent?: boolean
  /** Each runs one of the plugin's commands. */
  actions?: Array<{ label: string; command: string; args?: Json; primary?: boolean }>
}

// ── the client half (client.js): runs in the Echo window ────────────────────────────────────────────────────────

export type Slot = 'calendar.event' | 'call.menu' | 'task.actions'

export interface SlotTargets {
  'calendar.event': { kind: 'event'; event: CalendarEvent }
  'call.menu': { kind: 'call'; call: Call }
  'task.actions': { kind: 'story' | 'task' | 'decision' | 'risk' | 'question'; node: WorkItem; project: string }
}

export interface SlotItem<S extends Slot> {
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
  /** Run a command of its host half. */
  call(command: string, args?: Record<string, Json>): Promise<Json>
  /** A document listener removed with the plugin. */
  listen(type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): void
  slots: {
    list(): Slot[]
    add<S extends Slot>(slot: S, item: SlotItem<S>): void
  }
  panels: {
    add(view: { id: string; label: string; icon?: string; area?: 'right' | 'bottom'; when?(): boolean; render(): string }): void
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
  /** Where the window is. */
  where(): { view: string; section: string; route: string }
  go(hash: string): void
  /** Draw the window again after its data changed. */
  render(): void
  /** Echo's own pieces, so a plugin looks like Echo. */
  ui: {
    esc(s: string): string
    /** Its CSS, removed with the plugin. */
    style(css: string): void
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
