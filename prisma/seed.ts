import "dotenv/config";
import path from "node:path";
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

const DATA_FILE = process.env.DATA_FILE ?? path.join(__dirname, "..", "data", "Study.xlsx");

// sheet name -> tag stored on each imported Question
const SHEETS_TO_IMPORT: Record<string, string> = {
  "Arch Focused QA": "Arch Focused QA",
  "Comprehensive list": "Comprehensive list",
};

type SheetRow = {
  Topic?: string;
  "Sub Topic"?: string;
  OProb?: string;
  DLevel?: string;
  InfraVsDev?: string;
  "Review 1 day Before Interview"?: string;
  Scope?: string;
  Question?: string;
  Answer?: string;
};

function clean(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

async function importSheet(workbook: XLSX.WorkBook, sheetName: string, sourceTag: string) {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.warn(`Sheet "${sheetName}" not found in workbook, skipping.`);
    return 0;
  }

  const rows = XLSX.utils.sheet_to_json<SheetRow>(worksheet, { defval: null });

  const questions = rows
    .map((row) => ({
      topic: clean(row.Topic),
      subTopic: clean(row["Sub Topic"]),
      probabilityTier: clean(row.OProb),
      level: clean(row.DLevel),
      infraVsDev: clean(row.InfraVsDev),
      reviewBeforeInterview: clean(row["Review 1 day Before Interview"])?.toLowerCase() === "yes",
      scope: clean(row.Scope),
      question: clean(row.Question),
      answer: clean(row.Answer),
      sourceSheet: sourceTag,
    }))
    .filter((q): q is typeof q & { topic: string; question: string } => Boolean(q.topic && q.question));

  // Re-importing is idempotent: wipe previous rows from this sheet, then reinsert.
  await prisma.question.deleteMany({ where: { sourceSheet: sourceTag } });
  if (questions.length > 0) {
    await prisma.question.createMany({ data: questions });
  }

  console.log(`Imported ${questions.length} questions from "${sheetName}".`);
  return questions.length;
}

async function main() {
  console.log(`Reading workbook: ${DATA_FILE}`);
  const workbook = XLSX.readFile(DATA_FILE);

  let total = 0;
  for (const [sheetName, sourceTag] of Object.entries(SHEETS_TO_IMPORT)) {
    total += await importSheet(workbook, sheetName, sourceTag);
  }

  console.log(`Done. ${total} questions total in database.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
