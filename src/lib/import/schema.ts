export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"] as const;
export const CHANCE_LEVELS = ["VeryHigh", "High", "Medium", "Low", "VeryLow"] as const;
export const VISIBILITY_VALUES = ["Public", "Private"] as const;
export const ROLE_VALUES = [
  "Developer",
  "CTO",
  "Architect",
  "Scrum Master",
  "My Role",
  "Data Engineer",
  "AI Engineer",
] as const;

export const CONFIDENCE_LABELS: Record<string, number> = {
  NotRated: 0,
  VeryLow: 1,
  Low: 2,
  Medium: 3,
  High: 4,
  VeryHigh: 5,
};

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_IMPORT_ROWS = 2000;
export const MAX_FIELD_LENGTH = 20_000; // guards against pathological single-cell content

export type ImportedRow = {
  topic: string;
  subTopic: string | null;
  question: string;
  answer: string;
  difficultyLevel: (typeof DIFFICULTY_LEVELS)[number];
  targetRoles: string[];
  chanceOfBeingAsked: (typeof CHANCE_LEVELS)[number];
  userAnswerConfidence: number;
  answerVisibility: (typeof VISIBILITY_VALUES)[number];
  questionVisibility: (typeof VISIBILITY_VALUES)[number];
};

export type RowError = { row: number; message: string };
