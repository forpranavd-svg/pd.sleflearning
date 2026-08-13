import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  return NextResponse.json({ question });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const hasNoReviewNeeded = !!body && typeof body.noReviewNeeded === "boolean";
  const hasAnswer = !!body && typeof body.answer === "string";

  if (!hasNoReviewNeeded && !hasAnswer) {
    return NextResponse.json(
      { error: "Expected JSON body with noReviewNeeded (boolean) and/or answer (string)" },
      { status: 400 }
    );
  }

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const question = await prisma.question.update({
    where: { id },
    data: {
      ...(hasNoReviewNeeded ? { noReviewNeeded: body.noReviewNeeded } : {}),
      ...(hasAnswer ? { answer: body.answer } : {}),
    },
  });

  return NextResponse.json({ question });
}
