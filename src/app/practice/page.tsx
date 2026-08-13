"use client";

import { useEffect, useState } from "react";
import type { Question, TopicsResponse } from "@/lib/types";
import { Markdown } from "@/components/Markdown";

export default function PracticePage() {
  const [topicsData, setTopicsData] = useState<TopicsResponse | null>(null);
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then(setTopicsData);
  }, []);

  async function fetchRandomQuestion(selectedTopic: string) {
    setLoadingQuestion(true);
    setAnswer("");
    setFeedback(null);
    setError(null);
    const params = new URLSearchParams();
    if (selectedTopic) params.set("topic", selectedTopic);
    const res = await fetch(`/api/questions/random?${params.toString()}`);
    const data = await res.json();
    setQuestion(data.question);
    setLoadingQuestion(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/param-change pattern
    fetchRandomQuestion(topic);
  }, [topic]);

  async function submitAnswer() {
    if (!question || !answer.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, userAnswer: answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong getting feedback.");
      } else {
        setFeedback(data.feedback);
      }
    } catch {
      setError("Something went wrong getting feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">Any topic</option>
          {topicsData?.topics.map((t) => (
            <option key={t.topic} value={t.topic}>
              {t.topic}
            </option>
          ))}
        </select>
      </div>

      {loadingQuestion ? (
        <p className="mt-10 text-sm text-foreground/50">Picking a question…</p>
      ) : !question ? (
        <p className="mt-10 text-sm text-foreground/50">
          No questions available for this topic. Try another topic, or mark fewer questions as
          &ldquo;no review needed&rdquo; on the Browse page.
        </p>
      ) : (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground/50">
            <span className="rounded bg-black/[.06] px-1.5 py-0.5 dark:bg-white/[.08]">
              {question.topic}
            </span>
            {question.subTopic && (
              <span className="rounded bg-black/[.06] px-1.5 py-0.5 dark:bg-white/[.08]">
                {question.subTopic}
              </span>
            )}
            {question.scope && <span>{question.scope}</span>}
          </div>
          <p className="mt-3 text-lg font-medium">{question.question}</p>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here…"
            rows={8}
            className="mt-4 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
          />

          <div className="mt-4 flex gap-3">
            <button
              onClick={submitAnswer}
              disabled={submitting || !answer.trim()}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? "Getting feedback…" : "Submit for feedback"}
            </button>
            <button
              onClick={() => fetchRandomQuestion(topic)}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
            >
              Skip / Next question
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

          {feedback && (
            <div className="mt-6 rounded-lg border border-black/10 bg-black/[.02] p-4 dark:border-white/10 dark:bg-white/[.03]">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                AI Feedback
              </p>
              <Markdown>{feedback}</Markdown>
              <button
                onClick={() => fetchRandomQuestion(topic)}
                className="mt-4 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Next question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
