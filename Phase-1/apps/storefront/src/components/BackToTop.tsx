import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function BackToTop() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const aboveProductBar = pathname.startsWith("/product/");

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 320);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (!show) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed z-40 right-3 w-11 h-11 bg-myntra-pink text-white font-bold text-lg shadow-card ${
        aboveProductBar
          ? "bottom-[8.75rem] md:bottom-6"
          : "bottom-[5.75rem] md:bottom-6"
      }`}
    >
      ↑
    </button>
  );
}
