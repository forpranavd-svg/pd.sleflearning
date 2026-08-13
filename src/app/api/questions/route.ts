import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildQuestionWhere, redactPrivateAnswer } from "@/lib/questionFilters";
import { getCurrentUser } from "@/lib/auth/session";

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const viewer = await getCurrentUser();
  const where = buildQuestionWhere(searchParams, viewer?.id);

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: [{ topic: "asc" }, { subTopic: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({
    questions: questions.map((q) => redactPrivateAnswer(q, viewer?.id ?? null)),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
