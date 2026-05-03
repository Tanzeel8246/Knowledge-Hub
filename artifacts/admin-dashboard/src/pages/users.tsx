import { useState } from "react";
import Layout from "@/components/Layout";
import { useGetAdminUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetAdminUsers({ page, limit: 20, search: search || undefined });

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">Manage registered users · {data?.total ?? 0} total</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-left py-3 font-medium">Name</th>
                        <th className="text-left py-3 font-medium">Email</th>
                        <th className="text-left py-3 font-medium">Role</th>
                        <th className="text-left py-3 font-medium">Language</th>
                        <th className="text-left py-3 font-medium">Theme</th>
                        <th className="text-left py-3 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.users.map(user => (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                                {user.name[0].toUpperCase()}
                              </div>
                              <span className="font-medium text-foreground">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground">{user.email}</td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground uppercase text-xs font-medium">{user.language}</td>
                          <td className="py-3 text-muted-foreground capitalize text-xs">{user.theme}</td>
                          <td className="py-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {!data?.users.length && (
                        <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Users size={32} className="text-muted-foreground/40" />
                            <span>No users found</span>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {data.totalPages} · {data.total} users
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft size={16} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
