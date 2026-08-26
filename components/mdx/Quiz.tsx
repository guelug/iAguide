"use client";

teContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";

export type Letter = "a" | "b" | "c" | "d";

const STORAGE_KEY = "iaguide:quiz:v1";

type Store = Record<string, Record<string, Letter>>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(next: Store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
}

type QuizCtx = {
  quizId: string;
  picked: Record<string, Letter>;
  pick: (qid: string, letter: Letter) => void;
  reset: () => void;
};

const Ctx = createContext<QuizCtx | null>(null);

export function Quiz({ id, children }: { id: string; children: ReactNode }) {
  const t = useTranslations("mdx");
  const [picked, setPicked] = useState<Record<string, Letter>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const store = readStore();
    setPicked(store[id] ?? {});
    setReady(true);
  }, [id]);

  const pick = useCallback(
    (qid: string, letter: Letter) => {
      setPicked((prev) => {
        const nextQ = { ...prev, [qid]: letter };
        const store = readStore();
        store[id] = nextQ;
        writeStore(store);
        return nextQ;
      });
    },
    [id],
  );

  const reset = useCallback(() => {
    setPicked({});
    const store = readStore();
    delete store[id];
    writeStore(store);
  }, [id]);

  const value = useMemo(
    () => ({ quizId: id, picked, pick, reset }),
    [id, picked, pick, reset],
  );

  const total = countQuestions(children);
  const answered = Object.keys(picked).length;
  const correct = countCorrect(children, picked);

  return (
    <Ctx.Provider value={value}>
      <section
        className="not-prose my-8 overflow-x-clip rounded-xl border border-line bg-surface"
        data-quiz={id}
        aria-label={t("quiz")}
      >
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <p className="font-mono text-[0.7rem] tracking-[0.18em] uppercase text-violet">
            {t("quiz")}
          </p>
          {ready && answered > 0 ? (
            <p className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-faint">
              {t("quizSaved")}
            </p>
          ) : null}
        </header>
        <div className="divide-y divide-line">{children}</div>
        <footer className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-ink-soft">
            {ready && total > 0
              ? t("quizScore", { correct, total, answered })
              : t("quizHint")}
          </p>
          {answered > 0 ? (
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-lg border border-line px-3 font-mono text-[0.7rem] tracking-[0.14em] uppercase text-muted hover:border-teal/50 hover:text-ink"
            >
              {t("quizRetry")}
            </button>
          ) : null}
        </footer>
      </section>
    </Ctx.Provider>
  );
}

export function Q({
  id,
  prompt,
  a,
  b,
  c,
  d,
  answer,
  why,
  missA,
  missB,
  missC,
  missD,
}: {
  id: string;
  prompt: string;
  a: string;
  b: string;
  c?: string;
  d?: string;
  answer: Letter;
  why: string;
  missA?: string;
  missB?: string;
  missC?: string;
  missD?: string;
}) {
  const t = useTranslations("mdx");
  const ctx = useContext(Ctx);
  if (!ctx) return null;

  const choices: { letter: Letter; text: string; miss?: string }[] = [
    { letter: "a", text: a, miss: missA },
    { letter: "b", text: b, miss: missB },
  ];
  if (c) choices.push({ letter: "c", text: c, miss: missC });
  if (d) choices.push({ letter: "d", text: d, miss: missD });

  const chosen = ctx.picked[id];
  const revealed = Boolean(chosen);

  return (
    <fieldset className="px-4 py-4">
      <legend className="text-[0.98rem] font-medium leading-relaxed text-ink">
        {prompt}
      </legend>
      <div className="mt-3 grid gap-2">
        {choices.map((ch) => {
          const isChosen = chosen === ch.letter;
          const isRight = ch.letter === answer;
          let cls =
            "min-h-11 w-full rounded-lg border px-3 py-2 text-left text-[0.95rem] leading-snug transition-colors ";
          if (!revealed) {
            cls += "border-line bg-paper text-ink hover:border-violet/50";
          } else if (isRight) {
            cls += "border-teal bg-teal-wash text-ink";
          } else if (isChosen) {
            cls += "border-rose bg-rose-wash text-ink";
          } else {
            cls += "border-line bg-paper text-muted";
          }
          return (
            <button
              key={ch.letter}
              type="button"
              className={cls}
              aria-pressed={isChosen}
              onClick={() => ctx.pick(id, ch.letter)}
            >
              <span className="mr-2 font-mono text-[0.7rem] uppercase text-faint">
                {ch.letter}
              </span>
              {ch.text}
            </button>
          );
        })}
      </div>
      {revealed ? (
        <div className="mt-3 rounded-lg bg-sunken px-3 py-2 text-[0.92rem] leading-relaxed text-ink-soft">
          <p className="font-mono text-[0.62rem] tracking-[0.14em] uppercase text-teal">
            {chosen === answer ? t("quizCorrect") : t("quizWrong")}
          </p>
          <p className="mt-1">{why}</p>
          {chosen && chosen !== answer
            ? (() => {
                const miss = choices.find((ch) => ch.letter === chosen)?.miss;
                return miss ? <p className="mt-2 text-muted">{miss}</p> : null;
              })()
            : null}
        </div>
      ) : null}
    </fieldset>
  );
}

function countQuestions(children: ReactNode): number {
  let n = 0;
  walk(children, () => {
    n += 1;
  });
  return n;
}

function countCorrect(children: ReactNode, picked: Record<string, Letter>): number {
  let n = 0;
  walk(children, (props) => {
    if (picked[props.id] && picked[props.id] === props.answer) n += 1;
  });
  return n;
}

function walk(
  children: ReactNode,
  visit: (props: { id: string; answer: Letter }) => void,
) {
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (!child || typeof child !== "object" || !("props" in child)) continue;
    const props = (child as { props?: { id?: string; answer?: Letter } }).props;
    if (props?.id && props.answer) visit({ id: props.id, answer: props.answer });
  }
}
