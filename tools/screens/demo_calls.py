"""Made-up calls for the site's screenshots: two fictional clients, six calls.

Everything here is fiction (people, companies, .example domains). Each call is a list of turns
(speaker, text[, label]); times come from the words' length, and the minutes refer to turns by
label: {label} becomes [mm:ss].
"""

ME = {"name": "Alex Morgan", "email": "alex.morgan@northlight.example"}
P = {  # people: name -> email
    "Priya Nair": "priya.nair@northlight.example",
    "Ben Carter": "ben.carter@northlight.example",
    "Maya Lindqvist": "maya.lindqvist@harborlogistics.example",
    "Tom Okafor": "tom.okafor@harborlogistics.example",
    "Sofia Reyes": "sofia.reyes@harborlogistics.example",
    "Jonas Weber": "jonas.weber@harborlogistics.example",
    "Hannah Brooks": "hannah.brooks@verdantfoods.example",
    "Raj Mehta": "raj.mehta@verdantfoods.example",
    "Lucas Moreau": "lucas.moreau@verdantfoods.example",
}

CALLS = [
    # ── Harbor Logistics: dispatch platform rollout ─────────────────────────────────────────
    {
        "stamp": "2026-10-20_100212", "slug": "harbor-weekly-steering",
        "title": "Harbor · Weekly steering", "series": "harbor-steering",
        "start": "2026-10-20T10:00:00+02:00", "end": "2026-10-20T10:40:00+02:00",
        "organizer": "Maya Lindqvist", "people": ["Maya Lindqvist", "Tom Okafor", "Sofia Reyes", "Priya Nair"],
        "chat": [
            (95, "Priya Nair", "Pilot plan v3 is in the project folder: Dispatch-Pilot-Plan-v3.pptx"),
            (1490, "Tom Okafor", "SSO test tenant request is logged as CHG-4471"),
        ],
        "turns": [
            ("me", "Morning everyone. Let's start with where the pilot stands, then data, then the open points from last week."),
            ("Maya Lindqvist", "Sounds good. Before we start, I've had the board asking about the holiday peak again, so I'd like a clear answer on dates today."),
            ("Priya Nair", "So the plan is still the two depots for the pilot, Rotterdam and Antwerp, going live on the seventeenth of November.", "pilot"),
            ("Maya Lindqvist", "Two depots, not four?"),
            ("Priya Nair", "Two. Rotterdam has the cleanest data and Antwerp has the night shift, so between them we test both patterns."),
            ("Maya Lindqvist", "Fine. Let's lock that: we pilot with Rotterdam and Antwerp, and the other depots follow after the peak.", "decide-pilot"),
            ("me", "Agreed, I'll put it in the plan as a decision. The real risk is the depot master data."),
            ("Tom Okafor", "Yes. The depot list lives in three places today, the ERP, the old routing tool and a spreadsheet the dispatchers keep, and they don't agree.", "data-risk"),
            ("me", "How far apart are they?"),
            ("Tom Okafor", "Jonas thinks around fifteen percent of the depot records are duplicates or have the wrong opening hours."),
            ("me", "Then let's run a working session with Jonas and Ben this week and pick one source of truth before anything is imported.", "session"),
            ("Tom Okafor", "Thursday works for Jonas. I'll send the invite."),
            ("Sofia Reyes", "From the dispatch side, my question is training. The Rotterdam dispatchers need at least one hands-on session before go-live, ideally two."),
            ("Priya Nair", "We can run the first Rotterdam training session next Monday, the twenty-sixth, on the test environment.", "training"),
            ("Sofia Reyes", "Monday is fine if it's before nine, before the morning wave starts."),
            ("Priya Nair", "Eight o'clock then. I'll book it."),
            ("me", "What about single sign-on? Last week that was the blocker for the test environment."),
            ("Tom Okafor", "The SSO test tenant is requested. My team needs about two weeks for production, so we're looking at early November for SSO in production.", "sso"),
            ("me", "So the pilot depends on SSO in production being ready before the seventeenth. That's tight but workable."),
            ("Maya Lindqvist", "Tom, can you commit to production SSO by the fifth of November?"),
            ("Tom Okafor", "The fifth is realistic if security signs off the change on time. I'll chase them."),
            ("Sofia Reyes", "One more open point: who signs off the new driver-shift rules? Operations or HR? Nobody has told me.", "shift-q"),
            ("Maya Lindqvist", "Good question. I don't know either. Let me check with HR and come back next week."),
            ("me", "I'll keep that as an open question. Anything else for today?"),
            ("Maya Lindqvist", "Just the dates. If the pilot slips past the seventeenth, I need to know two weeks ahead, not two days."),
            ("me", "Understood. I'll send a one-page status every Friday so there are no surprises.", "status"),
        ],
        "minutes": """# Harbor · Weekly steering

> **Date:** Tuesday, 20 October 2026 · 40 min
> **Attendees:** Maya Lindqvist (Harbor Logistics), Tom Okafor (Harbor Logistics), Sofia Reyes (Harbor Logistics), Priya Nair, Alex Morgan

## Summary
The dispatch pilot stays on track for **17 November** with two depots, Rotterdam and Antwerp {pilot}. The main risk is depot master data, which lives in three systems that disagree {data-risk}; a working session this week will pick one source of truth {session}. Production SSO is the critical dependency for the pilot {sso}.

## Decisions
- Pilot with **Rotterdam and Antwerp**; the other depots follow after the holiday peak {decide-pilot}

## Progress
- **Pilot plan:** two depots chosen to cover the day and night shift patterns {pilot}
- **SSO:** test tenant requested; production expected early November {sso}
- **Training:** first Rotterdam session set for Monday 26 October, 08:00 {training}

## Blockers & risks
- **Depot master data**: ~15% duplicates or wrong opening hours across the ERP, the old routing tool and the dispatchers' sheet {data-risk}. Unblock: the data working session (Jonas, Ben).
- **Production SSO** by 5 November depends on security signing off the change {sso}.

## Open questions
- Who signs off the new driver-shift rules: Operations or HR? {shift-q}

## Action items
- [ ] Tom — send the invite for the data working session with Jonas and Ben (Thursday)
- [ ] Tom — production SSO by 5 November; chase the security sign-off
- [ ] Priya — book the Rotterdam training session, Mon 26 Oct 08:00
- [ ] Maya — check with HR who signs off the shift rules
- [ ] Me — one-page status to Maya every Friday {status}
""",
        "actions": [
            ("Send the invite for the data working session with Jonas and Ben", "Tom Okafor", "Thursday", "session"),
            ("Get production SSO live; chase the security sign-off", "Tom Okafor", "5 November", "sso"),
            ("Book the first Rotterdam training session", "Priya Nair", "Mon 26 Oct, 08:00", "training"),
            ("Check with HR who signs off the driver-shift rules", "Maya Lindqvist", "next week", "shift-q"),
            ("Send Maya a one-page status every Friday", "Me", "every Friday", "status"),
        ],
    },
    {
        "stamp": "2026-10-22_143005", "slug": "depot-data-working-session",
        "title": "Depot data — working session", "series": None,
        "start": "2026-10-22T14:30:00+02:00", "end": "2026-10-22T15:05:00+02:00",
        "organizer": "Tom Okafor", "people": ["Tom Okafor", "Jonas Weber", "Ben Carter"],
        "chat": [(640, "Jonas Weber", "Duplicate report: 212 of 1,460 depot records (14.5%)")],
        "turns": [
            ("Tom Okafor", "Thanks for making time. Jonas, can you show what you found?"),
            ("Jonas Weber", "Sure. I matched the three depot lists. Out of fourteen hundred and sixty records, two hundred and twelve are duplicates or conflict on opening hours.", "dupes"),
            ("me", "That's the fifteen percent. Which source is closest to reality?"),
            ("Jonas Weber", "The ERP. Finance keeps it current because invoicing depends on it. The routing tool hasn't been updated since the spring."),
            ("Ben Carter", "Then I'd propose the ERP is the source of truth, and we import only from the ERP. The dispatchers' sheet becomes a correction list, nothing more.", "sot"),
            ("Tom Okafor", "I agree. Let's decide that: the ERP is the master for depot data, full stop.", "decide-sot"),
            ("me", "Good. Jonas, when can you get us a clean export from the ERP?"),
            ("Jonas Weber", "I can have a clean export with the corrections merged by the twenty-eighth of October.", "export"),
            ("Ben Carter", "And I'll build the import mapping in the meantime, so we can load it the same day."),
            ("me", "Ben, please make the mapping handle the opening-hours format, the ERP uses a different one."),
            ("Ben Carter", "Noted. I'll write the mapping and a validation report for the import.", "mapping"),
            ("Jonas Weber", "One more problem: most Antwerp addresses have no geocodes. The routing engine can't plan routes without them.", "geo"),
            ("me", "How many?"),
            ("Jonas Weber", "About three hundred delivery addresses. We could geocode them in bulk, but someone has to check the industrial park ones by hand."),
            ("Tom Okafor", "That's a risk for Antwerp. If the geocodes aren't fixed, Antwerp can't go live on the seventeenth.", "geo-risk"),
            ("me", "Let's record it as a risk and work on it now. Jonas, can you run the bulk geocoding this week?"),
            ("Jonas Weber", "Yes, I'll run the bulk geocoding and send Sofia's team the list of addresses to check by hand.", "geocode"),
            ("me", "Great. Then the import depends on your export, and Antwerp depends on the geocodes. I'll put both in the plan."),
        ],
        "minutes": """# Depot data — working session

> **Date:** Thursday, 22 October 2026 · 35 min
> **Attendees:** Tom Okafor (Harbor Logistics), Jonas Weber (Harbor Logistics), Ben Carter, Alex Morgan

## Summary
Jonas matched the three depot lists: 212 of 1,460 records are duplicates or conflict on opening hours {dupes}. The ERP becomes the single source of truth for depot data {decide-sot}. Antwerp's delivery addresses mostly lack geocodes, which puts Antwerp's go-live at risk {geo-risk}.

## Decisions
- **The ERP is the master for depot data**; the dispatchers' sheet is only a correction list {sot} {decide-sot}

## Blockers & risks
- **Antwerp geocodes:** ~300 addresses without geocodes; without them Antwerp can't go live on 17 November {geo-risk}

## Action items
- [ ] Jonas — clean ERP export with corrections merged (28 October) {export}
- [ ] Ben — import mapping and validation report, incl. the opening-hours format {mapping}
- [ ] Jonas — bulk geocoding this week; list of addresses to check by hand to Sofia's team {geocode}
""",
        "actions": [
            ("Clean ERP export of depot data with corrections merged", "Jonas Weber", "28 October", "export"),
            ("Build the import mapping and a validation report", "Ben Carter", None, "mapping"),
            ("Bulk-geocode Antwerp addresses; send the manual-check list to Sofia's team", "Jonas Weber", "this week", "geocode"),
        ],
    },
    {
        "stamp": "2026-10-27_100140", "slug": "harbor-weekly-steering",
        "title": "Harbor · Weekly steering", "series": "harbor-steering",
        "start": "2026-10-27T10:00:00+01:00", "end": "2026-10-27T10:45:00+01:00",
        "organizer": "Maya Lindqvist", "people": ["Maya Lindqvist", "Tom Okafor", "Sofia Reyes", "Priya Nair"],
        "chat": [
            (310, "Sofia Reyes", "Training feedback form: 9 of 11 dispatchers rated it useful"),
            (2210, "Maya Lindqvist", "Board demo is on the 20th at 14:00, I'll send the invite"),
        ],
        "turns": [
            ("me", "Let's go through the plan. First, Sofia, how was the training session yesterday?"),
            ("Sofia Reyes", "It went well. All eleven Rotterdam dispatchers came to the training session yesterday, and most of them planned a full route on their own by the end.", "trained"),
            ("Priya Nair", "We saw two problems: the night-shift view is missing a filter, and the print layout of the runsheet is too small."),
            ("Sofia Reyes", "The night shift wasn't in the room, though. They need their own session, the night team works very differently.", "night"),
            ("Priya Nair", "Then we'll add a night-shift session for Antwerp before go-live."),
            ("me", "Tom, SSO?"),
            ("Tom Okafor", "Security signed off the change on Friday. The test tenant works, and production SSO is scheduled for the fifth of November as planned.", "sso-ok"),
            ("me", "Great news. And the depot data?"),
            ("Tom Okafor", "That one slipped. Jonas found more conflicts in the opening hours, so the clean export moves from the twenty-eighth to the thirtieth.", "slip"),
            ("me", "Two days is fine as long as Ben's import is ready the same day. I'll check with Ben."),
            ("Maya Lindqvist", "On the shift rules question from last week: I talked to HR. HR signs off the driver-shift rules, and Sofia's team proposes them.", "answer"),
            ("Sofia Reyes", "Good, then I'll draft the night-shift rules with HR this week."),
            ("me", "Thanks, Maya, I'll close that question. Now the go/no-go."),
            ("Maya Lindqvist", "I want a formal go/no-go meeting before the pilot. Let's hold it on the twelfth of November, with the depot managers.", "gonogo"),
            ("me", "Agreed. Go/no-go on the twelfth. Criteria: SSO live, data imported and validated, both depots trained, fallback ready."),
            ("Maya Lindqvist", "And the board wants a demo. I've told them the twentieth of November, three days after go-live."),
            ("Priya Nair", "That's tight but we can show live data from Rotterdam by then."),
            ("Tom Okafor", "One concern from me: if Antwerp's geocodes aren't done, we should go live with Rotterdam alone rather than delay both.", "fallback"),
            ("Maya Lindqvist", "I can live with that. Rotterdam alone is better than slipping."),
            ("me", "Then let's decide it now: if Antwerp isn't ready by the go/no-go, Rotterdam goes live alone on the seventeenth.", "decide-fallback"),
        ],
        "minutes": """# Harbor · Weekly steering

> **Date:** Tuesday, 27 October 2026 · 45 min
> **Attendees:** Maya Lindqvist (Harbor Logistics), Tom Okafor (Harbor Logistics), Sofia Reyes (Harbor Logistics), Priya Nair, Alex Morgan

## Summary
The first Rotterdam training went well: all 11 dispatchers attended {trained}. Security signed off SSO; production stays on **5 November** {sso-ok}. The clean depot export slipped from 28 to **30 October** {slip}. HR will sign off the driver-shift rules {answer}. A formal go/no-go is set for **12 November** {gonogo}.

## Decisions
- Formal **go/no-go on 12 November** with the depot managers {gonogo}
- If Antwerp isn't ready by the go/no-go, **Rotterdam goes live alone** on 17 November {decide-fallback}

## Progress
- **Training:** Rotterdam day shift trained; the night shift needs its own session {night}
- **SSO:** security sign-off received; production 5 November {sso-ok}
- **Depot data:** export slipped to 30 October {slip}

## Blockers & risks
- Antwerp geocodes still open; fallback agreed: Rotterdam alone {fallback}

## Open questions
- ~~Who signs off the driver-shift rules?~~ HR signs off; Sofia's team proposes them {answer}

## Action items
- [ ] Priya — night-shift training session for Antwerp before go-live {night}
- [ ] Sofia — draft the night-shift rules with HR this week
- [ ] Maya — send the board demo invite (20 November, 14:00)
""",
        "actions": [
            ("Run a night-shift training session for Antwerp before go-live", "Priya Nair", "before 17 Nov", "night"),
            ("Draft the night-shift rules with HR", "Sofia Reyes", "this week", "answer"),
            ("Send the board demo invite", "Maya Lindqvist", "20 November, 14:00", "gonogo"),
        ],
    },
    {
        "stamp": "2026-10-30_160012", "slug": "pilot-readiness-check",
        "title": "Pilot readiness check", "series": None,
        "start": "2026-10-30T16:00:00+01:00", "end": "2026-10-30T16:28:00+01:00",
        "organizer": "Priya Nair", "people": ["Sofia Reyes", "Priya Nair"],
        "chat": [(420, "Sofia Reyes", "Cutover checklist draft: Pilot-Cutover-Checklist.docx")],
        "my_notes": [
            ("cutover", "! ", "Cutover Sunday 16 Nov evening, not Monday morning"),
            ("paper", "", "Paper runsheets as fallback for the first week, Sofia keeps a printed set per depot"),
            ("geo-80", "? ", "Antwerp at 80% geocoded: enough for go/no-go? ask Tom"),
            ("brief", "- [ ] ", "Brief night shift lead before 12 Nov"),
        ],
        "live": True,
        "turns": [
            ("Priya Nair", "Let's walk through the cutover checklist Sofia drafted."),
            ("Sofia Reyes", "My proposal is a cutover on Sunday the sixteenth in the evening, so Monday's morning wave already runs on the new system.", "cutover"),
            ("me", "I like that. Monday morning cutovers always go wrong. Let's take Sunday evening."),
            ("Priya Nair", "Agreed, Sunday evening cutover."),
            ("Sofia Reyes", "For the first week I want paper runsheets as a fallback. If the system is down, the drivers still leave on time.", "paper"),
            ("me", "Makes sense. Sofia, can you keep a printed set per depot for that week?"),
            ("Sofia Reyes", "Yes, my team will print them every evening for the first week."),
            ("Priya Nair", "Where are we on Antwerp's geocodes?"),
            ("Sofia Reyes", "Jonas says the bulk run fixed about eighty percent. My team is checking the industrial park addresses by hand.", "geo-80"),
            ("me", "Is eighty percent enough to say go on the twelfth? I'd like Tom's view on that."),
            ("Priya Nair", "I'll ask Tom before Friday's status."),
            ("Sofia Reyes", "And I still need to brief the night shift lead. He's been on leave, he's back on Monday."),
            ("me", "Please brief him before the go/no-go, he should be in that meeting.", "brief"),
            ("Sofia Reyes", "Will do. I'll invite him to the go/no-go as well."),
            ("Priya Nair", "Then I'll update the cutover plan with Sunday evening and the paper fallback and send it round tonight.", "plan"),
        ],
        "minutes": """# Pilot readiness check

> **Date:** Friday, 30 October 2026 · 28 min
> **Attendees:** Sofia Reyes (Harbor Logistics), Priya Nair, Alex Morgan

## Summary
Cutover moves to **Sunday 16 November, evening**, so Monday's first wave runs on the new system {cutover}. Paper runsheets are the fallback for the first week {paper}. Antwerp is about 80% geocoded; whether that is enough for the go/no-go is open {geo-80}.

## Decisions
- **Cutover on Sunday 16 November, evening** {cutover}
- **Paper runsheets** as the fallback for the first week, printed nightly per depot {paper}

## Open questions
- Is 80% geocoded enough to say go for Antwerp on 12 November? Ask Tom {geo-80}

## Action items
- [ ] Sofia — brief the night shift lead before the go/no-go and invite him {brief}
- [ ] Priya — update the cutover plan and send it round tonight {plan}
- [ ] Priya — ask Tom whether 80% geocoding is enough
""",
        "actions": [
            ("Brief the night shift lead and invite him to the go/no-go", "Sofia Reyes", "before 12 Nov", "brief"),
            ("Update the cutover plan (Sunday evening, paper fallback) and send it round", "Priya Nair", "tonight", "plan"),
            ("Ask Tom whether 80% geocoding is enough for go", "Priya Nair", "before Friday", "geo-80"),
        ],
    },
    # ── Verdant Foods: supplier portal (pursuit) ────────────────────────────────────────────
    {
        "stamp": "2026-10-21_110305", "slug": "verdant-discovery-call",
        "title": "Verdant Foods — discovery call", "series": None,
        "start": "2026-10-21T11:00:00+02:00", "end": "2026-10-21T11:40:00+02:00",
        "organizer": "Hannah Brooks", "people": ["Hannah Brooks", "Raj Mehta", "Ben Carter"],
        "chat": [(1880, "Raj Mehta", "Supplier survey results attached: Supplier-Survey-2026.xlsx")],
        "turns": [
            ("Hannah Brooks", "Thanks for coming in. Let me explain the problem: onboarding a new supplier takes us six weeks on average, and we onboard about two hundred a year.", "problem"),
            ("me", "Where do the six weeks go?"),
            ("Raj Mehta", "Mostly chasing documents. Certificates, insurance, food safety audits. It's all email and spreadsheets, and every supplier sends things in a different format.", "docs"),
            ("Hannah Brooks", "And we have twelve hundred active suppliers whose certificates expire at different times. We find out when an audit fails."),
            ("Ben Carter", "So two problems: onboarding new suppliers, and keeping existing ones compliant."),
            ("Hannah Brooks", "Exactly. If I had to choose, onboarding first. That's what the business feels."),
            ("me", "What would success look like in a year?"),
            ("Hannah Brooks", "Onboarding in two weeks instead of six, and no expired certificates we didn't know about.", "success"),
            ("Raj Mehta", "And suppliers doing the work themselves in a portal instead of my team chasing them."),
            ("me", "Who else needs to be involved? IT, security?"),
            ("Hannah Brooks", "Lucas, our CIO. He'll want to know how this fits with Ariba. He's sceptical of new tools, to be honest.", "lucas"),
            ("me", "Then we should meet him before the proposal, not after."),
            ("Hannah Brooks", "I'll set that up for next week's review."),
            ("me", "Is there a budget range we should design to?"),
            ("Hannah Brooks", "I can't give you a number today. Send us options and we'll talk."),
            ("me", "Fair. We'll come back with a proposal and two options. Can we have it to you by the fifth of November?", "due"),
            ("Hannah Brooks", "The fifth works. Raj, can you send them the supplier survey from the spring?"),
            ("Raj Mehta", "Yes, I'll send the supplier survey today, it has the volumes by category.", "survey"),
        ],
        "minutes": """# Verdant Foods — discovery call

> **Date:** Wednesday, 21 October 2026 · 40 min
> **Attendees:** Hannah Brooks (Verdant Foods), Raj Mehta (Verdant Foods), Ben Carter, Alex Morgan

## Summary
Supplier onboarding takes **six weeks** on average, ~200 suppliers a year {problem}, mostly spent chasing documents by email {docs}. Success in a year: onboarding in two weeks and no unknown expired certificates {success}. The CIO, Lucas Moreau, must be involved early: he will ask how it fits with Ariba {lucas}.

## Decisions
- Proposal with two options to Verdant by **5 November** {due}
- Onboarding comes first; ongoing compliance second

## Open questions
- Budget range: none given, "send us options"
- How must the portal fit with SAP Ariba? {lucas}

## Action items
- [ ] Raj — send the spring supplier survey (volumes by category) today {survey}
- [ ] Hannah — set up the review with Lucas next week
- [ ] Me — proposal with two options by 5 November {due}
""",
        "actions": [
            ("Send the spring supplier survey", "Raj Mehta", "today", "survey"),
            ("Set up the proposal review with Lucas", "Hannah Brooks", "next week", "lucas"),
            ("Write the proposal with two options", "Me", "5 November", "due"),
        ],
    },
    {
        "stamp": "2026-10-29_150120", "slug": "verdant-proposal-review",
        "title": "Verdant Foods — proposal review", "series": None,
        "start": "2026-10-29T15:00:00+01:00", "end": "2026-10-29T15:40:00+01:00",
        "organizer": "Hannah Brooks", "people": ["Hannah Brooks", "Raj Mehta", "Lucas Moreau", "Priya Nair"],
        "chat": [(1210, "Lucas Moreau", "Our vendor security questionnaire: Vendor-Security-Questionnaire.docx")],
        "turns": [
            ("me", "Thanks for the time. We'll walk you through the draft: phase one is onboarding and document collection, phase two is ongoing compliance."),
            ("Lucas Moreau", "Before the details, my concern. We run SAP Ariba. I don't want a second supplier master that drifts away from it.", "ariba"),
            ("me", "That's the right concern. The portal wouldn't hold the supplier master. Ariba stays the master, the portal only collects documents and hands the approved supplier to Ariba."),
            ("Lucas Moreau", "Then I need to see the integration in the proposal, in detail. And it has to pass our vendor security review.", "security"),
            ("Raj Mehta", "How long does that review take, Lucas?"),
            ("Lucas Moreau", "Usually four weeks. Sometimes longer if there are findings.", "4w"),
            ("me", "Then the security review is on the critical path. We should start the questionnaire now, in parallel with the proposal."),
            ("Hannah Brooks", "Agreed. I don't want to sign and then wait two months."),
            ("Priya Nair", "We'll fill in the questionnaire this week. Lucas, could you send it over?"),
            ("Lucas Moreau", "I'll post it in the chat."),
            ("Hannah Brooks", "On scope, I'm happy with the phasing. Phase one only, onboarding and documents, and we decide on phase two after we've seen it work.", "phase"),
            ("me", "Good, let's take that as decided: phase one first, phase two is a separate decision."),
            ("Hannah Brooks", "One change on timing. Could you send the proposal on the seventh instead of the fifth? I'd like Lucas's integration questions in it.", "move"),
            ("me", "The seventh is fine, it makes the proposal stronger."),
            ("Lucas Moreau", "Include a diagram of the data flow between the portal and Ariba. That's what my architects will read first.", "diagram"),
            ("me", "We'll include it. Raj, are the volumes from the survey still current?"),
            ("Raj Mehta", "Yes. Two hundred new suppliers a year, mostly packaging and fresh produce."),
            ("Hannah Brooks", "Then we'll see the proposal on the seventh. If it covers Lucas's points, I'll take it to the leadership team on the twelfth."),
        ],
        "minutes": """# Verdant Foods — proposal review

> **Date:** Thursday, 29 October 2026 · 40 min
> **Attendees:** Hannah Brooks (Verdant Foods), Raj Mehta (Verdant Foods), Lucas Moreau (Verdant Foods), Priya Nair, Alex Morgan

## Summary
Lucas (CIO) wants no second supplier master next to **SAP Ariba** {ariba}: Ariba stays the master and the portal hands approved suppliers to it. The vendor security review takes about **four weeks** {4w} and is now on the critical path. Hannah agreed to **phase one only** {phase} and moved the proposal to **7 November** {move}.

## Decisions
- **Phase one only** (onboarding and document collection); phase two decided after it works {phase}
- Proposal due **7 November** instead of 5 November {move}

## Blockers & risks
- **Vendor security review** takes ~4 weeks; start the questionnaire in parallel with the proposal {4w}

## Action items
- [ ] Priya — fill in Verdant's vendor security questionnaire this week {security}
- [ ] Me — proposal with the Ariba integration and a data-flow diagram, by 7 November {diagram}
- [ ] Hannah — take the proposal to the leadership team on 12 November
""",
        "actions": [
            ("Fill in the vendor security questionnaire", "Priya Nair", "this week", "security"),
            ("Add the Ariba integration and a data-flow diagram to the proposal", "Me", "7 November", "diagram"),
            ("Take the proposal to the leadership team", "Hannah Brooks", "12 November", "move"),
        ],
    },
]
