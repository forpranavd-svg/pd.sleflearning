import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const [ownedQuestions, listItems, practiceAttempts, jobs] = await Promise.all([
    prisma.question.findMany({ where: { ownerId: user.id } }),
    prisma.userQuestion.findMany({ where: { userId: user.id }, include: { question: true } }),
    prisma.practiceAttempt.findMany({ where: { userId: user.id }, include: { question: true } }),
    prisma.job.findMany({ where: { userId: user.id } }),
  ]);

  const data = {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    },
    ownedQuestions,
    listItems,
    practiceAttempts,
    jobs,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="self-learning-data-export.json"`,
    },
  });
}
