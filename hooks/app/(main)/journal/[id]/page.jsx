import React from "react";
import { getJournalEntry } from "@/actions/journal";
import { getMoodById } from "@/app/lib/moods";
import { getExpressionLabel } from "@/app/lib/expression-moods";
import Image from "next/image";

const JournalEntryPage = async ({ params }) => {
  const { id } = params;

  // Fetch journal entry
  const entry = await getJournalEntry(id);

  // Handle missing entry
  if (!entry) {
    return (
      <div className="p-6 text-center text-lg font-medium">
        No journal entry found.
      </div>
    );
  }

  // Get mood info
  const mood = getMoodById(entry.mood);

  // Use fallback image if needed
  const moodImage = entry.moodImageUrl || "/fallback.jpg";

  return (
    <div className="p-6 space-y-6">
      {/* Mood Image */}
      {moodImage && (
        <div className="relative h-64 w-full rounded-lg overflow-hidden">
          <Image
            src={moodImage}
            alt="Mood visualization"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold mt-4">{entry.title}</h1>

      {/* Mood */}
      <div className="flex flex-col gap-1 text-lg mt-2">
        <div className="flex items-center gap-2">
          <span>Mood:</span>
          <span>
            {mood?.emoji} {mood?.label || "Unknown"}
          </span>
        </div>
        {entry.moodSource && entry.moodSource !== "manual" && entry.detectedExpression && (
          <p className="text-sm text-muted-foreground">
            AI detected {getExpressionLabel(entry.detectedExpression)}
            {entry.detectionConfidence != null &&
              ` (${Math.round(entry.detectionConfidence * 100)}% confidence)`}
            {entry.moodSource === "ai_overridden" && " — you changed the suggestion"}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="prose max-w-none mt-4">{entry.content}</div>

      {/* Collection */}
      {entry.collection && (
        <div className="text-sm text-muted-foreground mt-2">
          Collection: {entry.collection.name}
        </div>
      )}
    </div>
  );
};

export default JournalEntryPage;