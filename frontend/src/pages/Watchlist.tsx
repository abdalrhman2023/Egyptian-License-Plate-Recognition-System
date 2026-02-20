import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, Trash2, Loader2, X } from "lucide-react";
import { watchlistApi, type WatchlistEntry } from "@/lib/api";

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-accent/10 text-accent border-accent/20",
    low: "bg-success/10 text-success border-success/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${styles[priority] || styles.medium}`}>
      {priority}
    </span>
  );
}

export default function Watchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ plate_number: "", reason: "", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await watchlistApi.list(!showAll);
      setEntries(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await watchlistApi.add(form);
      setShowModal(false);
      setForm({ plate_number: "", reason: "", priority: "medium" });
      fetchData();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove from watchlist?")) return;
    try {
      await watchlistApi.delete(id);
      fetchData();
    } catch {
      // ignore
    }
  };

  const handleToggle = async (entry: WatchlistEntry) => {
    try {
      await watchlistApi.update(entry.id, { is_active: !entry.is_active });
      fetchData();
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {entries.length} entries {!showAll ? "(active only)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded border-border"
            />
            Show inactive
          </label>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No watchlist entries.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-card-hover p-4 flex items-center gap-4 ${
                !entry.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono font-bold text-sm">{entry.plate_number_arabic || entry.plate_number}</span>
                  <PriorityBadge priority={entry.priority} />
                  {!entry.is_active && (
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">Inactive</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.reason || "No reason specified"}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{entry.match_count} matches</span>
                  {entry.last_seen && (
                    <span>Last seen: {new Date(entry.last_seen).toLocaleDateString()}</span>
                  )}
                  {entry.last_seen_location && <span>@ {entry.last_seen_location}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(entry)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    entry.is_active
                      ? "border-accent/20 text-accent hover:bg-accent/10"
                      : "border-success/20 text-success hover:bg-success/10"
                  }`}
                >
                  {entry.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold">Add to Watchlist</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Plate Number</label>
                <input
                  value={form.plate_number}
                  onChange={(e) => setForm((f) => ({ ...f, plate_number: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="e.g. ABC 1234"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Reason</label>
                <input
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="Reason for watching"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 text-sm disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add to Watchlist"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
