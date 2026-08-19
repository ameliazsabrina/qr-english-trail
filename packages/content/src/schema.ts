import { z } from "zod";

const mediaSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1).optional(),
  mimeType: z.string().min(1).optional()
});

const questionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["multiple-choice", "fill-blank", "image-choice", "audio-choice"]),
  prompt: z.string().min(1),
  instructions: z.string().min(1).optional(),
  options: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), image: mediaSchema.optional() })).optional(),
  correctOptionId: z.string().min(1).optional(),
  acceptedAnswers: z.array(z.string().min(1)).optional(),
  media: mediaSchema.optional(),
  transcript: z.string().min(1).optional(),
  explanation: z.string().min(1).optional(),
  active: z.boolean(),
  difficulty: z.enum(["easy", "medium"]).optional()
}).superRefine((question, context) => {
  if (question.type === "multiple-choice") {
    if (!question.options || question.options.length < 2) {
      context.addIssue({ code: "custom", message: "Multiple-choice questions need at least two options" });
    }
    if (!question.correctOptionId || !question.options?.some(({ id }) => id === question.correctOptionId)) {
      context.addIssue({ code: "custom", message: "correctOptionId must match an option" });
    }
  }
  if (question.type === "fill-blank" && !question.acceptedAnswers?.length) {
    context.addIssue({ code: "custom", message: "Fill-blank questions need accepted answers" });
  }
  if (question.type === "audio-choice" && !question.transcript) {
    context.addIssue({ code: "custom", message: "Audio questions need a transcript" });
  }
});

export const learningPointSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  pointNumber: z.number().int().min(1).max(10),
  title: z.string().min(1),
  topic: z.string().min(1),
  status: z.enum(["draft", "active", "inactive"]),
  lesson: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
    examples: z.array(z.object({ english: z.string().min(1), translation: z.string().min(1).optional() })).optional(),
    media: z.array(mediaSchema).optional()
  }),
  questions: z.array(questionSchema),
  contentVersion: z.string().min(1)
});

