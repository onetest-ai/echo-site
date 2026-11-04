# echo-site

The website for [Echo](https://github.com/onetest-ai/echo) by onetest, served by GitHub Pages at <https://echo.onetest.ai>.

Plain static HTML and CSS with a little progressive JavaScript: no build step, no web fonts, no trackers, no external requests.
Colours and type are shared with the Echo window (`crates/echoctl/ui/app.css` in the Echo repo).

- `index.html` + `assets/home.css` + `assets/home.js`: home page
- `privacy/`: privacy policy
- `extend/` + `assets/extend.css`: how to write Echo plugins (the home page's look); `extend/index.md` is the same as Markdown (`python3 tools/html2md.py` after an edit), `extend/echo-plugin.d.ts` the types of `ctx`; screenshots in `assets/screens/extend/` (`tools/screens/extend.sh` makes the demo they are shot from)
- `llms.txt`: what's here, for agents
- `install/`: the installation guide (the Echo repo's `docs/install.md`, as a page)
- `windows/`: how the Windows builds are made and checked (not code-signed yet); `code-signing/` forwards there
- `trademark/`: trademark notice
- `assets/site.css`: styles for the policy pages
- `assets/brand/`: the onetest logo, favicon, social preview image
- `assets/screens/`: screenshots of the Echo window (see its README)
- `tools/screens/`: the generator for those screenshots

Preview locally: `python -m http.server` in this folder, then open http://localhost:8000.
