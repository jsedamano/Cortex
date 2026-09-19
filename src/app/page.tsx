"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

type Stage = "upload" | "goal" | "study";

const suggestedGoals = [
  "Prepare me for next week’s exam",
  "Quiz me on the topics I struggle with",
  "Help me connect the big ideas",
];

const questions = [
  {
    eyebrow: "Linked lists · Understanding",
    title: "What makes a linked list different from an array?",
    hint: "Think about memory layout, access, and what happens when the collection grows.",
  },
  {
    eyebrow: "Node implementation · Apply",
    title: "How would you insert a new node at the beginning of a singly linked list?",
    hint: "Walk through the pointer updates in the order they must happen.",
  },
];

function Mark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 40 40" fill="none">
      <path d="M20 3.5c1.5 8.9 7.6 15 16.5 16.5C27.6 21.5 21.5 27.6 20 36.5 18.5 27.6 12.4 21.5 3.5 20 12.4 18.5 18.5 12.4 20 3.5Z" fill="currentColor" />
      <circle cx="20" cy="20" r="4.2" fill="#FFF8ED" />
    </svg>
  );
}

function Icon({ name }: { name: "file" | "brain" | "arrow" | "check" }) {
  const paths = {
    file: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8m-6-6 6 6m-6-6v6h6M8 13h8M8 17h6" />,
    brain: <path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v1a3 3 0 0 0-1 5.83V16a3 3 0 0 0 3 3h1.5M14.5 4.5A3.5 3.5 0 0 1 18 8v1a3 3 0 0 1 1 5.83V16a3 3 0 0 1-3 3h-1.5M9.5 4.5v15M14.5 4.5v15M6 9.5h3.5m5 0H18M7 15h2.5m5 0H17" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stageNumber = stage === "upload" ? 1 : stage === "goal" ? 2 : 3;
  const question = questions[questionIndex % questions.length];
  const progress = useMemo(() => (questionIndex === 0 ? 38 : 54), [questionIndex]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).map((file) => file.name);
    setFiles((current) => Array.from(new Set([...current, ...incoming])));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  }

  function beginDemo() {
    if (files.length === 0) setFiles(["CS_2110_Linked_Lists.pdf"]);
    setStage("goal");
  }

  function nextQuestion() {
    setQuestionIndex((current) => current + 1);
    setAnswer("");
    setSubmitted(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17231d]">
      <header className="border-b border-[#17231d]/10 bg-[#f7f3ea]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 sm:px-8">
          <button className="flex items-center gap-2.5" onClick={() => setStage("upload")} aria-label="Go to Cortex home">
            <span className="grid size-9 place-items-center rounded-xl bg-[#173e2e] text-[#f8c955] shadow-[0_5px_14px_rgba(23,62,46,.2)]">
              <Mark className="size-5" />
            </span>
            <span className="text-xl font-semibold tracking-[-0.04em]">cortex</span>
          </button>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#607067]">New study session</span>
            <span className="rounded-full border border-[#173e2e]/15 bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#365247]">Step {stageNumber} of 3</span>
          </div>
        </div>
      </header>

      {stage !== "study" && (
        <div className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8">
          <div className="grid grid-cols-3 gap-2" aria-label={`Step ${stageNumber} of 3`}>
            {[1, 2, 3].map((step) => (
              <div key={step} className={`h-1 rounded-full transition-colors ${step <= stageNumber ? "bg-[#e86f51]" : "bg-[#17231d]/10"}`} />
            ))}
          </div>
        </div>
      )}

      {stage === "upload" && (
        <section className="mx-auto grid max-w-[1180px] gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.35fr_.65fr] lg:py-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e86f51]/25 bg-[#fff8ed] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-[#b94c34]">
              <span className="size-1.5 rounded-full bg-[#e86f51]" />
              Your personal study coach
            </div>
            <h1 className="max-w-3xl text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[.92] tracking-[-0.065em]">
              Turn your notes into <span className="font-serif font-medium italic text-[#e86f51]">practice.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#536159]">
              Add your class materials. Cortex will learn what you’re studying and build a conversation that adapts to you.
            </p>

            <div className="mt-10 max-w-2xl rounded-[28px] border border-[#173e2e]/12 bg-[#fffdf8] p-3 shadow-[0_24px_70px_rgba(38,52,44,.09)] sm:p-5">
              <div
                className={`group flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-8 text-center transition ${dragActive ? "border-[#e86f51] bg-[#fff1e8]" : "border-[#aab5ad] bg-[#fbfaf5] hover:border-[#e86f51]/70 hover:bg-[#fffaf4]"}`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click(); }}
              >
                <input ref={fileInputRef} className="sr-only" type="file" multiple accept=".pdf,.txt,.md" onChange={handleFileChange} />
                <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-[#e4eee7] text-[#173e2e] transition-transform group-hover:-translate-y-1">
                  <span className="size-7"><Icon name="file" /></span>
                </span>
                <p className="text-lg font-semibold tracking-[-0.02em]">Drop your class materials here</p>
                <p className="mt-2 text-sm text-[#6a756e]">or click to browse · PDF, TXT, or MD</p>
                <p className="mt-6 rounded-full bg-[#edf1ed] px-3 py-1 text-xs font-medium text-[#607067]">Up to 20 MB per file</p>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file) => (
                    <div key={file} className="flex items-center gap-3 rounded-2xl border border-[#173e2e]/10 bg-white px-4 py-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0e8] text-[#d65e43]"><span className="size-4"><Icon name="file" /></span></span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{file}</span>
                      <span className="grid size-6 place-items-center rounded-full bg-[#dff1e5] text-[#24633e]"><span className="size-3.5"><Icon name="check" /></span></span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={beginDemo} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173e2e] px-6 py-4 font-semibold text-white shadow-[0_9px_20px_rgba(23,62,46,.18)] transition hover:-translate-y-0.5 hover:bg-[#1e4d39]">
                {files.length ? "Continue with materials" : "Try with sample notes"}
                <span className="size-5"><Icon name="arrow" /></span>
              </button>
            </div>
          </div>

          <aside className="flex flex-col justify-end lg:pb-16">
            <div className="rounded-[28px] bg-[#173e2e] p-7 text-white shadow-[0_24px_70px_rgba(23,62,46,.2)] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f8c955]">How it works</p>
              <div className="mt-7 space-y-7">
                {[
                  ["01", "Share your materials", "Your notes become the source of truth."],
                  ["02", "Set your focus", "Tell Cortex what you want to master."],
                  ["03", "Learn by explaining", "Get questions that adapt to every answer."],
                ].map(([number, title, copy]) => (
                  <div key={number} className="flex gap-4">
                    <span className="font-mono text-sm text-[#8fb29f]">{number}</span>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#b9cbc1]">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm leading-6 text-[#d7e2dc]">
                “Explaining an idea is one of the fastest ways to discover what you actually understand.”
              </div>
            </div>
          </aside>
        </section>
      )}

      {stage === "goal" && (
        <section className="mx-auto max-w-[930px] px-5 py-12 sm:px-8 sm:py-20">
          <button onClick={() => setStage("upload")} className="mb-8 flex items-center gap-2 text-sm font-semibold text-[#607067] transition hover:text-[#173e2e]">
            <span className="rotate-180"><span className="block size-4"><Icon name="arrow" /></span></span> Back to materials
          </button>
          <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#d65e43]">Your turn</p>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">What do you want to practice today?</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#617068]">Be as specific as you like. Cortex will shape the session around your goal and materials.</p>

              <label className="mt-9 block">
                <span className="sr-only">Study goal</span>
                <textarea
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="I have a test next week. Focus on linked-list node implementation, but mix in the other topics too..."
                  className="min-h-48 w-full resize-none rounded-[24px] border border-[#173e2e]/15 bg-[#fffdf8] p-6 text-lg leading-8 outline-none shadow-[0_18px_50px_rgba(38,52,44,.07)] transition placeholder:text-[#9aa39e] focus:border-[#e86f51] focus:ring-4 focus:ring-[#e86f51]/10"
                />
              </label>

              <p className="mt-6 text-sm font-semibold text-[#536159]">Or start with a suggestion</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {suggestedGoals.map((suggestion) => (
                  <button key={suggestion} onClick={() => setGoal(suggestion)} className="rounded-full border border-[#173e2e]/15 bg-[#fffdf8] px-4 py-2.5 text-sm font-medium transition hover:border-[#e86f51] hover:bg-[#fff1e8]">
                    {suggestion}
                  </button>
                ))}
              </div>

              <button disabled={!goal.trim()} onClick={() => setStage("study")} className="mt-9 flex items-center gap-2 rounded-2xl bg-[#173e2e] px-7 py-4 font-semibold text-white shadow-[0_9px_20px_rgba(23,62,46,.18)] transition hover:-translate-y-0.5 hover:bg-[#1e4d39] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0">
                Build my session <span className="size-5"><Icon name="arrow" /></span>
              </button>
            </div>

            <aside className="h-fit rounded-[24px] border border-[#173e2e]/10 bg-[#fffdf8] p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#e4eee7] text-[#173e2e]"><span className="size-5"><Icon name="brain" /></span></span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#7b8780]">Cortex found</p>
                  <p className="font-semibold">6 key topics</p>
                </div>
              </div>
              <div className="my-5 h-px bg-[#173e2e]/10" />
              <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#7b8780]">Materials</p>
              <div className="mt-3 space-y-3">
                {files.map((file) => (
                  <div key={file} className="flex items-start gap-2.5 text-sm font-medium">
                    <span className="mt-0.5 size-4 shrink-0 text-[#d65e43]"><Icon name="file" /></span>
                    <span className="break-all">{file}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-[#f0eee5] p-4 text-sm leading-6 text-[#5e6a63]">The real app will use Gemini to analyze these files here.</div>
            </aside>
          </div>
        </section>
      )}

      {stage === "study" && (
        <section className="mx-auto max-w-[1180px] px-5 py-7 sm:px-8 sm:py-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d65e43]">Active session</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">Data Structures review</h1>
            </div>
            <button onClick={() => { setStage("upload"); setAnswer(""); setSubmitted(false); }} className="rounded-xl border border-[#173e2e]/15 bg-white/50 px-4 py-2 text-sm font-semibold transition hover:bg-white">End session</button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
            <aside className="order-2 space-y-4 lg:order-1">
              <div className="rounded-[22px] border border-[#173e2e]/10 bg-[#fffdf8] p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Session progress</p>
                  <span className="text-sm font-bold text-[#d65e43]">{progress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe4df]"><div className="h-full rounded-full bg-[#e86f51] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                <p className="mt-3 text-xs leading-5 text-[#738078]">Question {questionIndex + 1} of approximately 8</p>
              </div>
              <div className="rounded-[22px] bg-[#173e2e] p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-[#9bb8a8]">Mastery</p>
                <div className="mt-5 space-y-4">
                  {[["Core concepts", 78], ["Node structure", questionIndex ? 64 : 48], ["Operations", 31]].map(([topic, score]) => (
                    <div key={String(topic)}>
                      <div className="flex justify-between text-xs"><span>{topic}</span><span className="text-[#b9cbc1]">{score}%</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#f8c955]" style={{ width: `${score}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="order-1 rounded-[28px] border border-[#173e2e]/10 bg-[#fffdf8] shadow-[0_24px_70px_rgba(38,52,44,.08)] lg:order-2">
              <div className="border-b border-[#173e2e]/10 px-6 py-5 sm:px-9">
                <div className="flex items-center gap-3 text-sm font-medium text-[#68766e]">
                  <span className="grid size-8 place-items-center rounded-full bg-[#e4eee7] text-[#173e2e]"><Mark className="size-4" /></span>
                  Cortex is adapting to your answers
                </div>
              </div>
              <div className="p-6 sm:p-9">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#d65e43]">{question.eyebrow}</p>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">{question.title}</h2>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-[#6a756e]">{question.hint}</p>

                <label className="mt-8 block">
                  <span className="mb-2 block text-sm font-semibold">Explain it in your own words</span>
                  <textarea value={answer} onChange={(event) => { setAnswer(event.target.value); setSubmitted(false); }} placeholder="Type your answer here..." className="min-h-40 w-full resize-none rounded-[20px] border border-[#173e2e]/15 bg-white p-5 leading-7 outline-none transition placeholder:text-[#a2aaa5] focus:border-[#e86f51] focus:ring-4 focus:ring-[#e86f51]/10" />
                </label>

                {!submitted ? (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <button onClick={() => { setAnswer("I’m not sure yet."); setSubmitted(true); }} className="text-sm font-semibold text-[#65726b] underline decoration-[#65726b]/30 underline-offset-4">I’m not sure yet</button>
                    <button disabled={!answer.trim()} onClick={() => setSubmitted(true)} className="flex items-center gap-2 rounded-2xl bg-[#173e2e] px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1e4d39] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0">Check my answer <span className="size-5"><Icon name="arrow" /></span></button>
                  </div>
                ) : (
                  <div className="mt-6 rounded-[22px] border border-[#6dab7d]/30 bg-[#eef8f0] p-5 sm:p-6">
                    <div className="flex gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#2f7748] text-white"><span className="size-5"><Icon name="check" /></span></span>
                      <div>
                        <p className="font-semibold text-[#1f5d37]">{answer === "I’m not sure yet." ? "That’s okay — let’s build it together." : "Strong start — your comparison is on the right track."}</p>
                        <p className="mt-2 leading-7 text-[#456250]">{answer === "I’m not sure yet." ? "An array keeps elements next to each other in memory, while a linked list connects separate nodes using references. On the next question, focus on what those references let us change efficiently." : "You correctly identified that linked-list nodes are not stored contiguously. To make this complete, explain how that changes random access and insertion cost."}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[.1em] text-[#5f7867]">Grounded in CS_2110_Linked_Lists.pdf · Page 4</p>
                      </div>
                    </div>
                    <button onClick={nextQuestion} className="mt-5 flex items-center gap-2 rounded-xl bg-[#2f7748] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28663e]">Continue <span className="size-4"><Icon name="arrow" /></span></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
