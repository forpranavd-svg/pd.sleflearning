import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body.noReviewNeeded !== "boolean") {
    return NextResponse.json(
      { error: "Expected JSON body { noReviewNeeded: boolean }" },
      { status: 400 }
    );
  }

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const question = await prisma.question.update({
    where: { id },
    data: { noReviewNeeded: body.noReviewNeeded },
  });

  return NextResponse.json({ question });
}
