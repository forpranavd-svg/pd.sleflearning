import type { Prisma } from "@/generated/prisma/client";

function multiValue(searchParams: URLSearchParams, key: string): string[] | undefined {
  const raw = searchParams.get(key);
  if (!raw) return undefined;
  const values = raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

/**
 * Builds a Prisma where-clause for Question from URL search params shared by
 * the list and random-pick endpoints. Supported params (all optional):
 *   topic, subTopic, probabilityTier, level, infraVsDev, scope  - comma-separated, OR'd within a field
 *   reviewNeeded=true|false                                     - filters on noReviewNeeded
 *   q                                                            - free-text search over question/answer
 */
export function buildQuestionWhere(searchParams: URLSearchParams): Prisma.QuestionWhereInput {
  const where: Prisma.QuestionWhereInput = {};

  const topic = multiValue(searchParams, "topic");
  if (topic) where.topic = { in: topic };

  const subTopic = multiValue(searchParams, "subTopic");
  if (subTopic) where.subTopic = { in: subTopic };

  const probabilityTier = multiValue(searchParams, "probabilityTier");
  if (probabilityTier) where.probabilityTier = { in: probabilityTier };

  const level = multiValue(searchParams, "level");
  if (level) where.level = { in: level };

  const infraVsDev = multiValue(searchParams, "infraVsDev");
  if (infraVsDev) where.infraVsDev = { in: infraVsDev };

  const scope = multiValue(searchParams, "scope");
  if (scope) where.scope = { in: scope };

  const reviewNeeded = searchParams.get("reviewNeeded");
  if (reviewNeeded === "true") where.noReviewNeeded = false;
  if (reviewNeeded === "false") where.noReviewNeeded = true;

  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { question: { contains: q, mode: "insensitive" } },
      { answer: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}
