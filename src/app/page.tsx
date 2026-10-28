
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  Clock,
  Grid2X2,
  Heart,
  Minus,
  Monitor,
  Pi,
  RotateCcw,
  Search,
  Settings,
  Sigma,
  Sparkles,
  Square,
  Terminal,
  X,
  type LucideIcon,
} from "lucide-react";
import { evaluate, format, parse } from "mathjs";

type AppId = "calculator" | "formulas" | "graph" | "notes" | "settings";
type CalculatorMode = "standard" | "scientific";

type DesktopApp = {
  id: AppId;
  name: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
};

const apps: DesktopApp[] = [
  {
    id: "calculator",
    name: "Calculator",
    subtitle: "Crunch some numbers",
    icon: Calculator,
    color: "pink",
  },
  {
    id: "formulas",
    name: "Formula Book",
    subtitle: "Your math cheat sheet",
    icon: BookOpen,
    color: "mint",
  },
  {
    id: "graph",
    name: "Graph Studio",
    subtitle: "Coming soon",
    icon: Sigma,
    color: "lilac",
  },
  {
    id: "notes",
    name: "Scratchpad",
    subtitle: "Jot down your ideas",
    icon: Terminal,
    color: "yellow",
  },
  {
    id: "settings",
    name: "Preferences",
    subtitle: "Make it yours",
    icon: Settings,
    color: "blue",
  },
];

const allowedNames = new Set([
  "abs",
  "acos",
  "asin",
  "atan",
  "ceil",
  "cos",
  "e",
  "exp",
  "floor",
  "log",
  "log10",
  "max",
  "min",
  "pi",
  "pow",
  "round",
  "sin",
  "sqrt",
  "tan",
  "ans",
]);

function calculateExpression(expression: string, previousAnswer: number) {
  const source = expression
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .replaceAll("π", "pi")
    .replaceAll("√", "sqrt");

  if (!source.trim()) {
    throw new Error("Enter an expression first.");
  }

  // Only allow math syntax and known mathematical names.
  if (!/^[0-9a-zA-Z_+\-*/^().,!%\s]+$/.test(source)) {
    throw new Error("That character isn't supported.");
  }

  const tree = parse(source);
  let invalidName: string | null = null;

  tree.traverse((node) => {
    if (node.type === "SymbolNode" && "name" in node) {
      const name = String(node.name);
      if (!allowedNames.has(name)) {
        invalidName = name;
      }
    }
  });

  if (invalidName) {
    throw new Error(`"${invalidName}" isn't supported.`);
  }

  const result = evaluate(source, { ans: previousAnswer });

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("The result isn't a finite number.");
  }

  return result;
}

function formatNumber(value: number) {
  return format(value, { precision: 13 });
}

const standardKeys = [
  { label: "AC", action: "clear", kind: "utility" },
  { label: "(", action: "append", value: "(", kind: "utility" },
  { label: ")", action: "append", value: ")", kind: "utility" },
  { label: "÷", action: "append", value: "÷", kind: "operator" },
  { label: "7", action: "append", value: "7" },
  { label: "8", action: "append", value: "8" },
  { label: "9", action: "append", value: "9" },
  { label: "×", action: "append", value: "×", kind: "operator" },
  { label: "4", action: "append", value: "4" },
  { label: "5", action: "append", value: "5" },
  { label: "6", action: "append", value: "6" },
  { label: "−", action: "append", value: "−", kind: "operator" },
  { label: "1", action: "append", value: "1" },
  { label: "2", action: "append", value: "2" },
  { label: "3", action: "append", value: "3" },
  { label: "+", action: "append", value: "+", kind: "operator" },
  { label: "±", action: "sign", kind: "utility" },
  { label: "0", action: "append", value: "0" },
  { label: ".", action: "append", value: "." },
  { label: "=", action: "equals", kind: "equals" },
] as const;

const scientificKeys = [
  { label: "sin", value: "sin(", action: "append" },
  { label: "cos", value: "cos(", action: "append" },
  { label: "tan", value: "tan(", action: "append" },
  { label: "√", value: "sqrt(", action: "append" },
  { label: "x²", value: "^2", action: "append" },
  { label: "xʸ", value: "^", action: "append" },
  { label: "log", value: "log10(", action: "append" },
  { label: "ln", value: "log(", action: "append" },
  { label: "π", value: "π", action: "append" },
  { label: "e", value: "e", action: "append" },
  { label: "n!", value: "!", action: "append" },
  { label: "Ans", value: "ans", action: "append" },
] as const;

export default function Home() {
  const [activeApp, setActiveApp] = useState<AppId | null>("calculator");
  const [calculatorMode, setCalculatorMode] =
    useState<CalculatorMode>("standard");
  const [maximized, setMaximized] = useState(false);
  const [expression, setExpression] = useState("");
  const [answer, setAnswer] = useState<number>(0);
  const [displayResult, setDisplayResult] = useState("0");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<
    { expression: string; result: string }[]
  >([]);
  const [scratchpad, setScratchpad] = useState("");
  const [clock, setClock] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Intl.DateTimeFormat("en", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date()),
      );
    };

    updateClock();
    const timer = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const openApp = useCallback((id: AppId) => {
    setActiveApp(id);
    setSearchOpen(false);
  }, []);

  const append = useCallback((value: string) => {
    setError("");
    setExpression((current) => {
      if (current === "0" && /^[0-9]$/.test(value)) return value;
      if (current === "0" && value === ".") return "0.";
      return current + value;
    });
  }, []);

  const clear = useCallback(() => {
    setExpression("");
    setDisplayResult("0");
    setError("");
  }, []);

  const backspace = useCallback(() => {
    setError("");
    setExpression((current) => current.slice(0, -1));
  }, []);

  const solve = useCallback(() => {
    try {
      const result = calculateExpression(expression, answer);
      const formatted = formatNumber(result);

      setAnswer(result);
      setDisplayResult(formatted);
      setExpression(formatted);
      setError("");
      setHistory((current) =>
        [{ expression, result: formatted }, ...current].slice(0, 8),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't calculate that.",
      );
    }
  }, [expression, answer]);

  const toggleSign = useCallback(() => {
    setError("");
    setExpression((current) => {
      if (!current) return "−";
      if (current.startsWith("−(") && current.endsWith(")")) {
        return current.slice(2, -1);
      }
      return `−(${current})`;
    });
  }, []);

  const handleKey = useCallback(
    (key: string) => {
      if (/^[0-9.]$/.test(key)) {
        append(key);
      } else if (key === "+") {
        append("+");
      } else if (key === "-") {
        append("−");
      } else if (key === "*") {
        append("×");
      } else if (key === "/") {
        append("÷");
      } else if (key === "(" || key === ")") {
        append(key);
      } else if (key === "Enter" || key === "=") {
        solve();
      } else if (key === "Backspace") {
        backspace();
      } else if (key === "Escape") {
        clear();
      }
    },
    [append, backspace, clear, solve],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (
        /^[0-9.+\-*/()]$/.test(event.key) ||
        ["Enter", "Backspace", "Escape", "="].includes(event.key)
      ) {
        event.preventDefault();
        handleKey(event.key);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const preview = useMemo(() => {
    if (!expression.trim()) return "";

    try {
      return formatNumber(calculateExpression(expression, answer));
    } catch {
      return "";
    }
  }, [expression, answer]);

  const activeTool = apps.find((app) => app.id === activeApp);
  const ActiveToolIcon = activeTool?.icon;

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className="desktop-shell">
      <div className="desktop-wallpaper" aria-hidden="true">
        <div className="wallpaper-orb orb-one" />
        <div className="wallpaper-orb orb-two" />
        <div className="wallpaper-grid" />
        <div className="pixel-star star-one">✦</div>
        <div className="pixel-star star-two">✧</div>
        <div className="pixel-star star-three">✦</div>
        <div className="pixel-heart heart-one">♥</div>
        <div className="pixel-heart heart-two">♥</div>
      </div>

      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <span>m</span>
            <span className="brand-sparkle">✦</span>
          </div>
          <div>
            <p className="brand-name">mochi.math</p>
            <p className="brand-caption">a tiny universe of numbers</p>
          </div>
        </div>

        <div className="topbar-center">
          <span className="status-dot" />
          <span>ALL SYSTEMS CUTE</span>
        </div>

        <div className="topbar-actions">
          <button
            className="icon-button"
            aria-label="Search apps"
            title="Search apps"
            onClick={() => {
              setSearchOpen((current) => !current);
              setSearchQuery("");
            }}
          >
            <Search size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Open preferences"
            title="Preferences"
            onClick={() => openApp("settings")}
          >
            <Settings size={16} />
          </button>
          <div className="topbar-clock">
            <Clock size={14} />
            <span>{clock || "--:--"}</span>
          </div>
        </div>
      </header>

      <section className="desktop-content">
        <aside className="desktop-icons" aria-label="Desktop apps">
          <div className="desktop-section-label">YOUR LITTLE DESKTOP</div>
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                className={`desktop-icon ${activeApp === app.id ? "selected" : ""}`}
                onClick={() => openApp(app.id)}
                onDoubleClick={() => openApp(app.id)}
                title={app.subtitle}
              >
                <span className={`desktop-icon-art ${app.color}`}>
                  <Icon size={24} strokeWidth={1.7} />
                  <span className="icon-art-sparkle">✦</span>
                </span>
                <span className="desktop-icon-label">{app.name}</span>
              </button>
            );
          })}

          <div className="desktop-note">
            <Heart size={12} fill="currentColor" />
            <span>made with a little math & a lot of love</span>
          </div>
        </aside>

        <div className="desktop-main">
          <section className="welcome-card">
            <div className="welcome-copy">
              <div className="eyebrow">
                <Sparkles size={13} /> YOUR COZY MATH CORNER
              </div>
              <h1>
                Hello, little
                <br />
                <span>number nerd.</span>
              </h1>
              <p>
                Big equations, tiny windows.
                <br />
                Let&apos;s make math a little more magical.
              </p>
              <button
                className="primary-button"
                onClick={() => openApp("calculator")}
              >
                <Calculator size={16} />
                Open calculator
                <ArrowUpRight size={15} />
              </button>
            </div>
            <div className="welcome-art" aria-hidden="true">
              <div className="art-sun">✳</div>
              <div className="art-planet planet-large">
                <span className="planet-ring" />
                <span className="planet-face">◡</span>
              </div>
              <div className="art-planet planet-small">π</div>
              <div className="art-star star-a">✦</div>
              <div className="art-star star-b">✧</div>
              <div className="art-orbit orbit-a" />
              <div className="art-orbit orbit-b" />
              <div className="art-label">math is a love language ♡</div>
            </div>
            <button
              className="welcome-dismiss"
              aria-label="Dismiss welcome card"
              onClick={() => setShowWelcome(false)}
            >
              <X size={14} />
            </button>
          </section>

          {!showWelcome && (
            <button
              className="restore-welcome"
              onClick={() => setShowWelcome(true)}
            >
              <Sparkles size={13} /> Show welcome card
            </button>
          )}

          <div className="section-heading">
            <div>
              <p className="section-kicker">THE GOOD STUFF</p>
              <h2>Your apps</h2>
            </div>
            <span className="tiny-count">05 APPS INSTALLED</span>
          </div>

          <section className="app-grid" aria-label="Available apps">
            {apps.map((app, index) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  className={`app-card ${app.color}`}
                  onClick={() => openApp(app.id)}
                  style={{ animationDelay: `${index * 65}ms` }}
                >
                  <div className="app-card-top">
                    <span className={`app-icon ${app.color}`}>
                      <Icon size={21} strokeWidth={1.8} />
                    </span>
                    <ArrowUpRight className="app-arrow" size={15} />
                  </div>
                  <div className="app-card-copy">
                    <h3>{app.name}</h3>
                    <p>{app.subtitle}</p>
                  </div>
                  <div className="app-card-footer">
                    <span className="app-status-dot" />
                    {app.id === "graph" ? "IN THE WORKSHOP" : "READY TO OPEN"}
                  </div>
                </button>
              );
            })}
          </section>

          <section className="bottom-widgets">
            <div className="quote-widget">
              <span className="quote-mark">“</span>
              <div>
                <p className="quote-text">
                  Mathematics is the music of reason.
                </p>
                <p className="quote-credit">A LITTLE REMINDER FOR TODAY</p>
              </div>
              <span className="quote-decoration">∑</span>
            </div>
            <div className="quick-widget">
              <div className="quick-widget-heading">
                <span className="quick-widget-icon">
                  <Pi size={16} />
                </span>
                <span>QUICK FACT</span>
              </div>
              <p className="quick-number">3.14159...</p>
              <p className="quick-description">
                Pi goes on forever, and so does your potential.
              </p>
            </div>
          </section>

          <footer className="desktop-footer">
            <span>MOCHI MATH OS <span className="footer-version">v1.0.0</span></span>
            <span>STAY CURIOUS <span className="footer-heart">♥</span></span>
          </footer>
        </div>
      </section>

      {searchOpen && (
        <div className="search-panel">
          <div className="search-panel-heading">
            <Search size={16} />
            <span>Find your app</span>
            <button
              className="mini-close"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
            >
              <X size={14} />
            </button>
          </div>
          <input
            autoFocus
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Try calculator..."
            aria-label="Search apps"
          />
          <div className="search-results">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              return (
                <button key={app.id} onClick={() => openApp(app.id)}>
                  <span className={`search-result-icon ${app.color}`}>
                    <Icon size={17} />
                  </span>
                  <span>{app.name}</span>
                  <ArrowUpRight size={14} />
                </button>
              );
            })}
            {filteredApps.length === 0 && (
              <p className="empty-search">No apps found. Try another name!</p>
            )}
          </div>
        </div>
      )}

      {activeApp && activeTool && (
        <section 
          className={`app-window ${maximized ? "maximized" : ""}`}
          aria-label={`${activeTool.name} window`}>
          <header className="window-titlebar">
            <div className="window-title">
              <span className={`window-title-icon ${activeTool.color}`}>
                {ActiveToolIcon && <ActiveToolIcon size={15} />}
              </span>
              <span>{activeTool.name}</span>
              <span className="window-title-divider">/</span>
              <span className="window-title-muted">mochi OS</span>
            </div>
            <div className="window-controls">
              <button
                aria-label="Minimize window"
                title="Minimize"
                onClick={() => setActiveApp(null)}
              >
                <Minus size={14} />
              </button>
              <button
                aria-label="Maximize window"
                title="Maximize"
                onClick={() => setMaximized((current) => !current)}
              >
                <Square size={11} />
              </button>
              <button
                className="window-close"
                aria-label="Close window"
                title="Close"
                onClick={() => setActiveApp(null)}
              >
                <X size={14} />
              </button>
            </div>
          </header>

          {activeApp === "calculator" && (
            <div className="calculator-app">
              <div className="calculator-toolbar">
                <div className="mode-switch" role="group" aria-label="Calculator mode">
                  <button
                    className={calculatorMode === "standard" ? "active" : ""}
                    onClick={() => setCalculatorMode("standard")}
                  >
                    Standard
                  </button>
                  <button
                    className={calculatorMode === "scientific" ? "active" : ""}
                    onClick={() => setCalculatorMode("scientific")}
                  >
                    Scientific
                  </button>
                </div>
                <button
                  className="history-button"
                  onClick={() => {
                    if (history.length > 0) {
                      setExpression(history[0].expression);
                      setDisplayResult(history[0].result);
                      setError("");
                    }
                  }}
                  title="Load most recent calculation"
                >
                  <Clock size={14} />
                  <span>Last answer</span>
                </button>
              </div>

              <div className="calculator-display">
                <div className="display-label">
                  <span>YOUR EXPRESSION</span>
                  <span className="display-live">
                    <span className="status-dot" /> LIVE
                  </span>
                </div>
                <div className="expression-line" aria-live="polite">
                  {expression || <span className="expression-placeholder">0</span>}
                  <span className="expression-cursor" />
                </div>
                <div className="result-line">
                  <span className="result-equals">=</span>
                  <span className="result-value">
                    {error ? "Hmm..." : preview || displayResult}
                  </span>
                </div>
                {error && <p className="calculator-error">{error}</p>}
                <div className="display-bottom">
                  <span>RAD MODE</span>
                  <span>ANS = {formatNumber(answer)}</span>
                </div>
              </div>

              {calculatorMode === "scientific" && (
                <div className="scientific-grid">
                  {scientificKeys.map((key) => (
                    <button
                      key={key.label}
                      className="scientific-key"
                      onClick={() => append(key.value)}
                    >
                      {key.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="keypad">
                {standardKeys.map((key) => (
                  <button
                    key={key.label}
                    className={`calc-key ${"kind" in key ? key.kind : ""} ${key.label === "0" ? "zero-key" : ""}`}
                    onClick={() => {
                      if (key.action === "clear") clear();
                      else if (key.action === "equals") solve();
                      else if (key.action === "sign") toggleSign();
                      else if ("value" in key) append(key.value);
                    }}
                    aria-label={
                      key.label === "AC"
                        ? "Clear"
                        : key.label === "="
                          ? "Calculate"
                          : key.label
                    }
                  >
                    {key.label}
                  </button>
                ))}
              </div>

              <div className="calculator-bottom">
                <span><span className="mini-status-dot" /> READY TO COMPUTE</span>
                <button onClick={backspace} aria-label="Delete last character">
                  <RotateCcw size={12} /> Undo
                </button>
                <span>ENTER ↵</span>
              </div>
            </div>
          )}

          {activeApp === "formulas" && (
            <div className="utility-app">
              <div className="utility-intro">
                <div className="utility-hero-icon mint"><BookOpen size={24} /></div>
                <div>
                  <p className="section-kicker">POCKET REFERENCE</p>
                  <h2>Your formula book</h2>
                  <p>Little reminders for big-brain moments.</p>
                </div>
              </div>
              <div className="formula-list">
                <article className="formula-card">
                  <span className="formula-category">ALGEBRA</span>
                  <h3>Quadratic formula</h3>
                  <p className="formula-equation">x = (−b ± √(b² − 4ac)) / 2a</p>
                  <p className="formula-note">For equations of the form ax² + bx + c = 0.</p>
                </article>
                <article className="formula-card">
                  <span className="formula-category">GEOMETRY</span>
                  <h3>Circle area</h3>
                  <p className="formula-equation">A = πr²</p>
                  <p className="formula-note">Radius times radius, multiplied by pi.</p>
                </article>
                <article className="formula-card">
                  <span className="formula-category">PYTHAGORAS</span>
                  <h3>Right triangles</h3>
                  <p className="formula-equation">a² + b² = c²</p>
                  <p className="formula-note">The hypotenuse is the longest side.</p>
                </article>
                <article className="formula-card">
                  <span className="formula-category">CALCULUS</span>
                  <h3>Power rule</h3>
                  <p className="formula-equation">d/dx (xⁿ) = nxⁿ⁻¹</p>
                  <p className="formula-note">Bring the power down, then subtract one.</p>
                </article>
              </div>
            </div>
          )}

          {activeApp === "graph" && (
            <div className="utility-app coming-soon-app">
              <div className="coming-soon-art"><Sigma size={48} /></div>
              <p className="section-kicker">CURRENTLY IN THE WORKSHOP</p>
              <h2>Graph Studio</h2>
              <p>
                Plot functions, explore curves and watch equations come to life.
                This little app is on our roadmap.
              </p>
              <div className="coming-soon-tag"><Sparkles size={13} /> NEXT UP: FUNCTION PLOTTING</div>
              <button className="primary-button" onClick={() => openApp("calculator")}>
                <Calculator size={15} /> Back to calculator
              </button>
            </div>
          )}

          {activeApp === "notes" && (
            <div className="utility-app scratchpad-app">
              <div className="utility-intro">
                <div className="utility-hero-icon lilac"><Terminal size={23} /></div>
                <div>
                  <p className="section-kicker">A SPACE FOR YOUR THOUGHTS</p>
                  <h2>Scratchpad</h2>
                  <p>Write it down before it floats away.</p>
                </div>
              </div>
              <textarea
                value={scratchpad}
                onChange={(event) => setScratchpad(event.target.value)}
                placeholder={"Dear math diary...\n\nToday I figured out that..."}
                aria-label="Scratchpad notes"
              />
              <div className="scratchpad-footer">
                <span>{scratchpad.length} CHARACTERS</span>
                <span><Check size={12} /> SAVED IN THIS SESSION</span>
              </div>
              <p className="scratchpad-hint">
                Notes stay in this page while it remains open. Persistent saving can be added later.
              </p>
            </div>
          )}

          {activeApp === "settings" && (
            <div className="utility-app settings-app">
              <div className="utility-intro">
                <div className="utility-hero-icon pink"><Settings size={23} /></div>
                <div>
                  <p className="section-kicker">TINY TWEAKS</p>
                  <h2>Preferences</h2>
                  <p>Your desktop, your rules.</p>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-icon"><Monitor size={17} /></div>
                <div className="settings-row-copy">
                  <h3>Desktop theme</h3>
                  <p>Cotton Candy OS · Plum, pink, lilac and mint</p>
                </div>
                <span className="settings-pill">ACTIVE</span>
              </div>
              <div className="settings-row">
                <div className="settings-row-icon"><Calculator size={17} /></div>
                <div className="settings-row-copy">
                  <h3>Default calculator</h3>
                  <p>Choose the mode that opens with your calculator.</p>
                </div>
                <button
                  className="settings-select"
                  onClick={() => {
                    setCalculatorMode((mode) =>
                      mode === "standard" ? "scientific" : "standard",
                    );
                  }}
                >
                  {calculatorMode === "standard" ? "Standard" : "Scientific"}
                  <ChevronDown size={13} />
                </button>
              </div>
              <div className="settings-row">
                <div className="settings-row-icon"><Heart size={17} /></div>
                <div className="settings-row-copy">
                  <h3>A gentle reminder</h3>
                  <p>You don't have to solve everything at once.</p>
                </div>
                <span className="settings-heart">♥</span>
              </div>
              <div className="settings-about">
                <span className="brand-mark small"><span>m</span></span>
                <div>
                  <strong>mochi.math</strong>
                  <p>A tiny universe of numbers · v1.0.0</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <nav className="taskbar" aria-label="Desktop taskbar">
        <button
          className="taskbar-start"
          onClick={() => {
            setActiveApp(null);
            setSearchOpen((current) => !current);
            setSearchQuery("");
          }}
          aria-label="Open app launcher"
          title="App launcher"
        >
          <Grid2X2 size={17} />
          <span>mochi</span>
        </button>
        <div className="taskbar-divider" />
        <div className="taskbar-running">
          {apps
            .filter((app) => app.id === activeApp)
            .map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  className="taskbar-app active"
                  onClick={() => setActiveApp(null)}
                  title={`Minimize ${app.name}`}
                >
                  <Icon size={15} />
                  <span>{app.name}</span>
                </button>
              );
            })}
          {activeApp === null && (
            <span className="taskbar-hint">Your little desktop awaits ✦</span>
          )}
        </div>
        <div className="taskbar-spacer" />
        <div className="taskbar-tray">
          <span className="tray-heart">♥</span>
          <span className="tray-separator" />
          <span className="tray-time">{clock || "--:--"}</span>
          <button
            className="tray-desktop"
            aria-label="Show desktop"
            title="Show desktop"
            onClick={() => {
              setActiveApp(null);
              setSearchOpen(false);
            }}
          />
        </div>
      </nav>
    </main>
  );
}
