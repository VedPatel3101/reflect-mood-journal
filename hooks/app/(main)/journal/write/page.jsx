"use client";

import React, { useEffect, useState } from "react";
import "react-quill-new/dist/quill.snow.css";
import dynamic from "next/dynamic";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { journalSchema } from "@/app/lib/schema";
import { BarLoader } from "react-spinners";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMoodById, MOODS } from "@/app/lib/moods";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { createJournalEntry } from "@/actions/journal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCollection, getCollection } from "@/actions/collection";
import ColllectionForm from "@/components/collection-dialog";
import WebcamMoodDetector from "@/components/webcam-mood-detector";
import { MOOD_SOURCES } from "@/app/lib/expression-moods";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const JournelEntryPage = () => {
  const [iscollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  // Tracks AI detection metadata for persistence on publish
  const [detectionMeta, setDetectionMeta] = useState(null);
  const [aiSuggestedMood, setAiSuggestedMood] = useState(null);

  const {
    isLoading: actionLoading,
    fn: actionFn,
    data: actionResult,
  } = useFetch(createJournalEntry);

  const {
    loading: collectionsLoading,
    data: collections,
    fn: fetchCollection,
  } = useFetch(getCollection);

  const {
    loading: craetecollectionLoading,
    data: createcollections,
    fn: createdCollectionFn,
  } = useFetch(createCollection);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    getValues,
    setValue
  } = useForm({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: "",
      content: "",
      mood: "",
      collectionId: "",
    },
  });

  useEffect(() => {
    fetchCollection();
  }, []);

  useEffect(() => {
    if (actionResult && !actionLoading) {
      router.push(
        `/collection/${
          actionResult.collectionId
            ? actionResult.collectionId
            : "unorganized"
        }`
      );

      toast.success("Entry created successfully");
    }
  }, [actionResult, actionLoading]);

  const onSubmit = handleSubmit(async (data) => {
    const mood = getMoodById(data.mood);

    actionFn({
      ...data,
      collectionId: data.collectionId ? String(data.collectionId) : null,
      moodScore: mood.score,
      moodQuery: mood.pixabayQuery,
      detectedExpression: detectionMeta?.rawExpression ?? null,
      detectionConfidence: detectionMeta?.detectionConfidence ?? null,
      moodSource: detectionMeta?.moodSource ?? MOOD_SOURCES.MANUAL,
    });
  });

  const handleMoodDetected = (result) => {
    setValue("mood", result.detectedMood, { shouldValidate: true });
    setAiSuggestedMood(result.detectedMood);
    setDetectionMeta({
      rawExpression: result.rawExpression,
      detectionConfidence: result.detectionConfidence,
      moodSource: MOOD_SOURCES.AI,
    });
  };

  const handleDetectionReset = () => {
    setDetectionMeta(null);
    setAiSuggestedMood(null);
    setValue("mood", "");
  };

  const handleMoodChange = (value, onChange) => {
    onChange(value);

    if (detectionMeta) {
      setDetectionMeta((prev) => ({
        ...prev,
        moodSource:
          value !== aiSuggestedMood
            ? MOOD_SOURCES.AI_OVERRIDDEN
            : MOOD_SOURCES.AI,
      }));
    }
  };

  useEffect(() => {
    if (createcollections){
      setIsCollectionDialogOpen(false);
      fetchCollection();
      setValue("collectionId", String(createcollections.id));
      toast.success(`Collection ${createcollections.name} created!`);
    }
  }, [createcollections]);
    
  const handleCreateCollection = async (data) => {
    createdCollectionFn(data);
  };

  const isLoading = actionLoading || collectionsLoading;

  return (
    <div className="py-8 overflow-visible">
      <form className="space-y-2 mx-auto overflow-visible" onSubmit={onSubmit}>
        <h1 className="text-5xl md:text-6xl gradient-title">
          What&apos;s on your mind?
        </h1>

        {isLoading && <BarLoader color="orange" width={"100%"} />}

        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            disabled={isLoading}
            {...register("title")}
            placeholder="Give your entry a title..."
            className={`py-5 md:text-md ${
              errors.title ? "border-red-500" : ""
            }`}
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <WebcamMoodDetector
            onMoodDetected={handleMoodDetected}
            onReset={handleDetectionReset}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">How are you feeling?</label>
          <Controller
            name="mood"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => handleMoodChange(value, field.onChange)}
                value={field.value}
              >
                <SelectTrigger
                  className={`w-full ${
                    errors.mood ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select a mood.." />
                </SelectTrigger>

                <SelectContent>
                  {Object.values(MOODS).map((mood) => (
                    <SelectItem key={mood.id} value={mood.id}>
                      <span className="flex items-center gap-2">
                        {mood.emoji} {mood.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.mood && (
            <p className="text-red-500 text-sm">
              {errors.mood.message}
            </p>
          )}
          {detectionMeta?.moodSource === MOOD_SOURCES.AI_OVERRIDDEN && (
            <p className="text-sm text-amber-700">
              You changed the AI mood suggestion.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {getMoodById(getValues("mood"))?.prompt ?? "Write your thoughts..."}
          </label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <ReactQuill
                readOnly={isLoading}
                theme="snow"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.content && (
            <p className="text-red-500 text-sm">{errors.content.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Add to collection (optional)
          </label>
          <Controller
            name="collectionId"
            control={control}
            render={({ field }) => (
              <Select
                modal={false}
                onValueChange={(value) => {
                  if (value === "new") {
                    setIsCollectionDialogOpen(true);
                  } else {
                    field.onChange(String(value));
                  }
                }}
                value={field.value}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="choose a collection.." />
                </SelectTrigger>

                <SelectContent position="popper" side="bottom" align="start" className="z-50 max-h-60 overflow-y-auto">
                  {collections?.map((collection) => (
                    <SelectItem
                      key={collection.id}
                      value={String(collection.id)}
                    >
                      {collection.name}
                    </SelectItem>
                  ))}

                  <SelectItem value="new">
                    <span className="text-orange-600">
                      + Create New Collection
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.collectionId && (
            <p className="text-red-500 text-sm">
              {errors.collectionId.message}
            </p>
          )}
        </div>

        <div className="space-y-4 flex">
          <Button type="submit" variant="journal" disabled={actionLoading}>
            Publish
          </Button>
        </div>
      </form>

      <ColllectionForm
        loading={craetecollectionLoading}
        onSuccess={handleCreateCollection}
        open={iscollectionDialogOpen}
        setOpen={setIsCollectionDialogOpen}
      />
    </div>
  );
};

export default JournelEntryPage;