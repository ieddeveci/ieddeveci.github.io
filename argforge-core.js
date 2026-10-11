(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ArgForge = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const MESSAGES = {
    SOURCE_TEXT: ["Theory source must be text.", "Kuram kaynağı metin olmalıdır."],
    EXPECTED_BLOCK: [
      "Expected a bracketed declaration.",
      "Köşeli parantezli bir bildirim bekleniyor.",
    ],
    UNCLOSED_BLOCK: [
      "Declaration is missing its closing bracket.",
      "Bildirimin kapanış köşeli parantezi eksik.",
    ],
    NESTED_BLOCK: [
      "Quote a literal containing brackets.",
      "Köşeli parantez içeren atomik ifadeyi çift tırnak içine alın.",
    ],
    UNCLOSED_QUOTE: ["Quoted literal is not closed.", "Çift tırnaklı atomik ifade kapatılmamış."],
    HEADER: [
      "Expected a valid declaration keyword and colon.",
      "Geçerli bir bildirim anahtar sözcüğü ve iki nokta bekleniyor.",
    ],
    UNKNOWN_KEYWORD: ["Unknown declaration keyword.", "Bilinmeyen bildirim anahtar sözcüğü."],
    RULE_NAME: [
      "A rule requires a name of ASCII letters, digits or underscores.",
      "Kural adı ASCII harfleri, rakamlar veya alt çizgilerden oluşmalıdır.",
    ],
    UNNAMED: [
      "Only strict and defeasible rules have names.",
      "Yalnızca katı ve feshedilebilir kurallar adlandırılır.",
    ],
    SEPARATOR: [
      "Expected exactly one separator in this declaration.",
      "Bu bildirimde tam olarak bir ayırıcı bekleniyor.",
    ],
    EMPTY_LITERAL: [
      "A literal or antecedent slot is empty.",
      "Atomik ifade veya kural öncülü alanı boş.",
    ],
    QUOTED_LITERAL: [
      "Use a complete JSON-style quoted literal.",
      "JSON biçiminde tam bir çift tırnaklı atomik ifade kullanın.",
    ],
    RESERVED: [
      "Quote literals containing &, >, ^, [, ] or a double quote.",
      "&, >, ^, [, ] veya çift tırnak içeren atomik ifadeleri çift tırnak içine alın.",
    ],
    LITERAL: [
      "Literal must be trimmed, nonempty, with at most one leading minus.",
      "Atomik ifade boş olamaz, başında ve sonunda boşluk olamaz ve en fazla bir ön eksi işareti kullanılabilir.",
    ],
    RULE_PREFERENCE_NAMES: [
      "Rule preferences name rules.",
      "Kural tercihleri kural adlarını kullanır.",
    ],
    FACT_KIND: ["Invalid fact kind.", "Geçersiz olgu türü."],
    RULE_KIND: ["Invalid rule kind.", "Geçersiz kural türü."],
    DUPLICATE_RULE_NAME: ["Two rules have the same name.", "İki kural aynı ada sahip."],
    DUPLICATE_RULE_BODY: [
      "Two rules of the same kind have the same antecedents and conclusion.",
      "Aynı türden iki kural aynı öncüllere ve sonuca sahip.",
    ],
    KB_DISJOINT: [
      "A literal cannot be both a premise and an axiom.",
      "Bir atomik ifade hem öncül hem aksiyom olamaz.",
    ],
    NAME_COLLISION: [
      "A rule name is also used as a literal.",
      "Bir kural adı aynı zamanda atomik ifade olarak kullanılıyor.",
    ],
    PREFERENCE_DOMAIN: [
      "A preference names an unknown defeasible rule or ordinary premise.",
      "Bir tercih, bilinmeyen bir feshedilebilir kurala veya sıradan öncüle atıf yapıyor.",
    ],
    PREFERENCE_CYCLE: ["The preferences form a cycle.", "Tercihler bir döngü oluşturuyor."],
    SEMANTICS: ["Unsupported semantics.", "Desteklenmeyen semantik."],
    ORDERING: ["Unknown ordering.", "Bilinmeyen sıralama."],
    TOO_MANY_ARGUMENTS: [
      "More than {n} arguments: this theory is too large for the browser.",
      "{n} argümandan fazla: bu kuram tarayıcı için çok büyük.",
    ],
    SEARCH_TOO_LARGE: [
      "The search is too large for the browser; try grounded semantics or a smaller theory.",
      "Arama tarayıcı için çok büyük; temelli semantiği veya daha küçük bir kuramı deneyin.",
    ],
    TOO_MANY_EXTENSIONS: [
      "More than {n} complete extensions; try grounded semantics.",
      "{n} tam kapsamdan fazla; temelli semantiği deneyin.",
    ],
  };
  class ArgForgeError extends Error {
    constructor(code, line, column, vars = {}) {
      const known = MESSAGES[code];
      const fill = (t) => t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k]));
      const text = known ? fill(known[0]) : String(code);
      super(line ? `Line ${line}, column ${column}: ${text}` : text);
      this.code = known ? code : "ERROR";
      this.line = line || null;
      this.column = column || null;
      this.vars = vars;
      this.text = known ? [fill(known[0]), fill(known[1])] : [text, text];
    }
    render(language = "ENG") {
      const tr = language === "TUR";
      const text = this.text[tr ? 1 : 0];
      return this.line
        ? (tr
            ? `Satır ${this.line}, sütun ${this.column}: `
            : `Line ${this.line}, column ${this.column}: `) + text
        : text;
    }
  }
  const neg = (l) => (l.startsWith("-") ? l.slice(1) : "-" + l);
  const NAME = /^[A-Za-z0-9_]+$/;
  function checkLiteral(value) {
    if (typeof value !== "string" || !value.trim() || value !== value.trim())
      throw new ArgForgeError("LITERAL");
    if (value.startsWith("--") || value === "-") throw new ArgForgeError("LITERAL");
    return value;
  }
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const cmpArr = (a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const c = cmp(a[i], b[i]);
      if (c) return c;
    }
    return a.length - b.length;
  };
  const ALIASES = {
    premise: "premise",
    öncül: "premise",
    axiom: "axiom",
    aksiyom: "axiom",
    strict: "strict",
    katı: "strict",
    defeasible: "defeasible",
    feshedilebilir: "defeasible",
    prefer_rule: "prefer_rule",
    kural_tercihi: "prefer_rule",
    prefer_premise: "prefer_premise",
    öncül_tercihi: "prefer_premise",
    contrary: "contrary",
    karşıt: "contrary",
    contradictory: "contradictory",
    çelişik: "contradictory",
  };
  function position(source, offset) {
    const before = source.slice(0, offset);
    const line = before.split("\n").length;
    return [line, offset - before.lastIndexOf("\n")];
  }
  function fail(message, source, offset) {
    const [l, c] = position(source, offset);
    throw new ArgForgeError(message, l, c);
  }
  function* blocks(source) {
    let i = 0;
    while (i < source.length) {
      const ch = source[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (ch === "#" && !source.slice(source.lastIndexOf("\n", i - 1) + 1, i).trim()) {
        const end = source.indexOf("\n", i);
        i = end < 0 ? source.length : end + 1;
        continue;
      }
      if (ch !== "[") fail("EXPECTED_BLOCK", source, i);
      const start = i;
      i++;
      let quoted = false,
        escape = false;
      while (i < source.length) {
        const c = source[i];
        if (quoted) {
          if (escape) escape = false;
          else if (c === "\\") escape = true;
          else if (c === '"') quoted = false;
        } else if (c === '"') quoted = true;
        else if (c === "[") fail("NESTED_BLOCK", source, i);
        else if (c === "]") break;
        i++;
      }
      if (i === source.length) fail(quoted ? "UNCLOSED_QUOTE" : "UNCLOSED_BLOCK", source, start);
      const content = source.slice(start + 1, i);
      const m = /^\s*([^\s:]+)(?:\s+([^:]*?))?\s*:/.exec(content);
      if (!m) fail("HEADER", source, start + 1);
      const kind = ALIASES[m[1]];
      if (!kind) fail("UNKNOWN_KEYWORD", source, start + 1);
      const label = (m[2] || "").trim();
      if (kind === "strict" || kind === "defeasible") {
        if (!NAME.test(label)) fail("RULE_NAME", source, start + 1);
      } else if (label) fail("UNNAMED", source, start + 1);
      yield {
        kind: kind,
        name: label || null,
        body: content.slice(m[0].length),
        offset: start + 1 + m[0].length,
      };
      i++;
    }
  }
  function declarationOrder(source) {
    const order = new Map();
    let i = 0;
    for (const b of blocks(source)) {
      const key =
        b.kind === "premise" || b.kind === "axiom"
          ? "F:" + literal(b.body.trim(), source, b.offset)
          : b.kind === "strict" || b.kind === "defeasible"
            ? "R:" + b.name
            : null;
      if (key && !order.has(key)) order.set(key, i);
      i++;
    }
    return order;
  }
  function splitUnquoted(text, sep, source, offset) {
    const parts = [];
    let start = 0,
      i = 0,
      quoted = false,
      escape = false;
    while (i < text.length) {
      const c = text[i];
      if (quoted) {
        if (escape) escape = false;
        else if (c === "\\") escape = true;
        else if (c === '"') quoted = false;
      } else if (c === '"') quoted = true;
      else if (text.startsWith(sep, i)) {
        parts.push([text.slice(start, i), offset + start]);
        i += sep.length;
        start = i;
        continue;
      }
      i++;
    }
    if (quoted) fail("UNCLOSED_QUOTE", source, offset);
    parts.push([text.slice(start), offset + start]);
    return parts;
  }
  function literal(text, source, offset) {
    const raw = text.trim();
    if (!raw) fail("EMPTY_LITERAL", source, offset);
    let value = raw;
    if (raw.startsWith('"')) {
      try {
        value = JSON.parse(raw);
      } catch (e) {
        fail("QUOTED_LITERAL", source, offset);
      }
      if (typeof value !== "string") fail("QUOTED_LITERAL", source, offset);
    } else if (/[&>^[\]"]/.test(raw) || raw.includes("->") || raw.includes("=>"))
      fail("RESERVED", source, offset);
    try {
      return checkLiteral(value);
    } catch (e) {
      fail("LITERAL", source, offset);
    }
  }
  function parseDeclarations(source) {
    if (typeof source !== "string") throw new ArgForgeError("SOURCE_TEXT");
    const out = {
      facts: [],
      rules: [],
      rulePrefs: [],
      premisePrefs: [],
      contraries: [],
    };
    for (const d of blocks(source)) {
      const { kind: kind, name: name, body: body, offset: offset } = d;
      if (kind === "premise" || kind === "axiom") {
        out.facts.push({
          literal: literal(body, source, offset),
          kind: kind,
        });
        continue;
      }
      const sep =
        kind === "strict"
          ? "->"
          : kind === "defeasible"
            ? "=>"
            : kind.startsWith("prefer_")
              ? ">"
              : "^";
      const parts = splitUnquoted(body, sep, source, offset);
      if (parts.length !== 2) fail("SEPARATOR", source, offset);
      const [[a, ao], [b, bo]] = parts;
      if (kind === "strict" || kind === "defeasible") {
        const ants = a.trim()
          ? splitUnquoted(a, "&", source, ao).map(([x, o]) => literal(x, source, o))
          : [];
        out.rules.push({
          name: name,
          antecedents: ants,
          consequent: literal(b, source, bo),
          kind: kind,
        });
      } else if (kind === "prefer_rule") {
        const names = [a.trim(), b.trim()];
        if (!names.every((x) => NAME.test(x))) fail("RULE_PREFERENCE_NAMES", source, offset);
        out.rulePrefs.push({
          stronger: names[0],
          weaker: names[1],
        });
      } else if (kind === "prefer_premise") {
        out.premisePrefs.push({
          stronger: literal(a, source, ao),
          weaker: literal(b, source, bo),
        });
      } else {
        out.contraries.push({
          source: literal(a, source, ao),
          target: literal(b, source, bo),
          symmetric: kind === "contradictory",
        });
      }
    }
    return out;
  }
  function closure(pairs) {
    const result = new Set(pairs.map(([a, b]) => a + "\0" + b));
    const list = () => [...result].map((k) => k.split("\0"));
    for (;;) {
      let added = false;
      const cur = list();
      for (const [a, b] of cur)
        for (const [c, d] of cur)
          if (b === c && !result.has(a + "\0" + d)) {
            result.add(a + "\0" + d);
            added = true;
          }
      if (!added) return result;
    }
  }
  class Theory {
    constructor({
      facts: facts = [],
      rules: rules = [],
      rulePrefs: rulePrefs = [],
      premisePrefs: premisePrefs = [],
      contraries: contraries = [],
    }) {
      const factKey = new Map();
      for (const f of facts)
        factKey.set(checkLiteral(f.literal) + "\0" + f.kind, {
          literal: f.literal,
          kind: f.kind,
        });
      for (const f of factKey.values())
        if (f.kind !== "axiom" && f.kind !== "premise") throw new ArgForgeError("FACT_KIND");
      this.facts = [...factKey.values()].sort(
        (x, y) => cmp(x.literal, y.literal) || cmp(x.kind, y.kind),
      );
      this.rules = rules.map((r) => {
        if (!NAME.test(r.name)) throw new ArgForgeError("RULE_NAME");
        if (r.kind !== "strict" && r.kind !== "defeasible") throw new ArgForgeError("RULE_KIND");
        return {
          name: r.name,
          antecedents: [...new Set(r.antecedents.map(checkLiteral))].sort(cmp),
          consequent: checkLiteral(r.consequent),
          kind: r.kind,
        };
      });
      const names = this.rules.map((r) => r.name);
      if (new Set(names).size !== names.length) throw new ArgForgeError("DUPLICATE_RULE_NAME");
      const bodies = this.rules.map((r) => JSON.stringify([r.antecedents, r.consequent, r.kind]));
      if (new Set(bodies).size !== bodies.length) throw new ArgForgeError("DUPLICATE_RULE_BODY");
      this.rules.sort((a, b) => cmp(a.name, b.name));
      const uniq = (arr, key) => [...new Map(arr.map((x) => [key(x), x])).values()];
      this.rulePrefs = uniq(rulePrefs, (p) => p.stronger + "\0" + p.weaker).sort(
        (a, b) => cmp(a.stronger, b.stronger) || cmp(a.weaker, b.weaker),
      );
      this.premisePrefs = uniq(premisePrefs, (p) => p.stronger + "\0" + p.weaker).sort(
        (a, b) => cmp(a.stronger, b.stronger) || cmp(a.weaker, b.weaker),
      );
      this.contraries = uniq(contraries, (c) => [c.source, c.target, c.symmetric].join("\0")).sort(
        (a, b) =>
          cmp(a.source, b.source) ||
          cmp(a.target, b.target) ||
          (a.symmetric === b.symmetric ? 0 : a.symmetric ? 1 : -1),
      );
      const ordinary = new Set(
        this.facts.filter((f) => f.kind === "premise").map((f) => f.literal),
      );
      const axioms = new Set(this.facts.filter((f) => f.kind === "axiom").map((f) => f.literal));
      for (const l of ordinary) if (axioms.has(l)) throw new ArgForgeError("KB_DISJOINT");
      this.objectLiterals = new Set([
        ...this.facts.map((f) => f.literal),
        ...this.rules.flatMap((r) => [...r.antecedents, r.consequent]),
        ...this.contraries.flatMap((c) => [c.source, c.target]),
      ]);
      for (const n of names)
        if (this.objectLiterals.has(n)) throw new ArgForgeError("NAME_COLLISION");
      const defnames = new Set(
        this.rules.filter((r) => r.kind === "defeasible").map((r) => r.name),
      );
      for (const [prefs, universe] of [
        [this.rulePrefs, defnames],
        [this.premisePrefs, ordinary],
      ]) {
        if (prefs.some((p) => !universe.has(p.stronger) || !universe.has(p.weaker)))
          throw new ArgForgeError("PREFERENCE_DOMAIN");
        const cl = closure(prefs.map((p) => [p.stronger, p.weaker]));
        for (const k of cl) {
          const [a, b] = k.split("\0");
          if (a === b) throw new ArgForgeError("PREFERENCE_CYCLE");
        }
      }
      const base = new Set([...this.objectLiterals, ...defnames]);
      this.language = new Set([...base, ...[...base].map(neg)]);
      this.conflicts = new Set([...this.language].map((l) => l + "\0" + neg(l)));
      for (const c of this.contraries) {
        this.conflicts.add(c.source + "\0" + c.target);
        if (c.symmetric) this.conflicts.add(c.target + "\0" + c.source);
      }
      this.ruleOrder = closure(this.rulePrefs.map((p) => [p.stronger, p.weaker]));
      this.premiseOrder = closure(this.premisePrefs.map((p) => [p.stronger, p.weaker]));
    }
    static parse(text) {
      const theory = new Theory(parseDeclarations(text));
      theory.declarationOrder = declarationOrder(text);
      return theory;
    }
    conflict(x, y) {
      return this.conflicts.has(x + "\0" + y);
    }
    get acyclic() {
      const deps = new Map([...this.language].map((l) => [l, new Set()]));
      for (const r of this.rules) for (const a of r.antecedents) deps.get(r.consequent).add(a);
      while (deps.size) {
        const ready = [...deps].filter(([, p]) => !p.size).map(([l]) => l);
        if (!ready.length) return false;
        for (const l of ready) deps.delete(l);
        for (const p of deps.values()) for (const l of ready) p.delete(l);
      }
      return true;
    }
    topologicalLiterals() {
      const deps = new Map([...this.language].map((l) => [l, new Set()]));
      for (const r of this.rules) for (const a of r.antecedents) deps.get(r.consequent).add(a);
      const order = [];
      while (deps.size) {
        const ready = [...deps]
          .filter(([, p]) => !p.size)
          .map(([l]) => l)
          .sort(cmp);
        if (!ready.length) return null;
        order.push(...ready);
        for (const l of ready) deps.delete(l);
        for (const p of deps.values()) for (const l of ready) p.delete(l);
      }
      return order;
    }
    toSource() {
      const q = (v) =>
        /[&>^[\]"\\\n\r\t]/.test(v) || v.includes("->") || v.includes("=>") ? JSON.stringify(v) : v;
      const lines = [];
      for (const f of [...this.facts].sort(
        (a, b) => cmp(a.kind, b.kind) || cmp(a.literal, b.literal),
      ))
        lines.push(`[${f.kind}: ${q(f.literal)}]`);
      for (const r of this.rules)
        lines.push(
          `[${r.kind} ${r.name}: ${r.antecedents.map(q).join(" & ")}${r.kind === "strict" ? " -> " : " => "}${q(r.consequent)}]`,
        );
      for (const p of this.rulePrefs) lines.push(`[prefer_rule: ${p.stronger} > ${p.weaker}]`);
      for (const p of this.premisePrefs)
        lines.push(`[prefer_premise: ${q(p.stronger)} > ${q(p.weaker)}]`);
      const cs = [...this.contraries].sort(
        (a, b) =>
          (a.symmetric === b.symmetric ? 0 : a.symmetric ? 1 : -1) ||
          cmp(a.source, b.source) ||
          cmp(a.target, b.target),
      );
      for (const c of cs)
        lines.push(
          `[${c.symmetric ? "contradictory" : "contrary"}: ${q(c.source)} ^ ${q(c.target)}]`,
        );
      return lines.join("\n") + "\n";
    }
    plain() {
      return {
        facts: this.facts,
        rules: this.rules,
        rulePrefs: this.rulePrefs,
        premisePrefs: this.premisePrefs,
        contraries: this.contraries,
      };
    }
  }
  function contradictories(theory, literal) {
    const found = new Set([neg(literal)]);
    for (const k of theory.conflicts) {
      const [x, y] = k.split("\0");
      if (y === literal && theory.conflicts.has(y + "\0" + x)) found.add(x);
    }
    return [...found].sort(cmp);
  }
  function transpositions(rule, theory) {
    const out = [];
    rule.antecedents.forEach((phi, i) => {
      for (const c of contradictories(theory, rule.consequent))
        for (const d of contradictories(theory, phi)) {
          const ants = [...rule.antecedents];
          ants[i] = c;
          out.push([[...new Set(ants)].sort(cmp), d]);
        }
    });
    return out;
  }
  function closeUnderTransposition(theory, prefix = "tp") {
    const rules = [...theory.rules];
    const used = new Set([
      ...rules.map((r) => r.name),
      ...[...theory.objectLiterals].map((l) => l.replace(/^-/, "")),
    ]);
    const bodies = new Set(rules.map((r) => JSON.stringify([r.antecedents, r.consequent, r.kind])));
    let changed = true;
    while (changed) {
      changed = false;
      for (const rule of rules.filter((r) => r.kind === "strict")) {
        transpositions(rule, theory).forEach(([ants, cons], index) => {
          const key = JSON.stringify([ants, cons, "strict"]);
          if (bodies.has(key)) return;
          let name = `${prefix}_${rule.name}_${index + 1}`;
          let suffix = 1;
          while (used.has(name)) {
            suffix++;
            name = `${prefix}_${rule.name}_${index + 1}_${suffix}`;
          }
          used.add(name);
          rules.push({
            name: name,
            antecedents: ants,
            consequent: cons,
            kind: "strict",
          });
          bodies.add(key);
          changed = true;
        });
      }
    }
    if (rules.length === theory.rules.length) return theory;
    return new Theory({
      ...theory.plain(),
      rules: rules,
    });
  }
  function diagnose(theory) {
    const strictBodies = new Set(
      theory.rules
        .filter((r) => r.kind === "strict")
        .map((r) => JSON.stringify([r.antecedents, r.consequent])),
    );
    const missing = [];
    for (const r of theory.rules.filter((x) => x.kind === "strict"))
      for (const [ants, cons] of transpositions(r, theory))
        if (!strictBodies.has(JSON.stringify([ants, cons])))
          missing.push({
            rule: r.name,
            antecedents: ants,
            consequent: cons,
          });
    const axioms = new Set(theory.facts.filter((f) => f.kind === "axiom").map((f) => f.literal));
    const cl = strictClosure(theory, axioms);
    const axiomConflicts = [...cl].flatMap((x) =>
      [...cl].filter((y) => theory.conflict(x, y)).map((y) => [x, y]),
    );
    const heads = new Set(theory.rules.filter((r) => r.kind === "strict").map((r) => r.consequent));
    const ill = [];
    for (const k of theory.conflicts) {
      const [x, y] = k.split("\0");
      if (theory.conflict(y, x)) continue;
      if (axioms.has(y) || heads.has(y)) ill.push([x, y]);
    }
    return {
      wellDefined: !missing.length && !axiomConflicts.length && !ill.length,
      missingTranspositions: missing,
      axiomConflicts: axiomConflicts,
      illFormedContraries: ill,
    };
  }
  function strictClosure(theory, literals) {
    const closed = new Set(literals);
    let changed = true;
    while (changed) {
      changed = false;
      for (const r of theory.rules)
        if (
          r.kind === "strict" &&
          !closed.has(r.consequent) &&
          r.antecedents.every((a) => closed.has(a))
        ) {
          closed.add(r.consequent);
          changed = true;
        }
    }
    return closed;
  }
  let DESCRIPTORS = new Map(),
    SIGNATURES = new Map();
  const intern = (table, text) =>
    table.has(text) ? table.get(text) : (table.set(text, table.size), table.size - 1);
  function makeArgument(conclusion, rule, children, premise) {
    const a = {
      conclusion: conclusion,
      rule: rule,
      children: children,
      premise: premise,
    };
    a.structure = premise
      ? ["fact", premise.kind, conclusion]
      : ["rule", rule.name, children.map((c) => c.structure)];
    a.key = JSON.stringify(a.structure);
    const subs = new Map([[a.key, a]]);
    for (const c of children) for (const [k, s] of c.subs) subs.set(k, s);
    a.subs = subs;
    a.ordinaryPremises = new Set(
      premise
        ? premise.kind === "premise"
          ? [conclusion]
          : []
        : children.flatMap((c) => [...c.ordinaryPremises]),
    );
    a.axioms = new Set(
      premise
        ? premise.kind === "axiom"
          ? [conclusion]
          : []
        : children.flatMap((c) => [...c.axioms]),
    );
    a.defRules = new Set([
      ...(rule && rule.kind === "defeasible" ? [rule.name] : []),
      ...children.flatMap((c) => [...c.defRules]),
    ]);
    a.strictRules = new Set([
      ...(rule && rule.kind === "strict" ? [rule.name] : []),
      ...children.flatMap((c) => [...c.strictRules]),
    ]);
    a.lastDefRules =
      rule && rule.kind === "defeasible"
        ? new Set([rule.name])
        : new Set(children.flatMap((c) => [...c.lastDefRules]));
    a.depth = 1 + Math.max(-1, ...children.map((c) => c.depth));
    a.isStrict = a.defRules.size === 0;
    a.isFirm = a.ordinaryPremises.size === 0;
    const sorted = (s) => [...s].sort(cmp);
    a.descriptor = intern(
      DESCRIPTORS,
      JSON.stringify([
        conclusion,
        rule ? rule.name : null,
        rule ? rule.kind : null,
        sorted(a.lastDefRules),
        sorted(a.defRules),
        sorted(a.ordinaryPremises),
      ]),
    );
    a.signature = intern(
      SIGNATURES,
      a.descriptor +
        "|" +
        [...new Set([...subs.values()].map((s) => s.descriptor))].sort((x, y) => x - y).join(","),
    );
    a.attackable = premise ? premise.kind === "premise" : rule.kind === "defeasible";
    const attacker = JSON.stringify([
      conclusion,
      sorted(a.lastDefRules),
      sorted(a.defRules),
      sorted(a.ordinaryPremises),
    ]);
    a.attackSignature = intern(
      SIGNATURES,
      "A" +
        attacker +
        "|" +
        [...new Set([...subs.values()].filter((s) => s.attackable).map((s) => s.descriptor))]
          .sort((x, y) => x - y)
          .join(","),
    );
    return a;
  }
  function* product(lists, prefix = []) {
    if (prefix.length === lists.length) {
      yield prefix;
      return;
    }
    for (const x of lists[prefix.length]) yield* product(lists, [...prefix, x]);
  }
  function constructExact(theory, maxArguments) {
    const order = theory.topologicalLiterals();
    const pools = new Map([...theory.language].map((l) => [l, new Map()]));
    let count = 0;
    const add = (a) => {
      if (pools.get(a.conclusion).has(a.key)) return;
      pools.get(a.conclusion).set(a.key, a);
      if (++count > maxArguments)
        throw new ArgForgeError(
          `more than ${maxArguments} arguments: this theory is too large for the browser`,
        );
    };
    for (const f of theory.facts) add(makeArgument(f.literal, null, [], f));
    for (const lit of order)
      for (const rule of theory.rules.filter((r) => r.consequent === lit))
        for (const children of product(rule.antecedents.map((a) => [...pools.get(a).values()])))
          add(makeArgument(rule.consequent, rule, children, null));
    return [...pools.values()].flatMap((m) => [...m.values()]);
  }
  function constructQuotient(theory, maxArguments, key = "signature") {
    const known = new Map(),
      pools = new Map(),
      agenda = [],
      dependents = new Map(),
      seen = new Set();
    const pool = (l) => (pools.has(l) ? pools.get(l) : (pools.set(l, []), pools.get(l)));
    for (const r of theory.rules)
      r.antecedents.forEach((l, index) => {
        if (!dependents.has(l)) dependents.set(l, []);
        dependents.get(l).push([r, index]);
      });
    const insert = (a) => {
      if (known.has(a[key])) return;
      known.set(a[key], a);
      pool(a.conclusion).push(a);
      agenda.push(a);
      if (known.size > maxArguments)
        throw new ArgForgeError("TOO_MANY_ARGUMENTS", null, null, {
          n: maxArguments,
        });
    };
    const apply = (r, children) => {
      const applied = r.name + "\0" + children.map((c) => c[key]).join(",");
      if (seen.has(applied)) return;
      seen.add(applied);
      insert(makeArgument(r.consequent, r, children, null));
    };
    for (const f of theory.facts) insert(makeArgument(f.literal, null, [], f));
    for (const r of theory.rules) if (!r.antecedents.length) apply(r, []);
    let head = 0;
    while (head < agenda.length) {
      const delta = agenda[head++];
      for (const [r, index] of dependents.get(delta.conclusion) || []) {
        const choices = r.antecedents.map((l, j) => (j === index ? [delta] : [...pool(l)]));
        for (const children of product(choices)) apply(r, children);
      }
    }
    return [...known.values()];
  }
  const ORDERINGS = [
    "last_link_elitist",
    "last_link_democratic",
    "weakest_link_elitist",
    "weakest_link_democratic",
  ];
  function setLess(left, right, stronger, comparison) {
    if (!left.size) return false;
    if (!right.size) return true;
    const L = [...left],
      R = [...right];
    const st = (y, x) => stronger.has(y + "\0" + x);
    if (comparison === "elitist") return L.some((x) => R.every((y) => st(y, x)));
    return L.every((x) => R.some((y) => st(y, x)));
  }
  function weaker(theory, left, right, ordering) {
    const [mode, comparison] = [
      ordering.slice(0, ordering.lastIndexOf("_")),
      ordering.slice(ordering.lastIndexOf("_") + 1),
    ];
    const rp =
      mode === "last_link"
        ? [left.lastDefRules, right.lastDefRules]
        : [left.defRules, right.defRules];
    const pp = [left.ordinaryPremises, right.ordinaryPremises];
    if (mode === "last_link") {
      if (rp[0].size || rp[1].size) return setLess(rp[0], rp[1], theory.ruleOrder, comparison);
      return setLess(pp[0], pp[1], theory.premiseOrder, comparison);
    }
    if (left.isStrict && right.isStrict)
      return setLess(pp[0], pp[1], theory.premiseOrder, comparison);
    if (left.isFirm && right.isFirm) return setLess(rp[0], rp[1], theory.ruleOrder, comparison);
    return (
      setLess(pp[0], pp[1], theory.premiseOrder, comparison) &&
      setLess(rp[0], rp[1], theory.ruleOrder, comparison)
    );
  }
  function computeAttacks(theory, args) {
    const byConclusion = new Map();
    for (const a of args)
      (byConclusion.get(a.conclusion) || byConclusion.set(a.conclusion, []).get(a.conclusion)).push(
        a,
      );
    const attackersOf = new Map();
    for (const k of theory.conflicts) {
      const [s, t] = k.split("\0");
      (attackersOf.get(t) || attackersOf.set(t, []).get(t)).push(s);
    }
    const out = [];
    for (const target of args)
      for (const w of target.subs.values()) {
        const points = w.premise
          ? w.premise.kind === "premise"
            ? [["undermine", w.conclusion]]
            : []
          : w.rule.kind === "defeasible"
            ? [
                ["undercut", w.rule.name],
                ["rebut", w.conclusion],
              ]
            : [];
        for (const [kind, element] of points)
          for (const lit of attackersOf.get(element) || []) {
            const independent = kind === "undercut" || !theory.conflict(element, lit);
            for (const attacker of byConclusion.get(lit) || [])
              out.push({
                attacker: attacker,
                target: target,
                witness: w,
                kind: kind,
                element: element,
                independent: independent,
              });
          }
      }
    return out;
  }
  const IN = 1,
    OUT = 2,
    UNDEC = 3;
  function groundedLabelling(n, attackers, targets) {
    const label = new Int8Array(n),
      round = new Int32Array(n).fill(-1);
    const remaining = attackers.map((a) => a.length);
    let frontier = [];
    for (let i = 0; i < n; i++) if (!remaining[i]) frontier.push(i);
    let step = 0;
    while (frontier.length) {
      const out = [];
      for (const a of frontier) {
        label[a] = IN;
        round[a] = step;
      }
      for (const a of frontier)
        for (const b of targets[a])
          if (!label[b]) {
            label[b] = OUT;
            round[b] = step;
            out.push(b);
          }
      step++;
      const next = new Set();
      for (const b of out)
        for (const c of targets[b]) if (!label[c] && --remaining[c] === 0) next.add(c);
      frontier = [...next].sort((x, y) => x - y);
    }
    for (let i = 0; i < n; i++) if (!label[i]) label[i] = UNDEC;
    return {
      label: label,
      round: round,
    };
  }
  function sccOrder(nodes, targets) {
    const inSet = new Set(nodes),
      index = new Map(),
      low = new Map(),
      onStack = new Set(),
      stack = [],
      comps = [];
    let counter = 0;
    for (const root of nodes) {
      if (index.has(root)) continue;
      const work = [[root, 0]];
      index.set(root, counter);
      low.set(root, counter);
      counter++;
      stack.push(root);
      onStack.add(root);
      while (work.length) {
        const frame = work[work.length - 1],
          v = frame[0],
          out = targets[v];
        if (frame[1] < out.length) {
          const w = out[frame[1]++];
          if (!inSet.has(w)) continue;
          if (!index.has(w)) {
            index.set(w, counter);
            low.set(w, counter);
            counter++;
            stack.push(w);
            onStack.add(w);
            work.push([w, 0]);
          } else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
          continue;
        }
        work.pop();
        if (work.length) {
          const u = work[work.length - 1][0];
          low.set(u, Math.min(low.get(u), low.get(v)));
        }
        if (low.get(v) === index.get(v)) {
          const comp = [];
          let w;
          do {
            w = stack.pop();
            onStack.delete(w);
            comp.push(w);
          } while (w !== v);
          comps.push(comp.sort((x, y) => x - y));
        }
      }
    }
    return comps.reverse().flat();
  }
  function completeLabellings(
    n,
    attackers,
    targets,
    {
      stableOnly: stableOnly = false,
      maxSteps: maxSteps = Infinity,
      maxExtensions: maxExtensions = Infinity,
    } = {},
  ) {
    const g = groundedLabelling(n, attackers, targets);
    const BIT = {
      [IN]: 1,
      [OUT]: 2,
      [UNDEC]: 4,
    };
    const ALL = stableOnly ? 3 : 7;
    const dom = new Uint8Array(n);
    const open = [];
    for (let i = 0; i < n; i++) {
      if (g.label[i] === UNDEC) {
        dom[i] = ALL;
        open.push(i);
      } else dom[i] = BIT[g.label[i]];
    }
    const order = sccOrder(open, targets);
    const trail = [];
    const restrict = (x, mask, queue) => {
      const next = dom[x] & mask;
      if (next === dom[x]) return true;
      if (!next) return false;
      trail.push(x, dom[x]);
      dom[x] = next;
      queue.push(x, ...targets[x], ...attackers[x]);
      return true;
    };
    const undo = (mark) => {
      while (trail.length > mark) {
        const old = trail.pop(),
          x = trail.pop();
        dom[x] = old;
      }
    };
    const check = (y, queue) => {
      let someMustIn = false,
        someCannotOut = false,
        allMustOut = true,
        someCanIn = false,
        canUndec = [],
        canIn = [];
      for (const z of attackers[y]) {
        const d = dom[z];
        if (d === 1) someMustIn = true;
        if (!(d & 2)) someCannotOut = true;
        if (d !== 2) allMustOut = false;
        if (d & 1) {
          someCanIn = true;
          canIn.push(z);
        }
        if (d & 4) canUndec.push(z);
      }
      let mask = 7;
      if (someMustIn) mask &= 2;
      if (someCannotOut) mask &= ~1;
      if (allMustOut) mask &= 1;
      if (!someCanIn) mask &= ~2;
      if (!canUndec.length || someMustIn) mask &= ~4;
      if (!restrict(y, mask, queue)) return false;
      const d = dom[y];
      if (d === 1) {
        for (const z of attackers[y]) if (!restrict(z, 2, queue)) return false;
      } else if (d === 4) {
        for (const z of attackers[y]) if (!restrict(z, ~1, queue)) return false;
        const left = attackers[y].filter((z) => dom[z] & 4);
        if (!left.length) return false;
        if (left.length === 1 && !restrict(left[0], 4, queue)) return false;
      } else if (d === 2) {
        const left = attackers[y].filter((z) => dom[z] & 1);
        if (!left.length) return false;
        if (left.length === 1 && !restrict(left[0], 1, queue)) return false;
      }
      return true;
    };
    const propagate = (queue) => {
      while (queue.length) {
        const y = queue.pop();
        if (!check(y, queue)) return false;
      }
      return true;
    };
    const results = [];
    let steps = 0;
    const pick = () => {
      let best = -1,
        size = 9;
      for (const x of order) {
        const d = dom[x];
        if (d === 1 || d === 2 || d === 4) continue;
        const k = (d & 1) + ((d >> 1) & 1) + ((d >> 2) & 1);
        if (k < size) {
          best = x;
          size = k;
          if (k === 2) break;
        }
      }
      return best;
    };
    const search = () => {
      if (++steps > maxSteps) throw new ArgForgeError("SEARCH_TOO_LARGE");
      const x = pick();
      if (x < 0) {
        const label = Int8Array.from(dom, (d) => (d === 1 ? IN : d === 2 ? OUT : UNDEC));
        if (!legal(label)) return;
        if (results.length >= maxExtensions)
          throw new ArgForgeError("TOO_MANY_EXTENSIONS", null, null, {
            n: maxExtensions,
          });
        results.push(label);
        return;
      }
      for (const bit of [1, 2, 4]) {
        if (!(dom[x] & bit)) continue;
        const mark = trail.length,
          queue = [];
        if (restrict(x, bit, queue) && propagate(queue)) search();
        undo(mark);
      }
    };
    const legal = (label) => {
      for (let y = 0; y < n; y++) {
        let anyIn = false,
          allOut = true;
        for (const z of attackers[y]) {
          if (label[z] === IN) anyIn = true;
          if (label[z] !== OUT) allOut = false;
        }
        const want = anyIn ? OUT : allOut ? IN : UNDEC;
        if (label[y] !== want) return false;
      }
      return true;
    };
    if (propagate([...order])) search();
    return {
      labellings: results,
      grounded: g,
    };
  }
  const SEMANTICS = ["grounded", "complete", "preferred", "stable"];
  function extensionsOf(semantics, n, attackers, targets) {
    if (semantics === "grounded") {
      const g = groundedLabelling(n, attackers, targets);
      return {
        extensions: [inSet(g.label)],
        grounded: g,
      };
    }
    const { labellings: labellings, grounded: grounded } = completeLabellings(
      n,
      attackers,
      targets,
      {
        stableOnly: semantics === "stable",
      },
    );
    let sets = labellings.map(inSet);
    if (semantics === "stable") sets = labellings.filter((l) => !l.includes(UNDEC)).map(inSet);
    if (semantics === "preferred")
      sets = sets.filter(
        (s) => !sets.some((t) => t.size > s.size && [...s].every((x) => t.has(x))),
      );
    sets.sort((a, b) =>
      cmpArr(
        [...a].sort((x, y) => x - y),
        [...b].sort((x, y) => x - y),
      ),
    );
    return {
      extensions: sets,
      grounded: grounded,
    };
  }
  const inSet = (label) => new Set([...label.keys()].filter((i) => label[i] === IN));
  function strengths(n, attackers, tolerance = 1e-10, maxIter = 1e4) {
    let deg = new Float64Array(n).fill(1);
    for (let it = 0; it < maxIter; it++) {
      const next = new Float64Array(n);
      let change = 0;
      for (let a = 0; a < n; a++) {
        let s = 0;
        for (const b of attackers[a]) s += deg[b];
        next[a] = 1 / (1 + s);
        change = Math.max(change, Math.abs(next[a] - deg[a]));
      }
      deg = next;
      if (change < tolerance) return deg;
    }
    return deg;
  }
  function evaluate(input, options = {}) {
    const semantics = options.semantics || "grounded";
    const ordering = (options.ordering || "last_link") + "_" + (options.setOrdering || "elitist");
    if (!SEMANTICS.includes(semantics)) throw new ArgForgeError("SEMANTICS");
    if (!ORDERINGS.includes(ordering)) throw new ArgForgeError("ORDERING");
    const submitted = input instanceof Theory ? input : Theory.parse(input);
    DESCRIPTORS = new Map();
    SIGNATURES = new Map();
    const theory = options.transposition ? closeUnderTransposition(submitted) : submitted;
    const maxArguments = options.maxArguments || Infinity;
    const cyclic = !theory.acyclic;
    const cyclePolicy = options.cyclePolicy || "QUOTIENT";
    if (!["QUOTIENT", "QUOTIENT_ATTACKABLE"].includes(cyclePolicy))
      throw new ArgForgeError("ERROR");
    const args = cyclic
      ? constructQuotient(
          theory,
          maxArguments,
          cyclePolicy === "QUOTIENT" ? "signature" : "attackSignature",
        )
      : constructExact(theory, maxArguments);
    const declared = submitted.declarationOrder || new Map();
    const position = (a) => {
      const key = a.rule ? "R:" + a.rule.name : "F:" + a.conclusion;
      return declared.has(key) ? declared.get(key) : Infinity;
    };
    const byDepth = new Map();
    for (const a of args) (byDepth.get(a.depth) || byDepth.set(a.depth, []).get(a.depth)).push(a);
    const ordered = [];
    const rankOf = new Map();
    for (const depth of [...byDepth.keys()].sort((x, y) => x - y)) {
      const level = byDepth.get(depth);
      const childRanks = (a) => [...(a.children || [])].map((c) => rankOf.get(c.key));
      level.sort((a, b) => {
        const pa = position(a),
          pb = position(b);
        if (pa !== pb) return pa - pb;
        const ra = a.rule ? a.rule.name : "",
          rb = b.rule ? b.rule.name : "";
        if (ra !== rb) return cmp(ra, rb);
        const ca = childRanks(a),
          cb = childRanks(b);
        for (let k = 0; k < Math.min(ca.length, cb.length); k++)
          if (ca[k] !== cb[k]) return ca[k] - cb[k];
        return ca.length - cb.length || cmp(a.conclusion, b.conclusion) || cmp(a.key, b.key);
      });
      for (const a of level) {
        rankOf.set(a.key, ordered.length);
        ordered.push(a);
      }
    }
    args.length = 0;
    args.push(...ordered);
    const index = new Map(args.map((a, i) => [a.key, i]));
    args.forEach((a, i) => {
      a.index = i;
      a.alias = "A" + (i + 1);
    });
    const attacks = computeAttacks(theory, args).map((e) => ({
      attacker: e.attacker.index,
      target: e.target.index,
      on: e.witness.key,
      kind: e.kind,
      element: e.element,
      independent: e.independent,
      succeeds: e.independent || !weaker(theory, e.attacker, e.witness, ordering),
    }));
    const n = args.length;
    const attackers = Array.from(
        {
          length: n,
        },
        () => [],
      ),
      targets = Array.from(
        {
          length: n,
        },
        () => [],
      );
    const defeatKeys = new Set();
    for (const a of attacks) {
      const k = a.attacker * n + a.target;
      if (a.succeeds && !defeatKeys.has(k)) {
        defeatKeys.add(k);
        attackers[a.target].push(a.attacker);
        targets[a.attacker].push(a.target);
      }
    }
    const defeats = [...defeatKeys]
      .map((k) => [Math.floor(k / n), k % n])
      .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const { extensions: extensions, grounded: grounded } = extensionsOf(
      semantics,
      n,
      attackers,
      targets,
    );
    const bearers = new Map();
    for (const a of args)
      (bearers.get(a.conclusion) || bearers.set(a.conclusion, []).get(a.conclusion)).push(a.index);
    const claims = Object.create(null);
    for (const [claim, bs] of [...bearers].sort((x, y) => cmp(x[0], y[0]))) {
      const accepted = extensions.map((e) => bs.some((b) => e.has(b)));
      let status;
      if (!extensions.length) status = "NO_EXTENSIONS";
      else if (accepted.every(Boolean)) status = "JUSTIFIED";
      else if (accepted.some(Boolean)) status = "DEFENSIBLE";
      else if (extensions.every((e) => bs.every((b) => attackers[b].some((x) => e.has(x)))))
        status = "OVERRULED";
      else status = "UNDECIDED";
      claims[claim] = {
        status: status,
        bearers: bs,
        acceptance: extensions.length ? accepted.filter(Boolean).length / extensions.length : null,
      };
    }
    const labellings = extensions.map((e) =>
      args.map((a, i) => (e.has(i) ? "IN" : attackers[i].some((x) => e.has(x)) ? "OUT" : "UNDEC")),
    );
    const hc = strengths(n, attackers);
    const name = {
      1: "IN",
      2: "OUT",
      3: "UNDEC",
    };
    return {
      theory: theory,
      submitted: submitted,
      semantics: semantics,
      ordering: ordering,
      cyclic: cyclic,
      cyclePolicy: cyclic ? cyclePolicy : "EXACT",
      wellDefinedness: diagnose(theory),
      arguments: args.map((a, i) => ({
        index: i,
        alias: a.alias,
        key: a.key,
        structure: a.structure,
        conclusion: a.conclusion,
        kind: a.premise ? a.premise.kind : a.rule.kind,
        rule: a.rule ? a.rule.name : null,
        text: a.premise
          ? `${a.premise.kind} ${a.conclusion}`
          : `${a.rule.antecedents.join(" & ")} ${a.rule.kind === "strict" ? "->" : "=>"} ${a.rule.consequent}`,
        children: a.children.map((c) => index.get(c.key)),
        depth: a.depth,
        premises: [...a.ordinaryPremises].sort(cmp),
        axioms: [...a.axioms].sort(cmp),
        defeasibleRules: [...a.defRules].sort(cmp),
        grounded: name[grounded.label[i]],
        groundedRound: grounded.round[i] >= 0 ? grounded.round[i] : null,
        strength: hc[i],
      })),
      attacks: attacks,
      defeats: defeats,
      attackers: attackers,
      targets: targets,
      extensions: extensions.map((e) => [...e].sort((x, y) => x - y)),
      labellings: labellings,
      claims: claims,
    };
  }
  function explain(result, i) {
    return result.extensions.map((ext, k) => {
      const e = new Set(ext),
        label = result.labellings[k][i];
      if (label === "IN")
        return {
          extension: k,
          label: label,
          defeaters: result.attackers[i].map((b) => ({
            defeater: b,
            counteredBy: result.attackers[b].filter((c) => e.has(c)),
          })),
        };
      if (label === "OUT")
        return {
          extension: k,
          label: label,
          defeatedBy: result.attackers[i].filter((b) => e.has(b)),
        };
      return {
        extension: k,
        label: label,
        openDefeaters: result.attackers[i].filter((b) => result.labellings[k][b] !== "OUT"),
      };
    });
  }
  function viewLabels(result, view) {
    if (result.extensions.length) return result.labellings[view];
    return result.arguments.map((a) => a.grounded);
  }
  function explainArgument(result, i, view = 0) {
    const labels = viewLabels(result, view);
    const defeaters = result.attackers[i];
    const context = result.extensions.length
      ? {
          kind: result.semantics === "grounded" ? "grounded" : "extension",
          index: view,
          count: result.extensions.length,
        }
      : { kind: "none", semantics: result.semantics };
    let reason;
    if (!defeaters.length) reason = { type: "unattacked" };
    else if (labels[i] === "IN")
      reason = {
        type: "defended",
        answers: defeaters.map((b) => ({
          defeater: b,
          answeredBy: result.attackers[b].filter((c) => labels[c] === "IN"),
        })),
      };
    else if (labels[i] === "OUT")
      reason = { type: "defeated", by: defeaters.filter((b) => labels[b] === "IN") };
    else reason = { type: "undecided", by: defeaters.filter((b) => labels[b] === "UNDEC") };
    const defeating = new Set(defeaters);
    const keyIndex = new Map(result.arguments.map((a, k) => [a.key, k]));
    const failed = [];
    const seen = new Set();
    for (const x of result.attacks) {
      if (x.target !== i || x.succeeds || defeating.has(x.attacker)) continue;
      const on = keyIndex.has(x.on) ? keyIndex.get(x.on) : i;
      const key = x.attacker + ":" + on;
      if (seen.has(key)) continue;
      seen.add(key);
      failed.push({ attacker: x.attacker, on, kind: x.kind });
    }
    const a = result.arguments[i];
    return {
      argument: i,
      label: labels[i],
      context,
      reason,
      failed,
      grounded: { label: a.grounded, round: a.groundedRound },
      strength: a.strength,
    };
  }
  function explainClaim(result, claim) {
    const bearers = result.arguments
      .map((a, k) => k)
      .filter((k) => result.arguments[k].conclusion === claim);
    const status = (result.claims[claim] || { status: "UNSUPPORTED" }).status;
    const perExtension = result.extensions.map((ext, k) => {
      const labels = result.labellings[k];
      return {
        index: k,
        accepted: bearers.filter((b) => labels[b] === "IN"),
        defeated: bearers
          .filter((b) => labels[b] === "OUT")
          .map((b) => ({ argument: b, by: result.attackers[b].filter((x) => labels[x] === "IN") })),
        undecided: bearers.filter((b) => labels[b] === "UNDEC"),
      };
    });
    return {
      claim,
      status,
      bearers,
      count: result.extensions.length,
      acceptedIn: perExtension.filter((e) => e.accepted.length).map((e) => e.index),
      perExtension,
    };
  }
  class Mulberry32 {
    constructor(seed) {
      this.state = seed >>> 0;
    }
    next() {
      this.state = (this.state + 1831565813) >>> 0;
      let t = this.state;
      t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
      t = (t ^ ((t + (Math.imul(t ^ (t >>> 7), t | 61) >>> 0)) >>> 0)) >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    below(n) {
      return Math.floor(this.next() * n);
    }
    chance(p) {
      return this.next() < p;
    }
    pick(items) {
      return items[this.below(items.length)];
    }
    sample(items, k) {
      const pool = [...items],
        out = [];
      for (let i = 0; i < Math.min(k, items.length); i++)
        out.push(pool.splice(this.below(pool.length), 1)[0]);
      return out;
    }
  }
  const GENERATOR_DEFAULTS = {
    atoms: 6,
    premises: 4,
    axioms: 1,
    rules: 8,
    strict_ratio: 0.25,
    max_antecedents: 2,
    conflict: 0.4,
    undercuts: 0.15,
    rule_preferences: 0.3,
    premise_preferences: 0.2,
    contraries: 0.1,
    contradictories: 0.1,
    negation: 0.3,
    premise_conflicts: 0.15,
    acyclic: true,
    transposition: false,
  };
  const VARIED_SIZES = {
    small: [3, 4],
    medium: [5, 7],
    large: [8, 11],
    any: [3, 8],
  };
  function variedParams(seed, size = "medium") {
    const [lo, hi] = VARIED_SIZES[size];
    const r = new Mulberry32((seed + 1540483477) >>> 0);
    const atoms = lo + r.below(hi - lo + 1);
    const axioms = r.below(Math.min(2, atoms) + 1);
    const premises = r.below(atoms - axioms + 1);
    return {
      atoms: atoms,
      axioms: axioms,
      premises: premises + axioms > 0 ? premises : 1,
      rules: r.below(2 * atoms + 1),
      strict_ratio: r.pick([0, 0, 0.25, 0.5, 1]),
      max_antecedents: 1 + r.below(3),
      negation: r.pick([0, 0.2, 0.5]),
      premise_conflicts: r.pick([0, 0, 0.2, 0.5]),
      conflict: r.pick([0, 0.3, 0.6]),
      undercuts: r.pick([0, 0, 0.2, 0.4]),
      rule_preferences: r.pick([0, 0.3, 0.7]),
      premise_preferences: r.pick([0, 0.3]),
      contraries: r.pick([0, 0, 0.2]),
      contradictories: r.pick([0, 0, 0.2]),
      acyclic: r.chance(0.8),
    };
  }
  function generateSource(seed, params = {}) {
    const p = {
      ...GENERATOR_DEFAULTS,
      ...params,
    };
    if (p.premises + p.axioms > 2 * p.atoms) throw new ArgForgeError("more facts than literals");
    if (p.axioms > p.atoms) throw new ArgForgeError("axioms must not exceed atoms");
    if (p.premises + p.axioms < 1)
      throw new ArgForgeError("at least one premise or axiom is required");
    if (p.rules > 0 && p.acyclic && p.atoms < 2)
      throw new ArgForgeError("acyclic rules need at least 2 atoms");
    const rng = new Mulberry32(seed);
    const atoms = Array.from(
      {
        length: p.atoms,
      },
      (_, i) => "a" + (i + 1),
    );
    const order = rng.sample(atoms, atoms.length);
    const rank = new Map(order.map((a, i) => [a, i]));
    const signed = (atom) => (rng.chance(p.negation) ? "-" + atom : atom);
    const facts = [],
      factAtoms = new Set();
    for (let i = 0; i < p.axioms; i++) {
      const free = order.filter((a) => !factAtoms.has(a));
      if (!free.length) break;
      const atom = rng.pick(free);
      factAtoms.add(atom);
      facts.push(["axiom", signed(atom)]);
    }
    const taken = new Set(facts.map((f) => f[1]));
    for (let i = 0; i < p.premises; i++) {
      const opposable = facts.map((f) => neg(f[1])).filter((l) => !taken.has(l));
      const fresh = order.filter((a) => !factAtoms.has(a));
      let literal;
      if (opposable.length && (!fresh.length || rng.chance(p.premise_conflicts)))
        literal = rng.pick(opposable);
      else if (fresh.length) literal = signed(rng.pick(fresh));
      else break;
      taken.add(literal);
      factAtoms.add(literal.replace(/^-/, ""));
      facts.push(["premise", literal]);
    }
    const axioms = new Set(facts.filter((f) => f[0] === "axiom").map((f) => f[1]));
    const derivable = facts.map((f) => f[1]);
    const rules = [],
      strictHeads = new Set();
    const nStrict = Math.floor(p.rules * p.strict_ratio + 0.5);
    let kinds = [...Array(nStrict).fill("strict"), ...Array(p.rules - nStrict).fill("defeasible")];
    kinds = rng.sample(kinds, kinds.length);
    const counters = {
      strict: 0,
      defeasible: 0,
    };
    for (let kind of kinds) {
      if (!derivable.length) break;
      const count = 1 + rng.below(Math.min(p.max_antecedents, derivable.length));
      const ants = [];
      for (let i = 0; i < count; i++) {
        const choice = rng.pick(derivable);
        if (!ants.includes(choice) && !ants.includes(neg(choice))) ants.push(choice);
      }
      const used = new Set(ants.map((a) => a.replace(/^-/, "")));
      const heads = p.acyclic
        ? order.filter((a) => rank.get(a) > Math.max(...[...used].map((u) => rank.get(u))))
        : order.filter((a) => !used.has(a));
      if (!heads.length) continue;
      const headAtom = rng.pick(heads);
      let consequent;
      if (
        rng.chance(p.conflict) &&
        (derivable.includes(headAtom) || derivable.includes("-" + headAtom))
      )
        consequent = derivable.includes(headAtom) ? "-" + headAtom : headAtom;
      else consequent = signed(headAtom);
      if (
        kind === "strict" &&
        (axioms.has(consequent) || axioms.has(neg(consequent)) || strictHeads.has(neg(consequent)))
      )
        kind = "defeasible";
      counters[kind]++;
      const name = (kind === "strict" ? "s" : "r") + counters[kind];
      const sortedAnts = [...new Set(ants)].sort(cmp);
      if (
        rules.some((r) => {
          const inBody = r[2].every((a) => sortedAnts.includes(a));
          const inRule = sortedAnts.every((a) => r[2].includes(a));
          return (
            (r[3] === consequent && (inBody || inRule)) ||
            (r[3] === neg(consequent) && inBody && inRule)
          );
        })
      ) {
        counters[kind]--;
        continue;
      }
      rules.push([kind, name, sortedAnts, consequent]);
      if (kind === "strict") strictHeads.add(consequent);
      if (!derivable.includes(consequent)) derivable.push(consequent);
    }
    for (const name of rules.filter((r) => r[0] === "defeasible").map((r) => r[1])) {
      if (rng.chance(p.undercuts)) {
        counters.defeasible++;
        rules.push(["defeasible", "r" + counters.defeasible, [rng.pick(derivable)], "-" + name]);
      }
    }
    const defeasible = rules.filter((r) => r[0] === "defeasible").map((r) => r[1]);
    const ranking = rng.sample(defeasible, defeasible.length);
    const rulePrefs = [];
    for (let i = 0; i < ranking.length; i++)
      for (let j = i + 1; j < ranking.length; j++)
        if (rng.chance(Math.min(1, (p.rule_preferences / Math.max(1, ranking.length - 1)) * 2)))
          rulePrefs.push([ranking[i], ranking[j]]);
    const premises = facts.filter((f) => f[0] === "premise").map((f) => f[1]);
    const pranking = rng.sample(premises, premises.length);
    const premisePrefs = [];
    for (let i = 0; i < pranking.length; i++)
      for (let j = i + 1; j < pranking.length; j++)
        if (rng.chance(p.premise_preferences)) premisePrefs.push([pranking[i], pranking[j]]);
    const contraries = [];
    const blocked = new Set([
      ...strictHeads,
      ...rules.filter((r) => r[0] === "strict").flatMap((r) => r[2].map(neg)),
    ]);
    for (const target of premises) {
      if (blocked.has(target)) continue;
      if (rng.chance(p.contraries)) {
        const options = derivable.filter((l) => l !== target && l !== neg(target));
        const source = rng.pick(options.length ? options : [neg(target)]);
        if (source !== neg(target) && !contraries.some(([a, b]) => a === target && b === source))
          contraries.push([source, target]);
      }
    }
    const lines = facts.map(([k, l]) => `[${k}: ${l}]`);
    for (const [kind, name, ants, cons] of rules)
      lines.push(
        `[${kind} ${name}: ${ants.join(" & ")} ${kind === "strict" ? "->" : "=>"} ${cons}]`,
      );
    lines.push(
      ...rulePrefs.map(([a, b]) => `[prefer_rule: ${a} > ${b}]`),
      ...premisePrefs.map(([a, b]) => `[prefer_premise: ${a} > ${b}]`),
    );
    const closed = (extra) =>
      closeUnderTransposition(Theory.parse([...lines, ...extra].join("\n") + "\n"));
    let tail = [];
    const paired = new Set(),
      fixed = new Set([...axioms, ...strictHeads]);
    for (const literal of [...derivable]) {
      if (fixed.has(literal) || paired.has(literal)) continue;
      if (rng.chance(p.contradictories)) {
        const options = derivable.filter(
          (m) =>
            m.replace(/^-/, "") !== literal.replace(/^-/, "") && !fixed.has(m) && !paired.has(m),
        );
        if (options.length) {
          const partner = rng.pick(options);
          const candidate = [...tail, `[contradictory: ${literal} ^ ${partner}]`];
          if (!diagnose(closed(candidate)).axiomConflicts.length) {
            tail = candidate;
            paired.add(literal);
            paired.add(partner);
          }
        }
      }
    }
    const heads = new Set(
      closed(tail)
        .rules.filter((r) => r.kind === "strict")
        .map((r) => r.consequent),
    );
    lines.push(
      ...contraries.filter(([, t]) => !heads.has(t)).map(([a, b]) => `[contrary: ${a} ^ ${b}]`),
      ...tail,
    );
    return lines.join("\n") + "\n";
  }
  function generateTheory(seed, params = {}) {
    const t = Theory.parse(generateSource(seed, params));
    return params.transposition ? closeUnderTransposition(t) : t;
  }
  return {
    ArgForgeError: ArgForgeError,
    Theory: Theory,
    parseDeclarations: parseDeclarations,
    evaluate: evaluate,
    explain: explain,
    explainArgument: explainArgument,
    explainClaim: explainClaim,
    diagnose: diagnose,
    closeUnderTransposition: closeUnderTransposition,
    generateSource: generateSource,
    generateTheory: generateTheory,
    Mulberry32: Mulberry32,
    ORDERINGS: ORDERINGS,
    SEMANTICS: SEMANTICS,
    GENERATOR_DEFAULTS: GENERATOR_DEFAULTS,
    variedParams: variedParams,
    _extensionsOf: extensionsOf,
    version: "1.0.9",
  };
});
