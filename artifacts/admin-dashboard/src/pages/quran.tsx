import Layout from "@/components/Layout";
import { useGetSurahs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuranPage() {
  const { data: surahs, isLoading } = useGetSurahs();
  const [search, setSearch] = useState("");

  const filtered = surahs?.filter(s =>
    s.nameEnglish.toLowerCase().includes(search.toLowerCase()) ||
    s.nameTransliteration.toLowerCase().includes(search.toLowerCase()) ||
    String(s.number).includes(search)
  ) ?? [];

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quran Database</h1>
          <p className="text-muted-foreground mt-1">{surahs?.length ?? 0} surahs in the database</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search surahs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">#</th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Transliteration</th>
                      <th className="text-left py-3 px-4 font-medium">Arabic</th>
                      <th className="text-left py-3 px-4 font-medium">Ayahs</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Juz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(surah => (
                      <tr key={surah.number} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {surah.number}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{surah.nameEnglish}</td>
                        <td className="py-3 px-4 text-muted-foreground">{surah.nameTransliteration}</td>
                        <td className="py-3 px-4 text-right text-amber-500 font-medium">{surah.nameArabic}</td>
                        <td className="py-3 px-4 text-muted-foreground">{surah.totalAyahs}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${surah.revelationType === "Meccan" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}>
                            {surah.revelationType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{surah.juzStart}</td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <BookOpen size={32} className="mx-auto mb-2 text-muted-foreground/40" />
                        <p>{search ? "No matching surahs" : "No surahs in database yet"}</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
