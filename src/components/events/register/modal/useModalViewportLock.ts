"use client";

import { useEffect, useState } from "react";

export function useModalViewportLock(isOpen: boolean) {
  const [mounted, setMounted] = useState(false);
  const [visualHeight, setVisualHeight] = useState("90vh");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic visual viewport height adjustment (e.g. when keyboard opens on mobile)
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (vv) {
        setVisualHeight(`${vv.height * 0.92}px`);
      }
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isOpen) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      if (typeof window !== "undefined" && window.__enquivaLenis) {
        window.__enquivaLenis.stop();
      }
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
      if (typeof window !== "undefined" && window.__enquivaLenis) {
        window.__enquivaLenis.start();
      }
    }
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      if (typeof window !== "undefined" && window.__enquivaLenis) {
        window.__enquivaLenis.start();
      }
    };
  }, [isOpen]);

  return { mounted, visualHeight };
}
