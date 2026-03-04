"use client";
import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) { dot.current.style.left = mx + "px"; dot.current.style.top = my + "px"; }
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a,button,input,select,textarea")) ring.current?.classList.add("hov");
      else ring.current?.classList.remove("hov");
    };
    let af: number;
    const animate = () => {
      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
      if (ring.current) { ring.current.style.left = rx + "px"; ring.current.style.top = ry + "px"; }
      af = requestAnimationFrame(animate);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    af = requestAnimationFrame(animate);
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseover", over); cancelAnimationFrame(af); };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  );
}
