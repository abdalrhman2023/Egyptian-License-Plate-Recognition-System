import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Loader2 } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { analyticsApi } from "@/lib/api";

const COLORS = [
  "hsl(190, 100%, 50%)", "hsl(22, 100%, 60%)", "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(260, 80%, 60%)",
  "hsl(120, 60%, 40%)", "hsl(200, 80%, 55%)",
];

export default function Analytics() {
  const [overview, setOverview] = useState<{ total_detections: number; total_violations: number; unique_plates: number; average_confidence: number } | null>(null);
  const [govData, setGovData] = useState<{ governorate: string; count: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; vehicles: number; violations: number }[]>([]);
  const [confData, setConfData] = useState<{ range: string; count: number }[]>([]);
  const [topPlates, setTopPlates] = useState<{ plate_number: string; plate_number_arabic: string | null; detection_count: number; best_confidence: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.overview(),
      analyticsApi.governorateDistribution(),
      analyticsApi.dailyTrend(30),
      analyticsApi.confidenceDistribution(),
      analyticsApi.topPlates(10),
    ])
      .then(([ov, gov, daily, conf, top]) => {
        setOverview(ov);
        setGovData(gov);
        setDailyData(daily);
        setConfData(conf);
        setTopPlates(top);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Insights and trends from detection data</p>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Detections", value: overview.total_detections.toLocaleString() },
            { label: "Total Violations", value: overview.total_violations.toLocaleString() },
            { label: "Unique Plates", value: overview.unique_plates.toLocaleString() },
            { label: "Avg Confidence", value: `${(overview.average_confidence * 100).toFixed(1)}%` },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className="text-2xl font-heading font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Daily Trend (30 days)</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="vehicles" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="violations" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>

        {/* Governorate Distribution */}
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Governorate Distribution</h3>
          {govData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={govData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="count" stroke="none">
                    {govData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1 max-h-[160px] overflow-auto scrollbar-thin">
                {govData.map((g, i) => (
                  <div key={g.governorate} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate">{g.governorate}</span>
                    </div>
                    <span className="font-medium">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>

        {/* Confidence Distribution */}
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Confidence Distribution</h3>
          {confData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>

        {/* Top Plates */}
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Top Detected Plates</h3>
          {topPlates.length > 0 ? (
            <div className="space-y-2 max-h-[220px] overflow-auto scrollbar-thin">
              {topPlates.map((p, i) => (
                <div key={p.plate_number} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <span className="font-mono font-bold flex-1">{p.plate_number_arabic || p.plate_number}</span>
                  <span className="text-xs text-muted-foreground">{p.detection_count}x</span>
                  <span className="text-xs font-mono text-primary">{(p.best_confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
