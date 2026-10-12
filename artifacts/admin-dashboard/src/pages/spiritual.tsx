import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Feather, Compass, Heart, Plus, Sparkles, BookOpen, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AwradItem {
  id: string;
  title: string;
  titleArabic?: string;
  category: string;
  author: string;
  arabicText: string;
  translationUr?: string;
  translationEn?: string;
  benefits?: string;
}

export default function SpiritualAdminPage() {
  const { toast } = useToast();
  const [awrad, setAwrad] = useState<AwradItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    titleArabic: "",
    category: "dalail_al_khayrat",
    author: "",
    arabicText: "",
    translationUr: "",
    translationEn: "",
    benefits: "",
  });

  const fetchAwrad = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/spiritual/awrad");
      const data = await res.json();
      if (data.awrad) setAwrad(data.awrad);
    } catch {
      toast({ title: "Error", description: "Failed to load Awrad library", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwrad();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/spiritual/awrad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Success", description: "Awrad added to spiritual library" });
      setOpen(false);
      setForm({
        title: "",
        titleArabic: "",
        category: "dalail_al_khayrat",
        author: "",
        arabicText: "",
        translationUr: "",
        translationEn: "",
        benefits: "",
      });
      fetchAwrad();
    } catch {
      toast({ title: "Error", description: "Failed to add Awrad", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Heart className="text-primary" /> Tazkiyah & Spiritual Mentor Suite (تزکیہ، سلوک و اوراد)
            </h1>
            <p className="text-muted-foreground mt-1">
              Management of classical Sufi litanies, Awrad-e-Mashaikh, and daily spiritual self-audits (محاسبۂ نفس)
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} /> Add New Awrad / Hizb
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Litany to Spiritual Library</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Title (English)</Label>
                    <Input
                      required
                      placeholder="e.g. Hizb al-Bahr"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="dalail_al_khayrat">دلائل الخیرات (Dala'il al-Khayrat)</option>
                      <option value="hizb_al_bahr">حزب البحر (Hizb al-Bahr)</option>
                      <option value="qasida_burdah">قصیدہ بردہ (Qasida Burdah)</option>
                      <option value="munajat">مناجاتِ مقبول (Munajat)</option>
                      <option value="darood">چہل درود (Forty Darood)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Title (Arabic)</Label>
                  <Input
                    placeholder="e.g. حزب البحر لسيدي الشاذلي"
                    value={form.titleArabic}
                    onChange={(e) => setForm({ ...form, titleArabic: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Author / Sheikh</Label>
                  <Input
                    required
                    placeholder="e.g. الإمام أبو الحسن الشاذليؒ"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Arabic Text</Label>
                  <Textarea
                    required
                    rows={4}
                    placeholder="يَا عَلِيُّ يَا عَظِيمُ..."
                    className="text-right font-arabic text-lg"
                    value={form.arabicText}
                    onChange={(e) => setForm({ ...form, arabicText: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Urdu Translation & Spiritual Commentary</Label>
                  <Textarea
                    rows={3}
                    placeholder="اے سب سے بلند! اے بڑی عظمت والے..."
                    className="text-right"
                    value={form.translationUr}
                    onChange={(e) => setForm({ ...form, translationUr: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Benefits / Fadilat</Label>
                  <Input
                    placeholder="روحانی فوائد و معمولات"
                    value={form.benefits}
                    onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Save to Library</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Compass size={16} /> محاسبۂ نفس (Daily Spiritual Audit)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                روزانہ کی بنیاد پر باطنی گناہوں (تکبر، غیبت، ریاکاری، غصہ) سے اجتناب اور اوصافِ حمیدہ (صبر، شکر، درود، استغفار) کی نگرانی۔
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600">
                <Sparkles size={16} /> مشائخ کے اوراد و وظائف (Awrad)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                دلائل الخیرات شریف، حزب البحر، قصیدہ بردہ شریف اور مناجات مقبول کے مستند متون اور منظوم تراجم کا کلاؤڈ ذخیرہ۔
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-600">
                <Heart size={16} /> مراقبہ و ذکرِ خفی (Muraqabah Timer)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                لطائفِ خمسہ (قلب، روح، سر، خفی، اخفیٰ) پر تفکر اور ذکرِ الٰہی کے لیے پرسکون مراقبہ ٹائمر اور روحانی ہدایات۔
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Awrad Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">کتب خانہ اوراد و معمولات (Litanies Library)</h2>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">اوراد لوڈ ہو رہے ہیں...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {awrad.map((item) => (
                <Card key={item.id} className="hover:border-primary/50 transition-colors flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">{item.title}</CardTitle>
                        <p className="text-xs text-primary font-arabic mt-0.5">{item.author}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize text-xs">
                        {item.category.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted/40 rounded-lg text-right">
                      <p className="text-sm font-arabic leading-loose text-foreground">{item.arabicText}</p>
                    </div>

                    {item.translationUr && (
                      <p className="text-xs text-muted-foreground text-right leading-relaxed font-arabic">
                        {item.translationUr}
                      </p>
                    )}

                    {item.benefits && (
                      <div className="p-2 rounded bg-primary/5 border border-primary/20 text-xs text-foreground flex items-center gap-2">
                        <CheckCircle size={14} className="text-primary shrink-0" />
                        <span>{item.benefits}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
