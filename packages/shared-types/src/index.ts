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
