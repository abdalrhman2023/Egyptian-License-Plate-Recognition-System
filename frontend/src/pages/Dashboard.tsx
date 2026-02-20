import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Car, AlertTriangle, Shield, Target,
  TrendingUp, TrendingDown
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  dashboardApi,
  type DashboardStats,
  type HourlyData,
  type WeeklyData,
  type ViolationTypeData,
  type DetectionResponse,
} from "@/lib/api";

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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DetectionResponse[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationTypeData[]>([]);

  useEffect(() => {
    dashboardApi.stats().then(setStats).catch(() => {});
    dashboardApi.activity(8).then(setActivity).catch(() => {});
    dashboardApi.hourly().then(setHourlyData).catch(() => {});
    dashboardApi.weekly().then(setWeeklyData).catch(() => {});
    dashboardApi.violationTypes().then(setViolationTypes).catch(() => {});
  }, []);

  const statCards = [
    { label: "Vehicles Today", value: stats?.vehicles_today?.toLocaleString() || "0", change: stats?.vehicles_change || 0, icon: Car, color: "text-primary" },
    { label: "Violations Detected", value: stats?.violations_today?.toLocaleString() || "0", change: stats?.violations_change || 0, icon: AlertTriangle, color: "text-accent" },
    { label: "Watchlist Matches", value: stats?.watchlist_matches?.toLocaleString() || "0", change: 0, icon: Shield, color: "text-destructive" },
    { label: "System Accuracy", value: stats ? `${(stats.system_accuracy * 100).toFixed(1)}%` : "—", change: 0, icon: Target, color: "text-success" },
  ];

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <span className={`flex items-center gap-0.5 text-xs font-medium ${s.change > 0 ? "text-success" : s.change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {s.change > 0 ? <TrendingUp className="w-3 h-3" /> : s.change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {s.change !== 0 ? `${Math.abs(s.change)}%` : "—"}
              </span>
            </div>
            <div className="text-2xl font-heading font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-base flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success pulse-live" />
              Live Activity
            </h2>
            <span className="text-xs text-muted-foreground">Latest detections</span>
          </div>
          <div className="space-y-2">
            {activity.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground text-sm">
                No recent detections. Upload a video or image to get started.
              </div>
            ) : (
              activity.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
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
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono text-muted-foreground">
                      {new Date(d.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {d.confidence && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{(d.confidence * 100).toFixed(1)}% conf.</div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hourly Chart */}
          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold text-sm mb-4">Today's Traffic</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="vehicles" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Violation Breakdown */}
          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold text-sm mb-4">Violation Types</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={violationTypes} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                    {violationTypes.map((_, i) => (
                      <Cell key={i} fill={violationTypes[i]?.color || "hsl(var(--primary))"} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {violationTypes.map((v) => (
                  <div key={v.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                      <span className="text-muted-foreground">{v.name}</span>
                    </div>
                    <span className="font-medium">{v.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold text-sm mb-4">Weekly Trend</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="vehicles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
