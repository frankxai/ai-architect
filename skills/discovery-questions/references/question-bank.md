# Discovery question bank

Pick questions per section; do not ask all of these in one sitting. Each answer
in `01-discovery.md` is tagged `[answered]` (with a source) or `[unknown]` — see
`SKILL.md` for the tagging rule. Sections mirror the eight used in
`01-discovery.md`.

---

## Section 1: Business context

### Strategic priorities
1. What are the top three priorities driving this request right now?
2. Where does this system fit in the broader strategy — is it the strategy, or a bet inside it?
3. What competitive or market pressure makes this urgent now rather than later?
4. What happens to the business if this is never built?

### Current state
5. What's working well in the current process this system touches?
6. What's not working, specifically — not "it's slow," but where and for whom?
7. Where's the biggest bottleneck today?
8. If you could fix exactly one thing first, what would it be?

### Success metrics
9. How is success measured today, in this area?
10. Which metrics does this system need to move?
11. What data currently drives decisions here?

---

## Section 2: Process and operations

### Current workflow
12. Walk through the process step by step, as it happens today — not the intended version.
13. Who is involved at each step, and what do they actually do?
14. What tools or systems does each step touch?
15. Where do handoffs happen, and what gets lost in them?
16. Which step takes the most time, and why?

### Pain points
17. What manual work is repetitive and time-consuming?
18. Where do errors happen most often, and what do they cost when they do?
19. What breaks down under load — end of month, end of quarter, a traffic spike?
20. What currently requires constant human supervision?

### Automation history
21. What's already automated, and how well is it working?
22. What automation has been tried before, and why did it succeed or fail?
23. What should explicitly stay manual, and why?

---

## Section 3: Data and information

### Availability
24. What data exists today that's relevant to this system?
25. Where does it live, and who owns it?
26. How fresh is it — real time, daily batch, stale?
27. What relevant data is siloed, inaccessible, or simply not collected?

### Quality
28. How confident is the team in this data's accuracy and completeness?
29. What known quality issues exist, and who has to work around them today?
30. Who is accountable for data governance here, if anyone?

### Usage
31. Who uses this data today, and for what decisions?
32. What questions can't currently be answered with the data on hand?
33. What predictions or judgments does a person currently make by hand that this data could inform?

---

## Section 4: Users and stakeholders

### Personas
34. Who will actually use this system day to day?
35. What's their technical comfort level with new tools?
36. What does a typical day look like for them right now?
37. What tools do they already rely on, and what do they think of them?

### Needs
38. What task takes up most of their time that this system should change?
39. What decisions do they make regularly, and what do they currently lack to make them well?
40. How do they prefer to receive information — a dashboard, a message, an email, nothing until asked?

### Organizational impact
41. Who else is affected by this change, even if they won't use the system directly?
42. Who will champion this, and who will resist it — and why, specifically?
43. How were similar changes received in the past?

---

## Section 5: Technical environment

### Infrastructure
44. What's the current tech stack this system needs to sit next to?
45. Cloud, on-premise, or a mix — and which providers?
46. What infrastructure constraints exist (budget, headcount, approval process)?

### Integration
47. What systems does this need to read from or write to?
48. Do those systems expose APIs, or does access go through something else?
49. Real-time or batch — what does the downstream consumer actually need?

### Security and compliance
50. What security requirements apply to this system specifically?
51. What regulations govern the data involved (e.g., data residency, sector-specific rules)?
52. What data must never leave a given boundary — network, region, vendor?
53. Who needs access, and who explicitly must not have it?

---

## Section 6: AI-specific questions

### Prior experience
54. What AI or automation initiatives has this team tried before?
55. What worked, what didn't, and what's the working theory on why?
56. What's the team's day-to-day experience level with AI tools today?

### Use case shape
57. What decision or judgment is this system meant to support or replace?
58. What content, if any, does it need to generate?
59. What patterns should it detect that a person currently detects by hand, if any?

### Concerns
60. What about AI in this context worries the team — errors, bias, explainability, something else?
61. How will an AI mistake here be caught, and by whom?
62. What level of human review is non-negotiable, and where exactly does it sit in the flow?

---

## Section 7: Project constraints

### Timeline
63. What's driving the timeline — a real deadline, or a preference for speed?
64. What can be phased versus what must ship together?
65. What would count as an early, credible sign of progress?

### Budget
66. What budget range is available, and is it capex or opex?
67. What return is expected, and over what time horizon?
68. What would make this an easy call to keep funding versus kill?

### Resources
69. Who's actually available to work on this, and for how much of their time?
70. What skills exist in-house, and what's missing?
71. What external help, if any, is acceptable?

### Success and kill criteria
72. How will the team know, concretely, that this succeeded?
73. What would make this a clear failure — worth naming now, before the system exists?
74. What approvals are required before this can ship?

---

## Section 8: Follow-up deep dives

Use these once the surface answers are in, to get past the first pass:

- "Can you show me the current process happening live, not described?"
- "Can I see a real example — a real ticket, a real export, a real screen?"
- "What edge cases break the current process, and how often do they happen?"
- "What happens if we don't build this at all?"
- "What else are you considering instead of this?"

## Interviewing technique reference

- **The five whys.** State the problem, then ask "why" up to five times to find
  the root cause rather than the first symptom offered.
- **"Tell me about a time when..."** Anchors the answer to a real event instead
  of a general impression — ask what happened, what they did, and what the
  result was.
- **"Walk me through..."** Forces a step-by-step account instead of a summary;
  the gaps and hesitations are often more informative than the steps themselves.

## Interview discipline

- Start broad, then go specific — don't open with the hardest question.
- Ask for examples and numbers, not impressions.
- Get the name of the system or role, not "some tool" or "someone on the team."
- Don't lead the answer, don't propose the solution mid-interview, and don't
  skip a question because it feels obvious — the obvious answer is sometimes
  wrong.
- Notice silence. A section nobody can answer is itself a finding.
