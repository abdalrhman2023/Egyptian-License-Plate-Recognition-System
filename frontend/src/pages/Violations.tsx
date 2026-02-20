import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { violationsApi, type ViolationResponse } from "@/lib/api";

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    speeding: "bg-accent/10 text-accent border-accent/20",
    watchlist_match: "bg-destructive/10 text-destructive border-destructive/20",
    no_entry: "bg-warning/10 text-warning border-warning/20",
    parking: "bg-primary/10 text-primary border-primary/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${styles[type] || styles.speeding}`}>
      {type.replace("_", " ")}
    </span>
  );
}

export default function Violations() {
  const [items, setItems] = useState<ViolationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [resolvedFilter, setResolvedFilter] = useState<string>("");
  const [stats, setStats] = useState<{ total: number; resolved: number; pending: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await violationsApi.list({
        page,
        page_size: 15,
        violation_type: typeFilter || undefined,
        resolved: resolvedFilter === "" ? undefined : resolvedFilter === "true",
      });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, resolvedFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    violationsApi.stats().then(setStats).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / 15);

  const handleResolve = async (id: number) => {
    try {
      await violationsApi.resolve(id);
      fetchData();
      violationsApi.stats().then(setStats).catch(() => {});
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Violations</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total violations</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="text-2xl font-heading font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="stat-card">
            <div className="text-2xl font-heading font-bold text-accent">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="stat-card">
            <div className="text-2xl font-heading font-bold text-success">{stats.resolved}</div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="speeding">Speeding</option>
          <option value="no_entry">No Entry</option>
          <option value="parking">Parking</option>
          <option value="watchlist_match">Watchlist Match</option>
        </select>
        <select
          value={resolvedFilter}
          onChange={(e) => { setResolvedFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="false">Pending</option>
          <option value="true">Resolved</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No violations found.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={`glass-card-hover p-4 flex items-center gap-4 ${
                  !v.resolved ? "border-l-2 border-l-accent" : "border-l-2 border-l-success"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm">{v.plate_number}</span>
                    <TypeBadge type={v.violation_type} />
                    {v.resolved && (
                      <span className="flex items-center gap-1 text-success text-[10px] font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {v.description && <span>{v.description}</span>}
                    {v.speed && v.speed_limit && <span>{v.speed}/{v.speed_limit} km/h</span>}
                    {v.location && <><span>•</span><span>{v.location}</span></>}
                    {v.camera && <><span>•</span><span>{v.camera}</span></>}
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString()}
                  </div>
                  {!v.resolved && (
                    <button
                      onClick={() => handleResolve(v.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
