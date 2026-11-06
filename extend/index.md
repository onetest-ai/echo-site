<!-- Generated from extend/index.html by tools/html2md.py. Types: https://echo.onetest.ai/extend/echo-plugin.d.ts -->

# Make Echo yours.

A plugin is a folder with a manifest and two JavaScript files: a host half that runs inside Echo and a client half that draws in its window. People install it from a marketplace, after a sheet tells them what it may touch.

[Start with the quick start](#quickstart) · [See ours on GitHub](https://github.com/onetest-ai/echo-plugins)

Host half · main.js: **Runs inside Echo**

One sandbox per plugin. Commands, timers, its own files and settings, HTTPS, Claude Code on your profiles, the Inbox, sending to you.

Client half · client.js: **Draws in the window**

A Settings section, panels, buttons in Echo's slots, palette actions, an activity of its own — in Echo's own look, light and dark.

## Overview

An Echo plugin adds a feature with its own code. It is a folder with a manifest, `echo-plugin.json`, and up to two JavaScript modules. The **host half** runs inside Echo, in a sandbox of its own (QuickJS, 64 MB, 5 seconds of JavaScript at a time; long work is async). The **client half** runs in the Echo window. Both export `apply(ctx)`; `ctx` is the only way to Echo.

Echo loads enabled plugins when it starts and again after an install, an update, a switch or a removal. Switched off, a plugin's settings section, panels, buttons, timers and skills are gone; its files stay in its own folder until it is removed.

[echo-plugin.d.ts](https://echo.onetest.ai/extend/echo-plugin.d.ts) — the types of `ctx`, the manifest and every `target`, for your editor and for agents · [This page as Markdown](https://echo.onetest.ai/extend/index.md)

Its code: `<config>/plugins/installed/<id>/<version>/`

Its files and settings: `<data folder>/.echo/plugins/<id>/`

Its secrets: `<config>/plugins/secrets/<id>.json`

## Quick start

Standup: yesterday's calls as three bullets, on its own Settings page. Six steps, about ten minutes.

### 1. Make the folder

A plugin is a folder. Put it in a marketplace folder of your own — a Git repository later, a plain folder while you write it.

```
my-plugins/
├── echo-marketplace.json
└── plugins/
    └── standup/
        ├── echo-plugin.json
        ├── main.js
        └── client.js
```

### 2. Write the manifest

`echo-plugin.json` names it, the Echo it needs, its two halves and its settings. `uses` says what it may touch: each entry becomes a line of the install sheet.

File echo-plugin.json:

```
{
  "id": "standup",
  "name": "Standup",
  "version": "0.1.0",
  "echo": ">=0.7.4",
  "summary": "Yesterday's calls as a three-line standup",
  "uses": { "claude": {} },
  "main": "main.js",
  "client": "client.js",
  "settings": [
    { "key": "team", "label": "Team name", "type": "string" }
  ]
}
```

### 3. The host half

`main.js` runs inside Echo. Here a command asks Claude Code, on the user's own AI profile and read-only, for a standup from yesterday's calls, and keeps the answer in the plugin's own folder, and returns it as HTML.

File main.js:

```
export function apply(ctx) {
  ctx.command('standup', async () => {
    const team = (await ctx.settings.get('team')) || 'my team'
    const { answer } = await ctx.claude.run({
      title: 'Standup',
      tools: 'read',
      prompt: `From my calls since yesterday, write ${team}'s standup in three bullets.`,
    })
    await ctx.store.write('last.md', answer)
    return { html: ctx.markdown(answer) }   // Echo's safe Markdown writer
  })
}
```

### 4. The client half

`client.js` runs in the Echo window: a section of its own in Settings, a button, and the answer the host half turned into safe HTML with `ctx.markdown`.

File client.js:

```
export function apply(ctx) {
  let text = ''
  ctx.settings.section({
    id: 'main',
    label: 'Standup',
    render: () => `<h2>Standup</h2>
      <button class="btn primary" data-standup>Write it</button>
      <div>${text}</div>`,
  })
  ctx.listen('click', async (e) => {
    if (!e.target.closest('[data-standup]')) return
    const r = await ctx.call('standup')
    text = r.html
    ctx.render()
  })
}
```

### 5. List it

`echo-marketplace.json` at the marketplace's root lists its plugins. Push the folder to GitHub to share it: people add `owner/repo`.

File my-plugins/echo-marketplace.json:

```
{
  "name": "acme",
  "owner": "acme-example",
  "featured": ["standup"],
  "plugins": [
    { "id": "standup", "source": "./plugins/standup",
      "categories": ["automation"] }
  ]
}
```

### 6. Install it

In Echo: Settings → Plugins → Marketplaces → Add → the `my-plugins` folder. Then Discover → Standup → Install. A folder is read where it is: after an edit, Read again.

```
# Or from a terminal:
echoctl plugin marketplace add ~/my-plugins
echoctl plugin install standup      # shows what it uses; --yes agrees
echoctl plugin call standup standup
```

## The manifest

`echo-plugin.json` at the root of the plugin's folder. Echo reads it before anything runs, and the install sheet is made from it.

`id` (string, required):

Lowercase letters, digits and dashes. The plugin's folder names, its settings and its routes use it, so it never changes.

`name` (string, required):

What people see on its card, in Settings and on the install sheet.

`version` (string, required):

A plain version (`1.2.0`). When its marketplace offers a newer one, Settings → Plugins shows Update.

`echo` (string):

The Echo it needs: `">=0.7.4"`. An older Echo shows "Needs a newer Echo" instead of Install.

`summary` (string):

One line for its card in Discover.

`uses` (object):

What it may touch: `claude`, `schedule`, `deliver`, `deliver_provider`, `network`, `folders`, `sessions`, `channel`, `echo`, `events`. Each is described with the functions it opens in the [Host API](#host).

`main` (path):

Its host half, an ES module in the plugin's folder. Leave it out for a plugin that only draws.

`client` (path):

Its client half, an ES module loaded into the window. Leave it out for a plugin that only works in the background.

`settings` (array):

Values the user sets in its card: `{key, label, type, help}` with type `string`, `bool`, `folder` or `secret`. Secrets are stored apart and never shown again.

## Host API

What `ctx` holds in `main.js`. Every call that waits — Claude Code, HTTPS, the folder picker, reading many files — returns a promise and runs outside the plugin's time slice.

Some groups need a capability: a key in the manifest's `uses`. Each one becomes a sentence on the install sheet, shown under its group; a function that needs one refuses without it, and an update that asks for more waits until the user agrees again.

### Commands and timers

`"uses": { "schedule": {} }` — Install sheet: “Works on its own on a schedule while Echo runs”

Only `ctx.every` needs it; commands need nothing.

#### `ctx.command(name, fn)`

A command others can run: the plugin's client half (`ctx.call`), an Inbox button, or `echoctl plugin call`. `fn` gets the arguments as an object, may be async, and returns anything JSON can hold.

```
ctx.command('summary', async ({ days = 1 }) => {
  return { text: `last ${days} day(s)` }
})
```

#### `ctx.every(seconds, fn)` — needs `schedule`

Runs `fn` every so many seconds (at least 10) while Echo runs. Command-line calls never start timers.

`"uses": { "events": { "on": ["recording_started", "minutes_written"] } }` — Install sheet: “Knows when a recording starts and a call's minutes are written”

A plugin hears only the events it names. A plugin with `echo.read` also hears `minutes_written` and `sources_changed`.

#### `ctx.on(event, fn)` — needs `events`

Calls `fn(payload)` each time it happens, while Echo runs (command-line calls hear nothing, and nothing is replayed). Returns a promise that is refused for an event the manifest doesn't name. Payloads carry ids and titles, never what was said: read that with `ctx.echo.read`. `call` is the call's folder name.

```
ctx.on('minutes_written', ({ call, title, link }) => {
  ctx.log(`minutes for ${title}: ${link}`)
})
```

`meeting_soon` ({ id, subject, start }):

When a meeting is about to start.

`call_started` ({ app }):

When a Teams call starts.

`call_ended` ({ app, recording }):

When a Teams call ends.

`recording_started` ({ call, title, memo }):

When a recording starts.

`recording_stopped` ({ call, duration_s, reason }):

When a recording stops.

`transcribed` ({ call, ok }):

When a call's transcript is ready.

`minutes_written` ({ id, link, call, title }):

When a call's minutes are written.

`thread_synced` ({ thread, processed, left }):

When a thread's work is updated from its calls and mail.

`sources_changed` ({ changed, removed }):

When Echo's sources change.

### Its own files and settings

#### `ctx.store.read(path) · write(path, text) · list(dir) · remove(path) · path(path)`

Text files in the plugin's own folder inside the user's data folder. Paths are relative and stay inside it.

#### `ctx.settings.get(key) · set(key, value)`

The values of its manifest's `settings`. A `secret` is kept in a file only the user can read and is never sent to the window. `store.read` of a missing file gives `null`.

#### `ctx.package.read(path) · list(dir)`

Its own installed files, read-only — templates, prompts, defaults it ships.

### Network

`"uses": { "network": { "hosts": ["api.example.com"] } }` — Install sheet: “Talks to api.example.com over HTTPS”

#### `ctx.http.fetch(url, { method, headers, body })` — needs `network`

HTTPS to the hosts its manifest names; anything else is refused. Methods GET, POST, PUT, PATCH, DELETE; a 60-second limit and 10 MB per answer. Returns `{status, body}`.

```
const r = await ctx.http.fetch('https://api.example.com/v1/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { name: 'x' },
})
```

### Claude Code

`"uses": { "claude": {} }` — Install sheet: “Runs Claude Code on your AI profiles, with the permissions you pick”

#### `ctx.claude.run({ prompt, title, profile, model, tools, dir, timeout })` — needs `claude`

Runs Claude Code headless on one of the user's AI profiles (the default when `profile` is left out) and returns `{answer, model, usage}` — `usage` holds tokens, cost and time. `tools` decides what it may do: `"none"`; `"read"` — the data folder, Echo's read-only commands and the Brain; `"folder"` — the user's own Claude Code settings, refusing anything that would ask; `"skip"` — everything, unattended. `timeout` is in minutes (1–60, default 20); `dir` is its working folder inside the plugin's store (default `runs/<time>`). Echo adds the date and how to reach its data to the prompt.

```
const { answer, usage } = await ctx.claude.run({
  title: 'Weekly digest',
  tools: 'read',
  prompt: 'What did my clients ask for this week?',
})
```

#### `ctx.claude.hasPlugin(spec, profile) · installPlugin(spec, profile)`

Whether a Claude Code plugin (`name@marketplace`) is installed for a profile, and installing it at that profile's user scope.

#### `ctx.profiles()`

The user's AI profiles: `{default, profiles: [{id, name}]}`.

### Talking to the user

`"uses": { "deliver": { "to": ["teams", "mail"] } }` — Install sheet: “Sends messages to you: Teams (your chat with yourself) and mail”

`"uses": { "deliver_provider": { "kinds": ["telegram"] } }` — Install sheet: “Adds a way Echo sends things to you: Telegram”

Notifications, the Inbox and Markdown need nothing. Messages go only to the user — never to an address a model picked.

#### `ctx.notify(title, body)`

A system notification from Echo.

#### `ctx.inbox.set(key, item) · clear(key)`

An item in Echo's Inbox until it is cleared: `{title, why, go, actions: [{label, command, args, primary}]}`. Each action runs one of the plugin's commands; `go` is where a click on the item leads.

```
ctx.inbox.set('failed-42', {
  title: 'Routine failed: Monday digest',
  why: 'The AI profile needs a sign-in',
  actions: [{ label: 'Run again', command: 'run', args: { id: 42 }, primary: true }],
})
```

#### `ctx.deliver.status() · send(kind, msg)` — needs `deliver`

The ways Echo can send to the user, and sending: `msg` is `{title, markdown}`; Echo marks anything a model wrote.

#### `ctx.deliver.provide(kind, { label, send }) · ready(kind, yes, why)` — needs `deliver_provider`

Become a way to send: Echo calls `send(msg)` for messages of that kind; `ready` says whether it can send now, and why not.

#### `ctx.markdown(md)`

Echo's safe Markdown writer: HTML with everything escaped, https links only.

### Folders the user picks

`"uses": { "folders": { "what": "Obsidian vaults" } }` — Install sheet: “Reads the Obsidian vaults you pick, on this computer — only those”

Read-only: there is no write access to the user's folders.

#### `ctx.system.pickFolder(prompt)` — needs `folders`

The system's folder picker. The folder picked is granted to this plugin (and listed in its card); returns its path, or `null`.

#### `ctx.fs.folders() · list · read · readMany · walk · forget` — needs `folders`

Read-only access inside the granted folders: `list(root, path)`, `read(root, path, max)`, `readMany(root, paths, max)`, `walk(root, {path, ext, hidden, max})`, `forget(root)`. Paths are relative to a granted root; links are never followed out of it. `readMany` and `walk` run outside the plugin's time slice, for big folders.

```
const [root] = await ctx.fs.folders()
const files = await ctx.fs.walk(root, { ext: ['md'] })
const texts = await ctx.fs.readMany(root, files.map((f) => f.path))
```

### Echo's Claude sessions

`"uses": { "sessions": { "skills": true, "read": true, "hints": true } }` — Install sheet: “Gives Claude in Echo skills of its own; lets it read the folders you give it; tells it about the client or thread open in the window”

`"uses": { "channel": { "plugin": "telegram@claude-plugins-official" } }` — Install sheet: “Lets you reach your Claude · Echo folder session through Telegram”

Each part of `sessions` is asked for on its own, and all of it reaches only Echo's own sessions — never the user's Claude Code.

#### `ctx.sessions.skills([{ name, description, body }])` — needs `sessions.skills`

Skills for Echo's own Claude sessions — the Echo folder session and `claude.run`. Text only: Echo writes the skill files itself, so no hooks, MCP servers or agents come with them, and they never reach the user's Claude Code.

#### `ctx.sessions.read(folders)` — needs `sessions.read`

Which of its granted folders Echo's sessions may read.

#### `ctx.view.hints([{ client | thread, text }])` — needs `sessions.hints`

One plain line Claude is told when that client or thread is open in the window.

#### `ctx.sessions.channel({ plugin, env }) · clearChannel()` — needs `channel`

The Echo folder session listens to the Claude Code channel its manifest names.

### Echo's data and the system

`"uses": { "echo": { "read": ["clients", "threads"] } }` — Install sheet: “Reads the names of your clients and threads in Echo”

#### `ctx.echo.read("clients" | "threads")` — needs `echo`

Names and ids of the user's clients or threads, read-only.

#### `ctx.system.which(name)`

Whether a program is on this computer, and where.

#### `ctx.log(...)`

A line in Echo's log.

## Where a plugin shows up

The client half (`client.js`) puts a plugin into Echo's window. Each place below shows where it appears — a demo plugin put "Your button", "Your panel" and the rest there — what to call, and what Echo hands the code. Everything a plugin adds is taken out when it is switched off, updated or removed.

Draw with Echo's own CSS tokens — `var(--accent)`, `var(--line)`, `var(--text-2)`, classes such as `btn`, `btn primary`, `set-sub` — and it looks like Echo in light and dark. Work that needs the host half (Claude Code, the network, files) runs through one of its commands: `ctx.call(command, args)`.

### Buttons in Echo's slots

A **slot** is a place where Echo keeps room for plugins' buttons, beside its own. `ctx.slots.add(slot, { label, icon, title, when, run })`: `label` the text, `icon` an SVG string before it, `title` the tooltip; `when(target)` decides whether it shows (left out: always), `run(target)` is the click — an error it throws is shown with the label. `target` is what the screen is about.

### A button on a meeting — calendar.event

Calendar → a meeting → its card, under Echo's Record / Join buttons.

![A meeting card in the calendar with a plugin button "Your button" under Record when it starts](https://echo.onetest.ai/assets/screens/extend/slot-calendar-event.png)

```
ctx.slots.add('calendar.event', {
  label: 'Prep brief',
  when: ({ event }) => !event.recorded && new Date(event.start) > Date.now(),
  run: async ({ event }) => {
    const { markdown } = await ctx.call('brief', { subject: event.subject, start: event.start })
  },
})
```

- `target` — `{ kind: "event", event }`

- `event.id, subject, start, end` — the meeting; times are ISO strings

- `event.online, join_url` — a Teams meeting and its link

- `event.organizer, people, location` — the organiser's name, how many are invited, where

- `event.cancelled, declined` — as Outlook says

- `event.recorded` — `{name, status, minutes}` when Echo has the call, else empty

- `event.scheduled` — Echo will record it

- `event.projects` — the threads it belongs to

### An item in a call's menu — call.menu

A call → the ⋯ button in its header → the menu, above Delete.

![The ⋯ menu of a call with a plugin item "Your button" after Ask Claude about this call](https://echo.onetest.ai/assets/screens/extend/slot-call-menu.png)

```
ctx.slots.add('call.menu', {
  label: 'Send minutes to the team',
  when: ({ call }) => call.status === 'done',
  run: ({ call }) => ctx.call('send', { call: call.name }),
})
```

- `target` — `{ kind: "call", call }`

- `call.name` — the call's folder name — how commands and the CLI name it

- `call.title, started_at, minutes` — its title, start (ISO) and length in minutes

- `call.status` — `recording`, `transcribing`, `done`…

- `call.people` — who was in it

- `call.path` — its folder on disk

- `call.meeting` — the invite: subject, attendees

### A button on a task — task.actions

A thread's Work tab (or Tasks) → a story, task, decision, risk or question → its details, under its fields.

![A task's details in the right panel with a plugin button "Your button" under its fields](https://echo.onetest.ai/assets/screens/extend/slot-task-actions.png)

```
ctx.slots.add('task.actions', {
  label: 'Open a ticket',
  when: ({ kind }) => kind === 'task',
  run: ({ node, project }) => ctx.call('ticket', { thread: project, id: node.id, title: node.title }),
})
```

- `target` — `{ kind, node, project }`

- `kind` — `story`, `task`, `decision`, `risk` or `question`

- `node.id, title, state` — e.g. `T001`, its title, `open` / `done`…

- `node.owners, due, description, links` — who, when, the text, its links

- `node.history` — what was said about it, with quotes

- `project` — the thread's id

### A panel

A view in the right (or bottom) panel, with its icon among Echo's own tabs; the user moves and closes it like any panel.

![The right panel showing the plugin's "Your panel" tab beside Echo's My notes, Inbox and Vocabulary](https://echo.onetest.ai/assets/screens/extend/panel.png)

```
ctx.panels.add({
  id: 'standup',
  label: 'Standup',
  icon: '<svg …></svg>',
  area: 'right',                 // or 'bottom'
  when: () => true,              // when it may show
  render: () => `<div style="padding:14px 16px">${last}</div>`,
})
ctx.showPanel('standup')         // open it, e.g. from a button
```

Call `ctx.render()` after its data changes, and the panel draws again.

### A Settings page

Settings → From plugins → its own entry, with an icon and a count.

![Settings with "Your section" under From plugins and its page open](https://echo.onetest.ai/assets/screens/extend/settings-section.png)

```
ctx.settings.section({
  id: 'main',
  label: 'Standup',
  icon: '<svg …></svg>',
  badge: () => routines.length,   // the count beside its name
  render: () => `<h2>Standup</h2><p class="set-lead">…</p>`,
})
```

Its address is `#settings/<plugin>:<id>` — `ctx.go('settings/standup:main')` opens it. The values of the manifest's `settings` get a card in Settings → Plugins on their own; `ctx.settings.add(card)` adds to that card.

### A ⌘K action

The ⌘K palette (Ctrl+K on Windows), in a group of its own.

![The ⌘K palette with "Your action" under the plugin's group](https://echo.onetest.ai/assets/screens/extend/palette.png)

```
ctx.palette.add({
  label: 'Write a standup',
  group: 'Standup',
  keywords: 'daily scrum',
  run: (target) => ctx.call('standup'),
})
```

- `target` — what the palette is on (the chip in its box): `{ kind: "call", c, label }` on a call, `{ kind: "event", e, label }` on a meeting, or nothing

### An activity, with a graph

The bar on the left, under Echo's activities: a page of its own. Here it draws Echo's graph.

![A plugin activity "Yours" in the left bar showing a page with a graph of nodes and links](https://echo.onetest.ai/assets/screens/extend/activity.png)

```
ctx.activities.add({
  id: 'map',
  label: 'Map',
  icon: '<svg …></svg>',
  render: () => `<div style="padding:22px 28px;height:100%">
      <h2>Map</h2><div id="map-g" style="height:520px"></div></div>`,
  // after each render: draw into the page
  after() {
    ctx.ui.graph.draw(document.getElementById('map-g'), 'map', () => {
      const G = ctx.ui.newGraph()               // a graphology graph
      G.addNode('sso', { label: 'SSO', size: 1.4, color: '#9b78ff', x: 0, y: 0 })
      G.addNode('pilot', { label: 'Pilot', size: 0.9, color: '#9b78ff', x: 1, y: 1 })
      G.addEdge('sso', 'pilot', { size: 1, color: '#8a8a9566' })
      return G
    }, { click: (id) => ctx.go(`${ctx.id}:map/${id}`) })
  },
})
```

Its address is `#<plugin>:<id>/…`; what follows the id is the activity's own route (`ctx.where().route`). `ctx.ui.graph.draw(box, key, build, opts)` lays the graph out once per `key` and keeps it across renders; sizes are relative to the graph — keep them small.

### An Inbox item

Inbox (the tray at the foot of the bar, and its panel): something waiting for the user, with buttons. It comes from the **host** half.

![The Inbox panel with "Your Inbox item" and its buttons Do it and Not now](https://echo.onetest.ai/assets/screens/extend/inbox.png)

```
// main.js
ctx.inbox.set('weekly-failed', {
  title: 'Routine failed: Monday digest',
  why: 'The AI profile needs a sign-in',
  go: 'settings/standup:main',              // where a click on it leads
  actions: [
    { label: 'Run again', command: 'run', args: { id: 42 }, primary: true },
    { label: 'Not now', command: 'snooze', args: { id: 42 } },
  ],
})
ctx.inbox.clear('weekly-failed')            // once it is decided
```

Each button runs one of the plugin's commands with its `args`. Echo keeps the item until the plugin clears it.

### The rest of the client half

#### `ctx.call(command, args)`

Runs a command of its host half; a promise of what it returned.

#### `ctx.listen(type, fn) · ctx.ui.style(css)`

Document events (clicks on its own buttons) and CSS, removed with the plugin — an update never doubles a click.

#### `ctx.where() · ctx.go(hash) · ctx.render()`

Where the window is (`{view, section, route}`), going somewhere, and drawing again after its data changed.

#### `ctx.ui`

Echo's helpers: `esc` (escape text for HTML), `style`, `notice` (a message in the status line), `relDay`, `ago`, `graph`, `newGraph`. Markdown is the host half's: `ctx.markdown`.

## Marketplaces

A marketplace is a Git repository or a folder with `echo-marketplace.json` at its root. Users add it in Settings → Plugins → Marketplaces as `owner/repo`, `owner/repo@ref`, a Git URL (`…#ref`) or a folder on their computer. Echo's own, [onetest-ai/echo-plugins](https://github.com/onetest-ai/echo-plugins), is built in.

```
{
  "name": "acme",
  "owner": "acme-example",
  "featured": ["standup"],
  "plugins": [
    { "id": "standup", "source": "./plugins/standup", "categories": ["automation"] },
    { "id": "board", "source": { "github": "acme-example/board", "ref": "v2", "path": "plugin" } }
  ]
}
```

- A plugin's `source` is a folder in the same repository, or another GitHub repository at a ref and path.
- Echo checks every tree it fetches: no links; at most 5,000 files and 64 MB a marketplace, 400 files and 20 MB a plugin.
- It reads a marketplace again after 30 minutes and right after Echo updates. A folder is read where it is — while you write a plugin, Read again shows each edit.

## Security model

- **Installing is trusting.** A plugin runs its own code with the user's rights; the install sheet says so first and names who listed it.
- **Files.** Its own folder, and the folders the user picked for it, read-only; links are not followed out of them.
- **Network.** HTTPS to the hosts its manifest names, nothing else.
- **Claude Code.** Runs on the user's AI profiles with the tools the plugin asks for per run; a read-only run can't change anything.
- **The user's Claude Code is never touched.** Skills and folders go only to Echo's own sessions.
- **Secrets** are kept apart, readable only by the user, and never reach the window. Removing a plugin deletes its grants, hints and skills.

## Command line

```
echoctl plugin list                          # installed, offered, updates
echoctl plugin marketplace add <owner/repo | URL | folder>
echoctl plugin marketplace update            # read them again
echoctl plugin install <id> [--yes]          # shows what it uses; --yes agrees
echoctl plugin update <id>  |  remove <id>  |  enable <id>  |  disable <id>
echoctl plugin set <id> <key> <value>        # one of its settings
echoctl plugin call <id> <command> [json]    # run a command of its host half
```

## Examples

 [**Scheduler**Prompts on a schedule, sent to Teams, mail or Telegram: every, claude.run, deliver, inbox, a Settings section.](https://github.com/onetest-ai/echo-plugins/tree/main/plugins/scheduler) [**Telegram**A way Echo sends to you and a channel to Claude: deliver.provide, http, sessions.channel, a secret setting.](https://github.com/onetest-ai/echo-plugins/tree/main/plugins/telegram) [**Obsidian**Vaults for Claude and a vault browser: folders, fs.readMany, sessions.skills, an activity with a graph.](https://github.com/onetest-ai/echo-plugins/tree/main/plugins/obsidian)

Questions and ideas: [GitHub issues](https://github.com/onetest-ai/echo/issues).
