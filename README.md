# Cortex

Cortex turns class materials into an adaptive study conversation. Students upload notes, choose what they want to practice, answer one question at a time, and receive targeted feedback and follow-up questions.

## Current prototype

The website currently includes a complete mocked user journey:

- Drag-and-drop material selection
- Suggested and custom study goals
- Adaptive-question interface
- Answer feedback with a source reference
- Session progress and topic mastery

The interactions are intentionally mocked. The next milestone is to connect the upload and study flows to the Gemini API.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run build
```

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS

## Next milestone

Add server-only Gemini integration for document upload, material analysis, structured study plans, and adaptive answer evaluation.
