"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { FormMessage } from "@/components/ui";

type State = { error?: string; success?: string } | null;

export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      <FormMessage error={state?.error} success={state?.success} />
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {pending ? (
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Saving…</p>
      ) : null}
    </form>
  );
}
