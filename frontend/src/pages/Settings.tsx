import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Camera, Plus, Trash2, Loader2, Save, X } from "lucide-react";
import { settingsApi, type SettingResponse } from "@/lib/api";

interface CameraEntry {
  id: number;
  name: string;
  location: string;
  speed_limit: number;
  is_active: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingResponse[]>([]);
  const [cameras, setCameras] = useState<CameraEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraForm, setCameraForm] = useState({ name: "", location: "", speed_limit: 60 });
  const [addingCamera, setAddingCamera] = useState(false);

  useEffect(() => {
    Promise.all([settingsApi.list(), settingsApi.cameras()])
      .then(([s, c]) => {
        setSettings(s);
        setCameras(c);
        const vals: Record<string, string> = {};
        s.forEach((setting) => { vals[setting.key] = setting.value || ""; });
        setEditValues(vals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const updated = await settingsApi.update(key, editValues[key]);
      setSettings((prev) => prev.map((s) => (s.key === key ? updated : s)));
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  };

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCamera(true);
    try {
      await settingsApi.addCamera(cameraForm);
      const updatedCameras = await settingsApi.cameras();
      setCameras(updatedCameras);
      setShowCameraModal(false);
      setCameraForm({ name: "", location: "", speed_limit: 60 });
    } catch {
      // ignore
    } finally {
      setAddingCamera(false);
    }
  };

  const handleDeleteCamera = async (id: number) => {
    if (!confirm("Delete this camera?")) return;
    try {
      await settingsApi.deleteCamera(id);
      setCameras((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure system parameters and cameras</p>
      </div>

      {/* System Settings */}
      <div className="glass-card p-5 mb-6">
        <h3 className="font-heading font-semibold text-sm flex items-center gap-2 mb-4">
          <SettingsIcon className="w-4 h-4" /> System Settings
        </h3>
        <div className="space-y-4">
          {settings.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4"
            >
              <div className="flex-1">
                <label className="text-sm font-medium capitalize">{s.key.replace(/_/g, " ")}</label>
                {s.description && (
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={editValues[s.key] || ""}
                  onChange={(e) => setEditValues((v) => ({ ...v, [s.key]: e.target.value }))}
                  className="w-32 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={() => handleSave(s.key)}
                  disabled={saving === s.key || editValues[s.key] === (s.value || "")}
                  className="p-1.5 rounded-lg hover:bg-primary/10 text-primary disabled:opacity-30 transition-colors"
                >
                  {saving === s.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cameras */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
            <Camera className="w-4 h-4" /> Cameras
          </h3>
          <button
            onClick={() => setShowCameraModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" /> Add Camera
          </button>
        </div>

        {cameras.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No cameras configured.</p>
        ) : (
          <div className="space-y-2">
            {cameras.map((cam) => (
              <div key={cam.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{cam.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {cam.location} • {cam.speed_limit} km/h limit
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCamera(cam.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold">Add Camera</h3>
              <button onClick={() => setShowCameraModal(false)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCamera} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Camera Name</label>
                <input
                  value={cameraForm.name}
                  onChange={(e) => setCameraForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="e.g. CAM-01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Location</label>
                <input
                  value={cameraForm.location}
                  onChange={(e) => setCameraForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="e.g. 6th October Bridge"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Speed Limit (km/h)</label>
                <input
                  type="number"
                  value={cameraForm.speed_limit}
                  onChange={(e) => setCameraForm((f) => ({ ...f, speed_limit: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  min={10}
                  max={200}
                />
              </div>
              <button
                type="submit"
                disabled={addingCamera}
                className="w-full py-2.5 rounded-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 text-sm disabled:opacity-50"
              >
                {addingCamera ? "Adding..." : "Add Camera"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
