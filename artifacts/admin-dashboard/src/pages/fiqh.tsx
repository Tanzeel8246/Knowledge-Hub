import Layout from "@/components/Layout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Scale, Users, Calculator, BookOpen, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HeirShare {
  heir: string;
  heirUrdu: string;
  heirArabic: string;
  count: number;
  fractionLabel: string;
  sharePercentage: number;
  amount: number;
  eachAmount: number;
  quranicEvidence: string;
}

export default function FiqhAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"inheritance" | "comparative">("inheritance");

  // Inheritance State
  const [estate, setEstate] = useState("1000000");
  const [currency, setCurrency] = useState("PKR");
  const [deceasedGender, setDeceasedGender] = useState<"male" | "female">("male");
  const [wivesCount, setWivesCount] = useState("1");
  const [hasHusband, setHasHusband] = useState(false);
  const [sonsCount, setSonsCount] = useState("2");
  const [daughtersCount, setDaughtersCount] = useState("1");
  const [hasFather, setHasFather] = useState(true);
  const [hasMother, setHasMother] = useState(true);

  const [calcResult, setCalcResult] = useState<{
    totalEstate: number;
    currency: string;
    shares: HeirShare[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const runCalculation = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/fiqh/calculate-inheritance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalEstate: Number(estate),
          currency,
          deceasedGender,
          wivesCount: deceasedGender === "male" ? Number(wivesCount) : 0,
          hasHusband: deceasedGender === "female" ? hasHusband : false,
          sonsCount: Number(sonsCount),
          daughtersCount: Number(daughtersCount),
          hasFather,
          hasMother,
        }),
      });
      const data = await res.json();
      if (data.shares) {
        setCalcResult(data);
        toast({ title: "Calculation Complete", description: "Islamic Shariah shares computed successfully" });
      }
    } catch {
      toast({ title: "Error", description: "Calculation failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scale className="text-primary" /> Fiqh & Shariah Solutions (علم الفرائض و الفقہ)
            </h1>
            <p className="text-muted-foreground mt-1">
              Islamic inheritance distribution engine and comparative jurisprudence across 4 Madhahib
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={activeTab === "inheritance" ? "default" : "outline"}
              onClick={() => setActiveTab("inheritance")}
              className="gap-2"
            >
              <Calculator size={16} /> علم المواریث (Inheritance)
            </Button>
            <Button
              variant={activeTab === "comparative" ? "default" : "outline"}
              onClick={() => setActiveTab("comparative")}
              className="gap-2"
            >
              <BookOpen size={16} /> فقہ مقارن (Comparative)
            </Button>
          </div>
        </div>

        {activeTab === "inheritance" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users size={18} className="text-primary" /> ورثاء اور ترکہ کی تفصیلات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>کل قابل تقسیم ترکہ</Label>
                    <Input
                      type="number"
                      value={estate}
                      onChange={(e) => setEstate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>کرنسی</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="PKR">PKR (روپے)</option>
                      <option value="USD">USD ($)</option>
                      <option value="SAR">SAR (ریال)</option>
                      <option value="AED">AED (درہم)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>میت کی جنس (Deceased Gender)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      type="button"
                      variant={deceasedGender === "male" ? "default" : "outline"}
                      onClick={() => setDeceasedGender("male")}
                      size="sm"
                    >
                      مرد (مرحوم شوہر/باپ)
                    </Button>
                    <Button
                      type="button"
                      variant={deceasedGender === "female" ? "default" : "outline"}
                      onClick={() => setDeceasedGender("female")}
                      size="sm"
                    >
                      عورت (مرحومہ بیوی/ماں)
                    </Button>
                  </div>
                </div>

                {deceasedGender === "male" ? (
                  <div>
                    <Label>بیواؤں کی تعداد (Wives)</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                      value={wivesCount}
                      onChange={(e) => setWivesCount(e.target.value)}
                    >
                      <option value="0">کوئی نہیں (0)</option>
                      <option value="1">ایک بیوہ (1)</option>
                      <option value="2">دو بیوائیں (2)</option>
                      <option value="3">تین بیوائیں (3)</option>
                      <option value="4">چار بیوائیں (4)</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="husbandCheck"
                      checked={hasHusband}
                      onChange={(e) => setHasHusband(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="husbandCheck" className="cursor-pointer">شوہر حیات ہے؟</Label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>بیٹوں کی تعداد (Sons)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={sonsCount}
                      onChange={(e) => setSonsCount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>بیٹیوں کی تعداد (Daughters)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={daughtersCount}
                      onChange={(e) => setDaughtersCount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fatherCheck"
                      checked={hasFather}
                      onChange={(e) => setHasFather(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="fatherCheck" className="cursor-pointer">والد حیات ہیں</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="motherCheck"
                      checked={hasMother}
                      onChange={(e) => setHasMother(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="motherCheck" className="cursor-pointer">والدہ حیات ہیں</Label>
                  </div>
                </div>

                <Button className="w-full mt-4" onClick={runCalculation} disabled={loading}>
                  {loading ? "حساب جاری ہے..." : "شرعی حصص کا حساب لگائیں (Calculate)"}
                </Button>
              </CardContent>
            </Card>

            {/* Results Display */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>شرعی تقسیم کا نتیجہ (Distribution Breakdown)</span>
                  {calcResult && (
                    <Badge variant="secondary" className="font-mono">
                      کل ترکہ: {currency} {Number(estate).toLocaleString()}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!calcResult ? (
                  <div className="py-16 text-center text-muted-foreground">
                    ورثاء کی تفصیلات درج کر کے "حساب لگائیں" پر کلک کریں
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground text-xs">
                            <th className="py-2 text-left">وارث (Heir)</th>
                            <th className="py-2 text-center">تعداد</th>
                            <th className="py-2 text-center">قرآنی حصہ (Share)</th>
                            <th className="py-2 text-right">فی کس رقم</th>
                            <th className="py-2 text-right">کل رقم ({currency})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {calcResult.shares.map((s, idx) => (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="py-3">
                                <p className="font-semibold text-foreground">{s.heirUrdu}</p>
                                <p className="text-xs text-muted-foreground font-arabic">{s.heirArabic} ({s.heir})</p>
                              </td>
                              <td className="py-3 text-center">{s.count}</td>
                              <td className="py-3 text-center">
                                <Badge variant="outline" className="text-xs">{s.fractionLabel}</Badge>
                                <span className="block text-[10px] text-muted-foreground mt-0.5">{s.sharePercentage.toFixed(2)}%</span>
                              </td>
                              <td className="py-3 text-right font-mono font-medium">
                                {Math.round(s.eachAmount).toLocaleString()}
                              </td>
                              <td className="py-3 text-right font-mono font-bold text-primary">
                                {Math.round(s.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Quranic References */}
                    <div className="space-y-2 pt-4 border-t border-border">
                      <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase">قرآنی دلائل و نصوص (Shariah Evidence):</p>
                      {calcResult.shares.map((s, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-muted/40 text-xs flex items-start gap-2">
                          <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-foreground">{s.heirUrdu}: </span>
                            <span className="text-muted-foreground font-arabic">{s.quranicEvidence}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "comparative" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "رفع الیدین فی الصلاۃ (Raising hands in prayer)",
                summary: "تکبیر تحریمہ کے علاوہ رکوع میں جاتے اور اٹھتے وقت رفع یدین کا حکم",
                hanafi: "احناف کے نزدیک تکبیر تحریمہ کے علاوہ بقیہ مقامات پر رفع یدین سنت منسوخ یا ترک اولیٰ ہے۔ (ابن مسعود ؓ کی روایت)",
                shafii: "شوافع و حنابلہ کے نزدیک رکوع جاتے اور سر اٹھاتے وقت رفع یدین مسنون اور مستحب ہے۔ (ابن عمر ؓ کی روایت)",
              },
              {
                title: "جلسۂ استراحت (Sitting briefly after second prostration)",
                summary: "پہلی اور تیسری رکعت میں دوسرے سجدے کے بعد سیدھا کھڑا ہونا یا تھوڑی دیر بیٹھنا",
                hanafi: "احناف کے نزدیک سیدھا کھڑا ہونا اولیٰ اور سنت ہے، جلسۂ استراحت بغیر عذر کے ثابت نہیں۔",
                shafii: "امام شافعی کے نزدیک جلسۂ استراحت سنت ہے اور مالک بن حویرث ؓ کی حدیث پر عمل ہے۔",
              },
              {
                title: "مسنون وضو میں ترتیب (Order of Wudu)",
                summary: "وضو میں چہرہ، ہاتھ، سر اور پاؤں دھونے میں ترتیب کا فرض ہونا",
                hanafi: "احناف و مالکیہ کے نزدیک ترتیب سنتِ مؤکدہ ہے، فرض نہیں۔ اگر الٹی ترتیب سے وضو کیا تو ہو جائے گا۔",
                shafii: "شوافع اور حنابلہ کے نزدیک آیتِ قرآنیہ کی بنا پر ترتیب فرض اور رکن ہے۔",
              },
              {
                title: "زکوٰۃ میں نصابِ چاندی و سونا (Nisab Preference)",
                summary: "مخلوط اثاثہ جات اور نقدی میں چاندی یا سونے کے نصاب کو بنیاد بنانا",
                hanafi: "فقہ حنفی میں چاندی کے نصاب (595 گرام) کو ترجیح ہے تاکہ فقراء و مساکین کو زیادہ سے زیادہ نفع پہنچے۔",
                shafii: "شوافع کے نزدیک سونے کا نصاب (85 گرام) اصل پیمانہ ہے۔",
              },
            ].map((topic, idx) => (
              <Card key={idx} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{topic.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{topic.summary}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">فقہ حنفی (Hanafi View):</p>
                    <p className="text-xs text-foreground mt-1 leading-relaxed">{topic.hanafi}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">فقہ شافعی و دیگر ائمہ (Shafi'i & Jumhoor):</p>
                    <p className="text-xs text-foreground mt-1 leading-relaxed">{topic.shafii}</p>
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
