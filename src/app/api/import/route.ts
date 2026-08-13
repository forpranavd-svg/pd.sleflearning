import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { parseImportFile } from "@/lib/import/parseImportFile";
import { MAX_IMPORT_FILE_BYTES } from "@/lib/import/schema";

// Processed synchronously in the request/response cycle rather than via the
// Job model's background-processing design (#6/#11) — the 2000-row cap from
// schema.ts keeps a full import well within a normal request timeout. The
// Job row still records the import for audit/history purposes.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { success } = await checkRateLimit("import", user.id, 10, "1 h");
  if (!success) {
    return NextResponse.json({ error: "Too many imports. Try again in a bit." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The file is empty." }, { status: 400 });
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return NextResponse.json(
      { error: `File is too large. The limit is ${Math.floor(MAX_IMPORT_FILE_BYTES / (1024 * 1024))}MB.` },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const result = parseImportFile(buffer, user.role ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: "The file has errors.", rowErrors: result.errors }, { status: 400 });
  }

  const rowsWithIds = result.rows.map((row) => ({ id: randomUUID(), row }));

  const questionsData = rowsWithIds.map(({ id, row }) => ({
    id,
    topic: row.topic,
    subTopic: row.subTopic,
    question: row.question,
    answer: row.answer,
    sourceSheet: "import",
    ownerId: user.id,
    difficultyLevel: row.difficultyLevel,
    targetRoles: row.targetRoles,
    chanceOfBeingAsked: row.chanceOfBeingAsked,
    questionVisibility: row.questionVisibility,
    answerVisibility: row.answerVisibility,
    source: "import",
  }));

  const userQuestionsData = rowsWithIds.map(({ id, row }) => ({
    userId: user.id,
    questionId: id,
    addedVia: "own" as const,
    userAnswerConfidence: row.userAnswerConfidence,
  }));

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      type: "csv_import",
      status: "running",
      input: { fileName: file.name, rowCount: questionsData.length },
      startedAt: new Date(),
    },
  });

  try {
    await prisma.$transaction([
      prisma.question.createMany({ data: questionsData }),
      prisma.userQuestion.createMany({ data: userQuestionsData }),
    ]);

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "done", result: { imported: questionsData.length }, finishedAt: new Date() },
    });

    return NextResponse.json({ imported: questionsData.length });
  } catch (err) {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
        finishedAt: new Date(),
      },
    });
    return NextResponse.json({ error: "Something went wrong saving your questions. Try again." }, { status: 500 });
  }
}
