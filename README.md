# echo-site

The website for [Echo](https://github.com/onetest-ai/echo) by onetest, served by GitHub Pages at <https://echo.onetest.ai>.

Plain static HTML and CSS with a little progressive JavaScript: no build step, no web fonts, no trackers, no external requests.
Colours and type are shared with the Echo window (`crates/echoctl/ui/app.css` in the Echo repo).

- `index.html` + `assets/home.css` + `assets/home.js`: home page
- `privacy/`: privacy policy (the docs layout: `home.css` + `extend.css`, as `extend/` and `install/`)
- `extend/` + `assets/extend.css`: how to write Echo plugins (the home page's look); `extend/index.md` is the same as Markdown (`python3 tools/html2md.py` after an edit), `extend/echo-plugin.d.ts` the types of `ctx`; screenshots in `assets/screens/extend/` (`tools/screens/extend.sh` makes the demo they are shot from)
- `llms.txt`: what's here, for agents
- `install/`: the installation guide (the Echo repo's `docs/install.md`, as a page in the docs layout)
- `windows/`: how the Windows builds are made and checked (not code-signed yet); `code-signing/` forwards there
- `trademark/`: trademark notice
- `assets/site.css`: styles for the remaining policy pages (windows, trademark, code signing)
- `assets/brand/`: the onetest logo, favicon, social preview image
- `assets/screens/`: screenshots of the Echo window (see its README)
- `tools/screens/`: the generator for those screenshots

Preview locally: `python -m http.server` in this folder, then open http://localhost:8000.

## Writing the docs

The plugin guide (`extend/index.html`) and the install guide follow these conventions; keep them when you add to a page.

- A card (`.fn`) opens with one plain sentence: what it is for.
- Then bullets (`<ul class="rules">`), one fact each; no semicolon chains, no paragraph longer than 2-3 lines.
- Name the blocks with a small label (`<p class="lbl">`): Options, Gives, Refused, Limits, Example.
- Options and their meanings go in a `<dl class="gets">`; long shapes go in a list or a code block, not mid-sentence.
- Mark what is not in the released Echo with `<span class="new">after X.Y.Z</span>`.
- Code examples sit in `<pre class="code">`; they wrap, so keep lines short anyway.
- Use made-up data (`acme.example`), never a real call, mail or person.
- After an edit run `python3 tools/html2md.py` (never edit `extend/index.md`), and keep `extend/echo-plugin.d.ts` and `llms.txt` in step.
