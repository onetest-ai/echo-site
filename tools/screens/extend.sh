#!/bin/bash
# Demo for the /extend/ screenshots (assets/screens/extend/), fiction only: the site's demo calls, threads and
# ledger, one meeting later today, and a demo plugin that shows up everywhere a plugin can (its buttons in the three
# slots, a panel, a Settings page, a palette action, an activity with a graph, an Inbox item). Never touches the real
# data folder: ECHOCTL_HOME / ECHOCTL_CONFIG_DIR point into out-extend/.
#   ECHOCTL=<path to echoctl> ./extend.sh   → out-extend/out/export, then serve it and shoot each place.
# The Inbox in the export also lists this computer's own Claude Code plugin state: drop the "health" and "update"
# items from export/api/attention before shooting.
set -e
S=$(cd "$(dirname "$0")" && pwd)/out-extend; mkdir -p $S
SITE=$(cd "$(dirname "$0")" && pwd)
e=${ECHOCTL:?set ECHOCTL to an echoctl binary}
out=$S/out
python3 -I $SITE/make_demo.py $out >/dev/null
export ECHOCTL_HOME=$out/home ECHOCTL_CONFIG_DIR=$out/config
$e client add "Northlight Consulting" --domains northlight.example --internal >/dev/null
$e client add "Harbor Logistics" --domains harborlogistics.example >/dev/null
$e client add "Verdant Foods" --domains verdantfoods.example >/dev/null
$e project create "Dispatch platform rollout" --client harbor-logistics --stage active >/dev/null
$e project create "Supplier portal" --client verdant-foods --stage proposal >/dev/null
for id in dispatch-platform-rollout supplier-portal; do
  $e project rule $id --people >/dev/null
  $e project set $id --since 2026-10-01 --brief $SITE/brief-$id.md >/dev/null
done
$e project exclude supplier-portal 2026-10-30_160012-pilot-readiness-check >/dev/null
$e project ledger dispatch-platform-rollout sync >/dev/null
$e project ledger supplier-portal sync >/dev/null
while read p ev f; do
  $e project ledger $p apply --evidence $ev --proposals $SITE/ledger/$f.json >/dev/null
  $e project ledger $p done --evidence $ev >/dev/null
done <<L
dispatch-platform-rollout 2026-10-20_100212 harbor-1
dispatch-platform-rollout 2026-10-22_143005 harbor-2
dispatch-platform-rollout 2026-10-27_100140 harbor-3
dispatch-platform-rollout 2026-10-30_160012 harbor-4
supplier-portal 2026-10-21_110305 verdant-1
supplier-portal 2026-10-29_150120 verdant-2
L
# One meeting later today (the calendar without a Microsoft 365 sign-in shows today's agenda).
python3 -I - "$out/home/.echo/agenda.json" <<'PY'
import json,sys,datetime as d
now=d.datetime.now().astimezone()
s=(now+d.timedelta(minutes=50)).replace(second=0,microsecond=0); t=s+d.timedelta(minutes=45)
json.dump([{"id":"demo-weekly","subject":"Harbor · Weekly steering","start":s.isoformat(),"end":t.isoformat(),
  "organizer":{"name":"Maya Lindqvist","email":"maya.lindqvist@harborlogistics.example"},
  "attendees":[{"name":"Maya Lindqvist","email":"maya.lindqvist@harborlogistics.example"},{"name":"Tom Okafor","email":"tom.okafor@harborlogistics.example"},{"name":"Alex Morgan","email":"alex.morgan@northlight.example"}],
  "join_url":"https://teams.microsoft.com/l/meetup-join/demo"}],open(sys.argv[1],"w"))
PY
# The demo plugin: a button in each slot, from a local marketplace.
m=$S/market; rm -rf $m; mkdir -p $m/plugins/slots-demo
cat > $m/echo-marketplace.json <<J
{ "name": "demo", "owner": "demo", "plugins": [ { "id": "slots-demo", "source": "./plugins/slots-demo" } ] }
J
cat > $m/plugins/slots-demo/echo-plugin.json <<J
{ "id": "slots-demo", "name": "Slots demo", "version": "0.1.0", "summary": "A button in every slot", "uses": {}, "client": "client.js" }
J
cat > $m/plugins/slots-demo/client.js <<'J'
const STAR = (n = 14) => `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>`
export function apply(ctx) {
  ctx.ui.style('.sd-ic{display:inline-flex;margin-right:6px;vertical-align:-2px}')
  for (const slot of ['calendar.event', 'call.menu', 'task.actions']) ctx.slots.add(slot, { label: 'Your button', icon: `<span class="sd-ic">${STAR()}</span>`, run: () => {} })
  ctx.settings.section({ id: 'main', label: 'Your section', icon: STAR(16), badge: () => 3,
    render: () => '<h2>Your section</h2><p class="set-lead">A plugin\'s own page in Settings, under From plugins: its options, its lists, anything it draws.</p>' })
  ctx.panels.add({ id: 'panel', label: 'Your panel', icon: STAR(16), area: 'right', when: () => true,
    render: () => '<div style="padding:14px 16px"><h3 style="margin:0 0 6px">Your panel</h3><p class="set-sub">A view beside whatever is open: the right or the bottom panel, moved and closed like Echo\'s own.</p></div>' })
  ctx.palette.add({ label: 'Your action', group: 'Slots demo', keywords: 'demo', run: () => {} })
  ctx.activities.add({ id: 'graph', label: 'Yours', icon: STAR(20),
    render: () => '<div style="padding:22px 28px;height:100%;display:flex;flex-direction:column;gap:8px;box-sizing:border-box"><h2 style="margin:0">Your activity</h2><p class="set-sub" style="margin:0">A page of its own in the bar on the left — here drawing Echo\'s graph.</p><div id="sd-g" style="flex:1;min-height:460px"></div></div>',
    after() {
      const st = ctx.ui.graph.draw(document.getElementById('sd-g'), 'sd', () => {
        const G = ctx.ui.newGraph()
        const names = ['Dispatch platform', 'SSO', 'Training', 'ERP export', 'Depot data', 'Pilot', 'Go/no-go', 'Supplier portal', 'Pricing', 'Onboarding']
        names.forEach((n, i) => G.addNode(n, { x: Math.cos(i * 0.63) * (i % 3 + 2) * 160, y: Math.sin(i * 0.63) * (i % 3 + 2) * 160, size: i < 2 ? 1.4 : 0.9, color: i < 7 ? '#9b78ff' : '#0b72a0', label: n, pinLabel: true }))
        for (const [a, b] of [[0, 1], [0, 2], [0, 3], [0, 5], [3, 4], [5, 6], [1, 5], [2, 5], [7, 8], [7, 9], [8, 9], [6, 7]]) G.addEdge(names[a], names[b], { size: 1, color: '#8a8a9566' })
        return G
      })
      if (st && !st.zoomed) { st.zoomed = true; st.sigma.getCamera().setState({ ratio: 1.15 }) }
    } })
}
J
mkdir -p $out/home/.echo/plugins/slots-demo
cat > $out/home/.echo/plugins/slots-demo/inbox.json <<J
{ "demo": { "title": "Your Inbox item", "why": "Something only the user can decide — with buttons that run the plugin's commands", "actions": [ { "label": "Do it", "command": "do", "primary": true }, { "label": "Not now", "command": "later" } ] } }
J
$e plugin marketplace add $m --name demo >/dev/null
$e plugin install slots-demo --from demo --yes >/dev/null
rm -rf $out/export; $e window --export $out/export >/dev/null
echo $out
