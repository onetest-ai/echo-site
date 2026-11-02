"""People for the demo: titles, organisations and reporting lines (the directory), and where each
stands in each thread (role, stance, influence, interest). Fiction only."""
import json, os, sys

home = os.path.abspath(sys.argv[1])
proj = os.path.join(home, "projects")

D = {  # email: (name, title, org (client id), group, reports_to email)
    "maya.lindqvist@harborlogistics.example": ("Maya Lindqvist", "VP Operations", "harbor-logistics", "Operations", None),
    "sofia.reyes@harborlogistics.example": ("Sofia Reyes", "Dispatch Manager", "harbor-logistics", "Operations", "maya.lindqvist@harborlogistics.example"),
    "tom.okafor@harborlogistics.example": ("Tom Okafor", "Head of IT", "harbor-logistics", "IT", None),
    "jonas.weber@harborlogistics.example": ("Jonas Weber", "Data Engineer", "harbor-logistics", "IT", "tom.okafor@harborlogistics.example"),
    "hannah.brooks@verdantfoods.example": ("Hannah Brooks", "Chief Procurement Officer", "verdant-foods", "Procurement", None),
    "raj.mehta@verdantfoods.example": ("Raj Mehta", "Supplier Relations Lead", "verdant-foods", "Procurement", "hannah.brooks@verdantfoods.example"),
    "lucas.moreau@verdantfoods.example": ("Lucas Moreau", "CIO", "verdant-foods", "IT", None),
    "priya.nair@northlight.example": ("Priya Nair", "Delivery Lead", "northlight-consulting", "Delivery", None),
    "ben.carter@northlight.example": ("Ben Carter", "Solution Architect", "northlight-consulting", "Delivery", "priya.nair@northlight.example"),
}
AT = "2026-10-28T09:00:00+01:00"
people = []
for email, (name, title, org, group, boss) in D.items():
    fields = {"title": title, "org": org, "group": group}
    if boss:
        fields["reports_to"] = boss
    people.append({"id": email, "name": name, "emails": [email], "fields": fields,
                   "sources": {k: "you" for k in fields}, "history": []})
json.dump(people, open(os.path.join(proj, "people.json"), "w", encoding="utf-8"), indent=2)

# Per thread: email -> (role, stance, influence, interest, governance)
PLACES = {
    "dispatch-platform-rollout": {
        "maya.lindqvist@harborlogistics.example": ("Sponsor", "champion", 3, 3, True),
        "tom.okafor@harborlogistics.example": ("IT owner", "supporter", 3, 2, True),
        "sofia.reyes@harborlogistics.example": ("Key user", "supporter", 2, 3, None),
        "jonas.weber@harborlogistics.example": ("Data owner", "neutral", 1, 2, None),
        "priya.nair@northlight.example": ("Delivery lead", "champion", 2, 3, True),
        "ben.carter@northlight.example": ("Architect", "supporter", 2, 2, None),
    },
    "supplier-portal": {
        "hannah.brooks@verdantfoods.example": ("Buyer", "champion", 3, 3, True),
        # Left open for the people pass to propose (Needs you): Lucas's stance, Raj's interest.
        "lucas.moreau@verdantfoods.example": ("Approver", None, 3, 2, True),
        "raj.mehta@verdantfoods.example": ("Key user", "supporter", 1, None, None),
        "priya.nair@northlight.example": ("Delivery lead", "supporter", 2, 2, None),
        "ben.carter@northlight.example": ("Architect", "neutral", 1, 2, None),
    },
}
ORGS = {
    "dispatch-platform-rollout": [{"client": "harbor-logistics", "role": "Client", "stance": "champion", "influence": 3, "interest": 3}],
    "supplier-portal": [{"client": "verdant-foods", "role": "Prospect", "stance": "supporter", "influence": 3, "interest": 2}],
}
for pid, places in PLACES.items():
    f = os.path.join(proj, pid, "profile.json")
    p = json.load(open(f, encoding="utf-8"))
    p["people"] = []
    for email, (role, stance, infl, inter, gov) in places.items():
        m = {"name": D[email][0], "email": email, "role": role, "role_by": "you", "group": D[email][3]}
        m.update({k: v for k, v in (("stance", stance), ("influence", infl), ("interest", inter)) if v is not None})
        if gov:
            m["governance"] = True
        p["people"].append(m)
    p["orgs"] = ORGS[pid]
    json.dump(p, open(f, "w", encoding="utf-8"), indent=2, ensure_ascii=False)

# Organisations' groups (the org chart's columns).
cf = os.path.join(proj, "clients.json")
clients = json.load(open(cf, encoding="utf-8"))
groups = {"harbor-logistics": ["Operations", "IT"], "verdant-foods": ["Procurement", "IT"], "northlight-consulting": ["Delivery"]}
lst = clients if isinstance(clients, list) else clients.get("clients", [])
for c in lst:
    c["groups"] = groups.get(c["id"], [])
json.dump(clients, open(cf, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print("people placed")
