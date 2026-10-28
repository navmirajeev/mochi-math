
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus, Trash2, ZoomIn, ZoomOut, RotateCcw, Sparkles } from "lucide-react";

const COLORS = ["#D96C9D", "#8D79D6", "#54AE98", "#E6A34D", "#7198D5"];

export default function GraphStudio() {
  const graphId = useId().replace(/:/g, "");
  const graphRef = useRef<HTMLDivElement>(null);
  const [functions, setFunctions] = useState([
    { id: 1, expression: "x^2" },
    { id: 2, expression: "sin(x)" },
  ]);
  const [nextId, setNextId] = useState(3);
  const [view, setView] = useState(10);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function drawGraph() {
      const element = graphRef.current;
      if (!element) return;

      const width = Math.max(element.clientWidth, 300);
      const height = 340;

      
      try {
        const imported = await import("function-plot");
        if (cancelled || !graphRef.current) return;

        // Resolve the plotting function from the imported module.
        const functionPlot = (
          imported.default ?? imported
        ) as unknown as (options: Record<string, unknown>) => unknown;

        element.innerHTML = "";

        const data = functions
          .filter((item) => item.expression.trim())
          .map((item) => ({
            fn: item.expression.trim(),
            color: COLORS[(item.id - 1) % COLORS.length],
        }));

        functionPlot({
          target: `#${graphId}`,
          width,
          height,
          grid: true,
          xAxis: { domain: [-view, view] },
          yAxis: { domain: [-view, view] },
          data,
        });

        setError("");
      } catch (cause) {
        if (!cancelled) {
          console.error("Graph Studio rendering error:", cause);
          setError(
            cause instanceof Error
              ? `Graph error: ${cause.message}`
              : `Graph error: ${String(cause)}`
          );
        }
      }

    }

    drawGraph();

    const observer = graphRef.current
      ? new ResizeObserver(() => drawGraph())
      : null;

    if (graphRef.current && observer) {
      observer.observe(graphRef.current);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [functions, view]);

  function updateFunction(id: number, expression: string) {
    setFunctions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, expression } : item
      )
    );
  }

  function addFunction() {
    setFunctions((current) => [
      ...current,
      { id: nextId, expression: "" },
    ]);
    setNextId((id) => id + 1);
  }

  function removeFunction(id: number) {
    setFunctions((current) => current.filter((item) => item.id !== id));
  }

  function resetGraph() {
    setView(10);
    setFunctions([
      { id: 1, expression: "x^2" },
      { id: 2, expression: "sin(x)" },
    ]);
    setNextId(3);
  }

  return (
    <div className="graph-studio">
      <div className="graph-heading">
        <div>
          <p className="section-kicker">YOUR LITTLE MATH LAB</p>
          <h2>Graph Studio <span>✳</span></h2>
          <p className="graph-description">
            Give an equation a home and watch its curve bloom.
          </p>
        </div>
        <div className="graph-sticker" aria-hidden="true">૮ ˶ᵔ ᵕ ᵔ˶ ა</div>
      </div>

      <div className="graph-equations">
        <div className="graph-section-label">YOUR EQUATIONS</div>

        {functions.map((item) => (
          <div className="graph-equation-row" key={item.id}>
            <span
              className="graph-color-dot"
              style={{ backgroundColor: COLORS[(item.id - 1) % COLORS.length] }}
            />
            <span className="graph-y-label">y =</span>
            <input
              aria-label={`Equation ${item.id}`}
              value={item.expression}
              onChange={(event) =>
                updateFunction(item.id, event.target.value)
              }
              placeholder="e.g. x^2 or cos(x)"
              spellCheck={false}
            />
            <button
              type="button"
              className="graph-icon-button"
              onClick={() => removeFunction(item.id)}
              aria-label={`Remove equation ${item.id}`}
              title="Remove equation"
              disabled={functions.length === 1}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <div className="graph-toolbar">
          <button
            type="button"
            className="graph-secondary-button"
            onClick={addFunction}
          >
            <Plus size={15} /> Add equation
          </button>

          <div className="graph-zoom-controls">
            <button
              type="button"
              className="graph-icon-button"
              onClick={() => setView((v) => Math.max(2, v / 1.5))}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              className="graph-icon-button"
              onClick={() => setView((v) => Math.min(100, v * 1.5))}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              className="graph-icon-button"
              onClick={resetGraph}
              aria-label="Reset graph"
              title="Reset graph"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="graph-canvas-card">
        <div className="graph-canvas-heading">
          <span><Sparkles size={14} /> LIVE PREVIEW</span>
          <span className="graph-range">±{view.toFixed(1)}</span>
        </div>
        <div id={graphId} className="graph-canvas" ref={graphRef} />
        {error && <p className="graph-error" role="alert">{error}</p>}
      </div>

      <p className="graph-hint">
        ✿ Try <code>x^2</code>, <code>sin(x)</code>, <code>cos(x)</code>,
        {" "}<code>2*x+3</code> or <code>sqrt(x)</code>.
        Trigonometric functions use radians.
      </p>
    </div>
  );
}

