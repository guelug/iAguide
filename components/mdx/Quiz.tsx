"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  stem: string;
  options: Option[];
  correct: string;
  explanation: string;
};

export function Quiz({ questions }: { questions: Question[] }) {
  const t = useTranslations("mdx");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) return null;

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correct).length
    : 0;

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="border-b border-line/70 px-4 py-2.5">
        <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-violet">
          {t("quiz")}
        </p>
        <p className="mt-0.5 text-xs text-ink-soft">{questions.length} questions</p>
      </div>

      <div className="divide-y divide-line/50">
        {questions.map((q, i) => {
          const isCorrect = submitted && answers[q.id] === q.correct;
          const isWrong = submitted && answers[q.id] && answers[q.id] !== q.correct;
          return (
            <div key={q.id} className="px-4 py-4">
              <p className="mb-2 text-sm font-medium text-ink">
                <span className="text-violet">{i + 1}.</span> {q.stem}
              </p>
              <div className="flex flex-col gap-1.5">
                {q.options.map((opt) => {
                  let className =
                    "cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors";
                  if (submitted) {
                    if (opt.id === q.correct)
                      className += " border-teal bg-teal-wash text-teal-deep";
                    else if (answers[q.id] === opt.id)
                      className += " border-rose/60 bg-rose-wash text-rose-deep line-through";
                    else className += " border-line/50 text-faint";
                  } else {
                    className +=
                      answers[q.id] === opt.id
                        ? " border-violet/60 bg-violet-wash text-violet-deep"
                        : " border-line text-ink-soft hover:border-violet/30 hover:bg-violet-wash/50";
                  }
                  return (
                    <button
                      key={opt.id}
                      disabled={submitted}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                      }
                      className={className}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
              {submitted && !isCorrect && (
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  <span className="font-medium text-amber">{t("explanation")}:</span>{" "}
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-line/70 px-4 py-3">
        <button
          onClick={() => {
            setAnswers({});
            setSubmitted(false);
          }}
          className="rounded-md border border-line px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted transition-colors hover:bg-sunken"
        >
          {t("reset")}
        </button>
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length < questions.length}
            className="rounded-md bg-violet px-4 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-white transition-colors hover:bg-violet-deep disabled:opacity-40"
          >
            {t("check")}
          </button>
        ) : (
          <p className="font-mono text-sm text-ink">
            {score}/{questions.length}
          </p>
        )}
      </div>
    </div>
  );
}
