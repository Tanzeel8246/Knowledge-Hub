import { useState } from "react";
import Layout from "@/components/Layout";
import { useGetBooks, useGetBookCategories, useAdminCreateBook, useAdminDeleteBook } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, BookMarked, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function BooksPage() {
  const { data: booksData, isLoading } = useGetBooks({});
  const { data: categories } = useGetBookCategories();
  const createBook = useAdminCreateBook();
  const deleteBook = useAdminDeleteBook();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", categoryId: "", language: "en", description: "", isPublic: true });

  const handleCreate = async () => {
    if (!form.title || !form.author || !form.categoryId) {
      toast({ title: "Missing fields", description: "Title, author, and category are required", variant: "destructive" });
      return;
    }
    try {
      await createBook.mutateAsync(form as any);
      toast({ title: "Book created" });
      setOpen(false);
      setForm({ title: "", author: "", categoryId: "", language: "en", description: "", isPublic: true });
      queryClient.invalidateQueries({ queryKey: ["/books"] });
    } catch {
      toast({ title: "Error", description: "Failed to create book", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    try {
      await deleteBook.mutateAsync({ bookId: id });
      toast({ title: "Book deleted" });
      queryClient.invalidateQueries({ queryKey: ["/books"] });
    } catch {
      toast({ title: "Error", description: "Failed to delete book", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Books Library</h1>
            <p className="text-muted-foreground mt-1">{booksData?.total ?? 0} books · Manage the Islamic books collection</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-2" /> Add Book</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add New Book</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Author *</Label>
                    <Input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Category *</Label>
                    <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Language</Label>
                    <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="ur">Urdu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.isPublic} onCheckedChange={v => setForm(f => ({ ...f, isPublic: v }))} />
                  <Label>Public (visible to all users)</Label>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createBook.isPending}>
                  {createBook.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                  Create Book
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Title</th>
                      <th className="text-left py-3 px-4 font-medium">Author</th>
                      <th className="text-left py-3 px-4 font-medium">Language</th>
                      <th className="text-left py-3 px-4 font-medium">Chapters</th>
                      <th className="text-left py-3 px-4 font-medium">Visibility</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booksData?.books.map(book => (
                      <tr key={book.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-foreground">{book.title}</p>
                            {book.titleArabic && <p className="text-muted-foreground text-xs">{book.titleArabic}</p>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{book.author}</td>
                        <td className="py-3 px-4">
                          <span className="uppercase text-xs font-medium text-muted-foreground">{book.language}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{book.totalChapters}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${book.isPublic ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                            {book.isPublic ? "Public" : "Private"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(book.id)}>
                            <Trash2 size={15} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!booksData?.books.length && (
                      <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <BookMarked size={32} className="text-muted-foreground/40" />
                          <span>No books yet. Add one above.</span>
                        </div>
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
