import { learningPoints } from "./points.js";
import { validateContent } from "./validation.js";

validateContent(learningPoints);
const activeQuestions = learningPoints.flatMap(({ questions }) => questions).filter(({ active }) => active);
console.log(`Content valid: ${learningPoints.length} points, ${activeQuestions.length} active questions.`);

