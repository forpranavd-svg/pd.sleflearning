import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildQuestionWhere, redactPrivateAnswer } from "@/lib/questionFilters";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const viewer = await getCurrentUser();
  const where = buildQuestionWhere(searchParams, viewer?.id);

  // Practice mode excludes questions marked "no review needed" unless the
  // caller explicitly asked for a different reviewNeeded filter.
  if (!searchParams.has("reviewNeeded")) {
    where.noReviewNeeded = false;
  }

  const total = await prisma.question.count({ where });
  if (total === 0) {
    return NextResponse.json({ question: null });
  }

  const skip = Math.floor(Math.random() * total);
  const [question] = await prisma.question.findMany({
    where,
    orderBy: { id: "asc" },
    skip,
    take: 1,
  });

  return NextResponse.json({ question: question ? redactPrivateAnswer(question, viewer?.id ?? null) : null });
}
