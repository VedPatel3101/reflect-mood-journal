"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ✅ GET COLLECTIONS
export async function getCollection() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const collections = await db.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return collections;
}

// ✅ CREATE COLLECTION
export async function createCollection(data) {
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
        const { remaining, reset } = decision.reason;

        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const collection = await db.collection.create({
      data: {
        name: data.name,
        description: data.description,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    return collection;
  } catch (error) {
    console.error("CREATE ERROR:", error);
    throw new Error(error.message);
  }
}

// ✅ DELETE COLLECTION (FINAL FIXED)
export async function deleteCollection(collectionId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!collectionId) throw new Error("Collection ID is required");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // ✅ Ensure collection belongs to user
    const collection = await db.collection.findFirst({
      where: {
        id: collectionId,
        userId: user.id,
      },
    });

    if (!collection) throw new Error("Collection not found");

    // ✅ Delete related entries FIRST (prevents constraint errors)
    await db.entry.deleteMany({
      where: {
        collectionId: collectionId,
      },
    });

    // ✅ Delete collection
    await db.collection.delete({
      where: {
        id: collectionId,
      },
    });

    // ✅ Refresh UI
    revalidatePath("/dashboard");

    return true;
  } catch (error) {
    console.error("DELETE ERROR FULL:", error);
    throw new Error("Failed to delete collection");
  }
}