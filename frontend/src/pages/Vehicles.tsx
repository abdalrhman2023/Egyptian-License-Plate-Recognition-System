import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Car, Search, ChevronLeft, ChevronRight, Loader2, Trash2, MapPin } from "lucide-react";
import { vehiclesApi, type DetectionResponse, type DetectionListResponse, staticUrl } from "@/lib/api";

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

export default function Vehicles() {
  const [data, setData] = useState<DetectionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [govFilter, setGovFilter] = useState("");
  const [governorates, setGovernorates] = useState<{ governorate: string; count: number }[]>([]);
  const [selected, setSelected] = useState<DetectionResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehiclesApi.list({
        page,
        page_size: 15,
        status: statusFilter || undefined,
        governorate: govFilter || undefined,
        search: search || undefined,
      });
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, govFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    vehiclesApi.governorates().then(setGovernorates).catch(() => {});
  }, []);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this detection?")) return;
    try {
      await vehiclesApi.delete(id);
      fetchData();
      if (selected?.id === id) setSelected(null);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.total} detection${data.total !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search plate number..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="normal">Normal</option>
          <option value="speeding">Speeding</option>
          <option value="watchlist">Watchlist</option>
        </select>
        <select
          value={govFilter}
          onChange={(e) => { setGovFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none"
        >
          <option value="">All Governorates</option>
          {governorates.map((g) => (
            <option key={g.governorate} value={g.governorate}>
              {g.governorate} ({g.count})
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No vehicles found.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {data.items.map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelected(d)}
                    className={`glass-card-hover p-3 flex items-center gap-3 cursor-pointer ${
                      selected?.id === d.id ? "ring-1 ring-primary" : ""
                    }`}
                  >
                    {d.plate_image_path ? (
                      <img
                        src={staticUrl(d.plate_image_path)}
                        alt="plate"
                        className="w-16 h-10 rounded object-cover bg-secondary"
                      />
                    ) : (
                      <div className="w-16 h-10 rounded bg-secondary flex items-center justify-center">
                        <Car className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{d.plate_number_arabic || d.plate_number}</span>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {d.governorate && <span>{d.governorate} • </span>}
                        {new Date(d.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {d.confidence && (
                        <div className="text-xs font-mono text-primary">{(d.confidence * 100).toFixed(0)}%</div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                        className="p-1 mt-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 shrink-0 glass-card p-5 h-fit sticky top-0 hidden lg:block"
          >
            <h3 className="font-heading font-semibold text-sm mb-4">Detection Details</h3>
            {selected.car_image_path && (
              <img
                src={staticUrl(selected.car_image_path)}
                alt="car"
                className="w-full rounded-lg mb-3 bg-secondary"
              />
            )}
            {selected.plate_image_path && (
              <img
                src={staticUrl(selected.plate_image_path)}
                alt="plate"
                className="w-full h-20 object-contain rounded-lg mb-3 bg-secondary p-2"
              />
            )}
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plate</span>
                <span className="font-mono font-bold">{selected.plate_number_arabic || selected.plate_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={selected.status} />
              </div>
              {selected.governorate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Governorate</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.governorate}</span>
                </div>
              )}
              {selected.confidence && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="text-primary font-mono">{(selected.confidence * 100).toFixed(1)}%</span>
                </div>
              )}
              {selected.speed && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed</span>
                  <span>{selected.speed} km/h {selected.speed_limit ? `/ ${selected.speed_limit}` : ""}</span>
                </div>
              )}
              {selected.camera && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Camera</span>
                  <span>{selected.camera}</span>
                </div>
              )}
              {selected.location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-right max-w-[150px]">{selected.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(selected.created_at).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
