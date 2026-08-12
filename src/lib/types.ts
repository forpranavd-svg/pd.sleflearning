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
};

export type TopicsResponse = {
  topics: { topic: string; subTopics: string[] }[];
  probabilityTiers: string[];
  levels: string[];
  infraVsDevValues: string[];
  scopes: string[];
};
