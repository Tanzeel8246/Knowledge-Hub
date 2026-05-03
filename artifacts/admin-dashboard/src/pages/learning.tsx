import { useState } from "react";
import Layout from "@/components/Layout";
import { useGetLearningPaths, useAdminCreateLearningPath } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, GraduationCap, Loader2, Clock, BookOpen, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const levelColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-500",
  intermediate: "bg-amber-500/10 text-amber-500",
  advanced: "bg-red-500/10 text-red-500",
};

export default function LearningPage() {
  const { data: paths, isLoading } = useGetLearningPaths({});
  const createPath = useAdminCreateLearningPath();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", level: "beginner" as const, topic: "", estimatedHours: 10 });

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.topic) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    try {
      await createPath.mutateAsync(form as any);
      toast({ title: "Learning path created" });
      setOpen(false);
      setForm({ title: "", description: "", level: "beginner", topic: "", estimatedHours: 10 });
      queryClient.invalidateQueries({ queryKey: ["/learning/paths"] });
    } catch {
      toast({ title: "Error creating path", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Learning Paths</h1>
            <p className="text-muted-foreground mt-1">{paths?.length ?? 0} paths · Structured Islamic education</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-2" /> Add Path</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Learning Path</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description *</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Level</Label>
                    <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Topic *</Label>
                    <Input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Aqeedah" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Estimated Hours</Label>
                  <Input type="number" value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: Number(e.target.value) }))} min={1} />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createPath.isPending}>
                  {createPath.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                  Create Path
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paths?.map(path => (
              <Card key={path.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${levelColors[path.level]}`}>
                      {path.level}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{path.topic}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 leading-snug">{path.title}</h3>
                  <p className="text-muted-foreground text-xs line-clamp-2 mb-4">{path.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen size={12} /> {path.totalLessons} lessons</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {path.estimatedHours}h</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {path.enrolledCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!paths?.length && (
              <div className="col-span-3 py-16 text-center text-muted-foreground">
                <GraduationCap size={40} className="mx-auto mb-3 text-muted-foreground/40" />
                <p>No learning paths yet. Create one above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
