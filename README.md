# Markscheme — AI Assessment Extraction & Answer Mapping

Upload a printed question paper and one student's handwritten answer sheet.
The app extracts every question (and labelled sub-part) in printed order,
transcribes the student's answers, maps each answer to its question, and
lets you click a question to see the exact region highlighted on the answer
sheet — with optional AI grading and feedback.

## How it works

```
Upload (PDF/image) → Rasterize pages in-browser (pdf.js + canvas)
  → POST page images to /api/extract-questions  (Grok vision)
  → POST page images + known question numbers to /api/extract-answers (Grok vision)
  → Client-side mapping (lib/mapping.ts): match answers to questions,
    flag unanswered questions, flag out-of-order answers, collect
    answers that matched no question
  → Optional: POST matched Q/A text pairs to /api/grade (Grok text) for
    marks, verdicts and feedback
```

Everything is in-memory / client state for the duration of one session —
there's no database and no auth, per the assignment's constraints. PDFs and
images never leave the browser except as page screenshots sent to the two
extraction endpoints and the grading endpoint.

### Question extraction
`POST /api/extract-questions` sends every question-paper page (as an image)
to a Grok vision model with a prompt that asks it to return every question
**and labelled sub-part** as its own entry (e.g. `11(a)` and `11(b)` are two
entries), preserving the exact printed numbering, in printed order, along
with a bounding box (as % of page width/height) and marks if printed.

### Answer extraction
`POST /api/extract-answers` sends every answer-sheet page image to a Grok
vision model, **grounded with the exact list of question numbers** just
extracted from the question paper, and asks it to transcribe each distinct
handwritten segment, guess which question number it answers (or `null` if
it can't tell), and return one bounding box per page the segment spans —
so a continued answer ("see page 4") produces multiple regions in the same
segment.

### Mapping
`lib/mapping.ts` does the matching purely in the client, no AI call needed:
- A question is **unanswered** if no answer segment claimed its number.
- A question is **out of order** if its matched answer was written out of
  sequence relative to the other answered questions (computed via a longest
  increasing subsequence over `(page, y-position)` compared to printed
  question order).
- An answer segment that didn't confidently match any known question number
  is kept in an **"unmatched answers"** list so a teacher can review it
  manually rather than losing it.

### Highlighting
Clicking a question jumps the answer-sheet viewer to the right page and
draws a green highlight box (with a small "Qn" tag, matching the provided
Figma) around the exact bounding box returned by the model. If an answer
spans multiple pages, small page-jump chips appear so you can see every
region it covers.

### Grading (optional, in scope per the assignment)
`POST /api/grade` sends the matched question/answer text pairs (not images)
to a Grok text model, asking for marks awarded, a verdict
(correct/partial/incorrect), per-question feedback, and a short overall
summary. Ungraded/unanswered questions are simply left out of the total.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Route Handlers as the API layer)
- **Tailwind CSS v4** for styling, following the provided VedaAI Figma
  design closely (sidebar, orange/black accent system, upload cards,
  extracting screen, and the two-pane question-ledger + answer-sheet
  mapping screen — see `src/app/globals.css` for the design tokens)
- **pdf.js** (`pdfjs-dist`) — client-side PDF → PNG page rasterization
  (no server-side file storage needed)
- **xAI Grok API** (`grok-2-vision-1212` for vision, `grok-2-1212` for
  grading text) — OpenAI-compatible `/v1/chat/completions` endpoint, called
  from server Route Handlers so the API key never reaches the browser

## Running locally

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and set XAI_API_KEY to a real xAI key (https://console.x.ai)
npm run dev
```

Open http://localhost:3000.

## Deploying (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add an environment variable `XAI_API_KEY` (and optionally `XAI_MODEL` /
   `XAI_TEXT_MODEL`) in the Vercel project settings.
4. Deploy — no other configuration is required (no database, no build
   secrets besides the API key).

## Assumptions & limitations

- Only one student's answer sheet is handled per run, as specified.
- Question numbering matching is exact-string (after trimming
  whitespace/punctuation), so if the model transcribes a number
  inconsistently between the two documents, that answer falls into
  "unmatched" rather than being force-matched — this is a deliberate
  precision-over-recall choice so mismatches are visible and reviewable
  instead of silently wrong.
- Bounding boxes are the model's own visual estimate of a text block on the
  page image, not derived from OCR token coordinates, so very dense or
  cramped handwriting can produce a slightly loose highlight region.
- Handwriting transcription quality depends entirely on the underlying
  vision model; illegible words are marked with a `[?]` prefix by the model
  rather than invented outright.
- Large PDFs are rasterized at up to ~1600px on the long edge to keep
  vision-API payloads reasonably sized; this is a quality/cost tradeoff and
  can be raised in `src/lib/rasterize.ts` (`MAX_DIMENSION`) if needed.
- Grading is intentionally a separate, opt-in step (button in the top bar)
  so extraction/mapping — the core of the assignment — can be reviewed
  before spending an extra AI call on marks.
