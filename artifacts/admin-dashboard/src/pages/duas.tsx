import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { HeartHandshake, Plus, Search, BookOpen, CheckCircle } from "lucide-react";

interface DuaItem {
  id: string;
  category: string;
  title: string;
  titleArabic?: string;
  arabic: string;
  transliteration?: string;
  translation: string;
  translationUr?: string;
  reference: string;
  benefits?: string;
}

export default function DuasPage() {
  const { toast } = useToast();
  const [duas, setDuas] = useState<DuaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    category: "morning",
    title: "",
    titleArabic: "",
    arabic: "",
    transliteration: "",
    translation: "",
    translationUr: "",
    reference: "",
    benefits: "",
  });

  const categories = [
    { id: "all", label: "All Duas" },
    { id: "morning", label: "Morning" },
    { id: "evening", label: "Evening" },
    { id: "prayer", label: "Prayer / Salah" },
    { id: "food", label: "Food & Drink" },
    { id: "travel", label: "Travel" },
    { id: "distress", label: "Distress / Grief" },
    { id: "protection", label: "Protection" },
    { id: "forgiveness", label: "Forgiveness (Istighfar)" },
  ];

  const fetchDuas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/duas?limit=100`);
      const data = await res.json();
      if (data.duas) setDuas(data.duas);
    } catch {
      toast({ title: "Error", description: "Failed to load Duas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuas();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/duas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to create Dua");
      toast({ title: "Success", description: "Dua added to Hisnul Muslim database" });
      setOpen(false);
      setForm({
        category: "morning",
        title: "",
        titleArabic: "",
        arabic: "",
        transliteration: "",
        translation: "",
        translationUr: "",
        reference: "",
        benefits: "",
      });
      fetchDuas();
    } catch {
      toast({ title: "Error", description: "Failed to add Dua", variant: "destructive" });
    }
  };

  const filtered = duas.filter((d) => {
    const matchesCategory = selectedCategory === "all" || d.category === selectedCategory;
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.arabic.includes(search) ||
      d.translation.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HeartHandshake className="text-primary" /> Hisnul Muslim & Duas Library
            </h1>
            <p className="text-muted-foreground mt-1">Manage verified supplications, azkar, and prophetic duas</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} /> Add New Dua
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Dua to Hisnul Muslim</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {categories.filter((c) => c.id !== "all").map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Title (English)</Label>
                    <Input
                      required
                      placeholder="e.g. Waking Up"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Title (Arabic)</Label>
                  <Input
                    placeholder="e.g. عند الاستيقاظ"
                    value={form.titleArabic}
                    onChange={(e) => setForm({ ...form, titleArabic: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Arabic Text</Label>
                  <Textarea
                    required
                    rows={3}
                    placeholder="الْحَمْدُ لِلَّهِ الَّذِي..."
                    className="text-right font-arabic text-lg"
                    value={form.arabic}
                    onChange={(e) => setForm({ ...form, arabic: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Transliteration</Label>
                  <Input
                    placeholder="Alhamdu lillahi alladhi..."
                    value={form.transliteration}
                    onChange={(e) => setForm({ ...form, transliteration: e.target.value })}
                  />
                </div>

                <div>
                  <Label>English Translation</Label>
                  <Textarea
                    required
                    rows={2}
                    placeholder="All praise is for Allah who..."
                    value={form.translation}
                    onChange={(e) => setForm({ ...form, translation: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Urdu Translation</Label>
                  <Textarea
                    rows={2}
                    placeholder="تمام تعریفیں اللہ کے لیے ہیں..."
                    className="text-right"
                    value={form.translationUr}
                    onChange={(e) => setForm({ ...form, translationUr: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Reference (Hadith/Quran)</Label>
                    <Input
                      required
                      placeholder="e.g. Al-Bukhari 6312"
                      value={form.reference}
                      onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Benefits / Virtue</Label>
                    <Input
                      placeholder="Virtue or recommended frequency"
                      value={form.benefits}
                      onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Dua</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search duas by title, text, or translation..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {categories.map((c) => (
              <Button
                key={c.id}
                variant={selectedCategory === c.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading duas...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No duas found. Click "Add New Dua" to populate the database.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((d) => (
              <Card key={d.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{d.title}</CardTitle>
                    <Badge variant="secondary" className="capitalize text-xs">{d.category}</Badge>
                  </div>
                  {d.titleArabic && <p className="text-xs text-muted-foreground text-right">{d.titleArabic}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted/40 rounded-lg text-right">
                    <p className="text-lg leading-relaxed font-arabic text-foreground">{d.arabic}</p>
                  </div>
                  {d.transliteration && (
                    <p className="text-xs italic text-muted-foreground">{d.transliteration}</p>
                  )}
                  <p className="text-sm text-foreground">{d.translation}</p>
                  {d.translationUr && (
                    <p className="text-xs text-muted-foreground text-right">{d.translationUr}</p>
                  )}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <BookOpen size={12} /> {d.reference}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <CheckCircle size={12} /> Verified
                    </span>
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
