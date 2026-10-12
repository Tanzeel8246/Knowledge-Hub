import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Layers, Users, BookMarked, Sparkles } from "lucide-react";

interface RootSummary {
  key: string;
  root: string;
  transliteration: string;
  meaning: string;
  meaningUrdu: string;
  totalOccurrences: number;
}

interface RootDetail {
  root: string;
  transliteration: string;
  meaning: string;
  meaningUrdu: string;
  totalOccurrences: number;
  grammarForms: {
    form: string;
    type: string;
    meaning: string;
    examplesCount: number;
  }[];
  sampleAyahs: {
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    arabic: string;
    translationEn: string;
  }[];
}

interface TafsirComparison {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  surahArabic: string;
  arabic: string;
  translationEn: string;
  translationUr: string;
  tafsirs: {
    id: string;
    name: string;
    scholar: string;
    methodology: string;
    summaryEn: string;
    summaryUr: string;
  }[];
}

export default function ResearchAdminPage() {
  const [activeTab, setActiveTab] = useState<"roots" | "tafsir" | "narrators">("roots");

  // Roots State
  const [roots, setRoots] = useState<RootSummary[]>([]);
  const [selectedRoot, setSelectedRoot] = useState<string>("علم");
  const [rootDetail, setRootDetail] = useState<RootDetail | null>(null);

  // Tafsir State
  const [surahNum, setSurahNum] = useState("1");
  const [ayahNum, setAyahNum] = useState("2");
  const [tafsirData, setTafsirData] = useState<TafsirComparison | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  // Narrators State
  const [narrators, setNarrators] = useState<any[]>([]);

  useEffect(() => {
    // Fetch roots list
    fetch("/api/research/roots")
      .then((r) => r.json())
      .then((data) => {
        if (data.roots) setRoots(data.roots);
      })
      .catch(() => {});

    // Fetch default root
    fetchRootDetail("علم");

    // Fetch narrators
    fetch("/api/research/narrators")
      .then((r) => r.json())
      .then((data) => {
        if (data.narrators) setNarrators(data.narrators);
      })
      .catch(() => {});
  }, []);

  const fetchRootDetail = (rootKey: string) => {
    setSelectedRoot(rootKey);
    fetch(`/api/research/roots/${rootKey}`)
      .then((r) => r.json())
      .then((data) => setRootDetail(data))
      .catch(() => {});
  };

  const fetchTafsir = async () => {
    try {
      setTafsirLoading(true);
      const res = await fetch(`/api/research/tafsir/${surahNum}/${ayahNum}`);
      const data = await res.json();
      if (data.tafsirs) setTafsirData(data);
    } finally {
      setTafsirLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="text-primary" /> Islamic Research & Scholar Suite (مجمع البحوث الإسلامية)
            </h1>
            <p className="text-muted-foreground mt-1">
              Quranic root words, comparative multi-tafsir analysis, and Hadith narrator evaluation (علم الرجال)
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={activeTab === "roots" ? "default" : "outline"}
              onClick={() => setActiveTab("roots")}
              className="gap-2"
            >
              <Layers size={16} /> قرآنی مادہ (Roots)
            </Button>
            <Button
              variant={activeTab === "tafsir" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("tafsir");
                if (!tafsirData) fetchTafsir();
              }}
              className="gap-2"
            >
              <BookOpen size={16} /> تقابلی تفاسیر (Tafsir)
            </Button>
            <Button
              variant={activeTab === "narrators" ? "default" : "outline"}
              onClick={() => setActiveTab("narrators")}
              className="gap-2"
            >
              <Users size={16} /> رجال الحدیث (Narrators)
            </Button>
          </div>
        </div>

        {/* 1. ROOT WORDS */}
        {activeTab === "roots" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">فہرستِ مادہ قرآنی (Root Index)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {roots.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => fetchRootDetail(r.key)}
                      className={`w-full p-3.5 text-left flex items-center justify-between transition-colors ${
                        selectedRoot === r.key ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-base text-foreground font-arabic">{r.root}</p>
                        <p className="text-xs text-muted-foreground">{r.transliteration} • {r.meaningUrdu}</p>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {r.totalOccurrences}x
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>صرفی و نحوی تجزیہ (Grammatical Analysis): <span className="font-arabic text-primary font-bold text-lg">{rootDetail?.root}</span></span>
                  <Badge variant="outline" className="font-mono">{rootDetail?.totalOccurrences} مقامات</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{rootDetail?.meaning} ({rootDetail?.meaningUrdu})</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Grammar Breakdown */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">اشتقاقی اوزان و اشکال (Derivatives):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {rootDetail?.grammarForms.map((g, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-card">
                        <p className="font-bold text-sm text-primary font-arabic">{g.form}</p>
                        <p className="text-xs text-muted-foreground">{g.meaning}</p>
                        <Badge variant="secondary" className="mt-2 text-[10px]">{g.examplesCount}x تکرار</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Verses */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">نمونۂ قرآنی آیات (Contextual Verses):</p>
                  <div className="space-y-3">
                    {rootDetail?.sampleAyahs.map((ayah, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {ayah.surahName} ({ayah.surahNumber}:{ayah.ayahNumber})
                          </Badge>
                        </div>
                        <p className="text-lg text-right font-arabic leading-relaxed text-foreground">{ayah.arabic}</p>
                        <p className="text-xs text-muted-foreground">{ayah.translationEn}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 2. COMPARATIVE TAFSIR */}
        {activeTab === "tafsir" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label>سورۃ نمبر:</Label>
                  <Input
                    type="number"
                    min="1"
                    max="114"
                    value={surahNum}
                    onChange={(e) => setSurahNum(e.target.value)}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label>آیت نمبر:</Label>
                  <Input
                    type="number"
                    min="1"
                    value={ayahNum}
                    onChange={(e) => setAyahNum(e.target.value)}
                    className="w-20"
                  />
                </div>
                <Button onClick={fetchTafsir} disabled={tafsirLoading}>
                  {tafsirLoading ? "لوڈ ہو رہا ہے..." : "تقابلی تفسیر دیکھیں"}
                </Button>
              </CardContent>
            </Card>

            {tafsirData && (
              <div className="space-y-6">
                {/* Verse Card */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 text-center space-y-3">
                    <Badge variant="secondary">{tafsirData.surahName} ({tafsirData.surahArabic}) — آیت {tafsirData.ayahNumber}</Badge>
                    <p className="text-2xl font-arabic leading-loose text-foreground">{tafsirData.arabic}</p>
                    <p className="text-sm text-foreground max-w-3xl mx-auto">{tafsirData.translationEn}</p>
                    <p className="text-xs text-muted-foreground font-arabic">{tafsirData.translationUr}</p>
                  </CardContent>
                </Card>

                {/* 3 Tafsirs Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tafsirData.tafsirs.map((t) => (
                    <Card key={t.id} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground">{t.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{t.scholar}</p>
                        <Badge variant="outline" className="w-fit text-[10px] mt-1">{t.methodology}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                        <div className="p-3 bg-muted/40 rounded-lg text-xs leading-relaxed text-foreground">
                          <p className="font-semibold text-primary mb-1">اردو تفسیری خلاصہ:</p>
                          {t.summaryUr}
                        </div>
                        <div className="p-3 bg-card border border-border rounded-lg text-xs leading-relaxed text-muted-foreground">
                          <p className="font-semibold text-foreground mb-1">Academic Note (En):</p>
                          {t.summaryEn}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. HADITH NARRATORS */}
        {activeTab === "narrators" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {narrators.map((n) => (
              <Card key={n.key} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">{n.name}</CardTitle>
                      <p className="text-sm font-arabic text-primary mt-0.5">{n.nameArabic}</p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">{n.totalHadiths} احادیث</Badge>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Badge variant="outline" className="text-xs">{n.tabaqah}</Badge>
                    <Badge variant="outline" className="text-xs">وفات: {n.deathYearHijri}ھ</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">حکم و رتبہ (Jarh & Ta'dil Verdict):</p>
                    <p className="text-xs font-arabic text-foreground mt-0.5">{n.verdict}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.biography}</p>
                  <div className="pt-2 border-t border-border">
                    <p className="text-[11px] font-semibold text-muted-foreground">مشہور شاگرد (Prominent Students):</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {n.prominentStudents?.map((s: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
