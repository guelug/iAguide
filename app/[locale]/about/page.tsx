import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("about");
  const es = locale === "es";

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 prose-lesson">
      <h1 className="font-display text-4xl md:text-5xl">{t("title")}</h1>
      {es ? (
        <>
          <h2>{t("oss")}</h2>
          <p>
            iAguide es un sitio educativo de código abierto bajo licencia MIT.
            El repositorio previsto es{" "}
            <a href="https://github.com/guelug/iAguide">github.com/guelug/iAguide</a>.
            No hay telemetría. No hay cuenta. El curso es el producto.
          </p>
          <h2>{t("add")}</h2>
          <p>
            El sitio es un registro de módulos. Añadir el módulo 13 es dejar una carpeta.
            No hace falta tocar las rutas.
          </p>
          <ol>
            <li>
              Crea <code>content/modules/12-tu-slug/</code> con{" "}
              <code>meta.json</code>, <code>en.mdx</code>, <code>es.mdx</code> y,
              si hace falta, <code>Visual.tsx</code> (<code>use client</code>, export default).
            </li>
            <li>
              Importa el <code>meta.json</code> en <code>content/modules/index.ts</code>,
              añádelo al array, y registra el visual en <code>VISUALS</code> si existe.
            </li>
            <li>
              En <code>meta.json</code>: <code>id</code>, <code>order</code>, <code>slug</code>,
              títulos y resúmenes en en/es, <code>status</code> (<code>complete</code> o{" "}
              <code>wip</code>), <code>prereqs</code>, <code>durationMin</code>, <code>tags</code>.
            </li>
            <li>
              Los módulos <code>wip</code> aparecen en el mapa como teasers, no como lecciones.
            </li>
          </ol>
          <p>
            Componentes MDX disponibles: <code>Callout</code>, <code>TryThis</code>,{" "}
            <code>Myth</code>, <code>Term id=&quot;...&quot;</code>, <code>VisualSlot</code>.
            Añade términos en <code>content/glossary.ts</code>.
          </p>
          <h2>{t("disclaimer")}</h2>
          <p>
            Esto es una instantánea de 2026. Los nombres de CLI, las APIs y los tamaños de
            VRAM se quedan viejos. No inventamos benchmarks. Si una cifra es una regla
            práctica, está marcada como tal. Mide en tu máquina.
          </p>
        </>
      ) : (
        <>
          <h2>{t("oss")}</h2>
          <p>
            iAguide is a public MIT educational site. The intended repository is{" "}
            <a href="https://github.com/guelug/iAguide">github.com/guelug/iAguide</a>.
            No telemetry. No accounts. The course is the product.
          </p>
          <h2>{t("add")}</h2>
          <p>
            The site is a module registry. Adding a 13th module means dropping a folder.
            You should not need new routes.
          </p>
          <ol>
            <li>
              Create <code>content/modules/12-your-slug/</code> with{" "}
              <code>meta.json</code>, <code>en.mdx</code>, <code>es.mdx</code>, and
              optionally <code>Visual.tsx</code> (<code>use client</code>, default export).
            </li>
            <li>
              Import that <code>meta.json</code> in <code>content/modules/index.ts</code>,
              push it into the array, and if you shipped a visual, register it on{" "}
              <code>VISUALS</code>.
            </li>
            <li>
              <code>meta.json</code> fields: <code>id</code>, <code>order</code>,{" "}
              <code>slug</code>, <code>title</code> and <code>summary</code> in en/es,{" "}
              <code>status</code> (<code>complete</code> or <code>wip</code>),{" "}
              <code>prereqs</code>, <code>durationMin</code>, <code>tags</code>.
            </li>
            <li>
              <code>wip</code> modules show on the map as teasers, not as full lessons.
            </li>
          </ol>
          <p>
            MDX components: <code>Callout</code>, <code>TryThis</code>, <code>Myth</code>,{" "}
            <code>Term id=&quot;...&quot;</code>, <code>VisualSlot</code>. Add terms in{" "}
            <code>content/glossary.ts</code>.
          </p>
          <h2>{t("disclaimer")}</h2>
          <p>
            This is a 2026 snapshot. CLI names, APIs, and VRAM sizes go stale. We do not
            invent benchmarks. If a number is a rule of thumb, it is labelled as such.
            Measure on your machine.
          </p>
        </>
      )}
    </div>
  );
}
