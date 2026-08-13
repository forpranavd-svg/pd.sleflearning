export type Question = {
  id: string;
  topic: string;
  subTopic: string | null;
  probabilityTier: string | null;
  level: string | null;
  infraVsDev: string | null;
  scope: string | null;
  reviewBeforeInterview: boolean;
  question: string;
  answer: string | null;
  sourceSheet: string;
  noReviewNeeded: boolean;
  timesPracticed: number;
  lastPracticedAt: string | null;
  ownerId?: string | null;
  questionVisibility?: string;
  answerVisibility?: string;
  difficultyLevel?: string;
  targetRoles?: string[];
  chanceOfBeingAsked?: string;
  source?: string;
  /** Whether the current viewer has this question in their own list (#15). Undefined for signed-out viewers. */
  inMyList?: boolean;
};

export type TopicsResponse = {
  topics: { topic: string; subTopics: string[] }[];
  probabilityTiers: string[];
  levels: string[];
  infraVsDevValues: string[];
  scopes: string[];
  roles: string[];
};
