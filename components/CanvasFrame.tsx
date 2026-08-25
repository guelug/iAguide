"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  className?: string;
  children: ReactNode;
  camera?: CanvasProps["camera"];
  orthographic?: boolean;
  fallbackClassName?: string;
};

export function CanvasFrame({
  className,
  children,
  camera,
  orthographic,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);

    const el = host.current;
    if (!el) return () => mq.removeEventListener("change", apply);

    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => {
      mq.removeEventListener("change", apply);
      io.disconnect();
    };
  }, []);

  if (reduce) {
    return (
      <div
        className={className}
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 40% 30%, rgba(90,168,160,0.22), transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(201,163,90,0.12), transparent 50%), #07090b",
        }}
      />
    );
  }

  return (
    <div ref={host} className={className}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={camera}
        orthographic={orthographic}
      >
        {children}
      </Canvas>
    </div>
  );
}
