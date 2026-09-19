# Cortex

Cortex turns class materials into an adaptive study conversation. Students upload notes, choose what they want to practice, answer one question at a time, and receive targeted feedback and follow-up questions.

## Current prototype

The website currently includes:

- Drag-and-drop material selection
- Live PDF, TXT, and Markdown analysis with Gemini
- Gemini-generated topic summaries and suggested study goals
- Custom study goals
- Gemini-generated adaptive questions grounded in the uploaded material
- Gemini answer evaluation, source references, and follow-up questions
- Live session progress and topic mastery updates

The full material-analysis and adaptive tutoring loop is live for uploaded files. The built-in sample-notes path remains available as a local UI demonstration.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Add a local `.env.local` file before using live material analysis:

```env
GEMINI_API_KEY=your_key_here
```

## Quality checks

```bash
npm run lint
npm run build
```

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Google GenAI SDK
- Zod

## Next milestone

Add session completion reports, persistence, and production safeguards such as authentication and rate limiting.
