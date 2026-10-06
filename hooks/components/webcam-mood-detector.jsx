"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMoodById } from "@/app/lib/moods";
import {
  buildDetectionResult,
  EXPRESSIONS,
  getExpressionLabel,
} from "@/app/lib/expression-moods";

const MODEL_URL = "/models";
const LOW_CONFIDENCE_THRESHOLD = 0.4;

const WARMUP_MS = 1500;
const ANALYSIS_DURATION_MS = 3000;
const SAMPLE_INTERVAL_MS = 400;
const MIN_FACE_SAMPLES = 4;

const statusText = {
  idle: "Camera mood detection is ready.",
  loading: "Loading expression model...",
  camera: "Look at the screen — your face will be detected automatically.",
  detecting: "Analyzing your expression...",
  detected: "Mood suggestion ready.",
  "no-face": "No face found. Try again in better light.",
  denied: "Camera access was blocked. You can still select a mood manually.",
  error: "Mood detection could not start. You can still select a mood manually.",
};

const createEmptyScores = () =>
  Object.keys(EXPRESSIONS).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

const getAveragedExpression = (totals, sampleCount) => {
  if (sampleCount === 0) return { name: "neutral", confidence: 0 };

  return Object.entries(totals).reduce(
    (best, [name, total]) => {
      const avg = total / sampleCount;
      return avg > best.confidence ? { name, confidence: avg } : best;
    },
    { name: "neutral", confidence: 0 }
  );
};

const stopStream = (stream) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const WebcamMoodDetector = ({ onMoodDetected, onReset, disabled = false }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceApiRef = useRef(null);
  const cancelledRef = useRef(false);
  const [status, setStatus] = useState("idle");
  const [suggestion, setSuggestion] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const isBusy = ["loading", "camera", "detecting"].includes(status);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      stopStream(streamRef.current);
    };
  }, []);

  const closeOverlay = () => {
    setShowOverlay(false);
    stopStream(streamRef.current);
    streamRef.current = null;
  };

  const loadModels = async () => {
    if (!faceApiRef.current) {
      faceApiRef.current = await import("@vladmandic/face-api");
    }

    const faceapi = faceApiRef.current;

    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    }

    if (!faceapi.nets.faceExpressionNet.isLoaded) {
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    }

    return faceapi;
  };

  const analyzeFrames = async (faceapi, video) => {
    const totals = createEmptyScores();
    let faceSampleCount = 0;
    const totalSamples = Math.ceil(ANALYSIS_DURATION_MS / SAMPLE_INTERVAL_MS);

    for (let i = 0; i < totalSamples; i++) {
      if (cancelledRef.current) return null;

      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.35,
          })
        )
        .withFaceExpressions();

      if (detection?.expressions) {
        faceSampleCount += 1;
        for (const [name, score] of Object.entries(detection.expressions)) {
          if (totals[name] !== undefined) {
            totals[name] += score;
          }
        }
      }

      setAnalysisProgress(Math.round(((i + 1) / totalSamples) * 100));
      await wait(SAMPLE_INTERVAL_MS);
    }

    if (faceSampleCount < MIN_FACE_SAMPLES) return null;

    return getAveragedExpression(totals, faceSampleCount);
  };

  const startDetection = async () => {
    if (disabled || isBusy) return;

    setSuggestion(null);
    setAnalysisProgress(0);
    cancelledRef.current = false;
    setShowOverlay(true);

    try {
      setStatus("loading");
      const faceapi = await loadModels();
      if (cancelledRef.current) return;

      // Wait for full-screen video element to mount
      for (let i = 0; i < 20 && !videoRef.current; i++) {
        await wait(50);
      }
      if (cancelledRef.current || !videoRef.current) return;

      setStatus("camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      await wait(WARMUP_MS);
      if (cancelledRef.current) return;

      setStatus("detecting");
      const expression = await analyzeFrames(faceapi, videoRef.current);

      closeOverlay();

      if (!expression || expression.confidence < 0.2) {
        setStatus("no-face");
        setAnalysisProgress(0);
        return;
      }

      const result = buildDetectionResult(expression.name, expression.confidence);

      setSuggestion(result);
      setStatus("detected");
      setAnalysisProgress(100);
      onMoodDetected?.(result);
    } catch (error) {
      closeOverlay();
      setAnalysisProgress(0);
      setStatus(error?.name === "NotAllowedError" ? "denied" : "error");
    }
  };

  const cancelDetection = () => {
    cancelledRef.current = true;
    closeOverlay();
    setAnalysisProgress(0);
    setStatus("idle");
  };

  const resetDetection = () => {
    cancelledRef.current = true;
    closeOverlay();
    setSuggestion(null);
    setAnalysisProgress(0);
    setStatus("idle");
    onReset?.();
  };

  const suggestedMood = getMoodById(suggestion?.detectedMood);
  const confidencePercent = suggestion
    ? Math.round(suggestion.detectionConfidence * 100)
    : 0;
  const isLowConfidence =
    suggestion?.detectionConfidence < LOW_CONFIDENCE_THRESHOLD;

  return (
    <>
      {/* Full-screen camera overlay — opens on Detect Mood */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/30" />

          {/* Face guide — visual only; detection scans the full frame automatically */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-64 w-48 md:h-80 md:w-60 rounded-[50%] border-2 border-white/60 border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>

          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-orange-400" />
                <span className="font-medium">AI Mood Detection</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cancelDetection}
                className="text-white hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-end gap-4 p-6 pb-10">
              <div className="w-full max-w-md space-y-3 text-center">
                <p className="text-lg font-medium text-white">
                  {status === "detecting"
                    ? `${statusText.detecting} ${analysisProgress}%`
                    : statusText[status]}
                </p>

                {status === "detecting" && (
                  <>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-white/80">
                      Hold still — reading your expression automatically
                    </p>
                  </>
                )}

                {status === "camera" && (
                  <p className="text-sm text-white/80">
                    No need to adjust — just look at the screen
                  </p>
                )}

                {status === "loading" && (
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline card — results only, no small camera preview */}
      <div className="rounded-lg border bg-white/70 p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-orange-600" />
              AI Mood Detection
            </div>
            <p className="text-sm text-muted-foreground">{statusText[status]}</p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={startDetection}
              disabled={disabled || isBusy}
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Detect Mood
            </Button>

            {(suggestion || status !== "idle") && (
              <Button
                type="button"
                variant="ghost"
                onClick={resetDetection}
                disabled={disabled || isBusy}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {suggestion && (
          <div className="space-y-2">
            <div className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-900">
              Detected:{" "}
              <span className="font-medium">
                {getExpressionLabel(suggestion.rawExpression)}
              </span>
              <span className="text-orange-700">
                {" "}
                ({confidencePercent}% confidence)
              </span>
            </div>

            {suggestedMood && (
              <div className="rounded-md bg-orange-50/60 px-3 py-2 text-sm text-orange-800">
                Suggested mood:{" "}
                <span className="font-medium">
                  {suggestedMood.emoji} {suggestedMood.label}
                </span>
              </div>
            )}

            {isLowConfidence && (
              <p className="text-sm text-amber-700">
                Low confidence — please verify or choose a mood manually.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default WebcamMoodDetector;
