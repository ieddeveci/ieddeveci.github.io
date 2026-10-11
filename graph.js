"use strict";

(function (root) {
  const NS = "http://www.w3.org/2000/svg";
  const tr = (text) => (root.ArgForgeT ? root.ArgForgeT(text) : text);
  const DEFAULTS = {
    "--g-in": "#d0e9df",
    "--g-out": "#f6dfc4",
    "--g-undec": "#fdf3cf",
    "--g-node": "#ffffff",
    "--g-stroke": "#354e59",
    "--g-text": "#14212b",
    "--g-tag": "#52676b",
    "--g-defeat": "#a23b2c",
    "--g-attack": "#9b5420",
    "--g-selected": "#0f5e73",
  };
  function palette(container) {
    const style = typeof getComputedStyle === "function" ? getComputedStyle(container) : null;
    const read = (name) => ((style && style.getPropertyValue(name)) || "").trim() || DEFAULTS[name];
    const c = {};
    for (const name of Object.keys(DEFAULTS)) c[name.slice(4)] = read(name);
    return c;
  }
  const make = (tag, attrs = {}, text) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  };
  let context = null;
  let FONT = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  function width(text, size) {
    if (!context && typeof document !== "undefined")
      context = document.createElement("canvas").getContext("2d");
    if (!context) return Array.from(text).length * size * 0.6;
    context.font = size + "px " + FONT;
    return context.measureText(text).width;
  }
  function wrap(text, maxWidth, fontSize, maxLines) {
    const tokens = String(text).split(/(?<=[_\s-])/);
    const lines = [];
    let line = "";
    const push = () => {
      lines.push(line);
      line = "";
    };
    for (let token of tokens) {
      if (width(line + token, fontSize) <= maxWidth) {
        line += token;
        continue;
      }
      if (line) push();
      while (width(token, fontSize) > maxWidth) {
        let cut = token.length - 1;
        while (cut > 1 && width(token.slice(0, cut), fontSize) > maxWidth) cut--;
        lines.push(token.slice(0, cut));
        token = token.slice(cut);
      }
      line = token;
    }
    if (line || !lines.length) push();
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      let last = kept[maxLines - 1];
      while (last.length > 1 && width(last + "…", fontSize) > maxWidth) last = last.slice(0, -1);
      kept[maxLines - 1] = last + "…";
      return kept;
    }
    return lines;
  }
  function fit(text, maxWidth, fontSize) {
    let t = String(text);
    if (width(t, fontSize) <= maxWidth) return t;
    while (t.length > 1 && width(t + "…", fontSize) > maxWidth) t = t.slice(0, -1);
    return t + "…";
  }
  function size(node) {
    if (node.shape === "ellipse") {
      const lines = wrap(node.label, 190, 13, 2);
      const w = Math.max(...lines.map((l) => width(l, 13)));
      return {
        w: Math.max(56, Math.min(220, w + 30)),
        h: Math.max(40, 16 * lines.length + 18),
        lines: lines,
      };
    }
    const lines = wrap(node.label, 274, 14, 3);
    const tag = node.tag ? fit(node.tag, 274, 10) : "";
    const w = Math.max(...lines.map((l) => width(l, 14)), width(tag, 10));
    return {
      w: Math.max(64, Math.min(300, w + 26)),
      h: 16 + (tag ? 14 : 0) + 17 * lines.length,
      lines: lines,
      tag: tag,
    };
  }
  function layers(nodes, edges) {
    const ids = nodes.map((n) => n.id);
    const out = new Map(ids.map((i) => [i, []]));
    for (const e of edges) out.get(e.source).push(e.target);
    let index = 0;
    const idx = new Map(),
      low = new Map(),
      on = new Set(),
      stack = [],
      comp = new Map();
    let ncomp = 0;
    const visit = (v) => {
      idx.set(v, index);
      low.set(v, index);
      index++;
      stack.push(v);
      on.add(v);
      for (const w of out.get(v)) {
        if (!idx.has(w)) {
          visit(w);
          low.set(v, Math.min(low.get(v), low.get(w)));
        } else if (on.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
      }
      if (low.get(v) === idx.get(v)) {
        let w;
        do {
          w = stack.pop();
          on.delete(w);
          comp.set(w, ncomp);
        } while (w !== v);
        ncomp++;
      }
    };
    for (const v of ids) if (!idx.has(v)) visit(v);
    const rank = new Array(ncomp).fill(0);
    const cedges = edges
      .map((e) => [comp.get(e.source), comp.get(e.target)])
      .filter(([a, b]) => a !== b);
    for (let pass = 0; pass < ncomp; pass++) {
      let changed = false;
      for (const [a, b] of cedges)
        if (rank[b] < rank[a] + 1) {
          rank[b] = rank[a] + 1;
          changed = true;
        }
      if (!changed) break;
    }
    return new Map(ids.map((i) => [i, rank[comp.get(i)]]));
  }
  function layout(nodes, edges) {
    const dims = new Map(nodes.map((n) => [n.id, size(n)]));
    const rank = layers(nodes, edges);
    const rows = [];
    for (const n of nodes) (rows[rank.get(n.id)] ||= []).push(n.id);
    const filled = rows.filter(Boolean);
    const neighbours = new Map(nodes.map((n) => [n.id, []]));
    for (const e of edges) {
      neighbours.get(e.source).push(e.target);
      neighbours.get(e.target).push(e.source);
    }
    const order = new Map();
    filled.forEach((row) => row.forEach((id, i) => order.set(id, i)));
    for (let sweep = 0; sweep < 6; sweep++) {
      const seq = sweep % 2 ? [...filled].reverse() : filled;
      for (const row of seq) {
        const bc = new Map(
          row.map((id) => {
            const ns = neighbours.get(id);
            return [
              id,
              ns.length ? ns.reduce((s, x) => s + order.get(x), 0) / ns.length : order.get(id),
            ];
          }),
        );
        row.sort((a, b) => bc.get(a) - bc.get(b));
        row.forEach((id, i) => order.set(id, i));
      }
    }
    const pos = new Map();
    let y = 0;
    const gapX = 36,
      gapY = 70;
    const widths = filled.map((row) => row.reduce((s, id) => s + dims.get(id).w + gapX, -gapX));
    const maxW = Math.max(...widths, 0);
    filled.forEach((row, r) => {
      let x = (maxW - widths[r]) / 2;
      const h = Math.max(...row.map((id) => dims.get(id).h));
      for (const id of row) {
        const d = dims.get(id);
        pos.set(id, {
          x: x + d.w / 2,
          y: y + h / 2,
          w: d.w,
          h: d.h,
          lines: d.lines,
          tag: d.tag,
        });
        x += d.w + gapX;
      }
      y += h + gapY;
    });
    return {
      pos: pos,
      width: maxW,
      height: y - gapY,
    };
  }
  function boundary(a, b, shape) {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    if (!dx && !dy)
      return {
        x: a.x,
        y: a.y - a.h / 2,
      };
    const rx = a.w / 2 + 2,
      ry = a.h / 2 + 2;
    const t =
      shape === "ellipse"
        ? 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
        : 1 / Math.max(Math.abs(dx) / rx, Math.abs(dy) / ry);
    return {
      x: a.x + dx * t,
      y: a.y + dy * t,
    };
  }
  function render(container, model, options = {}) {
    container.replaceChildren();
    const C = palette(container);
    const family =
      typeof getComputedStyle === "function" ? getComputedStyle(container).fontFamily : "";
    if (family) FONT = family;
    const FILL = {
      IN: C.in,
      OUT: C.out,
      UNDEC: C.undec,
      "": C.node,
    };
    if (!model.nodes.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = tr("Nothing to draw yet.");
      container.append(p);
      return;
    }
    const derive = model.edges.filter((e) => e.kind === "derive");
    const {
      pos: pos,
      width: W,
      height: H,
    } = layout(model.nodes, derive.length ? derive : model.edges);
    const shapes = new Map(model.nodes.map((n) => [n.id, n.shape]));
    const svg = make("svg", {
      style: "font-family: " + FONT.replace(/"/g, "'"),
      role: "img",
      "aria-label": options.label || "Argument graph",
      class: "arggraph",
    });
    const marker = (id, colour) => {
      const m = make("marker", {
        id: id,
        viewBox: "0 0 10 10",
        refX: "10",
        refY: "5",
        markerWidth: "9",
        markerHeight: "9",
        markerUnits: "userSpaceOnUse",
        orient: "auto",
      });
      m.append(
        make("path", {
          d: "M0 0 L10 5 L0 10z",
          fill: colour,
        }),
      );
      return m;
    };
    const uid = "g" + Math.random().toString(36).slice(2, 8);
    const defs = make("defs");
    defs.append(
      marker(uid + "d", C.stroke),
      marker(uid + "x", C.defeat),
      marker(uid + "a", C.attack),
    );
    svg.append(defs);
    const world = make("g");
    svg.append(world);
    const pairCount = new Map();
    for (const e of model.edges) {
      const a = pos.get(e.source),
        b = pos.get(e.target);
      if (!a || !b) continue;
      const colour = e.kind === "derive" ? C.stroke : e.kind === "defeat" ? C.defeat : C.attack;
      const attrs = {
        fill: "none",
        stroke: colour,
        "stroke-width": e.kind === "derive" ? 1.8 : 2,
        "marker-end": `url(#${uid}${e.kind === "derive" ? "d" : e.kind === "defeat" ? "x" : "a"})`,
        class: "edge-" + e.kind,
      };
      if (e.kind === "attack") attrs["stroke-dasharray"] = "6 3";
      let d;
      if (e.source === e.target) {
        const s = {
            x: a.x + a.w / 4,
            y: a.y - a.h / 2,
          },
          t = {
            x: a.x - a.w / 4,
            y: a.y - a.h / 2,
          };
        d = `M${s.x} ${s.y} C ${s.x + 30} ${s.y - 55}, ${t.x - 30} ${t.y - 55}, ${t.x} ${t.y}`;
      } else if (e.kind === "derive") {
        const s = boundary(a, b, shapes.get(e.source)),
          t = boundary(b, a, shapes.get(e.target));
        d = `M${s.x} ${s.y} L${t.x} ${t.y}`;
      } else {
        const key = [e.source, e.target].sort().join("|"),
          k = pairCount.get(key) || 0;
        pairCount.set(key, k + 1);
        const dx = b.x - a.x,
          dy = b.y - a.y,
          len = Math.hypot(dx, dy) || 1,
          off = 40 + 22 * k;
        const c = {
          x: (a.x + b.x) / 2 - (dy / len) * off,
          y: (a.y + b.y) / 2 + (dx / len) * off,
        };
        const s = boundary(a, c, shapes.get(e.source)),
          t = boundary(b, c, shapes.get(e.target));
        d = `M${s.x} ${s.y} Q${c.x} ${c.y} ${t.x} ${t.y}`;
      }
      const path = make("path", {
        d: d,
        ...attrs,
      });
      if (e.title) path.append(make("title", {}, e.title));
      world.append(path);
    }
    for (const n of model.nodes) {
      const p = pos.get(n.id);
      const g = make("g", {
        transform: `translate(${p.x} ${p.y})`,
        class: "gnode" + (options.selected === n.id ? " selected" : ""),
        tabindex: "0",
        role: "button",
        "aria-label": (n.title || n.label) + (n.state ? ", " + n.state : ""),
      });
      const border = {
        fill: FILL[n.state || ""],
        stroke: options.selected === n.id ? C.selected : C.stroke,
        "stroke-width": options.selected === n.id ? 3.5 : 1.8,
      };
      if (n.dashed) border["stroke-dasharray"] = "7 3";
      g.append(
        n.shape === "ellipse"
          ? make("ellipse", {
              rx: p.w / 2,
              ry: p.h / 2,
              ...border,
            })
          : make("rect", {
              x: -p.w / 2,
              y: -p.h / 2,
              width: p.w,
              height: p.h,
              rx: 3,
              ...border,
            }),
      );
      const ellipse = n.shape === "ellipse";
      if (p.tag && !ellipse)
        g.append(
          make(
            "text",
            {
              "text-anchor": "middle",
              y: -p.h / 2 + 15,
              "font-size": 10,
              fill: C.tag,
            },
            p.tag,
          ),
        );
      const lineHeight = ellipse ? 16 : 17;
      const first = ellipse
        ? -((p.lines.length - 1) * lineHeight) / 2 + 5
        : -p.h / 2 + 8 + (p.tag ? 14 : 0) + 13;
      const label = make("text", {
        "text-anchor": "middle",
        "font-size": ellipse ? 13 : 14,
        fill: C.text,
      });
      p.lines.forEach((text, k) =>
        label.append(
          make(
            "tspan",
            {
              x: 0,
              y: first + k * lineHeight,
            },
            text,
          ),
        ),
      );
      g.append(label);
      g.append(make("title", {}, n.title || n.label));
      if (options.onSelect) {
        g.addEventListener("click", () => options.onSelect(n.id));
        g.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            options.onSelect(n.id);
          }
        });
      }
      world.append(g);
    }
    const pad = 40;
    let view = {
      x: -pad,
      y: -pad,
      w: Math.max(W, 200) + 2 * pad,
      h: Math.max(H, 120) + 2 * pad,
    };
    const full = {
      ...view,
    };
    const apply = () => svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`);
    apply();
    const zoom = (factor, cx = view.x + view.w / 2, cy = view.y + view.h / 2) => {
      view = {
        x: cx - (cx - view.x) * factor,
        y: cy - (cy - view.y) * factor,
        w: view.w * factor,
        h: view.h * factor,
      };
      apply();
    };
    svg.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();
        const r = svg.getBoundingClientRect();
        const cx = view.x + ((ev.clientX - r.left) / (r.width || 1)) * view.w,
          cy = view.y + ((ev.clientY - r.top) / (r.height || 1)) * view.h;
        zoom(ev.deltaY > 0 ? 1.15 : 1 / 1.15, cx, cy);
      },
      {
        passive: false,
      },
    );
    let drag = null;
    svg.addEventListener("pointerdown", (ev) => {
      if (ev.target === svg || ev.target.tagName === "path")
        drag = {
          x: ev.clientX,
          y: ev.clientY,
          v: {
            ...view,
          },
        };
    });
    svg.addEventListener("pointermove", (ev) => {
      if (!drag) return;
      const r = svg.getBoundingClientRect(),
        s = view.w / (r.width || 1);
      view = {
        ...drag.v,
        x: drag.v.x - (ev.clientX - drag.x) * s,
        y: drag.v.y - (ev.clientY - drag.y) * s,
      };
      apply();
    });
    const stop = () => (drag = null);
    svg.addEventListener("pointerup", stop);
    svg.addEventListener("pointerleave", stop);
    const tools = document.createElement("div");
    tools.className = "graph-tools";
    for (const [text, label, fn] of [
      ["+", "Zoom in", () => zoom(1 / 1.25)],
      ["−", "Zoom out", () => zoom(1.25)],
      [
        "Fit",
        "Fit to view",
        () => {
          view = {
            ...full,
          };
          apply();
        },
      ],
    ]) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = tr(text);
      b.setAttribute("aria-label", tr(label));
      b.onclick = fn;
      tools.append(b);
    }
    container.append(tools, svg);
  }
  root.ArgGraph = {
    render: render,
    layout: layout,
  };
})(typeof self !== "undefined" ? self : this);
