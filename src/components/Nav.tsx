import { Link } from "@tanstack/react-router";
import { Store, Package, Users, Home, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/inventory", label: "المخزن", icon: Package },
  { to: "/customers", label: "الزبائن", icon: Users },
] as const;

export function Nav() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <Store className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight">مركز البدر</div>
            <div className="text-[11px] text-muted-foreground">نظام المبيعات</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="تبديل المظهر"
            className="ms-1 flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}