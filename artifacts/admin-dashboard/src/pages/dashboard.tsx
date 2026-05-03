import Layout from "@/components/Layout";
import { useGetAdminStats, useGetAdminUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookMarked, GraduationCap, FileText, Bookmark, UserCheck, TrendingUp, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ label, value, icon: Icon, color, loading }: { label: string; value?: number; icon: any; color: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">{value?.toLocaleString() ?? 0}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetAdminStats();
  const { data: usersData, isLoading: usersLoading } = useGetAdminUsers({ page: 1, limit: 5 });

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "bg-blue-500/10 text-blue-500" },
    { label: "Active Today", value: stats?.activeUsersToday, icon: Activity, color: "bg-green-500/10 text-green-500" },
    { label: "Total Books", value: stats?.totalBooks, icon: BookMarked, color: "bg-amber-500/10 text-amber-500" },
    { label: "Learning Paths", value: stats?.totalLearningPaths, icon: GraduationCap, color: "bg-purple-500/10 text-purple-500" },
    { label: "Notes Created", value: stats?.totalNotes, icon: FileText, color: "bg-teal-500/10 text-teal-500" },
    { label: "Bookmarks", value: stats?.totalBookmarks, icon: Bookmark, color: "bg-rose-500/10 text-rose-500" },
    { label: "New Users (7d)", value: stats?.newUsersThisWeek, icon: TrendingUp, color: "bg-cyan-500/10 text-cyan-500" },
    { label: "Enrollments", value: stats?.totalEnrollments, icon: UserCheck, color: "bg-indigo-500/10 text-indigo-500" },
  ];

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of the Islamic Research & Learning OS</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(card => (
            <StatCard key={card.label} {...card} loading={isLoading} />
          ))}
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 font-medium">Name</th>
                      <th className="text-left py-2 font-medium">Email</th>
                      <th className="text-left py-2 font-medium">Role</th>
                      <th className="text-left py-2 font-medium">Language</th>
                      <th className="text-left py-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData?.users.map(user => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-medium text-foreground">{user.name}</td>
                        <td className="py-3 text-muted-foreground">{user.email}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground uppercase text-xs">{user.language}</td>
                        <td className="py-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {(!usersData?.users.length) && (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No users yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-2">📱 Mobile App</h3>
            <p className="text-sm text-muted-foreground">The Expo mobile app is running. Users can scan the QR code in the preview pane to access the app on their devices.</p>
            <div className="mt-3 text-xs text-muted-foreground font-mono bg-background/50 rounded p-2">
              Default credentials: admin@islamicresearch.app / admin123456
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
