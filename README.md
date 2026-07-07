# Information Literacy: Authority & Strategic Searching

An interactive SCORM 1.2 learning module for Canvas, built around two frames
of the ACRL Framework for Information Literacy for Higher Education:

- **Authority Is Constructed and Contextual** — a drag-and-drop activity
  matching research situations to the strongest source for that specific case.
- **Searching as Strategic Exploration** — a simulated library database
  search that gives feedback as the student refines their query (adding
  concepts, Boolean operators, phrase searching).

Audience: first-year undergraduates. No backend required — the whole module
is static HTML/CSS/JS with a self-contained SCORM 1.2 API wrapper
(`scorm/js/scorm-api.js`) that also runs standalone (no LMS) for local preview.

## Structure

```
scorm/
  imsmanifest.xml   SCORM 1.2 manifest
  index.html        module shell (welcome → authority → searching → wrap-up)
  css/style.css     Duke Blue–based styling
  js/scorm-api.js   SCORM 1.2 runtime wrapper (works standalone too)
  js/data.js        all editable content: scenarios, sources, feedback text
  js/app.js         navigation, activity logic, scoring
```

## Editing content

Librarians can update the scenarios, source types, feedback text, search
topic keywords, and sample citations without touching app logic — it's all
in `scorm/js/data.js`.

## Previewing locally

```
cd scorm
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

Outside an LMS, the SCORM wrapper runs in a standalone in-memory mode so the
whole flow (including scoring) works for preview/QA.

## Building the Canvas package

```
scripts/build.sh
```

Produces `dist/duke-info-literacy-authority-searching.zip` with
`imsmanifest.xml` at the zip root, ready to import into Canvas
(Settings → Import Course Content → SCORM Package).

## Scoring

- Authority activity: up to 50 pts (retries reduce the score slightly but
  never block completion — mastery is required to continue).
- Searching activity: 50 pts once a well-constructed query is reached.
- Reports `cmi.core.score.raw` (0–100) and `cmi.core.lesson_status`
  (`passed` at 70+, otherwise `completed`) back to Canvas.
