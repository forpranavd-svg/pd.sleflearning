"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question, TopicsResponse } from "@/lib/types";

type Filters = {
  topic: string;
  subTopic: string;
  probabilityTier: string;
  level: string;
  infraVsDev: string;
  scope: string;
  reviewNeeded: string; // "", "true", "false"
  q: string;
};

const emptyFilters: Filters = {
  topic: "",
  subTopic: "",
  probabilityTier: "",
  level: "",
  infraVsDev: "",
  scope: "",
  reviewNeeded: "",
  q: "",
};

function buildQuery(filters: Filters, page: number) {
  const params = new URLSearchParams();
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.subTopic) params.set("subTopic", filters.subTopic);
  if (filters.probabilityTier) params.set("probabilityTier", filters.probabilityTier);
  if (filters.level) params.set("level", filters.level);
  if (filters.infraVsDev) params.set("infraVsDev", filters.infraVsDev);
  if (filters.scope) params.set("scope", filters.scope);
  if (filters.reviewNeeded) params.set("reviewNeeded", filters.reviewNeeded);
  if (filters.q) params.set("q", filters.q);
  params.set("page", String(page));
  return params.toString();
}

export default function QuestionsPage() {
  const [topicsData, setTopicsData] = useState<TopicsResponse | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then(setTopicsData);
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((f) => ({ ...f, q: searchInput }));
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-filter-change pattern
    setLoading(true);
    fetch(`/api/questions?${buildQuery(filters, page)}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLoading(false);
      });
  }, [filters, page]);

  const subTopicOptions = useMemo(() => {
    if (!topicsData) return [];
    if (!filters.topic) {
      return Array.from(new Set(topicsData.topics.flatMap((t) => t.subTopics))).sort();
    }
    return topicsData.topics.find((t) => t.topic === filters.topic)?.subTopics ?? [];
  }, [topicsData, filters.topic]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value, ...(key === "topic" ? { subTopic: "" } : {}) }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setSearchInput("");
    setPage(1);
  }

  async function toggleNoReview(question: Question) {
    const next = !question.noReviewNeeded;
    setQuestions((qs) => qs.map((q) => (q.id === question.id ? { ...q, noReviewNeeded: next } : q)));
    await fetch(`/api/questions/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noReviewNeeded: next }),
    });
  }

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Browse Questions</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {loading ? "Loading…" : `${total} question${total === 1 ? "" : "s"} matching your filters`}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <input
          type="text"
          placeholder="Search questions & answers…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="col-span-2 rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40 sm:col-span-3 lg:col-span-4"
        />

        <select
          value={filters.topic}
          onChange={(e) => updateFilter("topic", e.target.value)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">All Topics</option>
          {topicsData?.topics.map((t) => (
            <option key={t.topic} value={t.topic}>
              {t.topic}
            </option>
          ))}
        </select>

        <select
          value={filters.subTopic}
          onChange={(e) => updateFilter("subTopic", e.target.value)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">All Subtopics</option>
          {subTopicOptions.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        <select
          value={filters.probabilityTier}
          onChange={(e) => updateFilter("probabilityTier", e.target.value)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">All Probability Tiers</option>
          {topicsData?.probabilityTiers.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={filters.level}
          onChange={(e) => updateFilter("level", e.target.value)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">All Levels</option>
          {topicsData?.levels.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={filters.infraVsDev}
          onChange={(e) => updateFilter("infraVsDev", e.target.value)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">Infra / Dev / Both</option>
          {topicsData?.infraVsDevValues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={filters.scope}
          onChange={(e) => updateFilter("scope", e.target.value)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">Broad / Specific</option>
          {topicsData?.scopes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={filters.reviewNeeded}
          onChange={(e) => updateFilter("reviewNeeded", e.target.value)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="">All Review Statuses</option>
          <option value="true">Needs Review</option>
          <option value="false">No Review Needed</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="rounded-md border border-black/10 px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            Clear filters
          </button>
        )}
      </div>

      <ul className="mt-8 flex flex-col gap-3">
        {questions.map((question) => {
          const isOpen = !!expanded[question.id];
          return (
            <li
              key={question.id}
              className="rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground/50">
                    <span className="rounded bg-black/[.06] px-1.5 py-0.5 dark:bg-white/[.08]">
                      {question.topic}
                    </span>
                    {question.subTopic && (
                      <span className="rounded bg-black/[.06] px-1.5 py-0.5 dark:bg-white/[.08]">
                        {question.subTopic}
                      </span>
                    )}
                    {question.probabilityTier && <span>{question.probabilityTier}</span>}
                    {question.level && <span>&middot; {question.level}</span>}
                    {question.scope && <span>&middot; {question.scope}</span>}
                    {question.noReviewNeeded && (
                      <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-green-700 dark:text-green-400">
                        No review needed
                      </span>
                    )}
                  </div>
                  <button
                    className="mt-2 text-left text-base font-medium"
                    onClick={() => setExpanded((e) => ({ ...e, [question.id]: !isOpen }))}
                  >
                    {question.question}
                  </button>
                  {isOpen && (
                    <div className="mt-3 whitespace-pre-wrap text-sm text-foreground/70">
                      {question.answer ?? (
                        <span className="italic text-foreground/40">No answer recorded yet.</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleNoReview(question)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    question.noReviewNeeded
                      ? "border-black/10 text-foreground/60 hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
                      : "border-black/10 hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
                  }`}
                >
                  {question.noReviewNeeded ? "Mark needs review" : "Mark no review needed"}
                </button>
              </div>
            </li>
          );
        })}
        {!loading && questions.length === 0 && (
          <li className="rounded-lg border border-dashed border-black/10 p-8 text-center text-sm text-foreground/50 dark:border-white/15">
            No questions match these filters.
          </li>
        )}
      </ul>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-black/10 px-3 py-1.5 disabled:opacity-40 dark:border-white/15"
          >
            Previous
          </button>
          <span className="text-foreground/60">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-black/10 px-3 py-1.5 disabled:opacity-40 dark:border-white/15"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
