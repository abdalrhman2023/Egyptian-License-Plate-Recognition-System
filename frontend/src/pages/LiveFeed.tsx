import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Car, Activity, Loader2 } from "lucide-react";
import { dashboardApi, type DetectionResponse } from "@/lib/api";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    normal: "bg-success/10 text-success border-success/20",
    speeding: "bg-accent/10 text-accent border-accent/20",
    watchlist: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${styles[status] || styles.normal}`}>
      {status}
    </span>
  );
}

export default function LiveFeed() {
  const [detections, setDetections] = useState<DetectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchActivity = async () => {
    try {
      const data = await dashboardApi.activity(30);
      setDetections(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    intervalRef.current = setInterval(fetchActivity, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success pulse-live" />
            Live Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time detection activity — auto-refreshes every 5 seconds
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5" />
          {detections.length} detections
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : detections.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No detections yet. Upload a video or image to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {detections.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-card-hover p-4 flex items-center gap-4 ${
                d.status === "watchlist" ? "border-destructive/30" : ""
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Car className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="plate-display text-sm">{d.plate_number_arabic || d.plate_number}</span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {d.speed && <span>{d.speed} km/h</span>}
                  {d.location && <><span>•</span><span>{d.location}</span></>}
                  {d.camera && <><span>•</span><span>{d.camera}</span></>}
                  {d.governorate && <><span>•</span><span>{d.governorate}</span></>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono text-muted-foreground">
                  {new Date(d.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {d.confidence && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {(d.confidence * 100).toFixed(1)}% conf.
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
