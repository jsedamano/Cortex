"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

type Stage = "upload" | "goal" | "study" | "results";

type MaterialAnalysis = {
  courseTitle: string;
  materialSummary: string;
  recommendedQuestionCount: number;
  materialCoherence: {
    shouldWarn: boolean;
    reason: string;
  };
  topics: Array<{ name: string; description: string }>;
  suggestedGoals: string[];
};

type MaterialApiResponse = {
  analysis: MaterialAnalysis;
  interactionId: string;
  files: Array<{
    displayName: string;
    mimeType: string;
    name: string;
    uri: string;
  }>;
};

type StudyQuestion = {
  text: string;
  topic: string;
  difficulty: "introductory" | "intermediate" | "advanced";
  questionType: "recall" | "explanation" | "application" | "debugging";
  hint: string;
  sourceReference: { document: string; page: number | null };
};

type MasteryTopic = { topic: string; score: number };

type StudyFeedback = {
  headline: string;
  explanation: string;
  score: number;
  correctPoints: string[];
  missingPoints: string[];
  misconceptions: string[];
  sourceReference: { document: string; page: number | null };
};

type StudyStartResponse = {
  interactionId: string;
  sessionTitle: string;
  goalAlignment: {
    shouldWarn: boolean;
    reason: string;
  };
  question: StudyQuestion;
  mastery: MasteryTopic[];
};

type AnswerResponse = {
  interactionId: string;
  feedback: StudyFeedback;
  masteryUpdates: MasteryTopic[];
  nextQuestion: StudyQuestion;
};

type SessionReport = {
  headline: string;
  overview: string;
  overallScore: number | null;
  strengths: string[];
  areasToImprove: string[];
  nextSteps: string[];
  topicResults: Array<{
    topic: string;
    score: number;
    note: string;
  }>;
};

type SessionResults = SessionReport & {
  questionsAnswered: number;
};

type EndSessionResponse = {
  interactionId: string;
  report: SessionReport;
};

const defaultSuggestedGoals = [
  "Prepare me for next week’s exam",
  "Quiz me on the topics I struggle with",
  "Help me connect the big ideas",
];

const sampleAnalysis: MaterialAnalysis = {
  courseTitle: "Data Structures",
  materialSummary:
    "These sample notes cover linked-list structure, node references, traversal, and common insertion and removal operations.",
  recommendedQuestionCount: 8,
  materialCoherence: {
    shouldWarn: false,
    reason: "",
  },
  topics: [
    { name: "Linked-list fundamentals", description: "How nodes form an ordered collection." },
    { name: "Node structure", description: "How values and references are represented." },
    { name: "Traversal", description: "How to move through a linked list safely." },
    { name: "Insertion", description: "How references change when adding nodes." },
    { name: "Removal", description: "How references change when deleting nodes." },
    { name: "Complexity", description: "The performance tradeoffs of list operations." },
  ],
  suggestedGoals: defaultSuggestedGoals,
};

const sampleQuestions: StudyQuestion[] = [
  {
    topic: "Linked lists",
    difficulty: "introductory",
    questionType: "explanation",
    text: "What makes a linked list different from an array?",
    hint: "Think about memory layout, access, and what happens when the collection grows.",
    sourceReference: { document: "CS_2110_Linked_Lists.pdf", page: 4 },
  },
  {
    topic: "Node implementation",
    difficulty: "intermediate",
    questionType: "application",
    text: "How would you insert a new node at the beginning of a singly linked list?",
    hint: "Walk through the pointer updates in the order they must happen.",
    sourceReference: { document: "CS_2110_Linked_Lists.pdf", page: 7 },
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

function Icon({ name }: { name: "file" | "brain" | "arrow" | "check" | "close" | "minus" }) {
  const paths = {
    file: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8m-6-6 6 6m-6-6v6h6M8 13h8M8 17h6" />,
    brain: <path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v1a3 3 0 0 0-1 5.83V16a3 3 0 0 0 3 3h1.5M14.5 4.5A3.5 3.5 0 0 1 18 8v1a3 3 0 0 1 1 5.83V16a3 3 0 0 1-3 3h-1.5M9.5 4.5v15M14.5 4.5v15M6 9.5h3.5m5 0H18M7 15h2.5m5 0H17" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m7 7 10 10M17 7 7 17" />,
    minus: <path d="M5 12h14" />,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

type WarningDialogProps = {
  id: string;
  title: string;
  description: string;
  secondaryLabel: string;
  primaryLabel: string;
  onSecondary: () => void;
  onPrimary: () => void;
};

function WarningDialog({
  id,
  title,
  description,
  secondaryLabel,
  primaryLabel,
  onSecondary,
  onPrimary,
}: WarningDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17231d]/55 px-5 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        className="w-full max-w-lg rounded-[28px] border border-white/40 bg-[#fffdf8] p-6 shadow-[0_30px_100px_rgba(10,25,18,.35)] sm:p-8"
      >
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff0d2] text-[#9a6412]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-6">
              <path d="M12 3 2.8 19h18.4L12 3Z" />
              <path d="M12 9v4.5M12 17h.01" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b06d14]">A quick check</p>
            <h2 id={`${id}-title`} className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#17231d] sm:text-3xl">
              {title}
            </h2>
          </div>
        </div>

        <p id={`${id}-description`} className="mt-5 leading-7 text-[#58675f]">
          {description}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            onClick={onSecondary}
            className="rounded-2xl border border-[#173e2e]/15 bg-white px-5 py-3 font-semibold text-[#365247] transition hover:border-[#173e2e]/30 hover:bg-[#f4f2eb]"
          >
            {secondaryLabel}
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="rounded-2xl bg-[#173e2e] px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1e4d39]"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function topicResultNote(score: number) {
  if (score >= 80) return "Strong understanding demonstrated during this session.";
  if (score >= 60) return "Developing well; a little more practice should make this reliable.";
  if (score > 0) return "Needs more explanation and retrieval practice.";
  return "Not assessed during this session.";
}

function createUnassessedReport(mastery: MasteryTopic[]): SessionReport {
  return {
    headline: "There is more to explore",
    overview:
      "The session ended before any answers were evaluated, so Cortex does not yet have enough evidence to assess your understanding. Your materials and goal are ready whenever you want to try again.",
    overallScore: null,
    strengths: [],
    areasToImprove: [],
    nextSteps: [
      "Restart the session and answer at least two or three questions.",
      "Explain each answer in your own words, even when you are uncertain.",
    ],
    topicResults: mastery.map(({ topic }) => ({
      topic,
      score: 0,
      note: "Not assessed during this session.",
    })),
  };
}

function createSampleReport(
  questionsAnswered: number,
  mastery: MasteryTopic[],
  latestFeedback: StudyFeedback | null,
): SessionReport {
  const averageMastery = mastery.length
    ? Math.round(
        mastery.reduce((total, topic) => total + topic.score, 0) /
          mastery.length,
      )
    : 0;
  const overallScore = latestFeedback?.score ?? averageMastery;

  return {
    headline:
      overallScore >= 70
        ? "A promising foundation"
        : "A useful first step",
    overview: `You completed ${questionsAnswered} ${questionsAnswered === 1 ? "question" : "questions"} in the sample session. Your responses show where to focus next, though a longer session would provide a more complete assessment.`,
    overallScore,
    strengths:
      overallScore >= 70
        ? ["You communicated the central idea clearly in the evaluated response."]
        : ["You engaged with the question and created a clear starting point for review."],
    areasToImprove: [
      "Explain how linked-list structure affects access and update costs.",
      "Use a small pointer-by-pointer example when describing an operation.",
    ],
    nextSteps: [
      "Practice tracing an insertion and removal on paper.",
      "Compare linked-list and array tradeoffs without looking at your notes.",
    ],
    topicResults: mastery.map(({ topic, score }) => ({
      topic,
      score,
      note: topicResultNote(score),
    })),
  };
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [sampleFileName, setSampleFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MaterialAnalysis | null>(null);
  const [materialInteractionId, setMaterialInteractionId] = useState<string | null>(null);
  const [studyInteractionId, setStudyInteractionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("Study session");
  const [currentQuestion, setCurrentQuestion] = useState<StudyQuestion | null>(null);
  const [queuedQuestion, setQueuedQuestion] = useState<StudyQuestion | null>(null);
  const [mastery, setMastery] = useState<MasteryTopic[]>([]);
  const [feedback, setFeedback] = useState<StudyFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [materialWarning, setMaterialWarning] = useState<string | null>(null);
  const [goalWarning, setGoalWarning] = useState<StudyStartResponse | null>(null);
  const [studyError, setStudyError] = useState<string | null>(null);
  const [sessionEndError, setSessionEndError] = useState<string | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);
  const [goal, setGoal] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stageNumber = stage === "upload" ? 1 : stage === "goal" ? 2 : 3;
  const question = currentQuestion ?? sampleQuestions[questionIndex % sampleQuestions.length];
  const targetQuestionCount = analysis?.recommendedQuestionCount ?? 8;
  const feedbackTheme =
    (feedback?.score ?? 100) < 30
      ? {
          card: "border-[#df6a5a]/35 bg-[#fff0ec]",
          icon: "bg-[#c94f3f]",
          iconName: "close" as const,
          headline: "text-[#8d3429]",
          badge: "bg-[#f3d1ca] text-[#8d3429]",
          explanation: "text-[#704b44]",
          source: "text-[#7d5b54]",
        }
      : (feedback?.score ?? 100) < 70
        ? {
            card: "border-[#dfb34c]/40 bg-[#fff8df]",
            icon: "bg-[#c98f1f]",
            iconName: "minus" as const,
            headline: "text-[#79550f]",
            badge: "bg-[#f3e2a7] text-[#74500b]",
            explanation: "text-[#675939]",
            source: "text-[#766946]",
          }
        : {
            card: "border-[#6dab7d]/30 bg-[#eef8f0]",
            icon: "bg-[#2f7748]",
            iconName: "check" as const,
            headline: "text-[#1f5d37]",
            badge: "bg-[#d9eedf] text-[#2f6842]",
            explanation: "text-[#456250]",
            source: "text-[#5f7867]",
          };
  const progress = useMemo(
    () =>
      Math.min(
        Math.round(((questionIndex + 1) / targetQuestionCount) * 100),
        100,
      ),
    [questionIndex, targetQuestionCount],
  );
  const visibleMastery = mastery.length
    ? mastery
    : [
        { topic: "Core concepts", score: 20 },
        { topic: "Applications", score: 20 },
        { topic: "Connections", score: 20 },
      ];
  const displayFileNames = files.length
    ? files.map((file) => file.name)
    : sampleFileName
      ? [sampleFileName]
      : [];
  const suggestedGoals = analysis?.suggestedGoals ?? defaultSuggestedGoals;

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    setSampleFileName(null);
    setAnalysis(null);
    setMaterialInteractionId(null);
    setStudyInteractionId(null);
    setCurrentQuestion(null);
    setQueuedQuestion(null);
    setFeedback(null);
    setMastery([]);
    setUploadError(null);
    setMaterialWarning(null);
    setGoalWarning(null);
    setSessionEndError(null);
    setSessionResults(null);
    setFiles((current) => {
      const allFiles = [...current, ...incoming];
      return allFiles.filter(
        (file, index) =>
          allFiles.findIndex(
            (candidate) =>
              candidate.name === file.name && candidate.size === file.size,
          ) === index,
      );
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  }

  function removeFile(fileIndex: number) {
    setFiles((current) => current.filter((_, index) => index !== fileIndex));
    if (fileInputRef.current) fileInputRef.current.value = "";

    setSampleFileName(null);
    setAnalysis(null);
    setMaterialInteractionId(null);
    setStudyInteractionId(null);
    setSessionTitle("Study session");
    setCurrentQuestion(null);
    setQueuedQuestion(null);
    setMastery([]);
    setFeedback(null);
    setUploadError(null);
    setMaterialWarning(null);
    setGoalWarning(null);
    setStudyError(null);
    setSessionEndError(null);
    setSessionResults(null);
    setGoal("");
    setAnswer("");
    setSubmitted(false);
    setQuestionIndex(0);
  }

  async function analyzeMaterials() {
    setUploadError(null);
    setMaterialWarning(null);

    if (files.length === 0) {
      setSampleFileName("CS_2110_Linked_Lists.pdf");
      setAnalysis(sampleAnalysis);
      setMaterialInteractionId(null);
      setStage("goal");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as
        | MaterialApiResponse
        | { error?: string };

      if (!response.ok || !("analysis" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Cortex could not analyze those materials.",
        );
      }

      setAnalysis(payload.analysis);
      setMaterialInteractionId(payload.interactionId);
      if (
        files.length > 1 &&
        payload.analysis.materialCoherence.shouldWarn
      ) {
        setMaterialWarning(
          payload.analysis.materialCoherence.reason ||
            "These materials appear to cover subjects that may work better in separate study sessions.",
        );
      } else {
        setStage("goal");
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Cortex could not analyze those materials.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function reviewMaterials() {
    setMaterialWarning(null);
    setAnalysis(null);
    setMaterialInteractionId(null);
  }

  function continueWithMixedMaterials() {
    setMaterialWarning(null);
    setStage("goal");
  }

  function enterStudySession(session: StudyStartResponse) {
    setSessionTitle(session.sessionTitle);
    setCurrentQuestion(session.question);
    setMastery(session.mastery);
    setStudyInteractionId(session.interactionId);
    setQuestionIndex(0);
    setAnswer("");
    setFeedback(null);
    setQueuedQuestion(null);
    setSubmitted(false);
    setSessionEndError(null);
    setSessionResults(null);
    setStage("study");
  }

  function editStudyGoal() {
    setGoalWarning(null);
  }

  function continueWithOffTopicGoal() {
    if (!goalWarning) return;
    const pendingSession = goalWarning;
    setGoalWarning(null);
    enterStudySession(pendingSession);
  }

  async function beginStudySession() {
    if (!goal.trim()) return;
    setStudyError(null);
    setGoalWarning(null);
    setSessionEndError(null);
    setSessionResults(null);

    if (!materialInteractionId) {
      setSessionTitle("Data Structures review");
      setStudyInteractionId(null);
      setCurrentQuestion(sampleQuestions[0]);
      setQueuedQuestion(null);
      setFeedback(null);
      setMastery([
        { topic: "Core concepts", score: 20 },
        { topic: "Node structure", score: 20 },
        { topic: "Operations", score: 20 },
      ]);
      setQuestionIndex(0);
      setAnswer("");
      setSubmitted(false);
      setSessionEndError(null);
      setStage("study");
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch("/api/study/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          previousInteractionId: materialInteractionId,
          questionCount: targetQuestionCount,
        }),
      });
      const payload = (await response.json()) as
        | StudyStartResponse
        | { error?: string };

      if (!response.ok || !("question" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Cortex could not build this study session.",
        );
      }

      if (payload.goalAlignment.shouldWarn) {
        setGoalWarning(payload);
      } else {
        enterStudySession(payload);
      }
    } catch (error) {
      setStudyError(
        error instanceof Error
          ? error.message
          : "Cortex could not build this study session.",
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function evaluateAnswer(studentAnswer = answer) {
    if (!studentAnswer.trim()) return;
    setAnswer(studentAnswer);
    setStudyError(null);

    if (!studyInteractionId) {
      const sampleScore = studentAnswer === "I’m not sure yet." ? 10 : 72;
      const sampleFeedback: StudyFeedback = {
        headline:
          studentAnswer === "I’m not sure yet."
            ? "That’s okay — let’s build it together."
            : "Strong start — your comparison is on the right track.",
        explanation:
          studentAnswer === "I’m not sure yet."
            ? "An array keeps elements next to each other in memory, while a linked list connects separate nodes using references. On the next question, focus on what those references let us change efficiently."
            : "You correctly identified that linked-list nodes are not stored contiguously. To make this complete, explain how that changes random access and insertion cost.",
        score: sampleScore,
        correctPoints: [],
        missingPoints: [],
        misconceptions: [],
        sourceReference: question.sourceReference,
      };
      setFeedback(sampleFeedback);
      setMastery((current) =>
        current.map((topic, index) =>
          index === questionIndex % current.length
            ? { ...topic, score: sampleScore }
            : topic,
        ),
      );
      setSubmitted(true);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch("/api/study/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: studentAnswer.trim(),
          previousInteractionId: studyInteractionId,
          questionNumber: questionIndex + 1,
          targetQuestionCount,
        }),
      });
      const payload = (await response.json()) as
        | AnswerResponse
        | { error?: string };

      if (!response.ok || !("feedback" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Cortex could not evaluate that answer.",
        );
      }

      setFeedback(payload.feedback);
      setMastery(payload.masteryUpdates);
      setStudyInteractionId(payload.interactionId);
      setQueuedQuestion(payload.nextQuestion);
      setSubmitted(true);
    } catch (error) {
      setStudyError(
        error instanceof Error
          ? error.message
          : "Cortex could not evaluate that answer.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  function nextQuestion() {
    setQuestionIndex((current) => current + 1);
    if (queuedQuestion) {
      setCurrentQuestion(queuedQuestion);
      setQueuedQuestion(null);
    } else if (!studyInteractionId) {
      setCurrentQuestion(sampleQuestions[(questionIndex + 1) % sampleQuestions.length]);
    }
    setAnswer("");
    setFeedback(null);
    setSubmitted(false);
  }

  async function endStudySession() {
    if (isChecking || isEnding) return;

    const questionsAnswered = questionIndex + (submitted ? 1 : 0);
    const finalMastery = mastery.length ? mastery : visibleMastery;
    setSessionEndError(null);

    if (questionsAnswered === 0) {
      setSessionResults({
        ...createUnassessedReport(finalMastery),
        questionsAnswered,
      });
      setStage("results");
      return;
    }

    if (!studyInteractionId) {
      setSessionResults({
        ...createSampleReport(questionsAnswered, finalMastery, feedback),
        questionsAnswered,
      });
      setStage("results");
      return;
    }

    setIsEnding(true);
    try {
      const response = await fetch("/api/study/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          mastery: finalMastery,
          previousInteractionId: studyInteractionId,
          questionsAnswered,
        }),
      });
      const payload = (await response.json()) as
        | EndSessionResponse
        | { error?: string };

      if (!response.ok || !("report" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Cortex could not create the session report.",
        );
      }

      setStudyInteractionId(payload.interactionId);
      setSessionResults({ ...payload.report, questionsAnswered });
      setStage("results");
    } catch (error) {
      setSessionEndError(
        error instanceof Error
          ? error.message
          : "Cortex could not create the session report.",
      );
    } finally {
      setIsEnding(false);
    }
  }

  function studyAgain() {
    setStudyInteractionId(null);
    setCurrentQuestion(null);
    setQueuedQuestion(null);
    setMastery([]);
    setFeedback(null);
    setAnswer("");
    setGoal("");
    setSubmitted(false);
    setQuestionIndex(0);
    setSessionEndError(null);
    setSessionResults(null);
    setStage("goal");
  }

  function startWithNewMaterials() {
    setFiles([]);
    setSampleFileName(null);
    setAnalysis(null);
    setMaterialInteractionId(null);
    setStudyInteractionId(null);
    setSessionTitle("Study session");
    setCurrentQuestion(null);
    setQueuedQuestion(null);
    setMastery([]);
    setFeedback(null);
    setGoal("");
    setAnswer("");
    setSubmitted(false);
    setQuestionIndex(0);
    setSessionEndError(null);
    setSessionResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStage("upload");
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

      {(stage === "upload" || stage === "goal") && (
        <div className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8">
          <div className="grid grid-cols-3 gap-2" aria-label={`Step ${stageNumber} of 3`}>
            {[1, 2, 3].map((step) => (
              <div key={step} className={`h-1 rounded-full transition-colors ${step <= stageNumber ? "bg-[#e86f51]" : "bg-[#17231d]/10"}`} />
            ))}
          </div>
        </div>
      )}

      {stage === "upload" && (
        <section className="mx-auto grid max-w-[1180px] gap-12 px-5 pt-5 pb-12 sm:px-8 sm:pt-6 sm:pb-16 lg:grid-cols-[1.35fr_.65fr] lg:pt-7 lg:pb-20">
          <div>
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
                  {files.map((file, index) => (
                    <div key={`${file.name}-${file.size}`} className="group/file flex items-center gap-3 rounded-2xl border border-[#173e2e]/10 bg-white px-4 py-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0e8] text-[#d65e43]"><span className="size-4"><Icon name="file" /></span></span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{file.name}</span>
                      <span className="relative size-7 shrink-0">
                        {isAnalyzing ? (
                          <span
                            className="absolute inset-0 grid place-items-center rounded-full bg-[#e4eee7] text-[#527062]"
                            title="Gemini is analyzing this file"
                          >
                            <span className="size-3.5 animate-spin rounded-full border-2 border-[#527062]/25 border-t-[#527062]" />
                          </span>
                        ) : (
                          <>
                            <span className="absolute inset-0 hidden place-items-center rounded-full bg-[#dff1e5] text-[#24633e] sm:grid sm:group-hover/file:opacity-0 sm:group-focus-within/file:opacity-0">
                              <span className="size-3.5"><Icon name="check" /></span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute inset-0 grid place-items-center rounded-full bg-[#fff0e8] text-[#a9432f] opacity-100 transition-colors hover:bg-[#fbded1] sm:opacity-0 sm:group-hover/file:opacity-100 sm:group-focus-within/file:opacity-100"
                              aria-label={`Remove ${file.name}`}
                              title="Remove file"
                            >
                              <span className="size-4"><Icon name="close" /></span>
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {uploadError && (
                <p className="mt-3 rounded-2xl border border-[#e86f51]/25 bg-[#fff1e8] px-4 py-3 text-sm leading-6 text-[#a9432f]" role="alert">
                  {uploadError}
                </p>
              )}

              <button disabled={isAnalyzing} onClick={analyzeMaterials} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173e2e] px-6 py-4 font-semibold text-white shadow-[0_9px_20px_rgba(23,62,46,.18)] transition hover:-translate-y-0.5 hover:bg-[#1e4d39] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0">
                {isAnalyzing ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Gemini is reading your materials…
                  </>
                ) : (
                  <>
                    {files.length ? "Analyze with Gemini" : "Try with sample notes"}
                    <span className="size-5"><Icon name="arrow" /></span>
                  </>
                )}
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
        <section className="mx-auto max-w-[930px] px-5 pt-5 pb-12 sm:px-8 sm:pt-6 sm:pb-20">
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

              {studyError && (
                <p className="mt-6 rounded-2xl border border-[#e86f51]/25 bg-[#fff1e8] px-4 py-3 text-sm leading-6 text-[#a9432f]" role="alert">
                  {studyError}
                </p>
              )}

              <button disabled={!goal.trim() || isStarting} onClick={beginStudySession} className="mt-9 flex items-center gap-2 rounded-2xl bg-[#173e2e] px-7 py-4 font-semibold text-white shadow-[0_9px_20px_rgba(23,62,46,.18)] transition hover:-translate-y-0.5 hover:bg-[#1e4d39] disabled:cursor-wait disabled:opacity-35 disabled:hover:translate-y-0">
                {isStarting ? (
                  <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Gemini is building your session…</>
                ) : (
                  <>Build my session <span className="size-5"><Icon name="arrow" /></span></>
                )}
              </button>
            </div>

            <aside className="h-fit rounded-[24px] border border-[#173e2e]/10 bg-[#fffdf8] p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#e4eee7] text-[#173e2e]"><span className="size-5"><Icon name="brain" /></span></span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#7b8780]">Cortex found</p>
                  <p className="font-semibold">{analysis?.topics.length ?? 0} key topics</p>
                </div>
              </div>
              {analysis && (
                <>
                  <p className="mt-5 text-sm font-semibold leading-5">{analysis.courseTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#68756e]">{analysis.materialSummary}</p>
                  <div className="mt-4 rounded-2xl bg-[#fff3de] px-3.5 py-3 text-sm text-[#79531c]">
                    <span className="font-semibold">Planned session:</span>{" "}
                    {analysis.recommendedQuestionCount} questions based on the scope of these materials
                  </div>
                  <div className="mt-4 grid auto-rows-fr gap-2">
                    {analysis.topics.slice(0, 4).map((topic) => (
                      <span key={topic.name} title={topic.description} className="flex min-h-12 w-full items-center rounded-2xl bg-[#e8eee9] px-3.5 py-2 text-[11px] font-semibold leading-4 text-[#365247]">
                        {topic.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className="my-5 h-px bg-[#173e2e]/10" />
              <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#7b8780]">Materials</p>
              <div className="mt-3 space-y-3">
                {displayFileNames.map((file) => (
                  <div key={file} className="flex items-start gap-2.5 text-sm font-medium">
                    <span className="mt-0.5 size-4 shrink-0 text-[#d65e43]"><Icon name="file" /></span>
                    <span className="break-all">{file}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#eef8f0] p-4 text-sm font-semibold text-[#2f6842]">
                <Mark className="size-4" />
                {sampleFileName ? "Sample analysis" : "Analyzed with Gemini"}
              </div>
            </aside>
          </div>
        </section>
      )}

      {stage === "study" && (
        <section className="mx-auto max-w-[1180px] px-5 py-7 sm:px-8 sm:py-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d65e43]">Active session</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{sessionTitle}</h1>
            </div>
            <button
              disabled={isChecking || isEnding}
              onClick={endStudySession}
              className="flex items-center gap-2 rounded-xl border border-[#173e2e]/15 bg-white/50 px-4 py-2 text-sm font-semibold transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
            >
              {isEnding && <span className="size-3.5 animate-spin rounded-full border-2 border-[#173e2e]/20 border-t-[#173e2e]" />}
              {isEnding ? "Building report…" : "End session"}
            </button>
          </div>

          {sessionEndError && (
            <p className="mb-6 rounded-2xl border border-[#e86f51]/25 bg-[#fff1e8] px-4 py-3 text-sm leading-6 text-[#a9432f]" role="alert">
              {sessionEndError}
            </p>
          )}

          <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
            <aside className="order-2 space-y-4 lg:order-1">
              <div className="rounded-[22px] border border-[#173e2e]/10 bg-[#fffdf8] p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Session progress</p>
                  <span className="text-sm font-bold text-[#d65e43]">{progress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe4df]"><div className="h-full rounded-full bg-[#e86f51] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                <p className="mt-3 text-xs leading-5 text-[#738078]">Question {questionIndex + 1} of {targetQuestionCount}</p>
              </div>
              <div className="rounded-[22px] bg-[#173e2e] p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-[#9bb8a8]">Mastery</p>
                <div className="mt-5 space-y-4">
                  {visibleMastery.slice(0, 6).map(({ topic, score }) => (
                    <div key={topic}>
                      <div className="flex justify-between gap-2 text-xs"><span className="truncate">{topic}</span><span className="shrink-0 text-[#b9cbc1]">{score}%</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#f8c955] transition-all duration-500" style={{ width: `${score}%` }} /></div>
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
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[#d65e43]">{question.topic} · {question.difficulty}</p>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">{question.text}</h2>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-[#6a756e]">{question.hint}</p>

                <label className="mt-8 block">
                  <span className="mb-2 block text-sm font-semibold">Explain it in your own words</span>
                  <textarea value={answer} onChange={(event) => { setAnswer(event.target.value); setSubmitted(false); }} placeholder="Type your answer here..." className="min-h-40 w-full resize-none rounded-[20px] border border-[#173e2e]/15 bg-white p-5 leading-7 outline-none transition placeholder:text-[#a2aaa5] focus:border-[#e86f51] focus:ring-4 focus:ring-[#e86f51]/10" />
                </label>

                {!submitted ? (
                  <div className="mt-5">
                    {studyError && (
                      <p className="mb-4 rounded-2xl border border-[#e86f51]/25 bg-[#fff1e8] px-4 py-3 text-sm leading-6 text-[#a9432f]" role="alert">
                        {studyError}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <button disabled={isChecking} onClick={() => evaluateAnswer("I’m not sure yet.")} className="text-sm font-semibold text-[#65726b] underline decoration-[#65726b]/30 underline-offset-4 disabled:opacity-40">I’m not sure yet</button>
                      <button disabled={!answer.trim() || isChecking} onClick={() => evaluateAnswer()} className="flex items-center gap-2 rounded-2xl bg-[#173e2e] px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1e4d39] disabled:cursor-wait disabled:opacity-35 disabled:hover:translate-y-0">
                        {isChecking ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Checking with Gemini…</> : <>Check my answer <span className="size-5"><Icon name="arrow" /></span></>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`mt-6 rounded-[22px] border p-5 sm:p-6 ${feedbackTheme.card}`}>
                    <div className="flex gap-4">
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full text-white ${feedbackTheme.icon}`}><span className="size-5"><Icon name={feedbackTheme.iconName} /></span></span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-semibold ${feedbackTheme.headline}`}>{feedback?.headline}</p>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${feedbackTheme.badge}`}>{feedback?.score}%</span>
                        </div>
                        <p className={`mt-2 leading-7 ${feedbackTheme.explanation}`}>{feedback?.explanation}</p>
                        {feedback && (feedback.correctPoints.length > 0 || feedback.missingPoints.length > 0 || feedback.misconceptions.length > 0) && (
                          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                            {feedback.correctPoints.length > 0 && (
                              <div className="rounded-xl bg-white/55 p-3">
                                <p className="font-semibold text-[#2f6842]">What you got right</p>
                                <ul className="mt-1 list-disc space-y-1 pl-4 text-[#526a59]">{feedback.correctPoints.map((point) => <li key={point}>{point}</li>)}</ul>
                              </div>
                            )}
                            {(feedback.missingPoints.length > 0 || feedback.misconceptions.length > 0) && (
                              <div className="rounded-xl bg-white/55 p-3">
                                <p className="font-semibold text-[#8c4d38]">What to strengthen</p>
                                <ul className="mt-1 list-disc space-y-1 pl-4 text-[#6b5a52]">{[...feedback.missingPoints, ...feedback.misconceptions].map((point) => <li key={point}>{point}</li>)}</ul>
                              </div>
                            )}
                          </div>
                        )}
                        <p className={`mt-3 text-xs font-semibold uppercase tracking-[.1em] ${feedbackTheme.source}`}>
                          Grounded in {feedback?.sourceReference.document ?? displayFileNames[0] ?? "your materials"}{feedback?.sourceReference.page ? ` · Page ${feedback.sourceReference.page}` : ""}
                        </p>
                      </div>
                    </div>
                    {questionIndex + 1 >= targetQuestionCount ? (
                      <button onClick={() => { setStage("upload"); setAnswer(""); setFeedback(null); setSubmitted(false); }} className="mt-5 flex items-center gap-2 rounded-xl bg-[#2f7748] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28663e]">
                        Finish session <span className="size-4"><Icon name="check" /></span>
                      </button>
                    ) : (
                      <button onClick={nextQuestion} className="mt-5 flex items-center gap-2 rounded-xl bg-[#2f7748] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28663e]">Continue <span className="size-4"><Icon name="arrow" /></span></button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {stage === "results" && sessionResults && (
        <section className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
          <div className="overflow-hidden rounded-[30px] bg-[#173e2e] p-7 text-white shadow-[0_28px_80px_rgba(23,62,46,.22)] sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#f8c955]">
                  <span className="size-1.5 rounded-full bg-[#f8c955]" />
                  Session complete
                </div>
                <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">
                  {sessionResults.headline}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[#d7e2dc] sm:text-lg sm:leading-8">
                  {sessionResults.overview}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                <button onClick={studyAgain} className="rounded-2xl bg-[#f8c955] px-5 py-3 font-semibold text-[#173e2e] transition hover:-translate-y-0.5 hover:bg-[#ffda73]">
                  Set a new goal
                </button>
                <button onClick={startWithNewMaterials} className="rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                  Use new materials
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-[180px_180px_1fr]">
            <div className="rounded-[22px] border border-[#173e2e]/10 bg-[#fffdf8] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b8780]">Overall score</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[#d65e43]">
                {sessionResults.overallScore === null ? "—" : `${sessionResults.overallScore}%`}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#738078]">
                {sessionResults.overallScore === null ? "Not enough evidence yet" : "Across evaluated answers"}
              </p>
            </div>

            <div className="rounded-[22px] border border-[#173e2e]/10 bg-[#fffdf8] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b8780]">Completed</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[#173e2e]">{sessionResults.questionsAnswered}</p>
              <p className="mt-2 text-xs leading-5 text-[#738078]">
                {sessionResults.questionsAnswered === 1 ? "Question answered" : "Questions answered"}
              </p>
            </div>

            <div className="rounded-[22px] border border-[#173e2e]/10 bg-[#fffdf8] p-5 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b8780]">Your study goal</p>
              <p className="mt-3 line-clamp-3 font-semibold leading-6 text-[#365247]">{goal}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[#6dab7d]/25 bg-[#eef8f0] p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-[#2f7748] text-white"><span className="size-4"><Icon name="check" /></span></span>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#1f5d37]">What went well</h2>
              </div>
              {sessionResults.strengths.length ? (
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[#456250]">
                  {sessionResults.strengths.map((strength) => (
                    <li key={strength} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#2f7748]" />{strength}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm leading-6 text-[#5f7867]">Complete a few questions so Cortex can identify demonstrated strengths.</p>
              )}
            </div>

            <div className="rounded-[24px] border border-[#e86f51]/20 bg-[#fff1e8] p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-[#e86f51] text-white"><span className="text-lg font-bold">↑</span></span>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#8c3f2e]">What to improve</h2>
              </div>
              {sessionResults.areasToImprove.length ? (
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[#6b5149]">
                  {sessionResults.areasToImprove.map((area) => (
                    <li key={area} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#e86f51]" />{area}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm leading-6 text-[#7f6258]">Complete a few questions so Cortex can identify specific improvement areas.</p>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-[24px] border border-[#173e2e]/10 bg-[#fffdf8] p-6 sm:p-7">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Topic results</h2>
              <div className="mt-6 space-y-5">
                {sessionResults.topicResults.map(({ topic, score, note }) => (
                  <div key={topic}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold">{topic}</p>
                      <span className="text-sm font-bold text-[#536159]">{score}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2e6e2]">
                      <div
                        className={`h-full rounded-full ${score >= 70 ? "bg-[#2f7748]" : score >= 40 ? "bg-[#e5a52e]" : "bg-[#e86f51]"}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#738078]">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-fit rounded-[24px] bg-[#173e2e] p-6 text-white sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f8c955]">Recommended next steps</p>
              <ol className="mt-6 space-y-5">
                {sessionResults.nextSteps.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-xs text-[#f8c955]">{index + 1}</span>
                    <span className="text-sm leading-6 text-[#d7e2dc]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {materialWarning && (
        <WarningDialog
          id="material-warning"
          title="These materials may belong in separate sessions"
          description={`${materialWarning} You can still study them together, but a more focused set of materials may produce a better session.`}
          secondaryLabel="Review files"
          primaryLabel="Continue anyway"
          onSecondary={reviewMaterials}
          onPrimary={continueWithMixedMaterials}
        />
      )}

      {goalWarning && (
        <WarningDialog
          id="goal-warning"
          title="This goal may not match your materials"
          description={`${goalWarning.goalAlignment.reason || "Your study goal appears to focus on a topic that is not covered by the uploaded materials."} You can continue, but Cortex will keep its questions grounded in your files.`}
          secondaryLabel="Edit goal"
          primaryLabel="Continue anyway"
          onSecondary={editStudyGoal}
          onPrimary={continueWithOffTopicGoal}
        />
      )}
    </main>
  );
}
