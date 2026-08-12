import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildQuestionWhere } from "@/lib/questionFilters";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const where = buildQuestionWhere(searchParams);

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

  return NextResponse.json({ question });
}
