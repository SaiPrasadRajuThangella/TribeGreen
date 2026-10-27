import { Eye, EyeOff, Gift, Lock } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui";
import { useSeo } from "@/hooks/useSeo";
import { adminLogin } from "@/lib/api";
import { USE_MOCK } from "@/lib/config";
import { useAuth } from "@/store";

export default function AdminLogin() {
  useSeo({ title: "Admin sign in", description: "Tribe Green admin.", noindex: true });

  const token = useAuth((s) => s.token);
  const setToken = useAuth((s) => s.setToken);
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { token } = await adminLogin(username.trim(), password);
      setToken(token);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <form
        noValidate
        onSubmit={submit}
        className="w-full max-w-sm rounded-[32px] bg-card p-8 shadow-[0_30px_60px_-30px_rgba(18,18,18,0.25)]"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-ink">
            <Gift size={20} className="text-lime" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">Tribe Green admin</h1>
            <p className="text-sm text-muted">Sign in to manage enquiries</p>
          </div>
        </div>

        <label htmlFor="username" className="mb-2 block text-sm font-semibold">
          Username
        </label>
        <input
          id="username"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 h-12 w-full rounded-2xl border border-line bg-canvas px-4 outline-none focus:border-ink focus:bg-card"
        />

        <label htmlFor="password" className="mb-2 block text-sm font-semibold">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-2xl border border-line bg-canvas pr-12 pl-4 outline-none focus:border-ink focus:bg-card"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-soft"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="dark" icon={Lock} loading={loading} className="mt-6 w-full">
          Sign in
        </Button>

        {USE_MOCK ? (
          <p className="mt-5 text-center text-xs leading-5 text-faint">
            Demo mode: the login details are in the project README.
          </p>
        ) : null}
      </form>
    </div>
  );
}
