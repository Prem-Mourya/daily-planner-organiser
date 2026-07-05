"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { login, type LoginState } from "@/app/actions/auth";

const initial: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="solid" disabled={pending}>
      {pending ? "Checking…" : "Enter"}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(login, initial);

  return (
    <Card>
      <form action={action} className="flex flex-col gap-3">
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoFocus
          className="w-full rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-sm text-black outline-none backdrop-blur placeholder:text-black/30 focus:border-black/30"
        />
        {state.error ? <p className="text-sm text-black/60">{state.error}</p> : null}
        <SubmitButton />
      </form>
    </Card>
  );
}
