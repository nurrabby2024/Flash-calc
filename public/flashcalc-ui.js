
(function () {
  const EXPR_KEY = "flashcalc-expr-v1";
  const HIST_KEY = "flashcalc-history-v1";
  const exprEl = document.getElementById("expr-display");
  const resultEl = document.getElementById("result-display");
  const historyEl = document.getElementById("history-list");

  function loadExpr() {
    try {
      const v = localStorage.getItem(EXPR_KEY);
      return v || "0";
    } catch {
      return "0";
    }
  }

  function saveExpr(expr) {
    try {
      localStorage.setItem(EXPR_KEY, expr);
    } catch {}
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HIST_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  function saveHistory(list) {
    try {
      localStorage.setItem(HIST_KEY, JSON.stringify(list));
    } catch {}
  }

  function normalizeExpression(expr) {
    return expr
      .replace(/÷/g, "/")
      .replace(/×/g, "*")
      .replace(/−/g, "-")
      .replace(/,/g, ".")
      .replace(/[^\d+\-*/%.() ]/g, "");
  }

  function evaluateExpression(expr) {
    const safe = normalizeExpression(expr);
    if (!safe.trim()) return "";
    try {
      // Very simple eval; expression is sanitized to digits + basic ops
      const result = Function(`"use strict"; return (${safe})`)();
      if (typeof result === "number" && isFinite(result)) {
        return result.toString();
      }
      return "";
    } catch {
      return "";
    }
  }

  function render(expr) {
    if (!exprEl || !resultEl) return;
    exprEl.textContent = expr || "0";
    const res = evaluateExpression(expr);
    resultEl.textContent = res === "" ? "0" : res;
  }

  function renderHistory() {
    if (!historyEl) return;
    const items = loadHistory();
    historyEl.innerHTML = "";
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "history-item";
      const exprSpan = document.createElement("span");
      exprSpan.className = "expr-small";
      exprSpan.textContent = item.expr;
      const resSpan = document.createElement("span");
      resSpan.className = "res-small";
      resSpan.textContent = item.result;
      row.appendChild(exprSpan);
      row.appendChild(resSpan);
      row.addEventListener("click", () => {
        setExpression(item.result);
      });
      historyEl.appendChild(row);
    });
  }

  function setExpression(expr) {
    saveExpr(expr);
    render(expr);
  }

  function appendToken(token) {
    let expr = loadExpr();
    if (expr === "0" && /[0-9.]/.test(token)) {
      expr = token;
    } else {
      expr += token;
    }
    setExpression(expr);
  }

  function handleEquals() {
    const expr = loadExpr();
    const res = evaluateExpression(expr);
    if (res === "") return;
    setExpression(res);
    const history = loadHistory();
    const updated = [{ expr, result: res }, ...history].slice(0, 7);
    saveHistory(updated);
    renderHistory();
  }

  function handleClear() {
    setExpression("0");
  }

  function handleBackspace() {
    let expr = loadExpr();
    if (expr.length <= 1) {
      expr = "0";
    } else {
      expr = expr.slice(0, -1);
    }
    setExpression(expr);
  }

  function handleKey(value, kind) {
    if (kind === "num") {
      appendToken(value);
    } else if (kind === "op") {
      appendToken(value);
    } else if (kind === "eq") {
      handleEquals();
    } else if (kind === "util") {
      if (value === "C") {
        handleClear();
      } else if (value === "⌫") {
        handleBackspace();
      }
    }
  }

  function onButtonClick(evt) {
    const btn = evt.currentTarget;
    const value = btn.getAttribute("data-key");
    const kind = btn.getAttribute("data-kind");
    if (!value || !kind) return;
    handleKey(value, kind);
  }

  function onKeydown(evt) {
    const key = evt.key;
    if ((key >= "0" && key <= "9") || key === ".") {
      appendToken(key);
    } else if (key === "+" || key === "-" || key === "*" || key === "/") {
      appendToken(key);
    } else if (key === "Enter" || key === "=") {
      evt.preventDefault();
      handleEquals();
    } else if (key === "Backspace") {
      handleBackspace();
    } else if (key === "Escape") {
      handleClear();
    }
  }

  function init() {
    const startExpr = loadExpr();
    render(startExpr);
    renderHistory();

    document.querySelectorAll(".key").forEach((btn) => {
      btn.addEventListener("click", onButtonClick);
    });

    window.addEventListener("keydown", onKeydown);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
