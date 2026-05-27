"use client";

import { useTransition } from "react";
import { completeOnboarding } from "../actions";

export function OnboardingChoices() {
  const [isPending, startTransition] = useTransition();

  function pick(role: "planner" | "venue") {
    startTransition(() => {
      completeOnboarding(role);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Choice
        eyebrow="For event organisers"
        title="I'm a Planner"
        body="I'm booking venues for conferences, meetings, or events."
        cta="Continue as Planner"
        onPick={() => pick("planner")}
        disabled={isPending}
      />
      <Choice
        eyebrow="For property owners"
        title="I'm a Venue"
        body="I run a hotel, banquet hall, or convention centre."
        cta="Continue as Venue"
        onPick={() => pick("venue")}
        disabled={isPending}
      />
    </div>
  );
}

function Choice({
  eyebrow,
  title,
  body,
  cta,
  onPick,
  disabled,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  onPick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className="flex flex-col items-start gap-2 rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-indigo-500 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400 dark:hover:bg-indigo-950"
    >
      <span className="text-xs font-medium tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
        {eyebrow}
      </span>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">{body}</p>
      <span className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
        {disabled ? "Saving..." : cta} &rarr;
      </span>
    </button>
  );
}
