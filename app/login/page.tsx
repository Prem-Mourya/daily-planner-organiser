import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center gap-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-black">Welcome back</h1>
        <p className="mt-1 text-sm text-black/50">Enter your password to open your planner.</p>
      </div>
      <LoginForm />
    </main>
  );
}
