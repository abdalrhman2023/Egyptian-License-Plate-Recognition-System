import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Loader2, Calendar } from "lucide-react";
import { reportsApi } from "@/lib/api";

export default function Reports() {
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    reportsApi
      .summary(days)
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await reportsApi.exportCsv(days);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentry-report-${days}d.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  const renderValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "number") return val.toLocaleString();
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and export detection reports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium gradient-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !summary ? (
        <div className="glass-card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No report data available.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(summary).map(([key, value], i) => {
            // Skip nested objects for card display
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 sm:col-span-2 lg:col-span-3"
                >
                  <h3 className="font-heading font-semibold text-sm mb-3 capitalize">
                    {key.replace(/_/g, " ")}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(value as Record<string, unknown>).map(([subKey, subVal]) => (
                      <div key={subKey} className="p-3 rounded-lg bg-secondary/50">
                        <div className="text-lg font-heading font-bold">{renderValue(subVal)}</div>
                        <div className="text-xs text-muted-foreground capitalize">{subKey.replace(/_/g, " ")}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="stat-card"
              >
                <div className="text-2xl font-heading font-bold">{renderValue(value)}</div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">{key.replace(/_/g, " ")}</div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
