"use server";

import { db } from "@/lib/prisma";
import { getMoodById, MOODS } from "@/app/lib/moods";
import {
  isValidExpression,
  isValidMoodSource,
  MOOD_SOURCES,
} from "@/app/lib/expression-moods";
import { auth } from "@clerk/nextjs/server";
import { getPixabayImage } from "./public";
import { revalidatePath } from "next/cache";
import { request } from "@arcjet/next";
import aj from "@/lib/arcjet";

const resolveAiMetadata = (data) => {
  const moodSource = isValidMoodSource(data.moodSource)
    ? data.moodSource
    : MOOD_SOURCES.MANUAL;

  if (moodSource === MOOD_SOURCES.MANUAL) {
    return {
      moodSource: MOOD_SOURCES.MANUAL,
      detectedExpression: null,
      detectionConfidence: null,
    };
  }

  const detectedExpression = isValidExpression(data.detectedExpression)
    ? data.detectedExpression
    : null;

  const confidence = Number(data.detectionConfidence);
  const detectionConfidence =
    detectedExpression &&
    Number.isFinite(confidence) &&
    confidence >= 0 &&
    confidence <= 1
      ? confidence
      : null;

  return {
    moodSource,
    detectedExpression,
    detectionConfidence,
  };
};

// ✅ CREATE ENTRY
export async function createJournalEntry(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const req = await request();

    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Request Blocked.");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const mood = MOODS[data.mood?.toUpperCase()];
    if (!mood) throw new Error("Invalid mood");

    const moodImageUrl = await getPixabayImage(data.moodQuery);
    const aiMetadata = resolveAiMetadata(data);

    const entry = await db.entry.create({
      data: {
        title: data.title,
        content: data.content,
        mood: mood.id,
        moodScore: mood.score,
        moodImageUrl,
        ...aiMetadata,

        user: {
          connect: { id: user.id },
        },

        ...(data.collectionId && {
          collection: {
            connect: { id: data.collectionId },
          },
        }),
      },
    });

    await db.draft.deleteMany({
      where: { userId: user.id },
    });

    revalidatePath("/dashboard");

    return entry;
  } catch (error) {
    console.error("CREATE ERROR:", error);
    throw new Error(error.message || "Failed to create entry");
  }
}

// ✅ GET ALL ENTRIES
export async function getJournalEntries({ collectionId, orderBy = "desc" } = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const entries = await db.entry.findMany({
      where: {
        userId: user.id,
        ...(collectionId === "unorganized"
          ? { collectionId: null }
          : collectionId
          ? { collectionId }
          : {}),
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: orderBy,
      },
    });

    return {
      success: true,
      data: {
        entries: entries.map((entry) => ({
          ...entry,
          moodData: getMoodById(entry.mood),
        })),
      },
    };
  } catch (error) {
    console.error("GET ENTRIES ERROR:", error);
    return { success: false, error: error.message };
  }
}

// ✅ GET SINGLE ENTRY (NO CRASH VERSION)
export async function getJournalEntry(id) {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    if (!id) return null;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return null;

    const entry = await db.entry.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return entry || null; // ✅ never crash
  } catch (error) {
    console.error("GET ENTRY ERROR:", error);
    return null; // ✅ prevents page crash
  }
}