import { getCollection } from "@/actions/collection";
import { getJournalEntries } from "@/actions/journal";
import React from "react";
import Collections from "@/app/(main)/dashboard/_components/collections";
import Moodanalytics from "./_components/mood-analytics";

const Dashboard = async () => {
  const collections = await getCollection();
  const entriesData = await getJournalEntries();

  const entries = entriesData?.data?.entries || [];

  const entriesByCollection = entries.reduce((acc, entry) => {
    const collectionId = String(entry.collectionId || "unorganized");

    if (!acc[collectionId]) {
      acc[collectionId] = [];
    }

    acc[collectionId].push(entry);
    return acc;
  }, {});

  const collectionsWithEntries = collections.map((collection) => ({
    ...collection,
    id: String(collection.id),
    entries: entriesByCollection[String(collection.id)] || [],
  }));

  const unorganizedEntries = entriesByCollection["unorganized"] || [];

  return (
    <div className="px-4 py-8 space-y-8">
      <section className="space-y-4">
        <Moodanalytics />
      </section>

      <Collections
        collections={collectionsWithEntries}
        unorganizedEntries={unorganizedEntries}
      />
    </div>
  );
};

export default Dashboard;