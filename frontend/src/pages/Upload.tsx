import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload as UploadIcon, FileVideo, FileImage, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadApi, type JobResponse } from "@/lib/api";

type UploadState = "idle" | "uploading" | "processing" | "completed" | "error";

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const accept = ".mp4,.avi,.mov,.mkv,.wmv,.jpg,.jpeg,.png,.bmp";

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setState("idle");
    setJob(null);
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setState("uploading");
    setError("");
    try {
      const result = await uploadApi.upload(file);
      setJob(result);

      if (result.file_type === "video" && result.status !== "completed") {
        setState("processing");
        // Poll for progress
        pollRef.current = setInterval(async () => {
          try {
            const updated = await uploadApi.jobStatus(result.id);
            setJob(updated);
            if (updated.status === "completed" || updated.status === "failed") {
              clearInterval(pollRef.current);
              setState(updated.status === "completed" ? "completed" : "error");
              if (updated.status === "failed") setError(updated.error_message || "Processing failed");
            }
          } catch {
            clearInterval(pollRef.current);
            setState("error");
            setError("Failed to check job status");
          }
        }, 1500);
      } else {
        setState("completed");
      }
    } catch (err: unknown) {
      setState("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFile(null);
    setState("idle");
    setJob(null);
    setError("");
  };

  const isVideo = file?.type.startsWith("video") || file?.name.match(/\.(mp4|avi|mov|mkv|wmv)$/i);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">Upload</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload video or image files for license plate detection</p>
      </div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-8 transition-all ${
          dragActive ? "border-primary/50 bg-primary/5" : ""
        } ${state !== "idle" && state !== "error" && file ? "pointer-events-none opacity-60" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${
            dragActive ? "gradient-primary" : "bg-secondary"
          }`}>
            <UploadIcon className={`w-7 h-7 ${dragActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
          </div>
          <h3 className="font-heading font-semibold mb-1">
            {dragActive ? "Drop file here" : "Drag & drop your file"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Supports MP4, AVI, MOV, MKV, JPG, PNG — max 500MB
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors"
          >
            Browse Files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      </motion.div>

      {/* Selected File */}
      {file && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 mt-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              {isVideo ? <FileVideo className="w-5 h-5 text-primary" /> : <FileImage className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            {state === "idle" && (
              <button onClick={reset} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {(state === "uploading" || state === "processing") && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {state === "uploading" ? "Uploading..." : `Processing... ${job?.detections_count || 0} plates found`}
                </span>
                <span className="font-mono text-primary">{Math.round(job?.progress || 0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full gradient-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${job?.progress || (state === "uploading" ? 30 : 0)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {job && state === "processing" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Frame {job.processed_frames} / {job.total_frames}
                </p>
              )}
            </div>
          )}

          {/* Completed */}
          {state === "completed" && job && (
            <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 text-success text-sm font-medium mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Processing Complete
              </div>
              <p className="text-xs text-muted-foreground">
                Found {job.detections_count} license plate{job.detections_count !== 1 ? "s" : ""} in {job.filename}
              </p>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-1">
                <AlertCircle className="w-4 h-4" />
                Error
              </div>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {state === "idle" && (
              <button
                onClick={handleUpload}
                className="flex-1 py-2.5 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 text-sm transition-opacity"
              >
                Start Detection
              </button>
            )}
            {(state === "completed" || state === "error") && (
              <button
                onClick={reset}
                className="flex-1 py-2.5 rounded-lg font-semibold border border-border hover:bg-secondary text-sm transition-colors"
              >
                Upload Another File
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
