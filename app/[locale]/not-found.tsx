import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-teal">404</p>
      <h1 className="mt-3 font-display text-4xl">Off the map</h1>
      <p className="mt-3 text-muted">That module is not in the registry.</p>
      <Link href="/course" className="mt-8 inline-block">
        Course map
      </Link>
    </div>
  );
}
