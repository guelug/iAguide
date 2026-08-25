import { Link } from "@/i18n/navigation";

export function Term({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={"/glossary#" + id} className="term-link">
      {children}
    </Link>
  );
}
