# Cortex

Cortex turns class materials into an adaptive study conversation. Students upload their notes, choose what they want to practice, answer one question at a time, and receive grounded feedback and follow-up questions generated with Gemini.

## Features

- Drag-and-drop PDF, TXT, and Markdown uploads
- Gemini-powered material summaries and topic identification
- A confirmation warning when uploaded materials appear to cover unrelated subjects
- A confirmation warning when a study goal appears unrelated to the uploaded materials
- Suggested and custom study goals
- Adaptive questions grounded in the uploaded material
- Answer evaluation, source references, and follow-up questions
- Live topic-mastery and session-progress updates
- End-of-session reports with strengths, improvement areas, and recommended next steps
- A built-in sample-notes path for testing the interface without an API call

## Prerequisites

Install these before setting up Cortex:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 20.9 or newer
- npm, which is included with Node.js
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

Confirm that Node and npm are available:

```bash
node -v
npm -v
```

## Complete local setup

### 1. Clone the repository

```bash
git clone https://github.com/jsedamano/Cortex.git
cd Cortex
```

If the repository is already cloned, update it first:

```bash
git pull
```

### 2. Install dependencies

Use `npm ci` so every teammate installs the exact versions recorded in `package-lock.json`:

```bash
npm ci
```

Run this again after pulling any change that updates `package.json` or `package-lock.json`.

### 3. Configure Gemini

Create a file named `.env.local` in the repository root, beside `package.json`:

```env
GEMINI_API_KEY=replace_with_your_api_key
```

You can optionally choose a different Gemini model:

```env
GEMINI_MODEL=gemini-3.8-flash
```

Important:

- Never commit `.env.local` or paste an API key into an issue, chat, or screenshot.
- Each teammate should preferably use their own API key to avoid sharing quotas.
- Restart the development server after changing environment variables.

### 4. Start Cortex

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If that port is occupied, Next.js will print the alternate local address in the terminal.

### 5. Verify the full flow

1. Upload a PDF, TXT, or Markdown file.
2. Click **Analyze with Gemini**.
3. Choose a suggested goal or enter a custom goal.
4. Click **Build my session**.
5. Answer the generated question and confirm that Cortex returns feedback and a follow-up question.

## Everyday teammate workflow

After another teammate pushes changes:

```bash
git pull
npm ci
npm run dev
```

`npm ci` is safe to run repeatedly and prevents missing-package errors when dependencies change.

## Quality checks

Run these before opening a pull request or sharing a build:

```bash
npm run lint
npm run build
```

To run the optimized production build locally:

```bash
npm run start
```

Run `npm run build` before `npm run start`.

## Troubleshooting

### `Module not found: Can't resolve '@google/genai'`

The dependencies have not been installed after pulling the Gemini integration. Stop the development server with `Ctrl+C`, then run:

```bash
npm ci
npm run dev
```

Confirm the packages are installed:

```bash
npm ls @google/genai zod
```

If the error remains, remove the generated dependency and Next.js cache folders and reinstall.

macOS or Linux:

```bash
rm -rf node_modules .next
npm ci
```

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, .next
npm ci
```

### `Gemini is not configured on this server`

Check that `.env.local` exists in the same folder as `package.json`, contains `GEMINI_API_KEY`, and that the development server was restarted after the file was created.

### Material analysis or answer evaluation fails

- Confirm the API key is active in Google AI Studio.
- Check the terminal for the server-side error.
- Try a smaller valid PDF, TXT, or Markdown file.
- Check whether the Gemini project has reached its rate limit or quota.

### Port 3000 is already in use

Use the alternate URL printed by `npm run dev`, or stop the other local development server before restarting Cortex.

## How the Gemini flow works

1. `/api/materials` securely uploads and analyzes the supplied files.
2. `/api/study/start` continues that Gemini interaction using the student's goal and generates the opening question.
3. `/api/study/answer` evaluates each answer, updates mastery, and generates the next question.

The API key is only read by server-side route handlers and is never included in browser code.

## Project structure

```text
src/app/
├── api/
│   ├── materials/route.ts
│   └── study/
│       ├── answer/route.ts
│       └── start/route.ts
├── globals.css
├── layout.tsx
└── page.tsx
```

## Technology

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Google GenAI SDK
- Zod

## Planned work

- Saved study history and persistence
- Authentication and per-user data separation
- Rate limiting and production monitoring
