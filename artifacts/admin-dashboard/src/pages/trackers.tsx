import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, Clock, Award, Flame } from "lucide-react";

export default function TrackersAdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"prayers" | "hifz" | "fasting">("prayers");

  useEffect(() => {
    // Simulated load state
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="text-primary" /> Worship Trackers & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time synchronization records of prayers, memorization (Hifz), and fasting habits
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Daily Prayer Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">Active</div>
              <p className="text-xs text-muted-foreground mt-1">Synced with cloud database</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hifz Tracking Surahs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">114 Surahs</div>
              <p className="text-xs text-muted-foreground mt-1">Ayah-level progress logging</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fasting Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">9 Categories</div>
              <p className="text-xs text-muted-foreground mt-1">Ramadan + Voluntary fasts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cloud Sync Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">Connected</div>
              <p className="text-xs text-muted-foreground mt-1">Multi-device sync enabled</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab("prayers")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "prayers" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Prayer Logs (نماز ٹریکر)
          </button>
          <button
            onClick={() => setActiveTab("hifz")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "hifz" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Hifz Progress (حفظ ٹریکر)
          </button>
          <button
            onClick={() => setActiveTab("fasting")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "fasting" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Fasting Logs (روزہ ٹریکر)
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "prayers" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prayer Tracking Architecture & Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Cloud Synchronization Scheme:</p>
                <p className="text-sm text-muted-foreground">
                  The mobile app syncs daily prayer statuses (Fajr, Dhuhr, Asr, Maghrib, Isha) directly via <code className="text-primary">/api/trackers/prayer</code>.
                  Each entry logs attendance mode (Jama'ah, Alone, Qadha, Missed) and custom spiritual reflection notes.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {["Fajr (فجر)", "Dhuhr (ظہر)", "Asr (عصر)", "Maghrib (مغرب)", "Isha (عشاء)"].map((p, i) => (
                  <div key={i} className="p-3 border border-border rounded-lg text-center bg-card">
                    <p className="text-xs text-muted-foreground">{p}</p>
                    <Badge variant="outline" className="mt-2 text-xs">Monitored</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "hifz" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quran Memorization (Hifz) Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Memorization Milestones:</p>
                <p className="text-sm text-muted-foreground">
                  Tracks all 6,236 Ayahs across 114 Surahs. Users can mark their status as Not Started, Memorizing, Memorized, or Revising via <code className="text-primary">/api/trackers/hifz</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "fasting" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fasting & Ramadan Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Voluntary & Obligatory Fasts Supported:</p>
                <p className="text-sm text-muted-foreground">
                  Mondays, Thursdays, White Days (Ayyam al-Bid: 13, 14, 15 Hijri), Ashura, Day of Arafah, 6 days of Shawwal, First 9 days of Dhul Hijjah, and Ramadan fasts.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
