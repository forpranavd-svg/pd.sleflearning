import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

// Adds a question to the signed-in user's list (#15). Idempotent — adding an
// already-listed question is a no-op, not an error. Doesn't duplicate the
// Question row; multiple users can list the same public question.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to build a list." }, { status: 401 });
  }

  const question = await prisma.question.findUnique({ where: { id } });
  if (
    !question ||
    (question.questionVisibility === "Private" && question.ownerId !== user.id)
  ) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  await prisma.userQuestion.upsert({
    where: { userId_questionId: { userId: user.id, questionId: id } },
    create: {
      userId: user.id,
      questionId: id,
      addedVia: question.ownerId === user.id ? "own" : "public",
    },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  await prisma.userQuestion.deleteMany({ where: { userId: user.id, questionId: id } });
  return NextResponse.json({ ok: true });
}
