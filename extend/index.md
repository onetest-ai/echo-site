<!-- Generated from extend/index.html by tools/html2md.py. Types: https://echo.onetest.ai/extend/echo-plugin.d.ts -->

# Make Echo yours.

A plugin is a folder with a manifest and two JavaScript files: a host half that runs inside Echo and a client half that draws in its window. People install it from a marketplace, after a sheet tells them what it may touch.

[Start with the quick start](#quickstart) · [See ours on GitHub](https://github.com/onetest-ai/echo-plugins)

Host half · main.js: **Runs inside Echo**

One sandbox per plugin. Commands, timers and events, its own files and settings, the folders you give it, the network, Claude Code on your profiles, routines of its own, the Inbox, sending to you.

Client half · client.js: **Draws in the window**

A Settings section, panels, buttons in Echo's slots, palette actions, an activity of its own, Today widgets and dashboards — in Echo's own look, light and dark.

## Overview

An Echo plugin adds a feature with its own code.

- It is a folder with a manifest, `echo-plugin.json`, and up to two JavaScript modules.
- The **host half** runs inside Echo, in a sandbox of its own.

- QuickJS, 64 MB shared by all host halves.
- 5 seconds of JavaScript between awaits; long work is async.
- It is one file with no imports.

- The **client half** runs in the Echo window and may import its own modules.
- Both halves export `apply(ctx)`.
- `ctx` is the only way to Echo.

Echo loads enabled plugins when it starts and again after an install, an update, a switch or a removal — from the window or from a terminal, with no restart.

- Switched off, a plugin's settings section, panels, buttons, timers, connections and skills are gone.
- Its files stay in its own folder until it is removed.

Echo grows its plugin API with each release. What is marked with a version ( *(0.10.0)*,  *(0.10.1)*,  *(0.10.3)*) needs that Echo or later: a plugin that uses it sets `"echo": ">=0.10.3"` (the newest it uses) in its manifest.

[echo-plugin.d.ts](https://echo.onetest.ai/extend/echo-plugin.d.ts) — the types of `ctx` in both halves, the manifest and every `target`, for your editor and for agents · [This page as Markdown](https://echo.onetest.ai/extend/index.md) · `echoctl plugin guide` prints the reference this page is made from, as your Echo has it

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
  "echo": ">=0.10.0",
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

`main.js` runs inside Echo.

- Here a command asks Claude Code, on the user's default AI profile and with the permissions the user set for routines, for a standup from yesterday's calls.
- It keeps the answer in the plugin's own folder and returns it as HTML.

File main.js:

```
export function apply(ctx) {
  ctx.command('standup', async () => {
    const team = (await ctx.settings.get('team')) || 'my team'
    const { answer } = await ctx.claude.run({
      title: 'Standup',
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

### 6. Check and install it

`echoctl plugin check` runs an install's checks on the folder. Then, in Echo: Settings → Plugins → Marketplaces → Add → the `my-plugins` folder; Discover → Standup → Install. A folder is read where it is: after an edit, Read again.

```
# Or from a terminal:
echoctl plugin check ~/my-plugins/plugins/standup   # exit 0, or each problem by file
echoctl plugin marketplace add ~/my-plugins
echoctl plugin install standup      # shows what it uses; --yes agrees
echoctl plugin call standup standup
```

## The manifest

`echo-plugin.json` at the root of the plugin's folder. Echo reads it before anything runs, and the install sheet is made from it.

`id` (string, required):

1–40 lowercase letters, digits and dashes, not starting with a dash. The plugin's folder names, its settings and its routes use it, so it never changes.

`name` (string, required):

Up to 60 characters: what people see on its card, in Settings and on the install sheet.

`version` (string, required):

`X.Y.Z` or `X.Y.Z-pre`. When its marketplace offers another version, Settings → Plugins shows Update; bump it for every change you publish.

`echo` (string):

The Echo it needs: `">=0.10.0"`. An older Echo shows "Needs Echo 0.10.0 or later" instead of Install.

`summary` (string):

One line for its card in Discover, up to 240 characters.

`uses` (object):

What it may touch — one line of the install sheet each (see the table below).

`main` (path):

Its host half, a `.js` or `.mjs` in the plugin's folder: one file, no imports. Leave it out for a plugin that only draws.

`client` (path):

Its client half, an ES module loaded into the window. Leave it out for a plugin that only works in the background.

`settings` (array):

Values the user sets in its card: `{key, label, type, default, help}`, `key` of a–z 0–9 `-` `_`, type `string` (the default), `bool`, `folder` or `secret`. Secrets are stored apart and never shown again.

`widgets` (array):

Widgets it adds to Today and dashboards, up to 24. Its host half gives their data, so a plugin with widgets needs a `main`. See [Today widgets](#widgets).

`dashboards` (array):

Up to 6 ready-made dashboards for a thread or a client, offered for the user to add. See [Dashboards](#dashboards).

`routines` (array):

 *(0.10.0)* Up to 4 Claude Code routines it ships, off until the user switches each on. See [Routines](#routines).

`skills` (array):

Its package skills, by folder (`["skills/staffing"]`): what Claude in Echo may use, at most 10. See [Claude in Echo](#agent).

`agent` (object):

`{summary, prefix}`: its part for Claude in Echo, from its `agent/` folder. See [Claude in Echo](#agent).

`icon` (path):

An `.svg` in its folder (up to 16 KB), shown beside its work rows and ⌘K entries.

### What it may touch: `uses`

Each key is a line on the install sheet, in Echo's own words — never the plugin's.

- The user agrees to the sheet on install.
- An update that adds a line asks again.
- A function that needs a key refuses without it.
- The sheet also says, first, that the plugin runs its own code in Echo and in the window with the user's rights, and names its routines, scripts, part for Claude, dashboards and widgets.

`claude` ({} · {skip: true}):

Runs Claude Code on the user's AI profiles. [Claude Code](#claude)

`schedule` ({}):

`ctx.every`: works on its own on a schedule. [Commands](#host-commands)

`events` ({on: [...]}):

The events it hears. [Events](#host-commands)

`network` ({hosts, hosts_from, ask, web}):

HTTPS hosts it names; addresses the user lists; one address the user types;  *(0.10.3)* any https page on the public internet with `web: true`. [Network](#network)

`speech` (true):

 *(0.10.3)* Transcribes the audio files it was handed. [Speech](#speech)

`folders` ({what, write}):

Folders the user picks, read-only or with `write: true` changed. [Folders and files](#folders)

`files` ({read: [...]}):

Other apps' files, each named in full. [Folders and files](#folders)

`echo` ({read, write, jobs}):

Echo's data it reads, what it writes, Echo's background jobs. [Echo's data](#data)

`m365` ({read: [...]}):

 *(0.10.0)* Microsoft 365 mail and chats, read-only. [Microsoft 365](#m365)

`signin` ({hosts, keep}):

The sign-in saved on this computer for a few hosts. [Sign-in](#signin)

`deliver` ({to: [...]}):

Where it sends to the user. [Talking to the user](#deliver)

`deliver_provider` ({kinds: [...]}):

A way to send it adds to Echo. [Talking to the user](#deliver)

`sessions` ({skills, read, hints, commands}):

What it gives Claude in Echo. [Claude in Echo](#agent)

`channel` ({plugin}):

A Claude Code channel to the folder session. [Claude in Echo](#agent)

`scripts` ([{skill, script, timeout}]):

Programs of its package skills Echo may run. [Scripts](#scripts)

`work` ({}):

Its rows on My work and in threads' Work. [Work rows](#work)

`ai` ({wrapper: {name, command}}):

An AI profile it offers. [Wrapper profiles](#wrapper)

`microphone` ({}):

 *(0.10.0)* Its window half hears the microphone, on the user's click. [Microphone](#mic)

`me` ({}):

 *(0.10.0)* Its host half reads About me. [About me](#about-me)

`skills` (true):

 *(0.10.0)* Its window half adds skills to the user's own Claude Code, each on a click. [Skills in the user's Claude Code](#own-skills)

`plugins` (true):

 *(0.10.5)* Its host half lists what other plugins offer and calls their commands. [Offering and calling commands](#offers)

## Host API

What `ctx` holds in `main.js`.

- Every call that waits — Claude Code, the network, a picker, reading many files, git — returns a promise and runs outside the plugin's time slice.
- A capability line below is the manifest's `uses` key and the sheet's words for it.

### Commands, timers and events

`"uses": { "schedule": {} }` — Install sheet: “Works on its own on a schedule while Echo runs”

Only `ctx.every` needs it; commands need nothing.

#### `ctx.command(name, fn)`

A command others can run: the plugin's client half (`ctx.call`), an Inbox button, a widget's action, or `echoctl plugin call`.

- `fn(args, { files })` gets the arguments as an object and, second, the file handles its caller passed (`[]` otherwise;  *(0.10.0)*)
- It may be async, returns anything JSON can hold and throws an `Error` to fail.
- A command the window calls has 30 seconds.

**Example**

```
ctx.command('summary', async ({ days = 1 }) => {
  return { text: `last ${days} day(s)` }
})
```

#### `ctx.every(seconds, fn)` — needs `schedule`

Runs `fn` every so many seconds (at least 10) while Echo runs.

#### `ctx.terminal`

`true` in a terminal — `echoctl plugin call`, `deliver`, `widget show`, `work show` — where only the plugin asked is loaded, no timer runs, and the process ends after the command: skip start-up work there.

`"uses": { "events": { "on": ["recording_started", "minutes_written"] } }` — Install sheet: “Knows when a recording starts (the call's title) and a call's minutes are written (the call's title)”

A plugin hears only the events it names.

- A plugin that reads `sources` or `source` also hears `minutes_written` and `sources_changed`.
-  *(0.10.0)* It hears them whole, with the extra keys marked readers below.
- Any other plugin hears them without those keys.

#### `ctx.on(event, fn)` — needs `events`

Calls `fn(payload)` each time it happens, while Echo runs.

- Returns a promise that is refused for an event the manifest doesn't name.
- Payloads carry ids and titles, never what was said: read that with `ctx.echo.read('source', …)`.
- `call` is the call's folder name.
-  *(0.10.0)* A call also has a `stamp`, the `YYYY-MM-DD_HHMMSS` its folder name starts with.
- A retitle changes the folder name but not the stamp, so key your own records by it.
- Two calls started in the same second share one stamp.
- Events are not replayed — but `threads_changed` and `shared_changed` from another process wait for the running app and arrive at least once.

**Example**

```
ctx.on('minutes_written', ({ call, title, link }) => {
  ctx.log(`minutes for ${title}: ${link}`)
})
```

`meeting_soon` ({ id, subject, start, threads }):

A meeting is about to start; `threads` the ids of the threads Echo puts it in.

`call_started` ({ app }):

A call starts (Teams, Google Meet).

`call_ended` ({ app, recording, next_call }):

A call ends.  *(0.10.0)* `next_call` is true when Teams went straight on to another call.

`recording_started` ({ call, stamp, title, memo }):

A recording starts.  *(0.10.0)* `stamp` is the call's stamp; `title` is the arm's, else the meeting's subject.

`recording_stopped` ({ call, stamp, duration_s, reason }):

A recording stops.  *(0.10.0)* `reason` is `call_ended`, `user`, `next_call`, `computer_slept` or `watch_stopped`.

`transcribed` ({ call, stamp, ok }):

A call's transcript is ready (`ok` false when it failed).

`minutes_written` ({ id, link, call, stamp, title, started_at, ended_at, duration_min, app, memo, revision, rewritten }):

A call's minutes are written.

-  *(0.10.0)* `revision` is 16 hex characters of the minutes and changes when they do.
- `rewritten` means Echo told this call's minutes before.
- Readers also get `threads`, `client`, `profile`, `participants` and `minutes` (without its `body`), as `ctx.echo.read('source')` gives them.
- No transcript or chat.

`thread_synced` ({ thread, processed, left }):

A thread's work is updated from its calls and mail.

`sources_changed` ({ changed, removed }):

Echo's sources (calls, mail, channels) change.

-  *(0.10.0)* Readers also get `items`: for each changed one (100 at most) what Echo decided when it indexed it — `{id, kind, title, subject, at, threads, client, profile, from, people, trust, link, url, m365_id, conversation_id}`, never its text.
- A removed one has only its id.

`threads_changed` ({ thread, born, change, … }):

A thread is `renamed` (`name`, `from`), `merged` (`into`, `dropped`: the plugin's values that didn't fit) or `deleted` (`values`: the plugin's own, removed). `born` tells this thread from a later one with its id.

`shared_changed` ({ namespace, key, thread?, by }):

A value its marketplace's plugins share changed — told to the others, never to the one that set it; no value in it.

### Offering and calling commands  *(0.10.5)*

A plugin can offer commands to other plugins and to Claude in Echo, and call what others offer.

#### `ctx.expose() · api.command(name, fn, { description, args, reads })` *(0.10.5)*

Offers the plugin's commands to other plugins and to Claude in Echo.

- It is opt-in: a plugin that never calls `ctx.expose` is invisible to the others.
- `ctx.expose()` returns `api`; `api.command` adds a command that works as `ctx.command` does, for the plugin's own callers too.
- What the plugin is for is its manifest's `agent.summary`, else its `summary`. A text passed to `ctx.expose` is not read.
- The command's second argument is `{ files, from }`: `files` as in `ctx.command`, `from` the caller's id, `"claude"` for Claude in Echo, and absent when the plugin calls it as its own.

**Options**

- `name` — 1–40 letters, digits, `-` or `_`, not starting with `__`

- `description` — 1–300 characters: when to call it

- `args` — `{ name: 'what to pass' }`: a line for an argument, or an optional argument of its own

- `reads` — `true` marks a command that only reads, so a run that only reads may call it; Echo trusts the mark, also for what the command calls in turn

**Arguments**

- Echo reads the names from the destructuring of the function's first parameter.
- `({ query, limit = 10 })`: `query` is required, `limit` optional with its default.
- `({ a } = {})`: every name is optional.
- A parameter that is not destructured (`(a) => …`) or a bound function leaves the arguments unknown: any JSON object is passed.

**How Echo finds the offer**

- It does a dry run of `apply(ctx)` without starting the plugin: its services do nothing, `ctx.terminal` is true and nothing it starts settles.
- The dry run has 5 seconds. Its result is kept for the installed version and Echo's version; one that runs over is tried again, and after 3 in a row the plugin counts as offering nothing.
- Call `ctx.expose` and its `command`s first in `apply`, with no condition and no `await` before them: what comes after a throw or an `await` is not found.
- A dry run that fails never fails an install.

**Refused**

- `ctx.expose` called twice.
- A name that `ctx.command` took already.
- A name or description outside the limits above.

**Limits**

- At most 20 offered commands.
- A call from another plugin or from Claude runs unattended, as a timer's does, also after its awaits: no picker opens. Offer no command that asks the user to pick.
- A plugin switched off or removed is offered to nobody.

**Example**

```
// main.js
export function apply(ctx) {
  const api = ctx.expose ? ctx.expose() : null
  if (api) {
    api.command('open-tickets', ({ team, limit = 10 }) => {
      const all = JSON.parse(ctx.store.read('tickets.json') || '[]')
      return all.filter((t) => t.team === team).slice(0, limit)
    }, {
      description: 'Open tickets of a team, newest first',
      args: { team: 'a team name, e.g. support' },
      reads: true,
    })
  }
  // the rest of apply
}
```

The guard `ctx.expose ? ctx.expose() : null` lets the same plugin load on an Echo older than 0.10.5; set `"echo": ">=0.10.5"` if it needs the offer.

`"uses": { "plugins": true }` — Install sheet: “Calls the commands your other plugins offer and gets what they answer — what those plugins read or do for you, it can have them read or do for it”

#### `await ctx.plugins.list() · get(id) · call(id, name, args)` — needs `plugins` *(0.10.5)*

Lists the plugins that offer commands, shows one's commands and calls one.

**Gives**

- `list()` — `[{ id, name, description }]`: the plugins that offer

- `get(id)` — the plugin with its `commands: [{ name, description, reads }]`

- `call(id, name, args)` — what the command answers; `args` is an object, `{}` when left out

**Refused**

- A plugin that offers nothing, and a command it does not offer.
- A command of the calling plugin itself.
- A required argument that is missing.
- A call while 16 calls between plugins already wait, which stops two plugins calling each other in a loop.

**Limits**

- A call waits up to 30 seconds.
- The called command runs unattended: no picker opens in it.

**Example**

```
const found = await ctx.plugins.list()
if (found.some((p) => p.id === 'tickets')) {
  const rows = await ctx.plugins.call(
    'tickets', 'open-tickets', { team: 'support' })
  ctx.log(`${rows.length} open`)
}
```

The terminal shows the same: `echoctl plugin commands [<id> [<name>]]` lists the plugins that offer, one's commands, or one command's arguments.

### Its own files and settings

#### `ctx.store.read(path) · write(path, text, opts) · list(dir) · remove(path) · path(path) · size(dir)`

Text files in the plugin's own folder inside the user's data folder, by relative path.

- A name at its top level is plain ASCII.
- `read` of a missing file gives `null`.
-  *(0.10.0)* `read` throws on a file that isn't UTF-8.
-  *(0.10.0)* `read(path, { lossy: true })` gives such a file with those bytes as �.
- Every write takes the plugin's lock across processes (the app and `echoctl plugin call`).
-  *(0.10.0)* `write(path, text, { ifSha })` writes only while the file's sha256 is still `ifSha` (else "changed since you read it").
-  *(0.10.0)* `write(path, text, { createNew: true })` writes only where no file is ("is there already").

#### `ctx.store.update(path, fn) · ctx.crypto.sha256(text)` *(0.10.0)*

`update` reads, calls `fn(text | null)` and writes its answer only over what it read.

- When another process wrote meanwhile it reads and calls `fn` again (up to 50 times), so `fn` only computes.
- `undefined`, `null` or the same text writes nothing.
- It returns the text kept.
- `sha256` is the hex sha256 of the text's UTF-8 bytes.

**Example**

```
const seen = ctx.store.update('seen.json', (t) => {
  const s = JSON.parse(t || '[]')
  return s.includes(id) ? undefined : JSON.stringify([...s, id])
})
```

#### `await ctx.store.walk(path, { ext, hidden, max, sha })` *(0.10.0)*

Lists the files under a folder of its own store, as `ctx.fs.walk` does for a folder the user gave it.

- Gives `[{path, size, mtime, sha?}]`, paths relative to the store (what `read` takes); `path` `""` is the store.
- Runs off the time slice.
- 20,000 rows by default, 100,000 at most.
- Dot names only with `hidden`; no link followed; nothing outside the store.
- `sha` for files up to 64 MB.
- A folder that isn't there gives `[]`.

#### `await ctx.store.copyIn(file, path, { createNew })` *(0.10.3)*

Keeps a file the user handed the plugin, as it is, in its own store.

- It gives `{path, size}`; the file is a [handle](#handles).
- 50 MB at most, off the time slice.
- The store's path rules, as `write`: nothing outside the store, none of Echo's own files.
- Never over a file unless `createNew: false` (the default is `true`).

#### `ctx.store.usage(dir) · ctx.store.size(dir)` *(0.10.3)*

What the plugin keeps in its store, or in its folder `dir`.

- Gives `{bytes, files}`.
- Its own files only, not `settings.json`.
- `usage` and `size` are one call; `ctx.cache.size()` is that of `cache/`.

#### `ctx.settings.get(key) · set(key, value)`

The values of its manifest's `settings`. A `secret` is kept in a file only the user can read and is never sent to the window.

-  *(0.10.3)* `get` gives what the user set, else the setting's manifest `default`, else `null`.
- Never a default for a `secret` or an address list the plugin may reach: only the user enters those.
- Before 0.10.3 an unset setting gave `null` even with a `default`. A plugin that writes `get(key) ?? fallback` now gets the manifest's default where it got its fallback, so the two may differ.

#### `ctx.command('__testSettings', fn)` *(0.10.3)*

A settings page's "Test connection": the host half answers it, and the window half runs it.

- The host half registers the command and reads what it needs itself (`ctx.settings.get('token')`, secrets included).
- It gets `{section}` and answers `true`, a message (ok) or `{ok, message}`.
- The window half runs it with `ctx.call('__testSettings', {section})` and is given only `{ok, message}`.
- `message` is cut at 300 characters.
- Each secret the user keeps (3 characters or more) is replaced by `••••`, however it is written, and every URL loses its query string and fragment.
- A host half that throws gives `{ok: false, message}`; a plugin without the command gives "this plugin has no connection test".
- The message is free text for the user: it must not echo request details. The masking guards against accidents only.

#### `ctx.package.read(path) · list(dir)`

Its own installed files, read-only — templates, prompts, defaults it ships.

Echo keeps its own files in the store and refuses a plugin's write of them.

- They are `settings.json`, `inbox.json`, `widgets.json`, `threads.json`, `work.json`, and  *(0.10.0)* `client-values.json`.
- They change through `ctx.settings`, `ctx.inbox`, `ctx.widgets`, `ctx.threads`, `ctx.clients` and `ctx.work`.
- What lies in `cache/` over 7 days Echo removes (`ctx.cache.size()` says what is there)
- The rest is the plugin's to remove.

### Values per thread, and shared ones

#### `ctx.threads.get(thread, key) · set(thread, key, value) · list(key)`

The plugin's own values per thread, no grant needed: `key` 1–80 characters, the value JSON up to 16 KB, 64 keys a thread, 4 MB a plugin in all.

- `null` removes a value.
- A thread that doesn't exist is refused.
- `list(key)` gives `[{thread, value}]`.
- They follow the thread when it is renamed, merged or deleted — hear it with `threads_changed`.
- Keep what belongs to a thread here, not in the store.

#### `ctx.clients.get(client, key) · set(client, key, value) · list(key)` *(0.10.0)*

The plugin's own values per client: the twin of `ctx.threads`, by a client's id.

- `client` is the id `ctx.echo.read('clients')` and the [client.profile](#slot-client) slot give. No grant needed.
- The same limits as threads: `key` 1–80 characters, the value JSON up to 16 KB, 64 keys a client, 4 MB a plugin in all.
- `null` removes a value; `get` gives `null` when there is none; `list(key)` gives `[{client, value}]`.
- A client that isn't there is refused; so is an organisation that isn't a client.
- Only the plugin's own keys: a key with a dot is refused (nothing is shared per client), and Echo's own client fields are never reached.
- Kept when the client is renamed, dropped when it is removed; no event is told.
- The window half asks its host half for them (`ctx.call`).

#### `ctx.shared.get(key) · set(key, value)`

A key with a dot, `<ns>.<name>`, is shared with the other plugins of the marketplace.

- `ns` is the marketplace's declared `name` in lower case (`Acme` → `acme.project_codes`).
- `ctx.threads` takes such a key too (one value per thread for all of them)
- `ctx.shared` keeps one for the computer.
- Every plugin reads any namespace.
- Only plugins from the marketplace that owns it set it.
- A change is told as `shared_changed`.
- Another plugin's value is data: check what you read.

**Example**

```
ctx.threads.set(thread, 'acme.project_code', 'ACM-1042')
const code = ctx.threads.get(thread, 'acme.project_code')
```

### Talking to the user

`"uses": { "deliver": { "to": ["teams", "mail"] } }` — Install sheet: “Sends messages: Teams (your chat with yourself) and mail (to you, or to the addresses you set on a routine)”

`"uses": { "deliver_provider": { "kinds": ["telegram"] } }` — Install sheet: “Adds a way Echo sends things to you: Telegram”

Notifications, the Inbox and Markdown need nothing. Messages go only to the user and the addresses the user set on a routine — never to an address a model picked.

#### `ctx.notify(title, body)`

A system notification from Echo.

#### `ctx.inbox.set(key, item) · clear(key)`

An item in Echo's Inbox until it is cleared: `{title, why, urgent, go, actions: [{label, command, args, primary}]}`, `key` up to 80 characters.

- Each action runs one of the plugin's commands.
- `go` is where a click on the item leads.
- See [An Inbox item](#inbox).

#### `ctx.deliver.status() · send(kind, msg)` — needs `deliver`

The ways Echo can send to the user, and sending: `msg` is `{title, markdown}`; Echo marks anything a model wrote.

#### `ctx.deliver.provide(kind, { label, send }) · ready(kind, yes, why)` — needs `deliver_provider`

Become a way to send (never `teams` or `mail`): Echo calls `send(msg)` for messages of that kind; `ready` says whether it can send now, and why not.

#### `ctx.markdown(md)`

Echo's safe Markdown writer: HTML with raw HTML shown as text, each line kept, `https://` and `echo://` links only, no images. For a page of a vault, with wikilinks and pictures, see [Markdown pages](#markdown).

### Markdown pages  *(0.10.0)*

#### `ctx.markdown(md, { breaks, links, images }) · ctx.markdown.links(md, { detail })`

A page of a vault, in both halves (the window half's is async): the minutes' writer, raw HTML as text, with `[[Page]]`, `[[Page|label]]`, `[[Page#heading]]` and `![[image.png]]`.

**Options and resolving**

- `breaks: true` makes a single newline a line break.
- A `mermaid` fence shows as its code; 2 MB of text at most.
- Echo can't call the plugin while it writes, so the plugin resolves first: `links(md)` gives `{links, images}`, each destination once as written.
- Pass them back as `{"<dest>": href | null}`.
- `links(md, { detail: true })` adds `entries: [{dest, kind: 'wiki' | 'md', embed}]`: each way a destination was written, once and in order (`[[Plan]]` and `[Plan](Plan)` on one page are two entries; `embed` for `![[…]]` and `![…](…)`).

**What Echo keeps**

- A link's href, only for one of these:

- an `https://` URL;
- an `echo://` link Echo knows;
- the plugin's own route: `#<id>:…`, or its Knowledge tab's `#brain/<id>:…`.

- An image's src, only from its [folder route](#folder-images).
- Anything else is text.
- `null` is a page that isn't there: a link with no href, `class="md-missing" data-md-missing="<dest>"`, for the plugin to style and catch (a click, and Enter).
- Encode names with spaces (`encodeURIComponent`).

**Example**

```
// client.js — a vault note: wikilinks to the plugin's own pages,
// pictures from the vault. exists: name → path in the vault, or null
async function notePage(root, md, exists) {
  const { links, images } = await ctx.markdown.links(md)
  const enc = (p) => p.split('/').map(encodeURIComponent).join('/')
  const L = {}, I = {}
  for (const d of links) {
    L[d] = exists[d] ? `#${ctx.id}:vault/${enc(exists[d])}` : null
  }
  const folder = `plugin/${ctx.id}/folder/${encodeURIComponent(root)}`
  for (const d of images) {
    I[d] = exists[d] ? `${folder}/${enc(exists[d])}` : null
  }
  return ctx.markdown(md, { breaks: true, links: L, images: I })
}
ctx.listen('click', (e) => {
  const miss = e.target.closest('[data-md-missing]')
  if (miss) ctx.ui.notice(`No note “${miss.dataset.mdMissing}” yet`)
})
```

### Microsoft 365  *(0.10.0)*

`"uses": { "m365": { "read": ["mail", "chats"] } }` — Install sheet: “Reads your Microsoft 365 mail and Teams chats through Echo's sign-in when it asks: it searches them and reads a mail's thread with its attachments' names or a chat's messages over some days — it never sends”

Through Echo's own sign-in, never one of the plugin's; without it each call is refused: "Microsoft 365 isn't connected: sign in to it in Echo's Settings → Calendar & chat".

#### `ctx.m365.search(query, { kinds, days, limit })` — needs `m365.read`

`{query, results, errors}`, as `echoctl m365 search`: its own kinds by default; `days` 90 (1–365), `limit` 25 a kind (1–50).

#### `ctx.m365.mailThread(message)` — needs `mail`

The thread of a mail by its Graph id, oldest first: `{subject, picked, messages: [{id, from, to, at, text, url, files, …}]}` — `files` its attachments' names, never their contents.

#### `ctx.m365.chat(chat, { since, until })` — needs `chats`

What was written on those days (`YYYY-MM-DD`, both included; the last seven by default), oldest first, about 400 messages at most: `{id, topic, members, url, since, until, messages: [{id, at, from, text, files}]}`.

### Sign-in

`"uses": { "signin": { "hosts": ["github.com"], "keep": true } }` — Install sheet: “Gets the sign-in saved on this computer for github.com (GitHub CLI or git): it can act as you there and send it to the places it talks to; it may sign you in to github.com itself and have Echo keep that sign-in for it”

1–4 plain host names. A sign-in grants no network: the API host goes in `network.hosts`.

#### `ctx.signin.get(host, { fresh }) · sources(host) · keep(host, token) · forget(host)` — needs `signin`

`get` resolves `{token, from: "echo" | "gh" | "git", user?}` or `null`: the one Echo keeps for this plugin (`keep: true`), else the GitHub CLI's, else git's credential helper's.

- `{fresh: true}` asks again after a 401.
- `sources` says which of the programs are here.
- `keep` has Echo keep a sign-in the plugin made itself (one line, 8 KB at most)
- `forget` signs out.
- Never put a token in a file, the store, the window or a log.

### Scripts

`"uses": { "scripts": [{ "skill": "staffing", "script": "scripts/read.sh" }] }` — Install sheet: “Runs programs from its package on this computer with your rights — they can reach the network and anything you can: “staffing/scripts/read.sh””

1–20 scripts, each in one of its package skills; `timeout` 1–3600 seconds (300 by default; the sheet names a longer one). An update that adds a script or changes any file of its skill folder asks again.

#### `ctx.scripts.run(skill, script, args, { timeout })` — needs `scripts`

Runs one of the plugin's declared scripts and gives `{status, stdout, stderr, truncated?, timed_out?}`.

- It is run by its shebang (on Windows a `.ps1` with PowerShell), never through a shell.
- `args` are plain strings, 100 at most.
- There is no stdin; output is 1 MB each for `stdout` and `stderr`.
- It runs without Echo's secrets or any `CLAUDE*` / `ANTHROPIC*` key.
-  *(0.10.0)* It runs with `ECHO_PLUGIN_SCRIPT=1`: an `echoctl` it starts refuses every change to Echo plugins — installs, updates, removals, switching on or off, their settings, marketplaces and certificates.
- Async: the host half keeps answering while it runs.
- One run of a script at a time.
- In Echo's sessions, `SKILL.md` names it by its path alone (`scripts/read.sh <args>`).

### Wrapper profiles

`"uses": { "ai": { "wrapper": { "name": "Acme Code", "command": "acme-code" } } }` — Install sheet: “Offers an AI profile that starts acme-code — a program you install yourself — in place of Claude Code; it sees and can change everything Claude in Echo is sent, call transcripts included. You add it in Settings → AI & minutes, if you want it”

`command` is one program name (letters, digits, `.`, `_`, `-`) found on the user's PATH — no arguments, no path, never a file of the plugin.

- `name` up to 40 characters.
- Only offered: the user adds it (`echoctl ai add-wrapper --plugin <id>`)
- The plugin never makes it the default.
- An update naming another program is taken only on the user's yes (`echoctl ai update-wrapper <id>`)
- The plugin off or removed leaves the profile.

### Speech  *(0.10.3)*

`"uses": { "speech": true }` — Install sheet: “Transcribes audio files you hand it (WAV, webm/opus, ogg/opus, m4a or mp3, up to 60 minutes and 200 MB) with Echo's own speech model, on this computer, or on the transcription server you connected; it starts only while Echo is not recording or transcribing a call. The text goes only to the plugin”

#### `await ctx.speech.transcribe(file, { words, language })` — host half · needs `speech`

The speech in an audio file the user handed the plugin.

**Gives**

- `{text, language, segments: [{start, end, text}], words?: [{start, end, word}]}`, times in seconds from the start.
- `file` is a [handle](#handles), checked as `ctx.files.read` checks it.

**Options**

- `language` — an ISO code (`"en"`, `"uk"`); else the first of Settings' languages; one Echo doesn't know is refused

- `words` — `true` adds each word's times, only when the engine timed every sentence's words (Whisper, Parakeet and Nemotron do; a transcription server only when its engine does); else there is no `words` key

**Formats and caps**

- WAV, webm/opus (what a window's MediaRecorder gives), ogg/opus, m4a (AAC) and mp3, read from the content, not the name. Vorbis is not read.
- 200 MB of file and 60 minutes.
- A file damaged in the middle is refused; one cut off at its end gives what came before.
- Audio that changes its sample rate or tracks part-way is refused.

**When**

- Never while Echo records (a call or a memo) or any call is being transcribed, and one file at a time: it does not queue, so ask again.
- It is checked when it starts: a recording that begins during a long file does not stop it.
- It runs off the plugin's 5 s slice. A long file outlasts a window half's `ctx.call` (30 s): start it from a command, an event, a timer or a routine, and let the window ask for the result.

**Where it runs**

- On Echo's own speech model, the one Settings names for the language, or on the transcription server the user connected, as a call is.
- Nothing else leaves the computer.
- The text is the file's: data, shown only through `ctx.markdown`.

### The system

#### `ctx.profiles()`

The user's AI profiles: `{default, profiles: [{id, name}]}`.

#### `ctx.system.which(name) · ctx.log(...)`

Whether a program is on this computer, and where; a line in Echo's log.

## Claude Code

`"uses": { "claude": {} }` — Install sheet: “Runs Claude Code on your AI profiles, acting on its own as you set routines in Settings (Auto, or skipping every permission check). In a folder you gave it, Claude works with that folder's own Claude Code setup: it reads the folder and, if the plugin may change it, edits files there or in a copy for you to review — as you set routines; on your click in its screens it opens Claude Code there in Echo's Claude panel for you to ask, as you set Claude in the window”

`"uses": { "claude": { "skip": true } }` — adds: “; a run you mark so may skip every permission check”

A plugin's Claude runs only on the user's AI profiles, through Echo — never a key or account of its own. Its permissions are the user's settings, never the plugin's.

#### `ctx.claude.run({ prompt, title, profile, model, tools, dir, timeout })` — needs `claude`

Runs Claude Code headless as the Claude · Echo folder session would, acting on its own, and returns `{answer, model, usage, actions}` — `usage` tokens, cost and time.

- `actions` the changes and sends it made through Echo.
- `profile` one of the user's AI profiles (the default when left out; a wrapper only when it is the default).
- `timeout` in minutes (1–60, default 30).
- `dir` its working folder inside the store (default `runs/<time>`).
-  *(0.10.0)* `tools`: left out, it is the user's setting for routines; or one of these:

- `"auto"` — Claude Code's auto mode

- `"skip"` — every permission check skipped — only with `claude.skip` on the sheet, else as left out

- `"none"` — no tools at all (put what it needs in the prompt)

- `"files"` —  *(0.10.6)* file tools only, in a folder of its store; needs `store` (see below)

- `"read"`, `"folder"` — from before; taken as `"auto"`

**Example**

```
const { answer, usage } = await ctx.claude.run({
  title: 'Weekly digest',
  prompt: 'What did my clients ask for this week?',
})
```

#### `ctx.claude.run({ folder, path, mode, prompt, … })` — needs `claude`, `folders` *(0.10.0)*

In a folder the user gave it (`folder` a root as `ctx.fs.folders()` names it, `path` a subfolder): Claude Code starts there as that folder's own project — its `CLAUDE.md`, `.claude/` skills, settings and hooks — with none of Echo's session, no MCP server, never Bash or the web.

`mode` is one of:

- `read` — the default: Read, Grep, Glob, Skill

- `edit` — needs `folders.write`: also Edit and Write, inside the folder

- `copy` — the `edit` run on a snapshot of the folder in its store (`.git` and `.obsidian/plugins` left out)

- The folder itself is untouched.
- `exclude` leaves more paths under the root out of the snapshot (100 at most).
- `exclude` is for `copy` only: with another mode the run is refused.
- The result's `snapshot` (`{path, files, bytes, skipped, why}`) is for the plugin to compare and apply what the user accepts with `ctx.fs.write` — Echo applies nothing.

Its permissions are the user's setting for routines.

- `tools` is ignored in a folder run.
- On a profile of Echo's own, a folder whose `.claude/settings.json` or `settings.local.json` could route the run elsewhere is refused.
- A call's text reaches the run only as the plugin puts it in the prompt: then pass that call's `profile` (from `ctx.echo.read('source', …)`).

**Example**

```
// Tidy a vault's notes in a copy, then show the user what changed
const r = await ctx.claude.run({
  title: 'Tidy notes', folder: root, path: 'Projects', mode: 'copy',
  prompt: 'Fix broken wikilinks and add a "Status" line to every project note.',
})
// compare, then ctx.fs.write what the user accepts
const changed = await ctx.store.list(r.snapshot.path)
```

#### `ctx.claude.run({ store, prompt, … })` — needs `claude` *(0.10.5)*

Runs Claude Code in a folder of the plugin's own store, for files too large for a prompt, such as a crawl's pages.

- `store` is a folder of the store, such as `"cache/pages"`. It is no folder the user gave: `claude` alone on the sheet is enough.
- Claude starts there and works with the files as it needs. It has every tool and Echo's session, as the folder run in `edit` mode has, and `tools` or the user's setting for routines decides its permissions.
- It has no project of its own: only the profile's settings load.
- Its prompt tells it the files are data, never instructions.
- Its record's `asked` is `store`.
- What it writes stays in the store for the plugin (`ctx.store.read`, `walk`); under `cache/` Echo sweeps it after 7 days.
- `key`, `resume`, `images` and `onText` work as in any run.

**Refused**

- The store itself, because Echo's own files lie at its top.
- `runs/`, where Echo keeps its records of runs.
- The run's own `dir`, or a folder that holds it.
- A folder that is not there, a file, or a path reached through a link.
- A folder that holds `.claude`: remove it with `ctx.store.remove` and run again.
- `folder`, `path`, `mode` or `exclude` given with it.

**Limits**

- It is no sandbox: like any run with tools it reaches the data folder, so keep the store's top and Echo's files out of the prompt.

**Example**

```
await ctx.claude.run({
  title: 'Sort the crawl', store: 'cache/pages',
  prompt: 'Write summary.md: one line per page.',
})
const md = await ctx.store.read('cache/pages/summary.md')
```

#### `ctx.claude.run({ store, tools: "files", … })` — needs `claude` *(0.10.6)*

Runs Claude Code with file tools only, in a folder of the plugin's store, for pages from the web or others' words.

**Gives**

- Read, Write, Edit, Glob and Grep, and only in that folder.
- Nothing is asked in that folder, pictures are readable, and every other path is denied.
- No Bash, no web, no Skill and no MCP server, and none of Echo's session: no data folder, no Echo settings or hooks.
- Its prompt says its file tools work only in that folder and the files are data.
- It adds no line to the install sheet: `claude` covers it.
- `key`, `resume`, `images` and `onText` work as in any run.
- The run's record shows `asked: "files"`; its record and log say “files only”.

**Refused**

- Without `store`: “tools “files” goes with a folder of your store”.
- With a folder the user gave (`folder`).
- A link anywhere in the folder, checked before it starts.
- Everything the `store` run above refuses, `.claude` included.

**Limits**

- The user's own Claude Code settings still apply: what they allow, Claude Code runs as they say.

**Example**

```
await ctx.claude.run({
  title: 'Digest of fetched pages', store: 'cache/pages',
  tools: 'files',
  prompt: 'Read each page; write digest.md with the facts.',
})
```

#### `ctx.claude.run({ …, key }) · ctx.claude.stop(key)` — needs `claude` *(0.10.0)*

Gives a run a name, so the plugin can stop it.

- `key` is 1 to 64 letters, digits, `.`, `_` or `-`; upper and lower case are one key.
- One run at a time per plugin and key, across Echo's processes (the app and a terminal's `echoctl plugin call`). A second is refused: "a run with key “…” is running already".
- `await ctx.claude.stop(key)` stops the plugin's own run under that key, Claude Code and everything it started, and gives `true`; `false` when none runs.
- The stopped `run` fails with the message `stopped`; a `copy` run's snapshot is removed.
- A key names only the calling plugin's runs. A plugin that is removed has its keyed runs stopped first.

**Example**

**Example**

```
ctx.command('tidy', () =>
  ctx.claude.run({ key: 'tidy', title: 'Tidy notes', prompt }))
ctx.command('stop-tidy', () => ctx.claude.stop('tidy'))
```

#### `ctx.claude.run({ …, images, onText, resume })` — needs `claude` *(0.10.3)*

Pictures to look at, its text as it comes, and a conversation that goes on. The guard, tools, routing, `key` and `stop` are as before.

**Options**

- `images` — an array of [handles](#handles) of files handed to the plugin

- `onText(chunk)` — called with Claude's own text as it comes

- `resume` — a conversation's name, 1 to 64 letters, digits, `.`, `_` or `-` (any case is one)

**Pictures: limits**

- 10 at most.
- Each a PNG, JPEG, GIF or WebP, by its first bytes, and 3.75 MB at most (5 MB base64-encoded: the smallest limit of the platforms a profile may reach).
- All of them 15 MB base64-encoded at most.
- Anything over is refused before Claude Code starts, with why.
- They go with the prompt on stdin, never on the command line, in every mode, `tools: "none"` too.

**Its text as it comes**

- Claude's own text, not a subagent's; in a run with tools, its text between tool calls too.
- Handed to `onText` in order, all before the run's promise settles; a chunk may hold several pieces.
- The result is the same as without.
- An error `onText` throws is logged and the run goes on.
- A `stream` the plugin passes itself is refused.

**A conversation**

- The first run begins a Claude Code session; the next run under the same `resume` continues it.
- It is kept to the AI profile and folder it began on: a run elsewhere is refused.
- One run at a time per conversation.
- Not with `copy`.
- Claude Code sends a conversation's earlier pictures again with every turn, so a run that would bring it past 20 pictures or 15 MB base64-encoded is refused; a turn without pictures goes on.
- A session Claude Code no longer has fails the run; Echo forgets the conversation and the next run begins a new one.

#### `await ctx.claude.forget(resume)` — needs `claude` *(0.10.3)*

Ends a conversation and removes its Claude Code transcript.

- Gives `true`, or `false` when there was none.
- Refused while a run of it goes on.
- The next run under that name begins a new conversation.
- Removing the plugin with its data forgets each of its conversations.

**Example**

```
const { answer } = await ctx.claude.run({
  title: 'Read the whiteboard', tools: 'none', resume: 'board',
  images: [photo], prompt: 'List the action items on this photo.',
  onText: (chunk) => ctx.log(chunk),
})
await ctx.claude.forget('board')
```

#### `ctx.claude.session({ folder, path, mode, profile })` — client half · `claude`, `folders` *(0.10.0)*

From the window half, opens Claude Code in Echo's terminal, in a folder the user gave the plugin.

- Only on the user's click or key in the plugin's screens; else it throws.
- It opens in a bottom-panel tab "Claude · <plugin name>", in that folder as its own project.
- `mode` is `read` or `edit` (no `copy`); its conversation is kept.
- It is the user's session: the plugin can't type into it or read it, and its permissions are the user's setting for Claude in the window.
- One session per plugin.
- Asked again while it runs, it is shown.
- Switched off or removed, the plugin's session runs on as the user's.

### Skills in the user's own Claude Code  *(0.10.0)*

`"uses": { "skills": true }` — Install sheet: “Adds instructions for Claude Code (skills) to your own Claude Code (~/.claude/skills), each only when you click to add it: skills that run commands are refused, never over a skill that is there already, changing or removing only the skills it added — they go when you remove the plugin”

On its own it doesn't let the plugin run Claude Code; that is `claude`. For Echo's own sessions see [Claude in Echo](#agent).

#### `ctx.claude.installSkill(name, md) · removeSkill(name)` — client half · needs `skills`

Adds a skill to the user's own Claude Code, or takes out one the plugin added.

**How it works**

- Async, and only on the user's click or key in the plugin's screens; else it rejects before anything is sent.
- The skill goes to `skills/<name>/SKILL.md` in the user's Claude Code folder: `~/.claude`, or the folder `CLAUDE_CONFIG_DIR` names.
- `name` is 1–64 of `a-z`, `0-9` and `-`; `md` is the whole `SKILL.md`, not empty, 256 KB at most.
- Nothing else of a skill is written.

**Refused**

- A skill folder that is there already is never changed unless this plugin added it. Echo keeps who added which outside the skill.
- A link in the folder's place, or as its `SKILL.md`.
- A skill that runs something (see the rules below).
- `removeSkill` takes out only a skill this plugin added: its `SKILL.md`, and its folder when nothing else is in it.

**When the plugin goes**

- Removing the plugin (`echoctl plugin remove`, with or without `--delete-data`) takes out every skill it added.

**A skill that runs nothing**

- The frontmatter (YAML between leading `---` lines, also after a BOM or blank space) holds only `name`, `description`, `when_to_use`, `argument-hint`, `disable-model-invocation` and `user-invocable`.
- Each is a value on its line or a `|` / `>` text block. No other key (`hooks`, `allowed-tools`, `shell`, `model`, `context`, `agent`…), no nested map, list, tag or anchor, and never malformed or unclosed.
- Nowhere a `!`or a code block opened with `!`.
- A skill that breaks a rule is refused, never stripped: "a skill can't run commands: …".

**Example**

**Example**

```
ctx.listen('click', async (e) => {
  if (!e.target.closest('#add-skill')) return
  const md = ['---', 'name: pilot-notes',
    'description: How we write pilot notes', '---', '',
    'Start with the goal.'].join('\n')
  await ctx.claude.installSkill('pilot-notes', md)
})
```

### How permissions follow the user's settings

Settings → AI & minutes → Claude's permissions, or `echoctl config` (refused inside a run Echo started):

- Claude in the window — `--folder-permissions ask|auto|skip`: the Claude · Echo folder session and a plugin's `ctx.claude.session`. Ask each time is Claude Code's own prompts

- Routines — `--routine-permissions auto|skip`: `ctx.claude.run` without its own `tools`, its folder runs, and plugins' routines. A routine always acts on its own: there is no Ask

- Yolo — `--yolo-permissions auto|skip`

- Auto — the default: Claude Code's auto mode where the profile's model has it; else edits accepted (`acceptEdits`) for `edit` and `copy`, and nothing asked (`dontAsk`) for `read`

- Skip — every permission check skipped (`--dangerously-skip-permissions`)

A run's record and log name the mode it asked and the permissions it ran with, and say so when it started in another mode.

#### `ctx.claude.hasPlugin(spec) · installPlugin(spec)` — needs `channel`

Whether the Claude Code channel plugin its manifest names (`uses.channel.plugin`) is installed for the default profile, and installing it at that profile's user scope; no other spec.

## Routines

### Routines of its own  *(0.10.0)*

A plugin may ship up to 4 Claude Code routines (with `uses.claude`).

- Each is off until the user switches it on — its row in Settings → Plugins, or `echoctl jobs set <plugin>.<routine> on=on`.
- Then Echo runs it every so many minutes while Echo runs, on the user's default AI profile, as `ctx.claude.run` runs.
- The plugin's own code neither switches it nor starts it.

`"routines": [{ "id": "mail-notes", "name": "Mail → notes", "every": 60, … }]` — Install sheet: “Has a routine “Mail → notes”, off until you switch it on in Settings → Plugins: then every 60 min Echo runs Claude Code on your default AI profile with the prompt it ships, acting on its own as you set routines — it may change your Echo data and send as you, as your Claude · Echo folder session may (its prompt: <hash>)”

```
{
  "id": "mail-notes-kit",
  "name": "Mail notes",
  "version": "0.1.0",
  "uses": { "claude": {} },
  "routines": [
    { "id": "mail-notes", "name": "Mail → notes",
      "what": "Reads new mail and keeps what lasts as notes",
      "prompt": "routines/mail-notes.md", "every": 60 }
  ]
}
```

- `id` — a–z 0–9 `-`, up to 40, once; among Echo's jobs it is `<plugin>.<routine>`

- `name, what` — one line each, up to 60 and 200 characters

- `prompt` — a `.md` file of its package (UTF-8, not empty, up to 16 KB)

- `every` — minutes, 15–1440: the default the user may change

- `night` — paused at night by default (`true` when not said)

- `tools` — `auto`, `skip` (with `claude.skip`) or `none`; left out, the user's setting for routines. The sheet says which

- `timeout` — minutes, 1–60 (20)

Echo puts its own lines before the prompt — which routine of which plugin this is, when it last ran — and keeps the answer with the run.

- Nobody is sent it.
- Its runs are kept with Echo's jobs, in Echo's words and counts, never the model's text.
- `echoctl jobs outcome <plugin>.<routine>` shows the last run's answer, changes, sends and log, and `echoctl jobs run <plugin>.<routine>` runs it now.
- An update that changes a routine's definition or prompt asks again and keeps it as the user had it.
- A routine an update adds starts off.
- Removing the plugin switches its routines off.

### Echo's background jobs

`"uses": { "echo": { "jobs": true } }` — Install sheet: “Shows Echo's background jobs and changes how often each runs, when it pauses at night and which model it uses — only when you change them in its screens”

#### `ctx.echo.jobs.list() · runs(job, { limit }) · set(job, ["key=value", …])` — client half · `echo.jobs`

What `echoctl jobs` prints: every job, its settings with value, default and range, its last and next run, the last 30 days with cost, and the night.

- `runs` newest first (20 by default, 500 at most).
- `set` only on the user's click or key (else it rejects before anything is sent), checked as `echoctl jobs set` (`key=` back to its default; `night from=HH:MM to=HH:MM`), resolving to the list after.
- A plugin may tune its own routines' `every`, `night` and `model` this way, never switch them on or off.
- Nothing of this is in the host half.

#### `ctx.echo.routines.list() · runs(id, { limit })` — client half · `echo.jobs`

Echo's jobs, and the plugins' routines, in the one shape a routine has everywhere.

- `list` gives `{routines, night}`, each routine `{id, source, name, what, enabled, schedule, next_run, running, last, model, month, settings}`.
- A run is `{started, ended, state, ok, summary, error, model, cost_usd, …}`.
- A job's `summary` and `error` are Echo's own words and counts, never a call's, thread's or person's name nor a model's text.

## Folders and files

`"uses": { "folders": { "what": "Obsidian vaults" } }` — Install sheet: “Reads the Obsidian vaults you pick, on this computer — only those”

`"uses": { "folders": { "what": "Obsidian vaults", "write": true } }` — Install sheet: “Reads and changes the Obsidian vaults you pick, on this computer — only those: it may write, move and delete files in them”

Paths are relative to a root the user picked; links are never followed out of it, and nothing is written through a link.

#### `ctx.system.pickFolder(prompt)` — needs `folders`

The system's folder picker.

- The folder picked is given to this plugin (and listed in its card)
- Returns its path, or `null`.
-  *(0.10.0)* The picker lets the user make a new folder in it (“New Folder” on macOS, “Make New Folder” on Windows), so a plugin that wants a new folder, such as a new vault, just asks for one.
- The folder made and picked is the one given.

#### `ctx.fs.folders() · forget(root) · list(root, path) · read(root, path, max)` — needs `folders`

The roots it was given, giving one back, a folder's entries, and a file's text (1 MB by default, 4 MB at most).

-  *(0.10.0)* Bytes that aren't UTF-8 come as �.
- `read(root, path, { max, strict: true })` throws "not UTF-8: <path>" instead, and `readMany(root, paths, { max, strict })` gives `null` for such a file (5,000 paths at most).

#### `ctx.fs.readMany(root, paths, max) · walk(root, { path, ext, hidden, max, sha })` — needs `folders`

For big folders, off the plugin's time slice.

- `readMany` gives many files' texts in order (`null` for one that can't be read).
- `walk` gives every file under `path` as `{path, size, mtime}`, dot folders left out unless `hidden`.
-  *(0.10.0)* `sha: true` adds each file's sha256 (up to 64 MB).

**Example**

```
const [root] = await ctx.fs.folders()
const files = await ctx.fs.walk(root, { ext: ['md'] })
const texts = await ctx.fs.readMany(root, files.map((f) => f.path))
```

#### `ctx.fs.stat(root, path, { sha }) · search(root, query, opts)` — needs `folders` *(0.10.0)*

`stat`: `{kind: file | dir | link | other, size, mtime, real, sha?}` or `null` — the last name never followed.

- `real` its place relative to the root (`null` for a link leading out)
- Never an absolute path.
- `search`: the lines holding `query` as typed (no pattern; any case unless `caseSensitive`), `[{path, line, text}]`, with `path`, `ext`, `hidden`, `max` (200, 1,000 at most).

#### `ctx.fs.write(root, path, text, { ifSha, createNew }) · append · mkdir · move · remove` — needs `folders.write`

Change the folders it was given: write a file (atomically), move one (never over another), delete one or an empty folder.

-  *(0.10.0)* `ifSha` writes only while the file is still the one it read ("“path” changed since you read it: read it again")
- `createNew: true` (or `ifSha: null`) never over a file.
- `append(root, path, text)` adds at the end (1 MB at most), making the file.
- `mkdir(root, path)` makes the folder and those above it.
- Every write takes the plugin's lock across processes.

#### `ctx.fs.snapshot(root, { exclude, hidden, maxFiles, maxBytes })` — needs `folders` *(0.10.0)*

A copy of the folder in the store's `cache/snapshots/<id>/` to work on with `ctx.store`: `{path, files, bytes, skipped, why: {large, unreadable}}`.

- No link followed, never a `.git` folder or `.obsidian/plugins`.
- Dot names only with `hidden`.
- 20,000 files and 512 MB at most; a file over 50 MB is left out.
- One at a time, 3 kept (2 GB in all).
- `ctx.store.remove(path)` removes it.

**Its pictures in the window**  *(0.10.0)*.

- The window half shows an image of a folder it was given from `plugin/<id>/folder/<encodeURIComponent(root)>/<path>`: png, jpg, gif and webp only (no svg), 10 MB at most, inside the folder.

### Hidden files it may write  *(0.10.0)*

A name that starts with `.` is read in a folder the plugin was given, but never written. These few are the exception, matched by their exact names (`.Claude` is not `.claude`).

- files — Written by their exact names:

- `.gitignore` in any folder that isn't hidden.
- `.obsidian/<name>.json`, directly in `.obsidian/`.
- Markdown in a skill of the folder's own Claude Code project: `.claude/skills/<name>/<file>.md`.
- `name` is 1–64 of `a-z`, `0-9`, `-`; `file` is not hidden.

- folders — `.obsidian`, `.claude`, `.claude/skills` and `.claude/skills/<name>`.

- A folder is never moved into a hidden place.

- refused — Everything else hidden ("is hidden"):

- `community-plugins.json` and `core-plugins.json`, which switch Obsidian plugins on.
- `.claude/settings*.json`, hooks, agents and commands, and anything else under `.claude`.
- `.obsidian/plugins`, themes and snippets.
- `.git`, `.mcp.json`, `.gitattributes`, `.env`.
- A hidden note.

- `ctx.fs.write`, `append`, `move` (to and from), `remove`, `copyIn` and `ctx.git.commit` take these files; `mkdir` and removing an empty folder take these folders.
- A skill file is written whole by `ctx.fs.write`. `append`, `copyIn` and `move` into `.claude/skills` are refused, and so is a `commit` of a skill file that fails the check.
- A skill file must run nothing: the same [rules](#skill-rules) as for `installSkill`.
- No sheet line of their own: `folders.write` covers them.

### Files the user hands it  *(0.10.0)*

A file the user picks, drops on the plugin's view or names with `echoctl plugin call … --file` reaches the plugin as a **handle**.

- A handle is `{file, name, size}`: `file` is an id of that plugin's alone, never the path.
- It is kept for an hour.
- There is no sheet line — handing a file over is the user's own act.
- A file's name comes from the user's disk: put it into HTML only through `ctx.ui.esc`.

#### `ctx.system.pickFiles(prompt, { multiple, ext })`

The system's file picker, titled "<plugin> — <prompt>": the handles picked, `[]` when cancelled.

- One file unless `multiple`.
- `ext` up to 20 extensions (`["md", "pdf"]`).
- A picker opens only from a command — never from `apply`, a timer, an event, a widget's or work rows' provider, or inside a run Echo started.

#### `await ctx.files.text(file, { pages, max })` *(0.10.3)*

The text of a file the user handed the plugin, read by Echo's own readers: no model, no network.

**Gives**

- `{text, pages, truncated}`.
- `pages` in the answer is the file's page count, `null` for a file without pages, so a plugin can page through a PDF.
- `truncated` when `max` bytes of text cut it (1 MB by default, 4 MB at most).

**Options**

- `pages` — a whole number (`3`) or a range (`"2-5"`, `"7-"`), 1-based, for a PDF or a deck

- `max` — bytes of text to return

**Reads**

- PDF, Word, PowerPoint, spreadsheets, HTML, Markdown and plain text; a file of another name when its first 8 KB hold no NUL.
- In a child process of Echo, killed after 60 s.
- One extraction at a time for a plugin, two in all; another is refused with why.

**Refused**

- A file over 50 MB, an Office file that unpacks to over 200 MB or holds over 5000 parts, an old `.xls`.
- A file without text, an HTML page with almost none (a page drawn by scripts), a PDF where PDFium isn't installed.
- A file without pages given `pages`, a malformed or negative number, a range that starts past the last page.

No line on the sheet.

#### `ctx.files.read(file, { max }) · ctx.fs.copyIn(file, root, path, { createNew })`

Reads a file the user handed the plugin, or copies it into a folder.

- `ctx.files.read` gives its text (1 MB by default, 4 MB at most).
- `ctx.fs.copyIn` copies its bytes as they are (50 MB at most) into a folder it was given, with `folders.write` — never over a file there unless `createNew: false`.
- The handle also goes as a request's body (`ctx.http.fetch(url, {file})`) or a WebSocket message.

**Example**

```
// client.js: files dropped on its activity go to the host half
ctx.onFileDrop((files) => ctx.call('import', {}, { files }))
// main.js
ctx.command('import', async (_, { files }) => {
  const [root] = await ctx.fs.folders()
  for (const f of files) await ctx.fs.copyIn(f, root, `Inbox/${f.name}`)
  return files.length
})
```

### Other apps' files

`"uses": { "files": { "read": ["~/Library/Application Support/obsidian/obsidian.json"] } }` — Install sheet: “Reads these files of other apps on this computer: “~/Library/Application Support/obsidian/obsidian.json””

#### `ctx.system.readFile(entry)` — needs `files`

The text of a file its manifest names (that very entry; 1 to 5 of them, `~/…`, `%APPDATA%/…`, `%LOCALAPPDATA%/…`), 1 MB at most, or `null` when it isn't on this computer.

### Git  *(0.10.0)*

In a folder it was given (`uses.folders`; `init` and `commit` also `folders.write`), async and off its time slice. No line on the sheet beyond the folder's.

#### `ctx.git.info(root) · status(root, { paths }) · log(root, { path, max }) · show(root, rev, path, { max, strict })`

`info`: `{repo: false}` or `{repo: true, branch, head, detached, busy, subfolder}`.

- `status`: changed and untracked files, `[{path, code, from?}]` with git's two letters.
- `log`: `[{rev, author, email, date, subject, echo, path?}]`, newest first, of the folder or one file through its renames (50, 1,000 at most)
- `echo` in a `log` row is the plugin that committed it through Echo.
- `show`: a file at `HEAD`, `HEAD~N` or a commit's id, `{text, size, truncated}` or `null`.
- Bytes that aren't UTF-8 are replaced; `strict: true` refuses such a file ("not UTF-8"), as `ctx.fs.read` does.

#### `ctx.git.init(root, { branch }) · commit(root, { paths, message })` — needs `folders.write`

`init`: a new repository, on `main` unless `branch`.

- `commit`: one commit of exactly `paths` (1–1,000 files, a file gone committed as removed), the user's other work left as it is.
- `commit` gives `{rev}`, or `{rev: null}` when nothing changed.
- Committed by `Echo (<plugin id>)`, authored by the user's git name when git knows it.
- No hook runs, nothing is signed, nothing is fetched.

Echo runs git itself, never through a shell, with the repository's own hooks, filters and programs switched off.

- It refuses:

- No git on the computer.
- Git older than 2.31.
- A repository whose history lies outside its folder (a `gitdir:` file, a worktree, a submodule).
- `core.worktree`.
- A bare or borrowed or partial repository.
- One another user owns.
- Settings that read or include a file a plugin could change.
- A commit during a merge or rebase.
- An ignored file.

- Git taking over 20 seconds is stopped.

## Network

`"uses": { "network": { "hosts": ["api.example.com"] } }` — Install sheet: “Talks to api.example.com over HTTPS”

`"uses": { "network": { "hosts_from": ["server"] } }` —  *(0.10.0)* Install sheet: “Talks to the addresses you list in its setting “server” (wildcards allowed, plain http too; its window part also over WebSocket)”

`"uses": { "network": { "web": true } }` —  *(0.10.3)* Install sheet: “Reads web pages on the public internet (https), and can send what it knows to any site through the addresses it opens”

`"uses": { "network": { "ask": true } }` —  *(0.10.0)* Install sheet: “Fetches a web page from an address you type in Echo's own box when it asks — that page only, once each time”

`hosts`: `https://` to those hosts only.

- `hosts_from`: string settings (without a default) where the **user** lists addresses — the plugin never sets them, not by `ctx.settings.set`, its files or a manifest default. (Echo 0.9.14 says “wildcards allowed; plain http only inside your own network”.)

#### `ctx.http.fetch(url, { method, headers, body, save, file })` — needs `network`

`{status, body}` for any HTTP answer, a redirect too (never followed).

- GET, POST, PUT, PATCH or DELETE; 60 seconds and 10 MB.
- `save`: a path in its store to keep the answer in (audio or a picture is shown from `/plugin/<id>/store/<path>`).
-  *(0.10.0)* `file`: a handle the user handed it, sent as the body with POST, PUT or PATCH.
- With `save` or `file`, 512 MB each way and 15 minutes.

**Example**

```
const r = await ctx.http.fetch('https://api.example.com/v1/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { name: 'x' },
})
```

**Addresses the user lists** are `scheme://host[:port]` patterns, http or https.

- They are comma- or space-separated.
- `*` stands for a leading name label (`http://*.lab.local`), a number of an IPv4 address but the first (`http://192.168.1.*`) or the port (`:*`).
-  *(0.10.0)* Plain http goes to any host the user listed.
- One outside their own network gets a note on the setting's row: "plain http: anyone on the way can read it".

#### `ctx.http.stream(url, { method, headers, body, file }, onChunk)` — needs `network` *(0.10.0)*

An answer as it comes (server-sent events, chunked): returns `{status, headers, done, cancel()}` at once.

- `onChunk(text, s)` for each piece (UTF-8 never cut inside a character)
- `done` resolves `{status, bytes, cancelled}`.
- No time limit, 512 MB at most.

#### `ctx.net.websocket(url, { headers, protocols })` — needs `network.hosts_from` *(0.10.0)*

`ws://` and `wss://` to an address the user listed (never a `hosts` host).

- It resolves once open to `{protocol, send, close, onMessage, onClose, onError}`.
- Send with `send(text)`, `send(base64, {binary: true})` or `send(handle)`.
- Receive with `onMessage(data, {binary})`; binary comes as base64.
- Set the handlers right after the await: events wait for them up to 1,000 and 8 MB.
- A message is 16 MB at most out, 4 MB in.

**Example**

```
const ws = await ctx.net.websocket('wss://printer.lab.local/events')
ws.onMessage = (data) => ctx.widgets.set('printer', JSON.parse(data))
ws.onClose = ({ code }) => ctx.log('closed', code)
```

A plugin keeps 8 connections (streams and WebSockets) open at once; switching it off, updating or removing it closes them all.

**Certificates the system doesn't trust**  *(0.10.0)* — a server of the user's own, self-signed or from an internal CA.

- https and wss to a listed address fail the first time with the key met there: "the certificate at <host:port> isn't one this computer trusts (its key: sha256//…): if it is your own server's, trust it in Settings → Plugins → <name>, or with echoctl plugin trust <id> <host:port>".
- Only the user trusts it — in the plugin's detail under Certificates, or `echoctl plugin trust`. No plugin can.
- From then on that address is reached with that key alone, and another key is refused until the user trusts it.

#### `ctx.http.askAddress()` — needs `network.ask` *(0.10.0)*

Echo's own box — the system's text dialog, not the plugin's page — asks the user for an address.

- It asks: "<plugin name> asks for the address of a web page to fetch once. Type or paste it:".
- It resolves the address typed, or `null`.
- The plugin may then fetch exactly that address once, within 10 minutes, as a plain GET with no headers or body.
- Refused inside a run Echo started.

**Refused**

- A host neither named nor listed.
- A certificate not trusted.
- A 9th connection.
- A method other than the five.
- A header that isn't a plain token or holds a line break (and `Content-Length` or `Transfer-Encoding` with `file`)
- A request past its time or size.

### From the window half  *(0.10.0)*

The window half reaches the addresses the user listed with the page's own Web APIs, and no other outside address.

- The Web APIs are `WebSocket`, `fetch` (streams too), `EventSource`, `<audio>` and `<video>`.
- The window's content security policy opens to each listed address of a plugin that is on, with its WebSocket scheme and port: `https://voicecho.local` becomes `https://voicecho.local:443` and `wss://voicecho.local:443`.
- When the list changes, the page loads again by itself, but not while a text box holds what the user typed.

- The policy is the page's, not one plugin's: while a plugin with listed addresses is on, every enabled plugin's window part can reach them. The setting's row says so.
- An IPv4 pattern with a `*` can't go into a policy: list each address.
- `fetch` and `EventSource` go through CORS: the server allows Echo's origin (`echo://localhost` on macOS, `http://echo.localhost` on Windows; `Access-Control-Allow-Origin: *` covers both). WebSocket has no CORS.
- macOS lets the window reach plain `http://` / `ws://` only to an IP address, a `.local` name or a one-label name; macOS 15 may ask once for Local Network access.
- A self-signed certificate isn't accepted by the window: reach such a server from the host half.

### Reading a web page  *(0.10.0)*

Reads a page from the web as safe Markdown, with its links and pictures. Without `network.web` it has no line of its own on the sheet: it is a GET under the network grants above.

- Checked as `ctx.http.fetch` is: a host in `network.hosts` over https, an address the user listed, or the page the user typed in Echo's box.
- Without `network.web` no redirect is followed: a page that moved rejects with its 3xx.
- No cookies, sign-ins or headers of the plugin's.
- All async, off the plugin's time slice.

#### `ctx.web.read(url, { max, timeout, images, render })`

The page's main part as Markdown, with what the page says about itself.

**Gives**

- `markdown` — the largest article (else main, else body) without scripts, styles, navigation, forms and the like; headings, paragraphs, lists, code, tables, links and pictures kept

- `title`, `lang`, `byline`, `published`, `description` — from the page; the title is not repeated in the Markdown

- `links` — `[{text, href}]`, absolute http(s) only, each once, 2,000 at most

- `images` — `[{src, alt, caption, width, height}]`, each once, 500 at most

- `source`, `needs_js` — where the text came from (`html`, `json-ld`, `state`, `noscript`, `meta`); true for a page that builds itself with scripts and has under 200 characters of text

- `url`, `truncated`, `bytes` — the address asked for; whether something was left out; the size read

**Limits**

- HTML only (`text/html`, `application/xhtml+xml`); anything else rejects "this is <type>, not a web page".
- Never compressed: a `Content-Encoding` other than identity rejects.
- 5 MB (`max` less), read as it comes; 30 seconds (`timeout` less).
- The charset the server or the page names, else UTF-8.
- A page's scripts are never run, unless `render: true` ([below](#rendered-page)). What it embeds (JSON-LD, a framework's JSON state, `<noscript>`) is read as data, and used when it is clearly fuller than the HTML.

**What is never markup**

- The page's words are escaped, so none of them means anything to Markdown.
- Control characters and invisible direction and joining marks are dropped.
- A link with `javascript:`, `data:`, `file:` or `mailto:`, the page's own anchors, an address with a user part, or one over 2 KB stays plain words.

**Saving its pictures**

- `images: 'save'` also downloads them: each entry gets `saved`, a file handle `{file, name, size, type}`, or `error`.
- 50 pictures, 10 MB each, 50 MB and 2 minutes for a page; PNG, JPEG, GIF, WebP, AVIF and SVG.
- Saved in the store's `cache/web/` as `NN.<ext>`. The Markdown keeps each `src`: map `src` to `saved.name` when you write them elsewhere.
- A picture comes from any public host, as a browser would load it, though the plugin wasn't granted that host. This is the one widening.
- Only these pictures, GET only, https (http for an http page), port 80 or 443.
- Echo looks the host up and refuses it when any address is this computer or a private, local or reserved one. It connects to the address it checked, never through a proxy.
- A page on the user's own network or this computer gets only the pictures the plugin may reach.

**Example**

**Example**

```
const page = await ctx.web.read('https://blog.acme.example/pilot',
  { images: 'save' })
const [root] = await ctx.fs.folders()
await ctx.fs.write(root, 'Clips/pilot.md', `# ${page.title}\n\n${page.markdown}`)
for (const i of page.images)
  if (i.saved) await ctx.fs.copyIn(i.saved, root, `Clips/${i.saved.name}`)
```

#### `ctx.web.read(url, { render: true })` — needs `network.web` *(0.10.3)*

Reads a page as a browser shows it, its JavaScript run, for a page that builds itself with scripts.

**Gives**

- The same shape as a normal read (Markdown, links, pictures, escaping, limits), plus `rendered: true`.
- `bytes` is the size of the page's DOM as HTML; `images: 'save'` works as for a public page.

**Which pages**

- Public https pages only, checked as [the public web](#public-web) is checked.
- A page reached through the plugin's other grants, plain http, another port, this computer or the user's network is refused before anything is asked.
- Without `network.web` it is refused, naming the line the sheet doesn't ask for.
- `render` other than `true` or `false` is refused.

**Where it runs**

- A hidden browser view in a child process of Echo, with no window or Dock icon, apart from Echo's window and the plugin's `ctx`.
- Nothing persists: cookies, storage and cache last only for that render.
- Downloads, popups and permissions (camera, microphone, location, notifications) are denied.
- Only the DOM's HTML and the address the page ended at come back.

**Its network**

- Every connection goes through Echo's public-address check, on port 443 only; never to this computer or the user's network.
- Media, workers (dedicated, shared and service), WebRTC, WebTransport and notifications are blocked.
- No event from the page can activate a link.
- The page's own requests to public hosts are allowed, and it sees the user's public IP.

**Limits**

- 30 seconds (`timeout` less).
- One render per plugin and two in all; another is refused: “is already rendering a page: one at a time”.
- 5 moves of the main frame; 250,000 elements.
- 5 MB of HTML (`max` less, then `truncated`).
- 64 connections (16 at once), 32 hosts, 25 MB through the check.

**Platforms**

- macOS and Windows: a hidden WKWebView on macOS, a hidden WebView2 on Windows, behind the same gate, with the same limits.

The page's words are untrusted data, as any page's.

#### `ctx.web.fetch(url, { max })`

One file the plugin may reach, as a file handle `{file, name, size, type}`.

- The same rules as `read`; any type.
- 10 MB, `max` up to 50 MB; 2 minutes.
- `name` is the address's last segment in letters, digits, `.`, `_`, `-`.

#### `ctx.web.markdown(html, { base })`

The same as `read` for HTML the plugin already has: a mail's body, a page it fetched itself. Nothing is fetched.

- Gives the same shape, without `url` and `bytes`; 5 MB.
- `base` is an http(s) address of 2 KB at most for relative links; without it they stay text.

#### `"uses": { "network": { "web": true } }` — for `ctx.web.read`, `ctx.web.fetch` *(0.10.3)*

Reads any page on the public internet, with no dialog.

**Reaches**

- `https://` only, on port 80 or 443.
- A host name, or an IPv4 address written as one; an IPv6 address written as one is refused.
- Public addresses only: every address the name resolves to must be public, so a name that points into this computer or the user's network, even in part, is refused.
- Echo connects to the address it checked, never through a proxy.
- A host the plugin's other grants reach (`network.hosts`, a listed address, the typed one) keeps their rules.

**Redirects**

- 301, 302, 303, 307 and 308 are followed, 5 at most.
- Each address is read against the one it came from, and checked again before anything is asked of it.
- The size and time caps are the whole read's: no redirect is followed past its time.
- A 6th redirect, or one to an address Echo may not read, is refused with why.

**Works**

- In queued and background work, routines and a long PDF read in parts, as in a command: no click, user activation or prompt per fetch.
- In a run Echo started it is allowed as the rest of `ctx.web` is; only `askAddress` is refused there.

**Refused**

- Plain http, another port, an address on this computer or the user's network, a name that isn't found (all in the same words, so no name inside the network can be probed).
- Unchanged: GET only, no cookies, credentials or headers of the plugin's, the same User-Agent and caps, HTML only for `read`.
- An update that adds the line asks the user again.

What comes back is the page's: untrusted data. Show it only through `ctx.markdown`, never as HTML of your own, and never in a prompt as instructions.

## Echo's data

`"uses": { "echo": { "read": ["threads", "calls", "me"] } }` — Install sheet: “Reads your threads' names and stages, the list of your calls (titles, times, who was invited, their threads) and your name and email in Echo”

#### `ctx.echo.read(kind, arg)` — needs `echo.read`

Read-only, a kind named in the manifest:

- `clients` — the names of the user's clients

- `threads` — open threads: `{id, name, client, stage, group, profile}`, `group` `pursuit` or `delivery`.

-  *(0.10.1)* `profile` is the id of the AI profile its jobs and sync run on: the one pinned to it, else the default's.

- `people` — who the people in the threads are.

-  *(0.10.0)* `{key, name, aliases, email, also, organisation, client, title, threads, link}`: `aliases` the other names Echo knows them by, `also` their other addresses, `client` their organisation's id, `key` what a call's `participants[].person` names.
-  *(0.10.1)* Also `places`, `reports_to` and `reports`:

- `places` — `[{thread, role, stance}]`, where they stand in each of their open threads (`null` when unset)

- `reports_to` — `{key, name}` of the listed person they report to (`key` is `null` when People doesn't list them), else `null`

- `reports` — `[{key, name}]` of the listed people who report to them

- The same people as before, with no facts or quotes from calls.

- `dictionary` — the dictionary

- `sources` — the calls and the facts of the threads' mail and channels, by `{kind, thread, since, limit}`.

-  *(0.10.0)* Also by `client` and `q` (every word in its title; a mail's subject and senders too).
-  *(0.10.1)* The mail and channel facts are Intake's now, not Recall's. What `ctx.where()` gives as `recall` is unchanged.
- Newest first, no text: a call with minutes `{id, stamp, kind, title, date, threads, client}`.
- A mail or post gives what `source` gives, without `text` and `messages`.
- `limit` 200 (1,000 at most)

- `source` — One call, mail conversation or channel post, with its text. `read('source', id, opts?)` takes `call:<folder>`,  *(0.10.0)* `call:<stamp>` or `mail:<source>`; a call needs its minutes.

**Every source**

- `{id, kind, title, date, text, link, threads, profile}`, and  *(0.10.0)* `client`.
- `profile`: the AI profile its text may go to.
- `threads` are each `{id, name, client, client_name}`.
- `client` is `{id, name}` when the threads have one client between them, else `null`.

**A call  *(0.10.0)* **

- Read by its folder or its stamp; `id` stays the folder's.
- `stamp`, `started_at`, `ended_at`, `duration_min`, `app`, `platform`, `memo`.
- `attendees`: `{name, email}`, organizer first.
- `participants`: the invite again, each with `person`, its key in `read('people')`, or `null`; 50 at most.
- `transcript`, and `chat`: `[{at, from, text, files}]`. A third argument `{transcript: false}` or `{chat: false}` leaves them out.
- `minutes`: `{summary, decisions, actions, questions, revision, body}`.

**Its minutes  *(0.10.0)* **

- `summary`: the text under the summary heading.
- `decisions`, `questions`: the bullets under those headings, also in Ukrainian and Russian; 50 at most.
- `actions`: the call's action items `{id, text, owner, due, done}`.
- `revision`: as in `minutes_written`.
- `body`: the Markdown from the first `## ` heading.

**A mail conversation or channel post  *(0.10.0)* **

- What Echo decided when it indexed it: `subject`, `at`, `from`, `people`, `trust`, `url`.
- `m365_id` (for `ctx.m365.mailThread`) and `conversation_id`.
- `text` and `messages` `[{from, at, text, link}]`: facts, never a message's own words.

- `calls`  *(0.10.0)* — Your calls, newest first, with or without minutes: `read('calls', {q, since, until, thread, client, limit})`.

- Each call is `{id, stamp, title, date, started_at, ended_at, duration_min, app, memo, minutes, transcript, chat, people, participants, threads, client, profile}`.
- `q` every word in its title, folder, subject or people.
- `since` and `until` `YYYY-MM-DD`, both days in.
- `thread` and `client` an id.
- `limit` 50 (500 at most)

- `calendar`  *(0.10.0)* — the agenda Echo last read, by start: `read('calendar', {from, to})`: `{id, subject, start, end, organizer, attendees, join_url, response, threads, client}`.

- `from` and `to` are `YYYY-MM-DD` by the start's day in the user's time zone, both days in.
- `client` is `{id, name}` when the threads have one between them.

- `me`  *(0.10.0)* — `{name, email}`, `null` each when unknown

- `recording`  *(0.10.0)* — `{state, call, stamp}`: `state` is `recording` while Echo records a call or memo, else `transcribing` while a call's transcription runs, else `idle`; `call` and `stamp` are `null` when idle. It has its own line on the sheet

#### `ctx.echo.dictionary.add({ name, synonyms, spellings, kind, client })` — needs `echo.write: dictionary`

Names for one thing into the user's dictionary. Sheet: “Adds names to your Echo dictionary”.

### About me  *(0.10.0)*

`"uses": { "me": {} }` — Install sheet: “Reads your About me in Echo (Settings → About me): your name and role, the people and terms of your calls, how you like things written and how you work”

#### `await ctx.me({ kinds })` — host half · needs `me`

What the user wrote about themselves in Settings → About me, in the parts you ask for.

**Options**

- `kinds` — the parts: `identity` (name, role, company, what they work on), `people`, `terms`, `style` (how they like notes and follow-ups written), `patterns` (how they work). None named: all but `patterns`, as Echo's own readers. An unknown kind throws

**Gives**

- `null` — when About me is missing, empty or still the template

- `text` — the asked blocks in About me's order, 20,000 characters at most

- `parts` — each asked kind's blocks; a kind About me hasn't is left out

- `name` — its `Name:` line (else Echo's name for the user) when `identity` is asked, else `null`

- `hash` — 8 hex characters of `text`: another hash means an edit to read again

- There is no event: read it when it is needed.
- `echo.read('me')` stays the way to name and mail the user; `ctx.me` reads what they wrote about themselves.

### Writing to threads

`"uses": { "echo": { "write": ["thread_stage", "tasks"] } }` — Install sheet: “Changes your threads' stage. Adds and updates tasks in your threads”

Every write is in the thread's history as the plugin's, with its reason. What the user set stays theirs.

#### `ctx.threads.setStage(thread, stage, reason)` — needs `thread_stage`

`{applied, why?}`.

- `stage` one of `lead`, `proposal`, `negotiation`, `kickoff`, `active`, `on_hold`, `wrap_up`, `done`, `lost`, `cancelled`.
- `reason` up to 300 characters.
- Once the user changes the stage away from what this plugin set, it answers `{applied: false, why: "the user set this thread's stage themselves"}` until the user hands it back (`echoctl project set <id> --stage-back-to <plugin>`, or the thread's Profile).

#### `ctx.tasks.upsert(thread, { key, title, due, owner, state, url, reason, propose }) · close(thread, key, reason, { propose })` — needs `tasks`

The plugin's own tasks, by its `key` (up to 120 characters), in a story named after the plugin: `{task, applied, proposed, ignored, why?}`.

- `state` `open`, `in_progress`, `blocked`, `done` or `cancelled`.
- `url` https, shown as the task's link.
- A field left out stays.
- The same values write nothing.
- `ignored` lists the fields the user set.
- `propose: true` waits in the thread's Work → To review and the Inbox for the user's Yes.
- After No, the same write stays quiet.

**Example**

```
ctx.tasks.upsert(thread, {
  key: 'ACM-1042', title: 'Review the pilot contract', due: '2026-12-01',
  owner: 'Dana Reyes', url: 'https://tracker.acme.example/ACM-1042',
  reason: 'assigned in the tracker',
})
```

## Claude in Echo

What a plugin gives Echo's own Claude — the Claude · Echo folder session, routines and Yolo — not the user's own Claude Code (for that, [skills in the user's Claude Code](#own-skills)).

`"uses": { "sessions": { "skills": true, "read": true, "hints": true, "commands": ["sync"] } }` — Install sheet: “Gives Claude in Echo skills of its own — text only, in Echo's sessions, not your Claude Code; lets Claude in Echo read the folders you give it (your Echo folder session may also change them, with your permissions); tells Claude what it knows about the client or thread open in the window; lets Claude in Echo run its commands “sync” without asking”

`"uses": { "channel": { "plugin": "telegram@claude-plugins-official" } }` — Install sheet: “Lets you reach your Claude · Echo folder session through Telegram while it is open in Echo, and installs Claude Code's telegram@claude-plugins-official plugin for it”

#### `agent/` and `"agent": { "summary", "prefix" }`

A folder in the plugin that Echo lays out for Claude, 1 MB in all.

- `agent/CLAUDE.md` is required (8 KB): what the plugin gives Claude, when to turn to it, and its commands as `${CLAUDE_PLUGIN_ROOT}/scripts/echoctl plugin call <id> <cmd>`.
- `agent/skills/<name>/SKILL.md`: up to 20.
- `agent/rules/*.md`: 10 files, 4 KB each.
- `agent/guides/**/*.md`: 50 files, 64 KB each.
- `summary` (one line, 200 characters) is the plugin's row in Echo's core; without it, the manifest's `summary` is.
- `prefix` (2–4 of a–z 0–9) names its skills `<prefix>-<name>`.
- Claude reads it only when it works with the plugin.
- Sheet: “Tells Claude in Echo how to work with it (a guide and the skill “…”), loaded only when you work with it”.

#### `echo_plugins` tools *(0.10.5)*

Echo's sessions and runs reach the commands and guides of other plugins through the `echo_plugins` tools.

- Echo gives them when a plugin offers commands ([`ctx.expose`](#offers)) or gives Claude a guide (`agent/`), in the folder session, a plugin's session, routines, Yolo and a plugin's runs.
- The tools are allowed without asking and are not given to a minutes run, a project sync or a run with no tools.
- The core lists each plugin in one table row: its name, its id and what it is for. Claude asks `plugin(id)` for the rest.
- What it is for is what its host half set with `ctx.agent.set`, else the manifest's `agent.summary`, else `summary`. A text passed to `ctx.expose` is ignored.

**Gives**

- `plugins` — every such plugin, with how many commands, its guide, skills and entries

- `plugin(id)` — one plugin's commands, guide, skills and entries

- `command(id, name)` — one command's arguments

- `call(id, name, args)` — runs a command and gives its answer

**Limits**

- A run that only reads calls only commands marked `reads`.
- A call of a command not marked `reads` shows in a routine's or Yolo's outcome as `plugin call <id> <name>`.
- The call runs unattended: no picker opens.

#### `"skills": ["skills/staffing"]`

Package skills: a folder with `SKILL.md` (frontmatter only `name` and `description`, no `!` commands), `scripts/` and `references/` beside it. No `uses.sessions` needed; at most 10, with the runtime skills.

#### `ctx.agent.set({ summary, entries: [{ name, summary, guide }] })` — needs `agent`

What changes at run time — one entry per vault, per watched project: up to 20, each a row in Echo's core and a guide (Markdown, 16 KB) Claude reads before working with it. Entries not given again are removed.

#### `ctx.sessions.skills([{ name, description, body }])` — needs `sessions.skills`

Runtime skills, text only: Echo writes the skill files itself, so no hooks, MCP servers or agents come with them.

#### `ctx.sessions.read(folders) · ctx.view.hints([{ client | thread, text }])` — needs `sessions.read`, `sessions.hints`

Which of its granted folders Echo's sessions may read.

- One plain line Claude is told when that client or thread is open in the window.
- These and `skills` are each set whole (`[]` removes them) and not kept across loads: set them from `apply`.

#### `ctx.sessions.channel({ plugin, env }) · clearChannel()` — needs `channel`

The Echo folder session listens to the Claude Code channel its manifest names, with `env` (no `CLAUDE*` or `ANTHROPIC*` key).

## Where a plugin shows up

The client half (`client.js`) puts a plugin into Echo's window.

- Each place below shows where it appears — a demo plugin put "Your button", "Your panel" and the rest there — what to call, and what Echo hands the code.
- Everything a plugin adds is taken out when it is switched off, updated or removed.

Draw with Echo's own CSS tokens — `var(--accent)`, `var(--line)`, `var(--text-2)`, classes such as `btn`, `btn primary`, `set-sub` — and it looks like Echo in light and dark.

- Work that needs the host half (Claude Code, the network, files) runs through one of its commands: `ctx.call(command, args)`.

### Buttons in Echo's slots

A **slot** is a place where Echo keeps room for plugins, beside its own.

- `ctx.slots.add(slot, { label, icon, title, when, run })`: `label` the text, `icon` an SVG string before it, `title` the tooltip.
- `when(target)` decides whether it shows (left out: always), `run(target)` is the click — an error it throws is shown with the label.
- `target` is what the screen is about.
- `ctx.slots.list()` names them all.

### A button on a meeting — calendar.event

Calendar → a meeting → its card, under Echo's Record / Join buttons.

![A meeting card in the calendar with a plugin button "Your button" under Record when it starts](https://echo.onetest.ai/assets/screens/extend/slot-calendar-event.png)

```
ctx.slots.add('calendar.event', {
  label: 'Prep brief',
  when: ({ event }) => !event.recorded && new Date(event.start) > Date.now(),
  run: async ({ event }) => {
    const { markdown } = await ctx.call('brief',
      { subject: event.subject, start: event.start })
  },
})
```

- `target` — `{ kind: "event", event }`

- `event.id, subject, start, end` — the meeting; times are ISO strings

- `event.online, join_url` — an online meeting and its link

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

- `label` —  *(0.10.0)* a text, or a synchronous function of the target (`(t) => `Open in ${…}``); one that throws or gives nothing leaves the item out. `calendar.event` and `task.actions` take one too

- `call.name` — the call's folder name — how commands and the CLI name it

- `call.stamp` —  *(0.10.0)* its stamp, `YYYY-MM-DD_HHMMSS`, kept when the call is retitled: key a record by it

- `call.title, started_at, minutes` — its title, start (ISO) and length in minutes

- `call.status` — `recording`, `transcribing`, `done`…

- `call.people` — who was in it

- `call.path` — its folder on disk

- `call.meeting` — the invite: subject, attendees

### A chip on a call's row — call.row  *(0.10.0)*

The calls list → each call's row, in its second line.

```
ctx.slots.add('call.row', {
  id: 'ticket',
  label: 'Its ticket',                                // the chip's tooltip
  chip: (call) => tickets[call.name] || null,   // short text, or nothing
})
```

- `call` — `{ name, stamp, title, started_at, status, memo }`

- `chip(call)` — synchronous; a short text (24 characters, the rest cut with …), drawn as text, or nothing. A click on it opens the call, as the row does. One per `id`; one that throws is left out

### A button on a task — task.actions

A thread's Work tab (or Tasks) → a story, task, decision, risk or question → its details, under its fields. Also on the plugin's own [work rows](#work).

![A task's details in the right panel with a plugin button "Your button" under its fields](https://echo.onetest.ai/assets/screens/extend/slot-task-actions.png)

```
ctx.slots.add('task.actions', {
  label: 'Open a ticket',
  when: ({ kind }) => kind === 'task',
  run: ({ node, project }) =>
    ctx.call('ticket', { thread: project, id: node.id, title: node.title }),
})
```

- `target` — `{ kind, node, project }`

- `kind` — `story`, `task`, `decision`, `risk` or `question`; `plugin` on a work row

- `node.id, title, state` — e.g. `T001`, its title, `open` / `done`…

- `node.owners, due, description, links` — who, when, the text, its links

- `node.history` — what was said about it, with quotes

- `project` — the thread's id

- a work row — `{ kind: "plugin", source, row }`: `when: (t) => t.kind === 'plugin' && t.source === ctx.id`; after `run`, Echo reads the rows again

### A row on a thread's Profile — thread.profile

A thread → Profile, under its Sources.

```
ctx.slots.add('thread.profile', {
  id: 'code',
  label: 'Project code',
  render: (thread) => ctx.ui.esc(codes[thread.id] || '—'),
  after: async (box, thread) => {
    if (!(thread.id in codes)) {
      codes[thread.id] = await ctx.call('code', { thread: thread.id })
      ctx.render()
    }
  },
})
```

- `thread` — `{ id, name, client }`

- `render(thread)` — synchronous HTML; `after(box, thread)` runs once per box drawn afresh. One row per `id`; one that throws is left out

### A row on a client's Profile — client.profile  *(0.10.0)*

A client → Profile, under its Threads.

As `thread.profile`, for a client.

```
ctx.slots.add('client.profile', {
  id: 'tier',
  label: 'Support tier',
  render: (client) => ctx.ui.esc(tiers[client.id] || '—'),
})
```

- `client` — `{ id, name }`

- `render`, `after` — as `thread.profile`: synchronous HTML, `after(box, client)` once per box drawn afresh, one row per `id`

### A box on a call's header — call.header  *(0.10.0)*

A call → its header, before My notes and ⋯.

A box of the plugin's own: a chip, or a button with a popup it draws itself.

```
ctx.slots.add('call.header', {
  id: 'ticket',
  label: 'Ticket',
  render: (call) => ctx.ui.esc(tickets[call.stamp] || 'No ticket'),
})
```

- `call` — `{ name, stamp, title, started_at, notes, profile, memo, threads, client }`, only what the page has.

- `name`: the call's folder name.
- `stamp`: kept when the call is retitled; key your own record of the call by it.
- `title`, `started_at`: its title and start.
- `notes`: whether it has minutes.
- `profile`: its AI profile, or `null`.
- `memo`: whether it is a memo.
- `threads`: its threads' ids.
- `client`: the first of their clients, or `null`.

- `render(call)` — synchronous HTML. The box is `position: relative`, so a popup anchors to it

- `after(box, call)` — once per box drawn afresh, again for another call. One per `id`; one that throws is left out and the header drawn without it

### A line while minutes come — call.minutes  *(0.10.0)*

A call → the box that says its minutes are coming.

A line in that box, drawn only while the minutes are on their way.

```
ctx.slots.add('call.minutes', {
  id: 'note',
  label: 'Our note',
  render: (call) => ctx.ui.esc('Tickets are added when they are ready'),
})
```

- drawn while — a run is queued or going; Echo is writing them by itself (due now or at a time, the call not over or not transcribed yet); a Claude Code session holds the call

- not drawn when — the minutes are off, held ("Until I say"), too thin, can't start, failed or written

- `call` — as in `call.header`. A line with nothing is not drawn; one that throws is left out

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

Call `ctx.render()` after its data changes, and the panel draws again. `ctx.openEchoPanel(view)` opens one of Echo's own, e.g. `claude-folder`.

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

Its address is `#<plugin>:<id>/…`.

- What follows the id is the activity's own route (`ctx.where().route`).
- `ctx.ui.graph.draw(box, key, build, opts)` lays the graph out once per `key` and keeps it across renders.
- Sizes are relative to the graph — keep them small.

 *(0.10.0)* `badge()` gives a count, shown on its icon as Threads shows its count (1–99, then "99+"), or `'!'`, Settings' attention mark.

- Anything else shows none.
- `editing()` true leaves the activity's box as it is on Echo's redraws, with no `render` and no `after`, until it says otherwise.
- Else the box is replaced only when its HTML changed.
- Both are asked on every draw, synchronously (a `ctx.render()` inside is ignored)
- One that throws is logged once and taken as no badge, not editing.

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

#### `ctx.call(command, args, { files })`

Runs a command of its host half.

- A promise of what it returned.
-  *(0.10.0)* Sent as a POST with `{args, files}` in its body, 4 MB at most ("too much for one plugin call: 4 MB at most")
- `files`: handles it was given, the command's own `{files}`.

#### `ctx.listen(type, fn) · listenWindow(type, fn) · onUnload(fn)`

Document events (clicks on its own buttons) removed with the plugin — an update never doubles a click.

-  *(0.10.0)* `listenWindow`: the same for the window (resize, focus, message)
- `onUnload`: its own cleanup — timers, observers — run first when it is switched off, updated or removed.

#### `ctx.onFileDrop(fn)` *(0.10.0)*

macOS: files dropped on the window while its activity or its Knowledge tab is shown go to `fn(files)` as [handles](#handles). With no such view shown, or on Windows, a drop is Echo's own.

#### `ctx.ui.style(css) · ctx.ui.stylesheet(path)`

CSS, removed with the plugin.  *(0.10.0)* `stylesheet` loads a `.css` file of its package by a plain relative path (`styles/view.css`) and resolves once loaded.

#### `ctx.ui.patch(el, html)` *(0.10.0)*

Replaces a box's HTML unless it is what `patch` last wrote there — redrawn the same, its focus, typed text and scroll stay.

#### `ctx.markdown(md, opts) · ctx.markdown.links(md, { detail })` *(0.10.0)*

Echo's writer from the window half, async — see [Markdown pages](#markdown).

#### `ctx.where() · ctx.go(hash, { replace }) · ctx.render()`

Where the window is (`{view, section, route}` *(0.10.0)* and `recall`: whether Recall is on), going somewhere, and drawing again after its data changed.

-  *(0.10.0)* `go(hash, { replace: true })` changes the address without a history step, so Back skips it, and the window shows the page as for a real one.
- Without it a new step is made, and the hash it is already at only redraws.

#### `ctx.ui`

Echo's helpers: `esc` (escape text for HTML), `notice` (a message in the status line), `copy` (the clipboard, on the user's click, 10,000 characters), `setRow`, `setCard`, `sw`, `ICON`, `relDay`, `ago`, `graph`, `newGraph`, and the ones above.

#### `ctx.ui.sheet(html, { label, onClose }) · ctx.ui.closeSheet()` *(0.10.0)*

Opens the plugin's HTML in Echo's dialog frame, over the window.

- It returns the sheet's box; its clicks go through `ctx.listen`. `label` names the dialog.
- The keyboard moves into it (an `[autofocus]` element, else the first it can reach) and Tab goes round inside.
- One sheet at a time: opening one closes the one open, the plugin's or another's.
- Esc, a click beside it or `ctx.ui.closeSheet()` (its own only) close it and call `onClose` once. Switched off, updated or removed, the plugin's sheet closes without `onClose`.
- Closed, the keyboard goes back where it was.
- Echo's redraws never replace it; the palette and Echo's own dialogs open over it.

#### `ctx.system.reveal(root, path)` — client half · needs `folders` *(0.10.0)*

Shows a file or folder of a given folder in Finder or Explorer, selected.

- `root` is as `ctx.fs.folders()` names it; `path` is relative inside it (`''` the folder itself). Hidden files and folders too, as they may be read.
- Async. It rejects, before anything is sent, unless the page has the user's click or key.
- Echo checks the plugin is on and names `uses.folders`, that the path is inside the folder (a link out is refused) and that it is there.
- The host half's `ctx.system` has no `reveal`.

#### `ctx.claude.session(opts) · installSkill(name, md) · ctx.echo.jobs · ctx.echo.routines`

Claude Code in a folder it was given, on the user's click — see [Claude Code](#claude); a skill in the user's own Claude Code — see [Skills in the user's Claude Code](#own-skills); Echo's background jobs — see [Echo's background jobs](#jobs).

### Microphone  *(0.10.0)*

`"uses": { "microphone": {} }` — Install sheet: “Hears your microphone in its own view: only after you click there, with Echo's recording sign on while it listens, and never while Echo records a call or a memo; it stops when you leave the view. What it hears can go to the addresses it may reach”

#### `ctx.microphone.open(audio) · close() · isOpen()` — needs `microphone`

`open` gives a `MediaStream` (`audio`: getUserMedia's audio constraints, `true` by default; no video).

- It throws, before anything is asked, unless all of these hold:

- the user just clicked or pressed a key;
- the window shows the plugin's own view (its activity or its Knowledge tab);
- Echo records nothing;
- no other plugin has the microphone.

- While it is open the window's top pill reads "<name> hears your microphone" with Stop, and the tray shows the recording sign.
- It stops on Stop, `close()`, leaving the view, the plugin switched off or updated, or a recording starting.
- The host half has no microphone.
- The window refuses the camera.

## Today widgets

A plugin can add widgets to **Today**, Echo's first screen, and to threads' and clients' [dashboards](#dashboards).

- They sit beside Echo's own: Your day, Next meeting, Needs you now, My work.
- The user puts one on Today from **✎ → Add a widget**, or with `echoctl today add plugin:<plugin>:<widget>`
- Then they size it S, M or L, give it one or two rows, and move it like any other.
- The plugin gives only the data: Echo draws it in Today's frame, light or dark.
- One kind, `page`, is drawn by the plugin itself.

![Five plugin widgets on Today: a release status with a Remind owners button, a sprint board drawn by the plugin, a number of open tickets with a progress bar, a bar chart of calls a day, and a list of the last builds with a link](https://echo.onetest.ai/assets/screens/extend/today-widgets.png)

### Declare them in the manifest

Each widget is an entry in `widgets`, up to 24. The install sheet says how many the plugin adds ("Adds 5 widgets you can put on Today"). They go into Add a widget's catalog under the plugin's name.

```
{
  "id": "team-pulse",
  "name": "Team pulse",
  "version": "1.0.0",
  "echo": ">=0.10.0",
  "main": "main.js",
  "client": "client.js",
  "widgets": [
    { "id": "tickets", "label": "Open tickets", "kind": "stat", "sizes": ["S", "M"],
      "about": "tickets waiting on the team" },
    { "id": "calls", "label": "Calls a day", "kind": "chart",
      "sizes": ["M", "L"], "refresh": 600 },
    { "id": "builds", "label": "Last builds", "kind": "table",
      "sizes": ["M", "L"], "heights": [1, 2],
      "params": [{ "key": "branch", "label": "Branch", "type": "choice",
                   "options": ["main", "release"], "default": "main" }] },
    { "id": "board", "label": "Sprint board", "kind": "page", "sizes": ["M", "L"] }
  ]
}
```

- `id` — lowercase letters, digits and dashes, unique in the plugin; on Today it is `plugin:<plugin>:<id>`

- `label, about` — its name on Today (up to 40 characters) and a line in the catalog (up to 120)

- `kind` — `stat`, `stats`, `chart`, `list`, `status`, `card`, `table` or `page` (a page needs a `client`)

- `sizes` — the sizes it takes, of `S`, `M`, `L`; default `["M"]`; a `table` only M and L. S is one column of Today, M two, L three

- `heights` — the rows of Today's grid it may take, of `1` and `2`, with `1`; default `[1]`

- `height` — `hug` (default: as tall as its content) or `fill` (as tall as its row)

- `refresh` — seconds between Echo's asks for its data, 60 at least

- `params` — its settings, up to 6 (see [Settings](#w-params))

### Kinds and their data

The data is plain JSON, up to 64 KB.

- Echo escapes every text, so a title from a ticket or a build log shows as text, never as HTML.
- Text past its limit is cut.
- A `tone` is `good`, `warn` or `bad` (a table cell's and a chart series' also `muted`).
- No widget scrolls inside the page: a table or list draws what its size holds, then "+N more", which shows the rest in place.
- At height 2 every count doubles.

- `stat` — `{ value, unit?, label?, tone?, note?, progress?: { used, of } }`: one number, with a bar when `progress` is given

- `stats` — `{ items: [{ label, value, tone?, trend?, link? }] }`: 2 / 4 / 6 numbers side by side at S / M / L; `trend` numbers drawn as a sparkline

- `chart` — see [Charts](#w-charts)

- `list` — `{ items: [{ title, sub?, link? }], empty? }`: 3 / 5 / 10 rows, and what to say when there are none

- `status` — `{ state: "ok" | "warn" | "bad", title, text? }`: a light and a line

- `card` — `{ title?, text?, link? }`: a short text

- `table` — `{ columns: [{ key, label, kind?, hide? }], rows: [{ id, cells: { <key>: text | number | { text, tone } }, link?, group?, detail? }], groups?, total?, note?, empty? }`: up to 10 columns and 200 rows, 8 rows a row of height.

- A column's `kind` `text`, `number`, `pill`, `date`, or for a scorecard `spark` (a small trend), `heat` (shaded by its share of the column's largest; up to 12 more) and `mix` (a thin 100% bar of parts, with `series`)
- `hide: "M"` leaves a column out at M.

- `page` — any JSON: the plugin's window half draws it (see [A page of its own](#w-page))

A list's or card's `link` goes only to an `echo://` place (a call, a task, a thread)

- A table row's and a `stats` item's also to `https://`.
- `asOf` (an ISO time) in any data shows that time instead of when the plugin answered.
- Data that doesn't fit its kind shows as "Couldn't draw this", with what is wrong.
- Check it from the terminal with `echoctl widget show plugin:<plugin>:<widget>`.

### Charts

`{ type, points, series?, unit?, note?, percent?, center?, headline? }`; values are numbers up to 10^15, all series on one axis and one `unit`.

- `line`, `area` — a line, a filled line: the last 60 points, 1–6 series

- `bar`, `stacked` — upright bars, stacked: the last 24

- `bars`, `stacked-bars` — horizontal bars: the last 4 / 6 / 12 at S / M / L

- `pie`, `donut` — slices of one series: up to 6, the rest folded into Other; `center: { value, label }` in a donut's hole

- `funnel` — the first 8 stages, each with its share of the one before

- `points` — one series `[{ label, value }]`; several `[{ label, values: { <key>: number } }]` with `series: [{ key, label, tone? }]`

- `percent` — shares of 100% on `stacked` and `stacked-bars`

- `headline` — `{ value, label?, change?: { by, than?, good? } }` above the chart: a value and its change with an arrow

### Give the data — the host half

Either Echo asks for it, or the plugin pushes it.

- `ctx.widgets.provide` answers when Echo asks: in the background, while Today shows the last answer at once, and again after `refresh` or when its size or height changes.
- The answer has to come within 5 seconds.
- `ctx.widgets.set` pushes data whenever the plugin has it, and `ctx.widgets.clear` takes it away.
- Work that takes longer, such as asking Claude Code, runs as a job whose result the plugin `set`s when it is done — keep data in the store and answer from it.

```
// main.js
export function apply(ctx) {
  ctx.widgets.provide('tickets', async () => {
    // fetched on a timer
    const open = JSON.parse(ctx.store.read('tickets.json') || '[]').length
    return { value: open, label: 'open tickets', tone: open > 10 ? 'warn' : 'good',
             progress: { used: open, of: 20 } }
  })

  // Pushed when the plugin learns something, e.g. from its own timer
  ctx.every(300, async () => {
    const ci = await readCi()
    ctx.widgets.set('release', {
      state: ci.ok ? 'ok' : 'bad',
      title: ci.ok ? 'main is green' : 'main is red',
    })
  })
}
```

- `ctx.widgets.provide(id, ({ size, height, fits, params }) => data)` — asked in the background; `params` are its settings, `fits` what Echo draws at that size and height (`{rows, items, bars}`): send that many, the most important first, and count the rest yourself

- `ctx.widgets.set(id, data)` — the data now, for every copy of it; Today draws it at its next read

- `ctx.widgets.clear(id)` — nothing to show: the widget takes no place on Today or a dashboard until it has data again

- `ctx.widgets.changed(id?)` — it read something new: Echo asks again, every copy with its own settings, at most once in 10 seconds a widget

Only ids the manifest declares are taken. A widget with `params` gets its data only by `provide`.

### Settings

A widget's `params` become its settings.

- The user opens them with ⚙ on the widget in Today's edit mode.
- Or sets them with `echoctl today set <widget> <key> <value>`.
- For every widget of the page at once, they use Echo's Filters widget (`echoctl today filter`).
- Each one is `{ key, label, type, options?, default? }`.

- `choice` — one of its `options` (1 to 12)

- `bool` — on or off

- `thread` — one of the user's open threads (its id); on a thread's dashboard Echo sets it

- `client` — one of the user's clients (its id); on a client's dashboard Echo sets it

The provider gets them as `params`: the defaults, then what the user set.

- Echo never gives a value the setting doesn't take, and asks again when one changes.
- A filter reaches every widget with a setting of the same key — name a setting people slice by as other widgets name it.

```
ctx.widgets.provide('builds', ({ params, fits }) => {
  const all = lastBuilds(params.branch)
  return {
    columns: [
      { key: 'n', label: 'Build', kind: 'number' },
      { key: 'result', label: 'Result', kind: 'pill' },
    ],
    rows: all.slice(0, fits.rows).map((b) => ({
      id: String(b.n),
      cells: { n: b.n, result: { text: b.result, tone: b.ok ? 'good' : 'bad' } },
    })),
    note: `${all.length} on ${params.branch}`,
  }
})
```

### Links and actions

Any widget's data but a page's may carry `open` and `actions`.

- `open` — where a click on the widget goes: an `echo://` place opens in Echo; an `https://` page opens in the browser on the user's first click, its host in the link's tooltip

- `actions` — up to 3 buttons, `[{ label, command, args }]`: a click runs the host half's `ctx.command(command)` with `args`, then Today reads the plugin's widgets again; the command answers with `ctx.widgets.set`

```
ctx.widgets.set('release', {
  state: 'warn', title: 'Two blockers left', text: 'Acme sign-off due Friday',
  open: 'https://ci.acme.example/release/2.4',
  actions: [{ label: 'Remind owners', command: 'remind', args: { release: '2.4' } }],
})
ctx.command('remind', async ({ release }) => { /* … */ return true })
```

### A page of its own — the client half

For what the other kinds can't show, a `page` widget is drawn by the plugin's window half, inside Echo's frame. The draw gets the data its host half gave, the widget's size, height, what fits, and the theme, and returns HTML.

```
// client.js
export function apply(ctx) {
  ctx.ui.style(`.tp-board{display:flex;gap:10px}
    .tp-board div{flex:1;border:1px solid var(--line);border-radius:8px;
      text-align:center}`)
  ctx.widgets.draw('board', ({ data, size, height, fits, theme }) =>
    `<div class="tp-board">${data.cols.map((c) =>
      `<div><b>${ctx.ui.esc(String(c.count))}</b>${ctx.ui.esc(c.name)}</div>`
    ).join('')}</div>`)
}
```

Draw from `data` only: the same data must give the same HTML.

- Escape every text with `ctx.ui.esc`.
- Here the plugin, not Echo, is drawing.
- Don't keep state in the page and don't call `ctx.render()` from a draw: Today draws it again when its data or size changes.
- Use Echo's CSS tokens and it looks right in light and dark.

### Waiting and failing

Today never jumps because a plugin is slow, and never hides why a widget is empty.

- Not answered yet — its place on Today is held, at its size, with a placeholder (`aria-busy`); Today reads again within seconds and the answer fills that place

- Its first ask failed — its frame stays with one line: "Couldn't get its data — <why>", e.g. "didn't answer within 5 s"

- A later ask failed — its last data stays, dated

- Data it can't draw — "Couldn't draw this — <what is wrong>"

- Nothing to show — (no data, or `clear`) it takes no place until it has some

`echoctl widget list` shows every widget Echo and its plugins offer; `echoctl widget show <id>` shows one's data, when it was given and the last error.

## Dashboards

A thread's dashboard (its Brief) and a client's (its Overview) are pages of widgets.

- A plugin may offer ready-made ones in its manifest's `dashboards`, up to 6: each is offered in the "+" beside a thread's or a client's dashboards, under From plugins, and in `echoctl dashboard presets`.
- The user adds one (`echoctl dashboard add-preset <plugin> <id>`), once; Echo never adds one itself.
- The install sheet only says so — "Offers dashboards: Staffing (clients)" — it is not a permission.

```
"dashboards": [
  { "id": "staffing", "kind": "client", "name": "Staffing",
    "about": "Who works where, and what is open",
    "items": [
      { "widget": "bench", "size": "L", "row": true },
      { "widget": "open-roles", "size": "M", "params": { "only_open": true } }
    ] }
]
```

- `id, name, about` — a–z 0–9 `-`, unique in the plugin; the dashboard's name (1–40; "Staffing 2" when the user has one already); a tooltip (160)

- `kind` — `thread` or `client`

- `for` — a thread's only: the stage groups it shows on — `pursuit`, `delivery`, `closed`; none: every thread

- `items` — 1–24 widgets, each once: its own by id, or `plugin:<id>:<widget>` of a plugin of its marketplace; `size`, `height`, `params` ones the widget takes; `row: true` starts a row

A dashboard offers only widgets with a setting of its kind — `thread` or `client` — and the page sets it, never `params`.

- When a new version of the plugin changes a dashboard the user added, it says "<plugin> updated this dashboard — Update / Keep mine".
- With its plugin off or removed it stays the user's, with Remove.
- `echoctl dashboard export <id> --thread|--client` prints a dashboard as such a block, for a manifest.

## Work rows

`"uses": { "work": {} }` — Install sheet: “Adds its items to Today → My work and to threads' Work”

A review asked of the user, an issue assigned to them: a plugin's items beside Echo's tasks, never in a thread's ledger.

#### `ctx.work.provide(({ scope, thread }) => rows) · ctx.work.changed()` — needs `work`

`scope` `"me"` (Today → My work) or `"thread"` (that thread's Work tab, `thread` its id)

- Up to 200 rows, one wrong row refusing the answer.
- Echo asks in the background (5 seconds), draws the last answer, and asks again when it is a minute old or after `changed()`.
- A provider that fails keeps its last rows, marked "not updated", for 24 hours.
- `echoctl work show [--thread <id>]` prints them.

**Example**

```
ctx.work.provide(({ scope, thread }) => reviews
  .filter((r) => scope === 'me' || r.thread === thread)
  .map((r) => ({ id: r.id, title: r.title, kind: 'Review', where: r.repo,
                 url: r.url, due: r.due, late: r.late, thread: r.thread })))
```

- `id, title, kind` — required: 1–200, 1–300, 1–30 characters; `id` unique

- `where` — up to 120 characters

- `url` — an `https://` address, opened in the browser on the first click

- `due, late` — `YYYY-MM-DD`; `true` or `false`

- `thread` — a thread id: a "me" row is then also in that thread's Work

Act on a row with a [`task.actions`](#slot-task) button; Echo's own Close and Claude stay off plugin rows.

## Marketplaces

A marketplace is a Git repository or a folder with `echo-marketplace.json` at its root.

- Users add it in Settings → Plugins → Marketplaces as `owner/repo`, `owner/repo@ref`, a Git URL (`…#ref`) or a folder on their computer.
- Echo's own, [onetest-ai/echo-plugins](https://github.com/onetest-ai/echo-plugins), is built in.

```
{
  "name": "acme",
  "owner": "acme-example",
  "featured": ["standup"],
  "plugins": [
    { "id": "standup", "source": "./plugins/standup", "categories": ["automation"] },
    { "id": "board",
      "source": { "github": "acme-example/board", "ref": "v2", "path": "plugin" } }
  ]
}
```

- A plugin's `source` is a folder in the same repository, or another GitHub repository at a ref and path. Its manifest's `id` equals the entry's.
- Echo checks every tree it fetches: plain files only, no links; at most 5,000 files and 64 MB a marketplace, 400 files and 20 MB a plugin.
- It reads a marketplace again after 30 minutes and right after Echo updates. A folder is read where it is — while you write a plugin, Read again shows each edit. `echoctl plugin install ./folder` copies a folder into My plugins first.
- An update is offered when `version` changes.
- The marketplace's `name` is the namespace its plugins [share values](#threads) under; an `agent.prefix` belongs to one marketplace too (`echo` is reserved).

## Check and test

- `echoctl plugin check <folder>` runs an install's checks — manifest, `uses`, widgets, dashboards, skills, scripts, `agent/` — and exits 0, or names each problem by file (`--json`). It needs no data folder, nothing installed and no network. Run it until it passes before you install or publish.
- `echoctl plugin call <id> <command> '<json>'` runs a command; `echoctl widget show` and `echoctl work show` print what Echo gets.
- Test against made-up services, never the real ones. In a development build of Echo, `ECHOCTL_TEST_HOSTS="api.example.com=http://127.0.0.1:8080"` sends `ctx.http.fetch` to a host the manifest names to your local fake; made-up `gh` / `git` first on `PATH` answer `ctx.signin.get`.
- In a debug build, `ECHOCTL_PICK_FOLDER=<dir>` answers the folder picker —  *(0.10.0)* `ECHOCTL_PICK_FILES=<path>:<path>` the file picker and `ECHOCTL_ASK_ADDRESS=<address>` the address box — and `echoctl plugin emit <event> '<json>'` queues an event for the plugins that hear it.
-  *(0.10.0)* In a development build, `ECHOCTL_TEST_GRAPH=http://127.0.0.1:<port>` (or `http://localhost:<port>`) is a fake Microsoft 365. Echo counts as signed in, with a made-up token, and sends every Graph request of `ctx.m365` to that address. It refuses the real sign-in; a value that isn't a local address is no sign-in at all; a release build never reads it. Serve made-up (`acme.example`) mail and a chat from it for `search`, `mailThread` and `chat`.
-  *(0.10.0)* On test data, `ctx.claude.installSkill` writes only into the folder `CLAUDE_CONFIG_DIR` names (refused when it isn't set), and `ctx.system.reveal` opens nothing: it is logged.
- Use made-up data in tests, fixtures and screenshots (`acme.example`) — never a real call, mail or person.

## Security model

What a plugin can and can't do, and who decides.

- **Installing is trusting.** A plugin runs its own code with the user's rights

- The install sheet says so first, names who listed it, and lists in Echo's words — never the plugin's — everything its manifest asks for: each capability, its routines, its scripts, its part for Claude, its dashboards and widgets.
- An update that asks for more, adds a script or changes a routine's prompt asks again.

- **Its code reaches Echo through `ctx`.** The host half runs in a sandbox with nothing else.

- The window half runs in Echo's own page, beside every other plugin, and can do there what the user can: what a plugin may do through its manifest, `ctx` and the command line holds for its services, not against its own page code or the programs its scripts run.

- **Files.** Its own store, and the folders the user picked for it — read-only unless the sheet says it may change them

- Never through a link, never Echo's own files in its store.
- A file the user hands it comes as a handle, never a path.
- Hidden files only by the short list under [Hidden files it may write](#hidden).

- **Network.** HTTPS to the hosts its manifest names

- The addresses the user listed (only the user enters them, plain http with a warning outside their own network)
- One page the user typed, once.
- Certificates the system doesn't trust only by the key the user trusted.
- The window opens only to the addresses the user listed.

- **Claude Code.** Runs only on the user's AI profiles, through Echo, with the permissions the user set — for routines (Auto or Skip), for Claude in the window (Ask, Auto or Skip) — never the plugin's.

- A run in a folder works with that folder's own setup and Echo's fixed tools for its mode: read, edit with `folders.write`, or a copy.
- A plugin's session in a folder opens only on the user's click and is the user's: the plugin can't type into it or read it.

- **Routines** are named on the sheet and stay off until the user switches each on; the plugin can tune but never switch them, and its code never starts them.
- **The user's Claude Code is touched only on a click.** Skills, guides and folders go only to Echo's own sessions. The one exception is `uses.skills`: skills that run nothing, each added on the user's click, never over one that is there, taken out with the plugin.
- **Echo's data.** Only the kinds the sheet names, read-only; a call's words never ride an event. Writes to threads are its own tasks and the stage it set, each in the history with its reason; what the user set stays theirs; a proposal waits for the user's Yes.
- **Microsoft 365** through Echo's sign-in, read-only — a plugin never sends mail or messages as the user. Messages go only to the user and the addresses the user set on a routine.
- **The microphone** opens only on the user's click in the plugin's own view, with Echo's recording sign on, never while Echo records. The camera is refused.
- **The user's choices stay the user's.** Echo's background jobs change only on the user's click in the plugin's screens; a wrapper profile and a dashboard are only offered, added by the user; certificates, listed addresses and permission settings are set by the user alone.
- **Inside a run Echo started** — a minutes run, a thread's sync, a routine, Yolo — no picker or address box opens, no certificate is trusted, no plugin is installed, changed or set up, permissions and jobs aren't changed, and a routine isn't run by hand

- `plugin call --file` is refused in all but a routine.

- **Secrets** are kept apart, readable only by the user, and never reach the window. Removing a plugin deletes its grants, hints and skills, and switches its routines off.

## Command line

```
echoctl plugin list                          # installed, offered, updates
echoctl plugin marketplace add <owner/repo | URL | folder>
echoctl plugin marketplace update            # read them again
echoctl plugin install <id | ./folder> [--yes]   # shows what it uses; --yes agrees
echoctl plugin update <id> [--yes]
echoctl plugin remove <id> [--delete-data]
echoctl plugin enable <id>  |  disable <id>
echoctl plugin set <id> <key> [<value>]     # show or set one of its settings
# run a command; --file hands it a file
echoctl plugin call <id> <command> [json] [--file <path>]…
# run a declared script as Echo runs it
echoctl plugin script <id> <skill> <script> -- [args]
echoctl plugin check <folder>… [--json]       # an install's checks, for authors
echoctl plugin guide                          # the authoring rules and the API reference
echoctl plugin mine                           # My plugins: the folder your own go in

# certificates of the addresses you listed (0.10.0)
echoctl plugin certs <id>                     # trusted, and met and refused
echoctl plugin trust <id> <host:port> [--key sha256//…]
echoctl plugin untrust <id> <host:port>

# Echo's jobs and plugins' routines
# every job, its settings, last run, the night
echoctl jobs [list]
# e.g. every=30 night=off model=sonnet; on=on for a routine
echoctl jobs set <job> key=value…
echoctl jobs runs <job>  |  jobs routines [--runs <job>]
echoctl jobs run <plugin>.<routine>           # run a plugin's routine now (0.10.0)
echoctl jobs outcome <plugin>.<routine> [--run <run>]   # its answer, changes, sends, log

# Claude's permissions (0.10.0)
echoctl config --folder-permissions ask|auto|skip \
  --routine-permissions auto|skip --yolo-permissions auto|skip

# Intake and search (0.10.1; `echoctl brain` is a hidden alias)
echoctl intake status  |  sync  |  search <words>
echoctl intake scopes  |  senders  |  files
echoctl intake set               # the embedding endpoint that re-ranks search
echoctl intake mcp               # search as an MCP server for Claude Code

# widgets, dashboards, work rows, wrapper profiles
echoctl widget list  |  widget show plugin:<id>:<widget>
echoctl dashboard presets --thread|--client
echoctl dashboard add-preset <plugin> <id>  |  preset-update <id> [--keep]
echoctl work show [--thread <id>]
echoctl ai add-wrapper --plugin <id>  |  ai update-wrapper <id>
```

## Examples

 [**Scheduler**Prompts on a schedule, sent to Teams, mail or Telegram: every, claude.run, deliver, inbox, a Settings section.](https://github.com/onetest-ai/echo-plugins/tree/main/plugins/scheduler) [**Telegram**A way Echo sends to you and a channel to Claude: deliver.provide, http, sessions.channel, a secret setting.](https://github.com/onetest-ai/echo-plugins/tree/main/plugins/telegram) [**Obsidian**Vaults for Claude and a vault browser: folders, fs.readMany, sessions.skills, an activity with a graph.](https://github.com/onetest-ai/echo-plugins/tree/main/plugins/obsidian)

Questions and ideas: [GitHub issues](https://github.com/onetest-ai/echo/issues).
