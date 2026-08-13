import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redactPrivateAnswer } from "@/lib/questionFilters";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const question = await prisma.question.findUnique({ where: { id } });

  // A Private question is invisible to anyone but its owner — 404 either
  // way so the response can't be used to confirm a private id exists.
  if (!question || (question.questionVisibility === "Private" && question.ownerId !== (viewer?.id ?? null))) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json({ question: redactPrivateAnswer(question, viewer?.id ?? null) });
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

  // Owned questions (#14 imports, #16 AI-generated) can only be edited by
  // their owner. System/seed questions (ownerId null) keep today's open-edit
  // behavior — the shared list predates accounts and isn't owned by anyone.
  if (existing.ownerId !== null) {
    const viewer = await getCurrentUser();
    if (!viewer || viewer.id !== existing.ownerId) {
      return NextResponse.json({ error: "You don't have permission to edit this question." }, { status: 403 });
    }
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
