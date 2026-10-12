import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setBaseUrl, setAuthTokenGetter, useGetMe } from "@workspace/api-client-react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import BooksPage from "@/pages/books";
import LearningPage from "@/pages/learning";
import HadithPage from "@/pages/hadith";
import QuranPage from "@/pages/quran";
import DuasPage from "@/pages/duas";
import TrackersAdminPage from "@/pages/trackers";
import FiqhAdminPage from "@/pages/fiqh";
import ResearchAdminPage from "@/pages/research";
import SpiritualAdminPage from "@/pages/spiritual";
import CommunityAdminPage from "@/pages/community";
import NotFound from "@/pages/not-found";

setBaseUrl(window.location.origin);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

interface AuthCtxType {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
}
const AuthCtx = createContext<AuthCtxType>({ token: null, setToken: () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("admin_token", t);
    else localStorage.removeItem("admin_token");
  }, []);
  const logout = useCallback(() => { setToken(null); queryClient.clear(); }, [setToken]);
  useEffect(() => { setAuthTokenGetter(() => token); }, [token]);
  return <AuthCtx.Provider value={{ token, setToken, logout }}>{children}</AuthCtx.Provider>;
}

function ProtectedRouter() {
  const { token } = useAuth();
  const [location, navigate] = useLocation();
  const { data: me, isLoading, isError } = useGetMe({ query: { enabled: !!token, retry: false } as any });

  useEffect(() => {
    if (!token || isError) navigate("/login");
  }, [token, isError]);

  if (!token) return <LoginPage />;
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );

  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/books" component={BooksPage} />
      <Route path="/learning" component={LearningPage} />
      <Route path="/hadith" component={HadithPage} />
      <Route path="/quran" component={QuranPage} />
      <Route path="/duas" component={DuasPage} />
      <Route path="/trackers" component={TrackersAdminPage} />
      <Route path="/fiqh" component={FiqhAdminPage} />
      <Route path="/research" component={ResearchAdminPage} />
      <Route path="/spiritual" component={SpiritualAdminPage} />
      <Route path="/community" component={CommunityAdminPage} />
      <Route path="/login" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ProtectedRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
