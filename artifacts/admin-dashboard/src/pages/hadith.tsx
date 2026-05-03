import Layout from "@/components/Layout";
import { useGetHadithCollections, useGetHadithBooks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ScrollText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HadithPage() {
  const { data: collections, isLoading } = useGetHadithCollections();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: books, isLoading: booksLoading } = useGetHadithBooks(selected ?? "", { query: { enabled: !!selected } });

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hadith Library</h1>
          <p className="text-muted-foreground mt-1">Browse hadith collections and books</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collections */}
          <Card>
            <CardHeader><CardTitle className="text-base">Collections</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {collections?.map(col => (
                    <button
                      key={col.id}
                      onClick={() => setSelected(col.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors",
                        selected === col.id && "bg-primary/5"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", selected === col.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                        <ScrollText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{col.name}</p>
                        <p className="text-muted-foreground text-xs">{col.totalHadiths?.toLocaleString()} hadiths</p>
                      </div>
                      {selected === col.id && <ChevronRight size={14} className="text-primary shrink-0" />}
                    </button>
                  ))}
                  {!collections?.length && (
                    <div className="p-8 text-center text-muted-foreground text-sm">No collections</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Books */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {selected ? `Books in ${collections?.find(c => c.id === selected)?.name ?? selected}` : "Select a collection"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selected ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ScrollText size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p>Select a collection to view its books</p>
                </div>
              ) : booksLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-left py-2 font-medium">#</th>
                        <th className="text-left py-2 font-medium">Book Name</th>
                        <th className="text-left py-2 font-medium">Arabic</th>
                        <th className="text-left py-2 font-medium">Hadiths</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books?.map(book => (
                        <tr key={`${book.collectionId}-${book.bookNumber}`} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-3 text-muted-foreground font-medium">{book.bookNumber}</td>
                          <td className="py-3 text-foreground">{book.nameEnglish ?? `Book ${book.bookNumber}`}</td>
                          <td className="py-3 text-muted-foreground text-right">{book.nameArabic ?? "—"}</td>
                          <td className="py-3 text-muted-foreground">{book.totalHadiths}</td>
                        </tr>
                      ))}
                      {!books?.length && (
                        <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No books found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
