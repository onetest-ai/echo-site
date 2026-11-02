"""Build Echo's demo data folder for the site's screenshots (fiction only).

    python make_demo.py <out>     # writes <out>/home (ECHOCTL_HOME) and <out>/config (ECHOCTL_CONFIG_DIR)

Then build_threads.ps1 makes the clients, threads and work ledger through echoctl itself.
"""
import hashlib, json, os, re, shutil, sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from demo_calls import CALLS, ME, P  # noqa: E402

out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "out")
home, config = os.path.join(out, "home"), os.path.join(out, "config")
shutil.rmtree(out, ignore_errors=True)
os.makedirs(os.path.join(home, "calls"))
os.makedirs(os.path.join(home, ".echo"))
os.makedirs(config)


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(data if isinstance(data, str) else json.dumps(data, indent=2, ensure_ascii=False))


def mmss(t):
    t = int(round(t))
    return f"{t // 60:02d}:{t % 60:02d}"


def hhmmss(t):
    t = int(round(t))
    return f"{t // 3600:02d}:{t % 3600 // 60:02d}:{t % 60:02d}"


# The user and their settings.
write(os.path.join(home, ".echo", "config.json"), {
    "model": "large-v3-turbo-q5_0", "languages": ["en"], "me": ME,
    "scheduled": "manual", "unscheduled": "manual", "auto_minutes": False, "project_sync": False,
})
write(os.path.join(home, ".echo", "me.md"), """# About me

Name: Alex Morgan
Role: Engagement lead
Company / team: Northlight Consulting
What I work on now: the Harbor Logistics dispatch rollout; the Verdant Foods supplier portal proposal
People I work with often (name — role): Priya Nair — delivery lead; Ben Carter — solution architect
""")
write(os.path.join(config, "home.json"), {"home": home})
write(os.path.join(config, "ai.json"), {"live_notes": True, "profiles": []})
# Client descriptions (a client page's Overview).
write(os.path.join(home, "projects", "clients", "harbor-logistics.md"), """Regional logistics group: **42 depots** in the Benelux and Germany, about 900 drivers.

- **What we do for them:** replace the dispatch and routing tool before the 2027 holiday peak
- **Who matters:** Maya Lindqvist (VP Operations) sponsors it; Tom Okafor owns IT and access
- **How they work:** weekly steering on Tuesdays; decisions by Maya, in the room
""")
write(os.path.join(home, "projects", "clients", "verdant-foods.md"), """Food producer, ~1,200 active suppliers (packaging, fresh produce, ingredients).

- **Opportunity:** a supplier portal for onboarding and certificates; SAP Ariba stays the master
- **Who matters:** Hannah Brooks (CPO) wants it; Lucas Moreau (CIO) has to approve it
""")

for c in CALLS:
    folder = os.path.join(home, "calls", f"{c['stamp']}-{c['slug']}")
    # The times as wall-clock times on this computer (the window shows them in its own time zone).
    start = datetime.fromisoformat(c["start"][:19]).astimezone()
    end = datetime.fromisoformat(c["end"][:19]).astimezone()
    c["start"], c["end"] = start.isoformat(), end.isoformat()
    # Turn times: from the words' length, small pauses; the call spread over its real duration.
    raw, t = [], 6.0
    for turn in c["turns"]:
        who, text = turn[0], turn[1]
        dur = 0.6 + 0.36 * len(text.split())
        raw.append([who, text, turn[2] if len(turn) > 2 else None, t, t + dur])
        t += dur + 1.1
    scale = max(1.0, ((end - start).total_seconds() - 60) / t)
    labels, segs = {}, []
    remote_ids = {}
    for who, text, label, a, b in raw:
        a, b = a * scale, a * scale + (b - a)
        if label:
            labels[label] = a
        seg = {"speaker": "me" if who == "me" else "remote", "start": round(a, 2), "end": round(b, 2), "lang": "en", "text": text}
        if who != "me":
            seg["name"] = who
            seg["speaker_id"] = remote_ids.setdefault(who, len(remote_ids) + 1)
        segs.append(seg)
    write(os.path.join(folder, "segments.json"), segs)

    md = [f"# {c['title']}", "", f"- **Recorded:** {c['start']}", f"- **Duration (speech):** {hhmmss(segs[-1]['end'])}",
          "- **Model:** large-v3-turbo-q5_0", f"- **Folder:** `{c['stamp']}`", ""]
    for s in segs:
        md += [f"**{s.get('name', 'Me')}** [{hhmmss(s['start'])}] _en_", s["text"], ""]
    write(os.path.join(folder, "transcript.md"), "\n".join(md))

    write(os.path.join(folder, "meta.json"), {
        "app": "teams", "audio": "deleted after transcription", "platform": "windows",
        "started_at": c["start"], "ended_at": c["end"], "stop_reason": "call_ended",
        "title": c["title"], "languages": ["en"], "ai_profile": "system",
    })
    org = c["organizer"]
    # Graph lists the organizer apart from the attendees.
    people = [{"name": n, "email": P[n]} for n in c["people"] if n != org]
    write(os.path.join(folder, "meeting.json"), {
        "id": "evt-" + c["stamp"], "subject": c["title"], **({"series_id": c["series"]} if c["series"] else {}),
        "start": c["start"], "end": c["end"],
        "organizer": {"name": org, "email": P[org]},
        "attendees": [{"name": ME["name"], "email": ME["email"]}] + people,
        "join_url": None, "vocabulary": [], "source": "msgraph",
    })
    write(os.path.join(folder, "chat.json"), [{"t": float(t0), "from": who, "text": text, "files": []} for t0, who, text in c.get("chat", [])])

    minutes = re.sub(r"\{([a-z0-9-]+)\}", lambda m: f"[{mmss(labels[m.group(1)])}]", c["minutes"])
    write(os.path.join(folder, "notes.md"), minutes)
    actions = [{"id": hashlib.sha1(f"{c['stamp']}{i}".encode()).hexdigest()[:8], "task": task, "owner": owner, "due": due,
                "confidence": "high", "t": round(labels[label], 1), "status": "todo"}
               for i, (task, owner, due, label) in enumerate(c["actions"])]
    if c["stamp"].startswith("2026-10-20"):
        actions[2]["status"] = "done"  # the training was booked (and held)
        actions[1]["status"] = "done"
    write(os.path.join(folder, "actions.json"), actions)
    finished = end + timedelta(minutes=16)
    write(os.path.join(folder, "notes-run.json"), {
        "state": "done", "model": "sonnet", "started_at": (end + timedelta(minutes=15)).isoformat(),
        "finished_at": finished.isoformat(), "message": None,
        "minutes": {"model": "sonnet", "at": finished.isoformat(), "sha256": hashlib.sha256(minutes.encode()).hexdigest()},
    })

    if c.get("my_notes"):
        lines = []
        for label, mark, text in c["my_notes"]:
            at = mmss(labels[label] + 4)
            lines.append(f"- [ ] [{at}] {text}" if mark.startswith("- [ ]") else f"- [{at}] {mark}{text}")
        write(os.path.join(folder, "my-notes.md"), "\n".join(lines) + "\n")

    if c.get("live"):
        write(os.path.join(folder, "live.jsonl"), "".join(json.dumps(s) + "\n" for s in segs))
        L = lambda k: round(labels[k], 1)  # noqa: E731
        write(os.path.join(folder, "live-notes.json"), {
            "profile": "system", "model": "haiku", "updated_at": end.isoformat(), "cursor": len(segs),
            "covered_until": segs[-1]["end"], "gaps": [],
            "now": "Agreeing the cutover: Sunday evening, paper runsheets as fallback; Antwerp geocoding at ~80%.",
            "decisions": [{"text": "Cutover on Sunday 16 Nov in the evening", "t": L("cutover")},
                          {"text": "Paper runsheets as fallback for the first week", "t": L("paper")}],
            "actions": [{"owner": "Sofia Reyes", "task": "Brief the night shift lead before the go/no-go", "t": L("brief")},
                        {"owner": "Priya Nair", "task": "Update the cutover plan and send it round tonight", "t": L("plan")}],
            "questions": [{"text": "Is 80% geocoded enough to say go for Antwerp?", "t": L("geo-80")}],
        })
        write(os.path.join(folder, "live-usage.json"), {"jobs": 14, "input_tokens": 31200, "cache_read_tokens": 18400,
                                                       "cache_write_tokens": 2100, "output_tokens": 6900, "cost_usd": 0.06})
    print(folder)
print(out)
