import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.questionId !== "string" || typeof body.userAnswer !== "string") {
    return NextResponse.json(
      { error: "Expected JSON body { questionId: string, userAnswer: string }" },
      { status: 400 }
    );
  }

  if (!body.userAnswer.trim()) {
    return NextResponse.json({ error: "Answer cannot be empty" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI feedback is not configured. Set ANTHROPIC_API_KEY on the server." },
      { status: 501 }
    );
  }

  const question = await prisma.question.findUnique({ where: { id: body.questionId } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const client = new Anthropic();

  const referenceAnswer = question.answer
    ? `\n\nA reference answer for context (the user's answer does not need to match it word for word):\n${question.answer}`
    : "";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are an interview coach giving feedback on a spoken/written practice answer to a technical or behavioral interview question. " +
      "Be direct and specific. Point out what was strong, what was missing or incorrect, and how to tighten the answer. " +
      "Keep the whole response under 200 words. Format as short paragraphs or a few bullet points, no headers. " +
      "Respond in Markdown (e.g. **bold**, bullet lists, ```mermaid fenced blocks for diagrams) since it is rendered as Markdown.",
    messages: [
      {
        role: "user",
        content:
          `Question (topic: ${question.topic}${question.subTopic ? ` / ${question.subTopic}` : ""}):\n${question.question}` +
          referenceAnswer +
          `\n\nMy answer:\n${body.userAnswer}\n\nGive me feedback on my answer.`,
      },
    ],
  });

  const feedback = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (response.stop_reason === "refusal" || !feedback) {
    return NextResponse.json({ error: "The AI declined to respond to this request." }, { status: 502 });
  }

  const attempt = await prisma.practiceAttempt.create({
    data: {
      questionId: question.id,
      userAnswer: body.userAnswer,
      aiFeedback: feedback,
    },
  });

  await prisma.question.update({
    where: { id: question.id },
    data: { timesPracticed: { increment: 1 }, lastPracticedAt: new Date() },
  });

  return NextResponse.json({ feedback, attemptId: attempt.id });
}
