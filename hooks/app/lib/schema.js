import { string, z } from "zod";
import { MOOD_SOURCES } from "./expression-moods";

export const journalSchema = z.object({
    title: z.string().min(1,"Title is required"),
    content: z.string().min(1,"Content is required"),
    mood: z.string().min(1,"Mood is required"),
    collectionId: z.string().optional(),
});

// Optional AI fields sent alongside the form on publish
export const journalSubmitSchema = journalSchema.extend({
    moodScore: z.number(),
    moodQuery: z.string(),
    detectedExpression: z.string().nullable().optional(),
    detectionConfidence: z.number().min(0).max(1).nullable().optional(),
    moodSource: z
        .enum([MOOD_SOURCES.MANUAL, MOOD_SOURCES.AI, MOOD_SOURCES.AI_OVERRIDDEN])
        .optional(),
});

export const CollectionSchema = z.object({
    name: z.string().min(1,"Name e is required"),
    description: z.string().optional(),
    
});