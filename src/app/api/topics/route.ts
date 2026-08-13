import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns the distinct filter values used to populate the browse page's
// filter controls: topic -> subtopics, plus the small enum-like fields.
export async function GET() {
  const rows = await prisma.question.findMany({
    select: { topic: true, subTopic: true },
    distinct: ["topic", "subTopic"],
    orderBy: [{ topic: "asc" }, { subTopic: "asc" }],
  });

  const topicMap = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!topicMap.has(row.topic)) topicMap.set(row.topic, new Set());
    if (row.subTopic) topicMap.get(row.topic)!.add(row.subTopic);
  }

  const topics = Array.from(topicMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([topic, subTopics]) => ({
      topic,
      subTopics: Array.from(subTopics).sort(),
    }));

  const [probabilityTiers, levels, infraVsDevValues, scopes] = await Promise.all([
    prisma.question.findMany({
      select: { probabilityTier: true },
      distinct: ["probabilityTier"],
    }),
    prisma.question.findMany({ select: { level: true }, distinct: ["level"] }),
    prisma.question.findMany({
      select: { infraVsDev: true },
      distinct: ["infraVsDev"],
    }),
    prisma.question.findMany({ select: { scope: true }, distinct: ["scope"] }),
  ]);

  const compact = (values: (string | null)[]) =>
    Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort();

  return NextResponse.json({
    topics,
    probabilityTiers: compact(probabilityTiers.map((r) => r.probabilityTier)),
    levels: compact(levels.map((r) => r.level)),
    infraVsDevValues: compact(infraVsDevValues.map((r) => r.infraVsDev)),
    scopes: compact(scopes.map((r) => r.scope)),
    // Fixed list (not derived from data) for the public-bank role filter (#15).
    // "My Role" isn't included — it's an import-time default, not a browsable value.
    roles: ["Developer", "CTO", "Architect", "Scrum Master", "Data Engineer", "AI Engineer"],
  });
}
