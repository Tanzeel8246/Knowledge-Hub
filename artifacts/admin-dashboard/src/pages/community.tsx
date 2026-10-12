import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Clock, Plus, Users, BookOpen, Volume2, ShieldCheck, Heart, Sparkles, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Mosque {
  id: string;
  name: string;
  arabicName?: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  contactNumber?: string;
  capacity?: number;
  hasWuduArea: boolean;
  hasLadiesArea: boolean;
  hasWheelchairAccess: boolean;
  fajrJamaat: string;
  dhuhrJamaat: string;
  asrJamaat: string;
  maghribJamaat: string;
  ishaJamaat: string;
  jummahJamaat: string;
  imamName?: string;
  verified: boolean;
}

interface KidsStory {
  id: string;
  title: string;
  titleArabic?: string;
  category: string;
  summary: string;
  arabicVerse?: string;
  urduContent: string;
  moralLesson: string;
  ageGroup: string;
}

interface Muezzin {
  id: string;
  name: string;
  muezzin: string;
  location: string;
  audioUrl: string;
  durationSec: number;
}

export default function CommunityAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"mosques" | "kids" | "muezzins">("mosques");
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [kidsStories, setKidsStories] = useState<KidsStory[]>([]);
  const [muezzins, setMuezzins] = useState<Muezzin[]>([]);
  const [loading, setLoading] = useState(true);
  const [mosqueDialogOpen, setMosqueDialogOpen] = useState(false);
  const [kidsDialogOpen, setKidsDialogOpen] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);

  // Mosque form
  const [mosqueForm, setMosqueForm] = useState({
    name: "",
    arabicName: "",
    city: "Islamabad",
    address: "",
    latitude: "33.7297",
    longitude: "73.0372",
    contactNumber: "",
    capacity: 1000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:15",
    dhuhrJamaat: "13:30",
    asrJamaat: "17:00",
    maghribJamaat: "18:45",
    ishaJamaat: "20:30",
    jummahJamaat: "13:45",
    imamName: "",
  });

  // Kids story form
  const [kidsForm, setKidsForm] = useState({
    title: "",
    titleArabic: "",
    category: "prophet_story",
    summary: "",
    arabicVerse: "",
    urduContent: "",
    moralLesson: "",
    ageGroup: "all",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, kRes, zRes] = await Promise.all([
        fetch("/api/community/mosques"),
        fetch("/api/community/kids"),
        fetch("/api/community/muezzins"),
      ]);
      const mData = await mRes.json();
      const kData = await kRes.json();
      const zData = await zRes.json();
      if (mData.mosques) setMosques(mData.mosques);
      if (kData.stories) setKidsStories(kData.stories);
      if (zData.muezzins) setMuezzins(zData.muezzins);
    } catch {
      toast({ title: "Error", description: "Failed to load community data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMosque = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/community/mosques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mosqueForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: "Mosque added successfully!" });
        setMosqueDialogOpen(false);
        fetchData();
      } else {
        toast({ title: "Error", description: data.error || "Failed to add mosque", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  const handleAddKidsStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/community/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kidsForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: "Kids story published successfully!" });
        setKidsDialogOpen(false);
        fetchData();
      } else {
        toast({ title: "Error", description: data.error || "Failed to publish story", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  const togglePlayAudio = (url: string, id: string) => {
    if (playingAudio === id && audioInstance) {
      audioInstance.pause();
      setPlayingAudio(null);
    } else {
      if (audioInstance) audioInstance.pause();
      const audio = new Audio(url);
      audio.play();
      setAudioInstance(audio);
      setPlayingAudio(id);
      audio.onended = () => setPlayingAudio(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <MapPin className="h-7 w-7 text-primary" />
              مساجد، اذان و مکتبِ اطفال (Community & Kids Suite)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              شہروں کی مرکزی مساجد، جماعت کے لائیو اوقات، حرمینی اذان اور بچوں کی اسلامی تعلیم کا انتظام
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "mosques" && (
              <Dialog open={mosqueDialogOpen} onOpenChange={setMosqueDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> نئی مسجد شامل کریں
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>نئی مسجد اور اوقاتِ جماعت کا اندراج</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddMosque} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>نام مسجد (اردو/انگریزی)</Label>
                        <Input
                          placeholder="Faisal Mosque Islamabad"
                          value={mosqueForm.name}
                          onChange={(e) => setMosqueForm({ ...mosqueForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>عربی نام</Label>
                        <Input
                          placeholder="مسجد الملك فيصل"
                          value={mosqueForm.arabicName}
                          onChange={(e) => setMosqueForm({ ...mosqueForm, arabicName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>شہر (City)</Label>
                        <Input
                          value={mosqueForm.city}
                          onChange={(e) => setMosqueForm({ ...mosqueForm, city: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>عرض بلد (Latitude)</Label>
                        <Input
                          value={mosqueForm.latitude}
                          onChange={(e) => setMosqueForm({ ...mosqueForm, latitude: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>طول بلد (Longitude)</Label>
                        <Input
                          value={mosqueForm.longitude}
                          onChange={(e) => setMosqueForm({ ...mosqueForm, longitude: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>مکمل پتہ (Address)</Label>
                      <Input
                        placeholder="Shah Faisal Ave, E-8, Islamabad"
                        value={mosqueForm.address}
                        onChange={(e) => setMosqueForm({ ...mosqueForm, address: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-primary">اوقاتِ جماعت (Jama'at Prayer Times)</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
                        <div>
                          <span className="text-xs text-muted-foreground">فجر</span>
                          <Input
                            value={mosqueForm.fajrJamaat}
                            onChange={(e) => setMosqueForm({ ...mosqueForm, fajrJamaat: e.target.value })}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">ظہر</span>
                          <Input
                            value={mosqueForm.dhuhrJamaat}
                            onChange={(e) => setMosqueForm({ ...mosqueForm, dhuhrJamaat: e.target.value })}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">عصر</span>
                          <Input
                            value={mosqueForm.asrJamaat}
                            onChange={(e) => setMosqueForm({ ...mosqueForm, asrJamaat: e.target.value })}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">مغرب</span>
                          <Input
                            value={mosqueForm.maghribJamaat}
                            onChange={(e) => setMosqueForm({ ...mosqueForm, maghribJamaat: e.target.value })}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">عشاء</span>
                          <Input
                            value={mosqueForm.ishaJamaat}
                            onChange={(e) => setMosqueForm({ ...mosqueForm, ishaJamaat: e.target.value })}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">جمعہ</span>
                          <Input
                            value={mosqueForm.jummahJamaat}
                            onChange={(e) => setMosqueForm({ ...mosqueForm, jummahJamaat: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>امام صاحب کا نام</Label>
                        <Input
                          placeholder="مولانا / ڈاکٹر ..."
                          value={mosqueForm.imamName}
                          onChange={(e) => setMosqueForm({ ...mosqueForm, imamName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>نمازیوں کی گنجائش (Capacity)</Label>
                        <Input
                          type="number"
                          value={mosqueForm.capacity}
                          onChange={(e) => setMosqueForm({ ...mosqueForm, capacity: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={mosqueForm.hasLadiesArea}
                          onChange={(e) => setMosqueForm({ ...mosqueForm, hasLadiesArea: e.target.checked })}
                        />
                        خواتین کے لیے جگہ
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={mosqueForm.hasWheelchairAccess}
                          onChange={(e) => setMosqueForm({ ...mosqueForm, hasWheelchairAccess: e.target.checked })}
                        />
                        وہیل چیئر رسائی
                      </label>
                    </div>
                    <Button type="submit" className="w-full mt-4">مسجد اور اوقات محفوظ کریں</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === "kids" && (
              <Dialog open={kidsDialogOpen} onOpenChange={setKidsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> نئی اسلامی کہانی شامل کریں
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>بچوں کے لیے نیا سبق / قصہ</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddKidsStory} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>عنوان (اردو/انگریزی)</Label>
                        <Input
                          value={kidsForm.title}
                          onChange={(e) => setKidsForm({ ...kidsForm, title: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>کیٹیگری</Label>
                        <select
                          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-white"
                          value={kidsForm.category}
                          onChange={(e) => setKidsForm({ ...kidsForm, category: e.target.value })}
                        >
                          <option value="prophet_story">قصص الانبیاء (Stories of Prophets)</option>
                          <option value="islamic_pillar">ارکانِ اسلام (Pillars of Islam)</option>
                          <option value="moral_etiquette">مسنون اخلاقیات و آداب (Manners)</option>
                          <option value="companions">صحابہ کرام کے واقعات (Companions)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>مختصر خلاصہ (Summary)</Label>
                      <Input
                        value={kidsForm.summary}
                        onChange={(e) => setKidsForm({ ...kidsForm, summary: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>قرآنی آیت یا حدیث شریف</Label>
                      <Input
                        placeholder="قُلْنَا يَا نَارُ كُونِي بَرْدًا وَسَلَامًا (الأنبياء: 69)"
                        value={kidsForm.arabicVerse}
                        onChange={(e) => setKidsForm({ ...kidsForm, arabicVerse: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>کہانی کا اردو متن (تفصیلی دلچسپ انداز میں)</Label>
                      <Textarea
                        rows={5}
                        value={kidsForm.urduContent}
                        onChange={(e) => setKidsForm({ ...kidsForm, urduContent: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>سبق آموز نتیجہ (Moral Lesson)</Label>
                      <Input
                        placeholder="ہمیں ہمیشہ اللہ تعالیٰ کے فیصلے پر راضی رہنا چاہیے..."
                        value={kidsForm.moralLesson}
                        onChange={(e) => setKidsForm({ ...kidsForm, moralLesson: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full mt-4">کہانی شائع کریں</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-border/40 gap-4">
          <button
            onClick={() => setActiveTab("mosques")}
            className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "mosques"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            <MapPin className="h-4 w-4" />
            مساجد و اوقاتِ جماعت ({mosques.length})
          </button>
          <button
            onClick={() => setActiveTab("kids")}
            className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "kids"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            مکتبِ اطفال و کہانیاں ({kidsStories.length})
          </button>
          <button
            onClick={() => setActiveTab("muezzins")}
            className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "muezzins"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            <Volume2 className="h-4 w-4" />
            حرمین اذان آڈیو پری سیٹس ({muezzins.length})
          </button>
        </div>

        {/* Tab 1: Mosques */}
        {activeTab === "mosques" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mosques.map((m) => (
              <Card key={m.id} className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-white font-bold">{m.name}</CardTitle>
                      {m.arabicName && <p className="text-xs text-primary font-arabic">{m.arabicName}</p>}
                    </div>
                    <Badge variant={m.verified ? "default" : "secondary"}>
                      {m.city}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-red-400" /> {m.address}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/40">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mb-1.5">
                      <Clock className="h-3 w-3 text-primary" /> اوقاتِ جماعت (Jama'at Times)
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="bg-black/30 p-1 rounded">
                        <span className="text-[10px] text-muted-foreground block">فجر</span>
                        <span className="font-bold text-white">{m.fajrJamaat}</span>
                      </div>
                      <div className="bg-black/30 p-1 rounded">
                        <span className="text-[10px] text-muted-foreground block">ظہر</span>
                        <span className="font-bold text-white">{m.dhuhrJamaat}</span>
                      </div>
                      <div className="bg-black/30 p-1 rounded">
                        <span className="text-[10px] text-muted-foreground block">عصر</span>
                        <span className="font-bold text-white">{m.asrJamaat}</span>
                      </div>
                      <div className="bg-black/30 p-1 rounded">
                        <span className="text-[10px] text-muted-foreground block">مغرب</span>
                        <span className="font-bold text-white">{m.maghribJamaat}</span>
                      </div>
                      <div className="bg-black/30 p-1 rounded">
                        <span className="text-[10px] text-muted-foreground block">عشاء</span>
                        <span className="font-bold text-white">{m.ishaJamaat}</span>
                      </div>
                      <div className="bg-primary/20 p-1 rounded">
                        <span className="text-[10px] text-primary block">جمعہ</span>
                        <span className="font-bold text-primary">{m.jummahJamaat}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {m.hasLadiesArea && (
                      <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">خواتین ہال</span>
                    )}
                    {m.hasWuduArea && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">وضو خانہ</span>
                    )}
                    {m.hasWheelchairAccess && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">وہیل چیئر</span>
                    )}
                    {m.capacity && (
                      <span className="px-2 py-0.5 rounded bg-gray-500/10 text-gray-300 border border-gray-500/20">گنجائش: {m.capacity.toLocaleString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tab 2: Kids Stories */}
        {activeTab === "kids" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kidsStories.map((story) => (
              <Card key={story.id} className="bg-card/50 border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white">{story.title}</CardTitle>
                    <Badge variant="outline" className="text-primary border-primary">
                      {story.category.replace("_", " ")}
                    </Badge>
                  </div>
                  {story.titleArabic && <p className="text-xs text-primary/80 font-arabic">{story.titleArabic}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-300">{story.summary}</p>
                  {story.arabicVerse && (
                    <div className="bg-primary/5 border border-primary/20 p-2.5 rounded text-center font-arabic text-primary text-sm">
                      {story.arabicVerse}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{story.urduContent}</p>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-xs text-emerald-400 flex items-start gap-1.5">
                    <Heart className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span><strong>سبق:</strong> {story.moralLesson}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tab 3: Muezzin Presets */}
        {activeTab === "muezzins" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {muezzins.map((m) => (
              <Card key={m.id} className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center justify-between">
                    <span>{m.name}</span>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {Math.floor(m.durationSec / 60)}m {m.durationSec % 60}s
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-primary">{m.muezzin}</p>
                  <p className="text-xs text-muted-foreground">{m.location}</p>
                </CardHeader>
                <CardContent>
                  <Button
                    variant={playingAudio === m.id ? "default" : "outline"}
                    className="w-full gap-2 text-xs"
                    onClick={() => togglePlayAudio(m.audioUrl, m.id)}
                  >
                    <Volume2 className="h-4 w-4" />
                    {playingAudio === m.id ? "آڈیو اذان بند کریں (Stop)" : "آڈیو اذان سنیں (Listen Preview)"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
