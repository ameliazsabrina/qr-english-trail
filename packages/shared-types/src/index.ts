export type QuestionType =
  | "multiple-choice"
  | "fill-blank"
  | "image-choice"
  | "audio-choice";

export type MediaAsset = {
  src: string;
  alt?: string;
  mimeType?: string;
};

export type QuestionOption = {
  id: string;
  label: string;
  image?: MediaAsset;
};

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  translation: string;
  instructions?: string;
  options?: QuestionOption[];
  correctOptionId?: string;
  acceptedAnswers?: string[];
  media?: MediaAsset;
  transcript?: string;
  explanation?: string;
  active: boolean;
  difficulty?: "easy" | "medium";
};

export type LearningPoint = {
  id: string;
  slug: string;
  pointNumber: number;
  title: string;
  topic: string;
  status: "draft" | "active" | "inactive";
  lesson: {
    heading: string;
    body: string;
    examples?: Array<{ english: string; translation?: string }>;
    media?: MediaAsset[];
  };
  questions: Question[];
  contentVersion: string;
};

export type PublicQuestion = Omit<Question, "correctOptionId" | "acceptedAnswers">;

export type QuizQuestion = PublicQuestion & {
  topic: string;
};

export type PointQuizResponse = {
  questions: QuizQuestion[];
};

export type QuizAnswerResult = {
  correct: boolean;
  correctOptionId?: string;
  explanation?: string;
};

export type PointSummary = Pick<
  LearningPoint,
  "id" | "slug" | "pointNumber" | "title" | "topic"
>;

export type PublicLearningPoint = Omit<LearningPoint, "questions"> & {
  questionCount: number;
};

export type ApiError = {
  error: { code: string; message: string };
};

export type PlayerProfile = {
  publicPlayerId: string;
  nickname: string;
  avatarId: string;
};

export type PlayerSession = {
  player: PlayerProfile;
  sessionToken: string;
  recoveryCode?: string;
};

export type AttemptMode = "eligible" | "practice";

export type QuizAttempt = {
  id: string;
  mode: AttemptMode;
  expiresAt: string;
  questions: QuizQuestion[];
};

export type PlayerProgress = {
  totalScore: number;
  completedPointCount: number;
  completedPointIds: string[];
};

export type AttemptCompletion = {
  attemptId: string;
  mode: AttemptMode;
  correctAnswers: number;
  questionCount: number;
  awardedScore: number;
  progress: PlayerProgress;
};

export type AttemptAnswerResponse = {
  result: QuizAnswerResult;
  completion?: AttemptCompletion;
};

export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  avatarId: string;
  totalScore: number;
  completedPointCount: number;
  isCurrentPlayer: boolean;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  currentPlayer?: LeaderboardEntry;
};
