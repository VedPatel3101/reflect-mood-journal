import { getMoodById } from "./moods";

// face-api.js expression labels returned by the expression recognition net
export const EXPRESSIONS = {
  happy: { id: "happy", label: "Happy" },
  sad: { id: "sad", label: "Sad" },
  angry: { id: "angry", label: "Angry" },
  neutral: { id: "neutral", label: "Neutral" },
  fearful: { id: "fearful", label: "Fearful" },
  surprised: { id: "surprised", label: "Surprised" },
  disgusted: { id: "disgusted", label: "Disgusted" },
};

// Maps each detected expression to the closest app mood ID (30-mood system)
export const EXPRESSION_TO_MOOD = {
  happy: "happy",
  sad: "sad",
  angry: "angry",
  neutral: "neutral",
  fearful: "anxious",
  surprised: "excited",
  disgusted: "disappointed",
};

export const MOOD_SOURCES = {
  MANUAL: "manual",
  AI: "ai",
  AI_OVERRIDDEN: "ai_overridden",
};

const VALID_EXPRESSIONS = new Set(Object.keys(EXPRESSIONS));
const VALID_MOOD_SOURCES = new Set(Object.values(MOOD_SOURCES));

export const getExpressionLabel = (expression) =>
  EXPRESSIONS[expression]?.label ?? expression;

export const mapExpressionToMood = (expression) =>
  EXPRESSION_TO_MOOD[expression] ?? "neutral";

export const isValidExpression = (expression) =>
  VALID_EXPRESSIONS.has(expression);

export const isValidMoodSource = (source) => VALID_MOOD_SOURCES.has(source);

export const buildDetectionResult = (rawExpression, confidence) => {
  const moodId = mapExpressionToMood(rawExpression);
  const mood = getMoodById(moodId);

  return {
    rawExpression,
    expressionLabel: getExpressionLabel(rawExpression),
    detectionConfidence: Number(confidence.toFixed(4)),
    detectedMood: mood?.id ?? moodId,
    mappedMoodLabel: mood?.label ?? moodId,
  };
};
