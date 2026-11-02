// For screenshots only (added to the export's index.html, never to Echo): `?click=<css>` clicks
// each element named, in order, once it exists — as the user would — so a shot can open a work item,
// a person or a tab that has no address of its own.
(() => {
  const clicks = new URLSearchParams(location.search).getAll('click')
  const wait = (sel, ms) => new Promise((ok) => {
    const t0 = Date.now()
    const tick = () => { const el = document.querySelector(sel); if (el) return ok(el); if (Date.now() - t0 > ms) return ok(null); setTimeout(tick, 100) }
    tick()
  })
  // `?inject=ask`: the "Claude · this call" panel shows ask.html (a drawn session) in place of its
  // start screen — a static export runs no terminal.
  const inject = new URLSearchParams(location.search).get('inject')
  window.addEventListener('load', async () => {
    if (inject) {
      const btn = await new Promise((ok) => {
        const t0 = Date.now()
        const tick = () => {
          const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Ask Claude about this call' && x.closest('[class*="bottom"], [class*="panel"]'))
          if (b || Date.now() - t0 > 5000) return ok(b)
          setTimeout(tick, 100)
        }
        tick()
      })
      if (btn) {
        const box = btn.parentElement
        box.innerHTML = await (await fetch(`${inject}.html`)).text()
        box.style.cssText += ';padding:0;margin:0;height:100%;flex:1;width:100%;max-width:none;align-self:stretch'
        for (let p = box.parentElement; p && !p.matches('body'); p = p.parentElement) { if (p.offsetHeight > 200) break; p.style.width = '100%' }
      } else console.warn('shot: no Claude panel to fill')
    }
    for (const sel of clicks) {
      const el = await wait(sel, 5000)
      if (el) { el.click(); await new Promise((r) => setTimeout(r, 400)) } else console.warn('shot: not found', sel)
    }
  })
})()
