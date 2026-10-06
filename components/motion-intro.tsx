"use client";
import { useEffect } from "react";
export default function MotionIntro() { useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; let context: { revert: () => void } | undefined; import("gsap").then(({ gsap }) => { context = gsap.context(() => { gsap.from(".hero .reveal", { opacity: 0, y: 20, duration: 0.8, stagger: 0.12, ease: "power2.out" }); }); }); return () => context?.revert(); }, []); return null; }

