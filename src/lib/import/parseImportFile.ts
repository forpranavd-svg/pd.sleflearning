import * as XLSX from "xlsx";
import {
  DIFFICULTY_LEVELS,
  CHANCE_LEVELS,
  VISIBILITY_VALUES,
  ROLE_VALUES,
  CONFIDENCE_LABELS,
  MAX_IMPORT_ROWS,
  MAX_FIELD_LENGTH,
  type ImportedRow,
  type RowError,
} from "./schema";

type RawRow = Record<string, unknown>;

type Canonical =
  | "topic"
  | "subTopic"
  | "question"
  | "answer"
  | "difficultyLevel"
  | "targetRoles"
  | "chanceOfBeingAsked"
  | "userAnswerConfidence"
  | "answerVisibility"
  | "questionVisibility";

// Header matching is case/space-insensitive so common spreadsheet variations
// ("Sub Topic", "SubTopic", "Difficulty") all resolve to the same field.
const HEADER_ALIASES: Record<string, Canonical> = {
  topic: "topic",
  question: "question",
  answer: "answer",
  "sub topic": "subTopic",
  subtopic: "subTopic",
  "difficulty level": "difficultyLevel",
  difficulty: "difficultyLevel",
  "target roles": "targetRoles",
  "target role": "targetRoles",
  role: "targetRoles",
  roles: "targetRoles",
  "chance of being asked": "chanceOfBeingAsked",
  chance: "chanceOfBeingAsked",
  "user answer confidence": "userAnswerConfidence",
  confidence: "userAnswerConfidence",
  "answer visibility": "answerVisibility",
  "question visibility": "questionVisibility",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function cellToString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function matchEnum<T extends string>(value: string, options: readonly T[]): T | null {
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  for (const option of options) {
    if (option.toLowerCase() === normalized) return option;
  }
  return null;
}

function parseTargetRoles(raw: string | null): { roles: string[]; error?: string } {
  if (!raw) return { roles: [] };
  const parts = raw
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const roles: string[] = [];
  for (const part of parts) {
    const matched = matchEnum(part, ROLE_VALUES);
    if (!matched) {
      return {
        roles: [],
        error: `Unknown target role "${part}". Expected one of: ${ROLE_VALUES.join(", ")}.`,
      };
    }
    if (!roles.includes(matched)) roles.push(matched);
  }
  return { roles };
}

function parseConfidence(raw: string | null): { value: number; error?: string } {
  if (!raw) return { value: 0 };
  const trimmed = raw.trim();
  const asNumber = Number(trimmed);
  if (trimmed !== "" && !Number.isNaN(asNumber)) {
    if (!Number.isInteger(asNumber) || asNumber < 0 || asNumber > 5) {
      return {
        value: 0,
        error: `User Answer Confidence "${raw}" must be a whole number from 0 to 5.`,
      };
    }
    return { value: asNumber };
  }
  const key = Object.keys(CONFIDENCE_LABELS).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase().replace(/\s+/g, "")
  );
  if (!key) {
    return {
      value: 0,
      error: `Unknown User Answer Confidence "${raw}". Expected a number 0-5 or one of: ${Object.keys(
        CONFIDENCE_LABELS
      ).join(", ")}.`,
    };
  }
  return { value: CONFIDENCE_LABELS[key] };
}

export type ParseResult = { ok: true; rows: ImportedRow[] } | { ok: false; errors: RowError[] };

/**
 * Parses an uploaded .xlsx/.xls/.csv file into validated ImportedRow objects.
 * Validation is all-or-nothing: if any row has an error, no rows are
 * returned, so the caller never has to partially commit an import (#11).
 *
 * `resolveMyRole` is the importing user's own User.role, used to resolve the
 * "My Role" sentinel in Target Roles. If the user hasn't set a role yet,
 * "My Role" is dropped from that row's roles rather than kept literally —
 * an empty targetRoles list means "applies to everyone" everywhere else in
 * the app, which is the closest available meaning.
 */
export function parseImportFile(buffer: ArrayBuffer, resolveMyRole: string | null): ParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return {
      ok: false,
      errors: [{ row: 0, message: "Could not read the file. Make sure it's a valid .xlsx, .xls, or .csv file." }],
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ok: false, errors: [{ row: 0, message: "The file has no sheets." }] };
  }
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: null });

  if (rawRows.length === 0) {
    return { ok: false, errors: [{ row: 0, message: "The file has no data rows." }] };
  }
  if (rawRows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      errors: [
        { row: 0, message: `Too many rows (${rawRows.length}). The limit is ${MAX_IMPORT_ROWS} per import.` },
      ],
    };
  }

  const errors: RowError[] = [];
  const rows: ImportedRow[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // +1 for 1-indexing, +1 for the header row
    const fields: Partial<Record<Canonical, string | null>> = {};
    for (const [header, value] of Object.entries(rawRow)) {
      const canonical = HEADER_ALIASES[normalizeHeader(header)];
      if (!canonical) continue;
      const str = cellToString(value);
      if (str && str.length > MAX_FIELD_LENGTH) {
        errors.push({ row: rowNumber, message: `"${header}" is too long (max ${MAX_FIELD_LENGTH} characters).` });
        continue;
      }
      fields[canonical] = str;
    }

    const topic = fields.topic ?? null;
    const question = fields.question ?? null;
    const answer = fields.answer ?? null;

    if (!topic) errors.push({ row: rowNumber, message: "Topic is required." });
    if (!question) errors.push({ row: rowNumber, message: "Question is required." });
    if (!answer) errors.push({ row: rowNumber, message: "Answer is required." });
    if (!topic || !question || !answer) return;

    let difficultyLevel: (typeof DIFFICULTY_LEVELS)[number] = "Medium";
    if (fields.difficultyLevel) {
      const matched = matchEnum(fields.difficultyLevel, DIFFICULTY_LEVELS);
      if (!matched) {
        errors.push({
          row: rowNumber,
          message: `Unknown Difficulty Level "${fields.difficultyLevel}". Expected one of: ${DIFFICULTY_LEVELS.join(", ")}.`,
        });
      } else {
        difficultyLevel = matched;
      }
    }

    let chanceOfBeingAsked: (typeof CHANCE_LEVELS)[number] = "Medium";
    if (fields.chanceOfBeingAsked) {
      const matched = matchEnum(fields.chanceOfBeingAsked, CHANCE_LEVELS);
      if (!matched) {
        errors.push({
          row: rowNumber,
          message: `Unknown Chance Of Being Asked "${fields.chanceOfBeingAsked}". Expected one of: ${CHANCE_LEVELS.join(", ")}.`,
        });
      } else {
        chanceOfBeingAsked = matched;
      }
    }

    let questionVisibility: (typeof VISIBILITY_VALUES)[number] = "Public";
    if (fields.questionVisibility) {
      const matched = matchEnum(fields.questionVisibility, VISIBILITY_VALUES);
      if (!matched) {
        errors.push({
          row: rowNumber,
          message: `Unknown Question Visibility "${fields.questionVisibility}". Expected Public or Private.`,
        });
      } else {
        questionVisibility = matched;
      }
    }

    let answerVisibility: (typeof VISIBILITY_VALUES)[number] = "Private";
    if (fields.answerVisibility) {
      const matched = matchEnum(fields.answerVisibility, VISIBILITY_VALUES);
      if (!matched) {
        errors.push({
          row: rowNumber,
          message: `Unknown Answer Visibility "${fields.answerVisibility}". Expected Public or Private.`,
        });
      } else {
        answerVisibility = matched;
      }
    }

    const { roles: targetRoles, error: rolesError } = parseTargetRoles(fields.targetRoles ?? null);
    if (rolesError) errors.push({ row: rowNumber, message: rolesError });

    const { value: userAnswerConfidence, error: confidenceError } = parseConfidence(
      fields.userAnswerConfidence ?? null
    );
    if (confidenceError) errors.push({ row: rowNumber, message: confidenceError });

    const resolvedRoles: string[] = [];
    for (const role of targetRoles) {
      if (role === "My Role") {
        if (resolveMyRole && !resolvedRoles.includes(resolveMyRole)) resolvedRoles.push(resolveMyRole);
      } else if (!resolvedRoles.includes(role)) {
        resolvedRoles.push(role);
      }
    }

    rows.push({
      topic,
      subTopic: fields.subTopic ?? null,
      question,
      answer,
      difficultyLevel,
      targetRoles: resolvedRoles,
      chanceOfBeingAsked,
      userAnswerConfidence,
      answerVisibility,
      questionVisibility,
    });
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, rows };
}
