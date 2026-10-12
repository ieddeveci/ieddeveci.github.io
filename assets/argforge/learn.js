"use strict";

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./argforge-core.js"));
  else root.ArgForgeLearn = factory(root.ArgForge);
})(typeof self !== "undefined" ? self : this, function (AF) {
  const SETTINGS = { semantics: "grounded", ordering: "last_link", setOrdering: "elitist", transposition: false };
  const W = {
    rain: ["rain", "yağmur"],
    wet: ["wet streets", "ıslak sokak"],
    slippery: ["slippery", "kaygan"],
    bird: ["bird", "kuş"],
    penguin: ["penguin", "penguen"],
    flies: ["flies", "uçar"],
    open: ["shop open", "dükkan açık"],
    guilty: ["guilty", "suçlu"],
    innocent: ["innocent", "masum"],
    alibi: ["alibi", "tanık ifadesi"],
    seen: ["seen at the scene", "olay yerinde görüldü"],
    forecast: ["rain forecast", "yağmur tahmini"],
    clear: ["clear sky", "açık gökyüzü"],
    cancelled: ["picnic cancelled", "piknik iptal"],
    toy: ["toy", "oyuncak"],
    expA: ["Ayşe is an expert on medicines", "Ayşe ilaç uzmanı"],
    saysA: ["Ayşe says the drug is safe", "Ayşe ilacın güvenli olduğunu söylüyor"],
    safe: ["the drug is safe", "ilaç güvenli"],
    paid: ["Ayşe is paid by the manufacturer", "Ayşe üreticiden para alıyor"],
    expM: ["Mehmet is an expert on medicines", "Mehmet ilaç uzmanı"],
    saysM: ["Mehmet says the drug is not safe", "Mehmet ilacın güvenli olmadığını söylüyor"],
    passed: ["passed", "sınavı geçti"],
    cheated: ["cheated", "kopya çekti"],
    cert: ["certificate", "sertifika"],
    vehicle: ["vehicle", "araç"],
    amb: ["ambulance", "ambulans"],
    duty: ["on duty", "görevde"],
    allowed: ["allowed in the park", "parka girebilir"],
    wsays: ["the witness says red", "tanık kırmızı diyor"],
    cshows: ["the camera shows blue", "kamera mavi gösteriyor"],
    red: ["red", "kırmızı"],
    blue: ["blue", "mavi"],
    windy: ["windy", "rüzgarlı"],
    wings: ["has wings", "kanatlı"],
    migrates: ["migrates", "göç eder"],
  };
  const KW = {
    premise: ["premise", "öncül"],
    axiom: ["axiom", "aksiyom"],
    defeasible: ["defeasible", "feshedilebilir"],
    strict: ["strict", "katı"],
    prefer_rule: ["prefer_rule", "kural_tercihi"],
    prefer_premise: ["prefer_premise", "öncül_tercihi"],
    contrary: ["contrary", "karşıt"],
    contradictory: ["contradictory", "çelişik"],
    rexpert: ["expert", "uzman"],
    rexpert2: ["expert2", "uzman2"],
    rbias: ["bias", "taraf"],
  };
  const STATUS = {
    JUSTIFIED: ["justified", "gerekçelendirilmiş"],
    DEFENSIBLE: ["defensible", "savunulabilir"],
    OVERRULED: ["overruled", "reddedilmiş"],
    UNDECIDED: ["undecided", "kararsız"],
    UNSUPPORTED: ["unsupported, since no argument concludes it", "desteklenmemiş, çünkü hiçbir argüman ona varmıyor"],
    NO_EXTENSIONS: ["without a status, since there is no extension", "durumsuz, çünkü hiç kapsam yok"],
  };
  const KIND = {
    rebut: ["rebuts", "sonucuna saldırıyor"],
    undermine: ["undermines", "öncülüne saldırıyor"],
    undercut: ["undercuts", "kuralına saldırıyor"],
  };
  const li = (lang) => (lang === "tr" ? 1 : 0);
  const q = (x) => "“" + x + "”";
  const w = (key, lang) => W[key][li(lang)];
  const k = (key, lang) => KW[key][li(lang)];
  const fill = (text, lang) =>
    text.replace(/\{(\w+)\}/g, (m, key) => (W[key] ? w(key, lang) : m)).replace(/<(\w+)>/g, (m, key) => (KW[key] ? k(key, lang) : m));
  const fillText = (text, lang) =>
    text
      .replace(/-\{(\w+)\}/g, (m, key) => (W[key] ? q("-" + w(key, lang)) : m))
      .replace(/\{(\w+)\}/g, (m, key) => (W[key] ? q(w(key, lang)) : m))
      .replace(/<(\w+)>/g, (m, key) => (KW[key] ? k(key, lang) : m));
  const tx = (en, tr) => ({ en: en, tr: tr });
  const statusOf = (r, c) => (r.claims[c] || { status: "UNSUPPORTED" }).status;
  const statusWord = (s, lang) => (STATUS[s] || [s, s])[li(lang)];

  function lastDef(r, i, memo = new Map()) {
    if (memo.has(i)) return memo.get(i);
    const a = r.arguments[i];
    let out;
    if (a.kind === "defeasible") out = [a.rule];
    else if (a.kind === "premise" || a.kind === "axiom") out = [];
    else out = [...new Set(a.children.flatMap((c) => lastDef(r, c, memo)))].sort();
    memo.set(i, out);
    return out;
  }
  function witnessOf(r, attack) {
    const j = r.arguments.findIndex((a) => a.key === attack.on);
    return j < 0 ? attack.target : j;
  }
  const set = (xs) => "{" + xs.join(", ") + "}";
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  const plain = (a) => (a.kind === "premise" || a.kind === "axiom" ? a.conclusion : a.text);
  function nm(r, i, lang, form) {
    const a = r.arguments[i];
    if (lang === "tr") {
      const ends = a.kind === "premise" ? ["öncülü", "öncülünün", "öncülüne"] : a.kind === "axiom" ? ["aksiyomu", "aksiyomunun", "aksiyomuna"] : ["argümanı", "argümanının", "argümanına"];
      return q(plain(a)) + " " + ends[{ gen: 1, dat: 2 }[form] || 0];
    }
    return (a.kind === "premise" ? "the premise " : a.kind === "axiom" ? "the axiom " : "the argument ") + q(plain(a));
  }
  const names = (r, xs, lang) => xs.map((i) => nm(r, i, lang)).join(", ");

  function whyFailed(r, attack) {
    const a = r.arguments[attack.attacker],
      v = r.arguments[witnessOf(r, attack)];
    if (String(r.ordering).startsWith("weakest_link")) {
      const dem = String(r.ordering).endsWith("democratic");
      const ra = a.defeasibleRules,
        rv = v.defeasibleRules,
        pa = a.premises,
        pv = v.premises;
      let en, tr;
      if (!ra.length && !rv.length) {
        en = `the premises are compared: ${set(pa)} for ${q(plain(a))} against ${set(pv)} for ${q(plain(v))}`;
        tr = `öncüller karşılaştırılır: ${q(plain(a))} için ${set(pa)}, ${q(plain(v))} için ${set(pv)}`;
      } else if (!pa.length && !pv.length) {
        en = `all the defeasible rules are compared: ${set(ra)} for ${q(plain(a))} against ${set(rv)} for ${q(plain(v))}`;
        tr = `bütün feshedilebilir kurallar karşılaştırılır: ${q(plain(a))} için ${set(ra)}, ${q(plain(v))} için ${set(rv)}`;
      } else {
        en = `both the defeasible rules (${set(ra)} against ${set(rv)}) and the premises (${set(pa)} against ${set(pv)}) of ${q(plain(a))} and ${q(plain(v))} are compared`;
        tr = `${q(plain(a))} ile ${q(plain(v))} argümanlarının hem feshedilebilir kuralları (${set(ra)} ile ${set(rv)}) hem de öncülleri (${set(pa)} ile ${set(pv)}) karşılaştırılır`;
      }
      return tx(
        `Under weakest link with the ${dem ? "democratic" : "elitist"} set ordering, ${en}. The attacking argument, ${q(plain(a))}, comes out weaker, so its attack fails.`,
        `En zayıf halkada ${dem ? "demokratik" : "elitist"} küme sıralamasıyla ${tr}. Saldıran ${q(plain(a))} argümanı daha zayıf kaldığı için saldırısı başarısız olur.`,
      );
    }
    const la = lastDef(r, attack.attacker),
      lv = lastDef(r, witnessOf(r, attack));
    if (la.length || lv.length) {
      const extra = la.length && !lv.length;
      return tx(
        `Under last link, the last defeasible rules of the two arguments are compared: ${set(la)} for ${q(plain(a))} and ${set(lv)} for ${q(plain(v))}. The attacking argument, ${q(plain(a))}, comes out weaker, so its attack fails.${extra ? " A non-empty set always counts as weaker than an empty one." : ""}`,
        `Son halkada iki argümanın son feshedilebilir kuralları karşılaştırılır: ${q(plain(a))} için ${set(la)}, ${q(plain(v))} için ${set(lv)}. Saldıran ${q(plain(a))} argümanı daha zayıf kaldığı için saldırısı başarısız olur.${extra ? " Boş olmayan bir küme, boş kümeden her zaman daha zayıf sayılır." : ""}`,
      );
    }
    return tx(
      `Neither argument uses a defeasible rule, so their premises are compared: ${set(a.premises)} for ${q(plain(a))} against ${set(v.premises)} for ${q(plain(v))}. The attacking premise side comes out weaker, so its attack fails.`,
      `İki argüman da feshedilebilir kural kullanmadığı için öncülleri karşılaştırılır: ${q(plain(a))} için ${set(a.premises)}, ${q(plain(v))} için ${set(v.premises)}. Saldıran taraf daha zayıf kaldığı için saldırısı başarısız olur.`,
    );
  }

  function attackLine(r, attack) {
    const i = attack.attacker,
      t = attack.target;
    const ok = attack.succeeds;
    const atPremise = r.arguments[t].kind === "premise";
    const en = `${cap(nm(r, i, "en"))} ${KIND[attack.kind][0]} ${nm(r, t, "en")}`;
    const tr =
      attack.kind === "rebut"
        ? `${nm(r, i, "tr")}, ${nm(r, t, "tr", "gen")} sonucuna saldırıyor`
        : attack.kind === "undercut"
          ? `${nm(r, i, "tr")}, ${nm(r, t, "tr", "gen")} kuralına saldırıyor`
          : atPremise
            ? `${nm(r, i, "tr")}, ${nm(r, t, "tr", "dat")} saldırıyor`
            : `${nm(r, i, "tr")}, ${nm(r, t, "tr", "dat")} öncülü üzerinden saldırıyor`;
    return tx(`${en}, ${ok ? "and the attack succeeds" : "but the attack fails"}.`, `${tr} ${ok ? "ve saldırı başarılı oluyor" : "ama saldırı başarısız oluyor"}.`);
  }

  function claimLine(r, c) {
    const s = statusOf(r, c);
    return tx(`According to the engine, ${q(c)} is ${statusWord(s, "en")}.`, `Motora göre ${q(c)} iddiası ${statusWord(s, "tr")}.`);
  }

  function join(parts) {
    return tx(parts.map((p) => p.en).filter(Boolean).join(" "), parts.map((p) => p.tr).filter(Boolean).join(" "));
  }

  const SEM = { grounded: ["grounded", "temelli"], preferred: ["preferred", "tercih edilen"], stable: ["stable", "kararlı"], complete: ["complete", "tam"] };
  function settingsText(settings) {
    const st = Object.assign({}, SETTINGS, settings || {});
    return tx(
      `Settings: ${SEM[st.semantics][0]} semantics · ${st.ordering === "last_link" ? "last link" : "weakest link"} · ${st.setOrdering} set ordering · contrapositives ${st.transposition ? "added" : "not added"}`,
      `Ayarlar: ${SEM[st.semantics][1]} semantik · ${st.ordering === "last_link" ? "son halka" : "en zayıf halka"} · ${st.setOrdering === "elitist" ? "elitist" : "demokratik"} küme sıralaması · ters yönlü hâller ${st.transposition ? "ekleniyor" : "eklenmiyor"}`,
    );
  }
  function context(lang, source, given, settings) {
    let r, error;
    try {
      r = AF.evaluate(source, Object.assign({}, SETTINGS, settings || {}));
    } catch (e) {
      error = e;
    }
    let decls = null,
      givenDecls = null;
    try {
      decls = AF.parseDeclarations(source);
      givenDecls = AF.parseDeclarations(given || "");
    } catch (e) {}
    return { lang, source, given, r, error, decls, givenDecls };
  }

  function added(ctx) {
    const key = (x) => JSON.stringify(x);
    const out = { facts: [], rules: [], rulePrefs: [], premisePrefs: [], contraries: [] };
    for (const part of Object.keys(out)) {
      const before = new Set((ctx.givenDecls[part] || []).map(key));
      out[part] = (ctx.decls[part] || []).filter((x) => !before.has(key(x)));
    }
    out.count = Object.values(out).reduce((n, xs) => n + (Array.isArray(xs) ? xs.length : 0), 0);
    return out;
  }
  function sameExceptPreferences(ctx) {
    const key = (x) => JSON.stringify(x);
    for (const part of ["facts", "rules", "contraries"]) {
      const a = (ctx.decls[part] || []).map(key).sort().join("|");
      const b = (ctx.givenDecls[part] || []).map(key).sort().join("|");
      if (a !== b) return false;
    }
    return true;
  }
  function keptGiven(ctx) {
    const key = (x) => JSON.stringify(x);
    for (const part of ["facts", "rules", "rulePrefs", "premisePrefs", "contraries"]) {
      const now = new Set((ctx.decls[part] || []).map(key));
      if ((ctx.givenDecls[part] || []).some((x) => !now.has(key(x)))) return false;
    }
    return true;
  }
  const neg = (x) => (x.startsWith("-") ? x.slice(1) : "-" + x);
  const factsAbout = (ctx, lit) => (ctx.decls.facts || []).filter((f) => f.literal === lit || f.literal === neg(lit));
  const newRules = (ctx) => {
    const old = new Set((ctx.givenDecls.rules || []).map((x) => x.name));
    return (ctx.decls.rules || []).filter((x) => !old.has(x.name));
  };
  const hasAll = (xs, ys) => ys.every((y) => xs.includes(y));
  const argsWithRule = (r, name) => r.arguments.map((a, i) => i).filter((i) => r.arguments[i].rule === name);
  const childConclusions = (r, i) => r.arguments[i].children.map((c) => r.arguments[c].conclusion);
  const label = (r, i) => r.arguments[i].grounded;
  const bearers = (r, c) => r.arguments.map((a, i) => i).filter((i) => r.arguments[i].conclusion === c);
  function claimReason(r, c) {
    const s = statusOf(r, c);
    if (s === "JUSTIFIED")
      return tx(`The grounded extension contains an argument for ${q(c)}.`, `Temelli kapsam ${q(c)} için bir argüman içeriyor.`);
    if (s === "OVERRULED")
      return tx(`Every argument for ${q(c)} is defeated by an accepted argument.`, `${q(c)} için kurulan her argüman, kabul edilmiş bir argüman tarafından yeniliyor.`);
    if (s === "UNDECIDED")
      return tx(
        `No argument for ${q(c)} is accepted, but not all of them are defeated by an accepted argument either.`,
        `${q(c)} için kabul edilmiş bir argüman yok, ama onun için kurulan argümanların hepsi de kabul edilmiş bir argüman tarafından yenilmiyor.`,
      );
    return tx("", "");
  }
  const missingGiven = tx(
    "Keep the given lines as they are and add your own declarations below them.",
    "Verilen satırlara dokunmayın, kendi bildirimlerinizi onların altına ekleyin.",
  );
  const lines = (r) => r.attacks.map((a) => attackLine(r, a));
  const failures = (r) => r.attacks.filter((a) => !a.succeeds).map((a) => whyFailed(r, a));
  const pick = (r) => (statusOf(r, "p") === "JUSTIFIED" ? "p" : statusOf(r, "-p") === "JUSTIFIED" ? "-p" : "none");
  const pq = (r) => {
    const a = statusOf(r, "q") === "JUSTIFIED",
      b = statusOf(r, "-q") === "JUSTIFIED";
    return a && b ? "both" : a ? "q" : b ? "-q" : "none";
  };
  const PCHOICES = [
    { value: "p", label: tx("“p”", "“p”") },
    { value: "-p", label: tx("“-p”", "“-p”") },
    { value: "none", label: tx("neither", "hiçbiri") },
  ];
  const QCHOICES = [
    { value: "both", label: tx("both “q” and “-q”", "hem “q” hem “-q”") },
    { value: "q", label: tx("only “q”", "yalnızca “q”") },
    { value: "-q", label: tx("only “-q”", "yalnızca “-q”") },
  ];

  const conc = (r, i) => r.arguments[typeof i === "number" ? i : r.arguments.findIndex((a) => a.key === i)].conclusion;
  const family = (r) => r.extensions.map((e) => "{" + [...e].map((i) => conc(r, i)).sort().join(", ") + "}");
  const familyText = (r, lang) => {
    const f = family(r).map((x) => (x === "{}" ? (lang === "tr" ? "boş küme {}" : "the empty set {}") : x));
    if (!f.length) return lang === "tr" ? "hiç kapsam yok" : "no extension";
    return f.join(lang === "tr" ? " ve " : " and ");
  };
  const sameFamily = (r1, r2) => family(r1).slice().sort().join("|") === family(r2).slice().sort().join("|");
  const countAnswer = (r) => ["none", "one", "two"][Math.min(r.extensions.length, 2)];
  const COUNT_CHOICES = [
    { value: "none", label: tx("none", "hiç yok") },
    { value: "one", label: tx("one", "bir tane") },
    { value: "two", label: tx("two", "iki tane") },
  ];
  function cycleOf(ctx, names) {
    const edges = (ctx.decls.contraries || []).filter((x) => !x.symmetric && names.includes(x.source) && names.includes(x.target));
    const next = {};
    for (const e of edges) (next[e.source] = next[e.source] || []).push(e.target);
    const walk = (start, at, seen) => {
      if (seen.length === names.length) return (next[at] || []).includes(start);
      return (next[at] || []).some((n) => !seen.includes(n) && walk(start, n, [...seen, n]));
    };
    return walk(names[0], names[0], [names[0]]);
  }
  const SYNTAX = [
    [tx("Premise", "Öncül"), "[<premise>: {rain}]", tx("a statement that can be attacked", "saldırıya açık bir ifade")],
    [tx("Axiom", "Aksiyom"), "[<axiom>: {rain}]", tx("a statement that cannot be attacked", "saldırılamayan bir ifade")],
    [tx("Negation", "Olumsuzlama"), "-{rain}", tx("the opposite of a statement", "bir ifadenin değili")],
    [tx("Defeasible rule", "Feshedilebilir kural"), "[<defeasible> r1: {rain} => {wet}]", tx("usually holds", "genellikle geçerlidir")],
    [tx("Strict rule", "Katı kural"), "[<strict> s1: {penguin} -> {bird}]", tx("always holds", "her zaman geçerlidir")],
    [tx("Several conditions", "Birden çok koşul"), "[<defeasible> r2: a & b => c]", tx("conditions are joined with &", "koşullar & ile bağlanır")],
    [tx("Undercut", "Kurala saldırı"), "[<defeasible> r3: {penguin} => -r1]", tx("rule r1 does not apply here", "r1 kuralı burada geçerli değil")],
    [tx("Rule preference", "Kural tercihi"), "[<prefer_rule>: r2 > r1]", tx("r2 is stronger than r1", "r2, r1'den güçlüdür")],
    [tx("Premise preference", "Öncül tercihi"), "[<prefer_premise>: {rain} > -{rain}]", tx("the first premise is more reliable", "ilk öncül daha güvenilirdir")],
    [tx("Contrary", "Karşıt"), "[<contrary>: {alibi} ^ {guilty}]", tx("the first attacks the second, one way only", "ilki ikincisine saldırır, tersi olmaz")],
    [tx("Contradictory", "Çelişik"), "[<contradictory>: {guilty} ^ {innocent}]", tx("the two attack each other", "ikisi birbirine saldırır")],
  ];
  const SYNTAX_NOTE = tx(
    "Write each declaration on its own line, in square brackets. Statements may contain spaces. Every rule needs a name of its own, such as r1 or s1.",
    "Her bildirimi köşeli parantez içinde, ayrı bir satıra yazın. İfadeler boşluk içerebilir. Her kuralın r1 ya da s1 gibi kendine ait bir adı olmalıdır.",
  );

  const LESSONS = [
    {
      id: "premises",
      title: tx("Premises and claims", "Öncüller ve iddialar"),
      intro: tx(
        "A theory is a list of declarations written in square brackets. The simplest declaration is a premise: a statement we accept but that someone could still challenge. Every premise is an argument on its own, and the statement an argument arrives at is its claim. An axiom is similar, but it can never be attacked.",
        "Kuram, köşeli parantez içinde yazılan bildirimlerden oluşur. En basit bildirim öncüldür. Öncül, kabul ettiğimiz ama başkasının itiraz edebileceği bir ifadedir. Her öncül kendi başına bir argümandır ve bir argümanın vardığı ifadeye iddia denir. Aksiyom da öncüle benzer, ancak aksiyoma hiçbir zaman saldırılamaz.",
      ),
      exercises: [
        {
          id: "premises-1",
          kind: "build",
          task: tx(
            "Suppose we accept that it is raining. Write a premise that makes the claim {rain} justified. A single declaration is enough.",
            "Yağmur yağdığını kabul edelim. {rain} iddiasını gerekçelendiren bir öncül yazın. Tek bir bildirim yeterli.",
          ),
          given: "",
          hint: tx("A premise is written [premise: …].", "Öncüller [öncül: …] biçiminde yazılır."),
          solution: "[<premise>: {rain}]",
          wrong: ["[<axiom>: {rain}]", "[<premise>: -{rain}]"],
          check(ctx) {
            const c = w("rain", ctx.lang);
            const fact = ctx.decls.facts.find((f) => f.literal === c);
            if (fact && fact.kind === "axiom")
              return {
                ok: false,
                msg: tx(
                  `An axiom also makes ${q(c)} justified, but an axiom can never be attacked. This exercise asks for a statement that could be challenged, so write a premise.`,
                  `Aksiyom da ${q(c)} iddiasını gerekçelendirir, ama aksiyoma hiçbir zaman saldırılamaz. Bu alıştırmada itiraz edilebilecek bir ifade istiyoruz. O yüzden bir öncül yazın.`,
                ),
              };
            const own = ctx.r.arguments.findIndex((a) => a.kind === "premise" && a.conclusion === c);
            if (statusOf(ctx.r, c) === "JUSTIFIED" && fact && own >= 0) {
              const attacked = ctx.r.attacks.some((a) => a.target === own);
              return {
                ok: true,
                msg: join([
                  tx(`Your premise is, on its own, an argument for ${q(c)}.`, `Öncülünüz tek başına ${q(c)} için bir argüman oluşturuyor.`),
                  attacked ? join(lines(ctx.r)) : tx("Nothing attacks it.", "Ona saldıran bir şey yok."),
                  claimLine(ctx.r, c),
                ]),
              };
            }
            return {
              ok: false,
              msg: join([claimLine(ctx.r, c), tx(`Write a premise whose statement is exactly ${q(c)}.`, `İfadesi tam olarak ${q(c)} olan bir öncül yazın.`)]),
            };
          },
        },
        {
          id: "premises-2",
          kind: "predict",
          task: tx(
            "In this theory two premises contradict each other. The minus sign marks the negation of a statement. Under grounded semantics, what do you expect the status of {rain} to be?",
            "Bu kuramda iki öncül birbiriyle çelişiyor. Eksi işareti bir ifadenin değilini gösterir. Temelli semantiğe göre {rain} iddiasının durumu sizce ne olur?",
          ),
          given: "[<premise>: {rain}]\n[<premise>: -{rain}]",
          choices: ["JUSTIFIED", "OVERRULED", "UNDECIDED"],
          hint: tx("Is there anything that gives one premise an advantage over the other?", "Öncüllerden birini ötekine üstün kılan bir şey var mı?"),
          answer: (ctx) => statusOf(ctx.r, w("rain", ctx.lang)),
          explain(ctx) {
            return join([
              ...lines(ctx.r),
              tx(
                `The two premises attack each other, and with no preference between them both attacks succeed. Grounded semantics then accepts neither, so ${q(w("rain", "en"))} stays undecided.`,
                `İki öncül birbirine saldırıyor ve aralarında bir tercih olmadığı için iki saldırı da başarılı. Bu durumda temelli semantik ikisini de kabul etmez, ${q(w("rain", "tr"))} iddiası kararsız kalır.`,
              ),
            ]);
          },
        },
      ],
    },
    {
      id: "rules",
      title: tx("Rules", "Kurallar"),
      intro: tx(
        "Rules lead from statements to a conclusion. A defeasible rule (=>) describes a connection that usually holds: [defeasible r1: a => b] says that if a, then usually b. A strict rule (->) has no exceptions: [strict s1: a -> b] says that if a, then always b. Every rule has a name. Applying a rule to arguments for its conditions gives a new argument, and rules can be linked into chains.",
        "Kurallar bazı ifadelerden bir sonuca götürür. Feshedilebilir kural (=>) genellikle geçerli olan bir bağlantıyı anlatır: [feshedilebilir r1: a => b], a varsa genellikle b de vardır demektir. Katı kural (->) ise istisna tanımaz: [katı s1: a -> b], a varsa b her zaman vardır demektir. Her kuralın bir adı olur. Bir kuralı, koşulları için kurulmuş argümanlara uyguladığınızda yeni bir argüman ortaya çıkar. Kuralları art arda bağlayarak zincir de kurabilirsiniz.",
      ),
      exercises: [
        {
          id: "rules-1",
          kind: "build",
          task: tx(
            "We know that it is raining, and rain usually makes the streets wet. Add this connection as a defeasible rule, so that {wet} is justified.",
            "Yağmur yağdığını biliyoruz. Yağmur da genellikle sokakları ıslatır. Bu bağlantıyı feshedilebilir bir kural olarak ekleyin ve {wet} iddiasını gerekçelendirin.",
          ),
          given: "[<premise>: {rain}]",
          hint: tx("A defeasible rule is written [defeasible r1: condition => conclusion].", "Feshedilebilir kurallar [feshedilebilir r1: koşul => sonuç] biçiminde yazılır."),
          solution: "[<premise>: {rain}]\n[<defeasible> r1: {rain} => {wet}]",
          wrong: ["[<premise>: {rain}]\n[<premise>: {wet}]", "[<premise>: {rain}]\n[<strict> s1: {rain} -> {wet}]"],
          check(ctx) {
            const c = w("wet", ctx.lang),
              rn = w("rain", ctx.lang);
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            if (factsAbout(ctx, c).length)
              return {
                ok: false,
                msg: tx(
                  `${q(c)} should not be declared directly. The task is to derive it from ${q(rn)} with a defeasible rule.`,
                  `${q(c)} doğrudan bildirilmemeli. Görev, bu sonucu ${q(rn)} ifadesinden feshedilebilir bir kuralla türetmek.`,
                ),
              };
            const rule = (ctx.decls.rules || []).find((x) => x.kind === "defeasible" && x.consequent === c && x.antecedents.length === 1 && x.antecedents[0] === rn);
            if (!rule) {
              const strict = (ctx.decls.rules || []).find((x) => x.kind === "strict" && x.consequent === c);
              if (strict)
                return {
                  ok: false,
                  msg: tx(
                    "That is a strict rule (->), which says that rain always makes the streets wet. Rain usually does, not always, so use a defeasible rule (=>).",
                    "Bu bir katı kural (->) ve yağmurun sokakları her zaman ıslattığını söylüyor. Yağmur sokakları genellikle ıslatır, her zaman değil. O yüzden feshedilebilir bir kural (=>) kullanın.",
                  ),
                };
              return {
                ok: false,
                msg: tx(
                  `Add a defeasible rule whose only condition is ${q(rn)} and whose conclusion is ${q(c)}.`,
                  `Tek koşulu ${q(rn)}, sonucu ${q(c)} olan feshedilebilir bir kural ekleyin.`,
                ),
              };
            }
            const arg = argsWithRule(ctx.r, rule.name).find((i) => childConclusions(ctx.r, i)[0] === rn);
            if (arg === undefined) return { ok: false, msg: join([claimLine(ctx.r, c)]) };
            const a = ctx.r.arguments[arg];
            const ok = statusOf(ctx.r, c) === "JUSTIFIED";
            return {
              ok,
              msg: join([
                tx(`The argument ${q(a.text)} applies the rule ${rule.name} to ${q(rn)}.`, `${q(a.text)} argümanı, ${rule.name} kuralını ${q(rn)} ifadesine uyguluyor.`),
                ...lines(ctx.r),
                claimLine(ctx.r, c),
              ]),
            };
          },
        },
        {
          id: "rules-2",
          kind: "build",
          task: tx(
            "Wet streets are usually slippery. Build a chain of two defeasible rules: the first from {rain} to {wet}, the second from {wet} to {slippery}. In the end {slippery} should be justified.",
            "Islak sokaklar genellikle kaygandır. İki feshedilebilir kuraldan oluşan bir zincir kurun: ilki {rain} ifadesinden {wet} ifadesine, ikincisi {wet} ifadesinden {slippery} ifadesine gitsin. Sonunda {slippery} iddiası gerekçelendirilmiş olmalı.",
          ),
          given: "[<premise>: {rain}]",
          hint: tx("Write two rules called r1 and r2. The conclusion of the first should be the condition of the second.", "r1 ve r2 adında iki kural yazın. Birinci kuralın sonucu, ikinci kuralın koşulu olsun."),
          solution: "[<premise>: {rain}]\n[<defeasible> r1: {rain} => {wet}]\n[<defeasible> r2: {wet} => {slippery}]",
          wrong: ["[<premise>: {rain}]\n[<defeasible> r1: {rain} => {slippery}]"],
          check(ctx) {
            const c = w("slippery", ctx.lang),
              mid = w("wet", ctx.lang),
              rn = w("rain", ctx.lang);
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            if (factsAbout(ctx, c).length || factsAbout(ctx, mid).length)
              return {
                ok: false,
                msg: tx(
                  `Do not declare ${q(mid)} or ${q(c)} directly. Both should be derived with rules.`,
                  `${q(mid)} ya da ${q(c)} ifadesini doğrudan bildirmeyin. İkisi de kurallarla türetilmeli.`,
                ),
              };
            const first = (ctx.decls.rules || []).filter((x) => x.kind === "defeasible" && x.consequent === mid && x.antecedents.length === 1 && x.antecedents[0] === rn);
            const second = (ctx.decls.rules || []).filter((x) => x.kind === "defeasible" && x.consequent === c && x.antecedents.length === 1 && x.antecedents[0] === mid);
            if (!first.length || !second.length)
              return {
                ok: false,
                msg: join([
                  !first.length ? tx(`The chain needs a defeasible rule from ${q(rn)} to ${q(mid)}.`, `Zincirde ${q(rn)} ifadesinden ${q(mid)} ifadesine giden feshedilebilir bir kural olmalı.`) : tx("", ""),
                  !second.length ? tx(`The chain needs a defeasible rule from ${q(mid)} to ${q(c)}.`, `Zincirde ${q(mid)} ifadesinden ${q(c)} ifadesine giden feshedilebilir bir kural olmalı.`) : tx("", ""),
                ]),
              };
            const firstNames = first.map((x) => x.name);
            const chained = second
              .flatMap((x) => argsWithRule(ctx.r, x.name))
              .find((i) => ctx.r.arguments[i].children.some((ch) => firstNames.includes(ctx.r.arguments[ch].rule)));
            if (chained === undefined) return { ok: false, msg: join([claimLine(ctx.r, mid), claimLine(ctx.r, c)]) };
            const a = ctx.r.arguments[chained];
            const firstArg = ctx.r.arguments[a.children[0]];
            return {
              ok: statusOf(ctx.r, c) === "JUSTIFIED",
              msg: join([
                tx(
                  `The argument for ${q(c)} applies ${a.rule} to the argument ${q(firstArg.text)}, which itself applies ${firstArg.rule} to ${q(rn)}. The chain goes through ${q(mid)} as required.`,
                  `${q(c)} için kurulan argüman, ${a.rule} kuralını ${q(firstArg.text)} argümanına uyguluyor. Bu argüman da ${firstArg.rule} kuralını ${q(rn)} ifadesine uyguluyor. Zincir istendiği gibi ${q(mid)} üzerinden geçiyor.`,
                ),
                ...lines(ctx.r),
                claimLine(ctx.r, c),
              ]),
            };
          },
        },
      ],
    },
    {
      id: "rebut",
      title: tx("Negation and rebutting", "Olumsuzlama ve sonuca saldırı"),
      intro: tx(
        "The statement -x is the negation of x. An argument for -x attacks an argument that reaches x through a defeasible rule. This kind of attack is called rebutting. A conclusion reached through a strict inference cannot be rebutted directly, but the argument may still be open to attack through its premises or its defeasible sub-arguments.",
        "-x ifadesi x'in değilidir. -x için kurulan bir argüman, x sonucuna feshedilebilir bir kuralla varan argümana saldırır. Bu saldırı türüne sonuca saldırı denir. Katı çıkarımla elde edilen bir sonuca doğrudan sonuca saldırı yapılamaz. Ancak argümanın öncülleri ya da feshedilebilir alt argümanları saldırıya açık olabilir.",
      ),
      exercises: [
        {
          id: "rebut-1",
          kind: "build",
          task: tx(
            "Birds usually fly, and this theory concludes {flies}. Add an argument that speaks against this conclusion, that is, one that rebuts it.",
            "Kuşlar genellikle uçar ve bu kuram da {flies} sonucuna varıyor. Bu sonuca karşı çıkan, yani onun sonucuna saldıran bir argüman ekleyin.",
          ),
          given: "[<premise>: {bird}]\n[<defeasible> r1: {bird} => {flies}]",
          hint: tx("You need an argument whose conclusion is -{flies}. A premise or a rule can give you one.", "Sonucu -{flies} olan bir argümana ihtiyacınız var. Bir öncül ya da bir kural bunu sağlar."),
          solution: "[<premise>: {bird}]\n[<defeasible> r1: {bird} => {flies}]\n[<premise>: {penguin}]\n[<defeasible> r2: {penguin} => -{flies}]",
          wrong: ["[<premise>: {bird}]\n[<defeasible> r1: {bird} => {flies}]\n[<premise>: -{bird}]"],
          check(ctx) {
            const c = w("flies", ctx.lang);
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const own = bearers(ctx.r, c);
            const att = ctx.r.attacks.find((a) => a.kind === "rebut" && own.includes(a.target) && ctx.r.arguments[a.attacker].conclusion === neg(c));
            if (att) {
              const back = ctx.r.attacks.filter((a) => a.attacker === att.target && a.target === att.attacker);
              let why;
              if (att.succeeds && back.some((a) => a.succeeds))
                why = tx("Both attacks succeed and nothing decides between them, so neither argument is accepted.", "İki saldırı da başarılı ve aralarında karar veren bir şey yok, bu yüzden iki argüman da kabul edilmiyor.");
              else if (att.succeeds && !back.length)
                why = tx(
                  `The argument for ${q(c)} cannot attack yours back, because your argument does not end with a defeasible rule and does not rest on an attackable premise. So your rebuttal decides the matter.`,
                  `${q(c)} argümanı sizinkine karşılık veremiyor, çünkü sizin argümanınız feshedilebilir bir kuralla bitmiyor ve saldırıya açık bir öncüle dayanmıyor. Bu yüzden saldırınız sonucu belirliyor.`,
                );
              else if (att.succeeds) why = join([...back.filter((a) => !a.succeeds).map((a) => whyFailed(ctx.r, a)), tx("Its counterattack fails, so your rebuttal decides the matter.", "Karşı saldırısı başarısız olduğu için sizin saldırınız sonucu belirliyor.")]);
              else why = whyFailed(ctx.r, att);
              return { ok: true, msg: join([attackLine(ctx.r, att), ...back.map((a) => attackLine(ctx.r, a)), why, claimLine(ctx.r, c)]) };
            }
            const other = ctx.r.attacks.find((a) => a.kind === "undermine");
            if (other)
              return {
                ok: false,
                msg: join([
                  attackLine(ctx.r, other),
                  tx(`That attacks a premise. Here the task is to attack the conclusion ${q(c)} itself.`, `Bu bir öncüle saldırı. Burada ${q(c)} sonucunun kendisine saldırmanız gerekiyor.`),
                ]),
              };
            return {
              ok: false,
              msg: tx(
                `Nothing attacks the argument for ${q(c)} yet. The attacking argument must conclude ${q(neg(c))}.`,
                `${q(c)} için kurulan argümana henüz saldıran bir şey yok. Saldıran argümanın sonucu ${q(neg(c))} olmalı.`,
              ),
            };
          },
        },
        {
          id: "rebut-2",
          kind: "predict",
          task: tx(
            "Birds usually fly, but penguins usually don't. Both {bird} and {penguin} are premises, and there is no preference between the two rules. What is the status of {flies}?",
            "Kuşlar genellikle uçar, penguenler ise genellikle uçmaz. Hem {bird} hem {penguin} öncül olarak veriliyor ve iki kural arasında bir tercih yok. {flies} iddiasının durumu ne olur?",
          ),
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]",
          choices: ["JUSTIFIED", "OVERRULED", "UNDECIDED"],
          hint: tx("Look at the two attacks between the arguments for {flies} and -{flies}.", "{flies} ve -{flies} için kurulan argümanlar arasındaki iki saldırıya bakın."),
          answer: (ctx) => statusOf(ctx.r, w("flies", ctx.lang)),
          explain(ctx) {
            return join([
              ...lines(ctx.r),
              tx(
                "Each argument rebuts the other and both attacks succeed. Grounded semantics does not take sides in such a standoff, so both claims stay undecided.",
                "İki argüman birbirinin sonucuna saldırıyor ve iki saldırı da başarılı. Temelli semantik böyle bir çekişmede taraf tutmaz, iki iddiayı da kararsız bırakır.",
              ),
            ]);
          },
        },
      ],
    },
    {
      id: "undermine",
      title: tx("Undermining and undercutting", "Öncüle ve kurala saldırı"),
      intro: tx(
        "There are two more kinds of attack. Undermining targets a premise: an argument for -x attacks every argument that uses the premise x. Axioms cannot be undermined. Undercutting targets a defeasible rule itself: an argument whose conclusion is -r1 says that the rule r1 does not apply in this case.",
        "Saldırının iki türü daha var. Öncüle saldırıda -x için kurulan bir argüman, x öncülünü kullanan her argümana saldırır. Aksiyomlar bu şekilde saldırıya uğramaz. Kurala saldırıda ise hedef feshedilebilir bir kuralın kendisidir. Sonucu -r1 olan bir argüman, r1 kuralının bu durumda geçerli olmadığını söyler.",
      ),
      exercises: [
        {
          id: "undermine-1",
          kind: "build",
          task: tx(
            "Attack the premise {bird} and defeat it, so that {flies} is no longer justified. This exercise uses last link. If your first attempt fails, read the explanation in the feedback.",
            "{bird} öncülüne saldırın ve onu yenin. Böylece {flies} artık gerekçelendirilmiş olmasın. Bu alıştırmada son halka kullanılıyor. İlk denemeniz başarısız olursa geri bildirimdeki açıklamayı okuyun.",
          ),
          given: "[<premise>: {bird}]\n[<defeasible> r1: {bird} => {flies}]",
          hint: tx(
            "If your attack fails, compare what the two arguments are built from. Does your argument really need a rule?",
            "Saldırınız başarısız olduysa iki argümanın neyden kurulduğunu karşılaştırın. Argümanınızın bir kurala gerçekten ihtiyacı var mı?",
          ),
          solution: "[<premise>: {bird}]\n[<defeasible> r1: {bird} => {flies}]\n[<premise>: -{bird}]",
          wrong: ["[<premise>: {bird}]\n[<defeasible> r1: {bird} => {flies}]\n[<premise>: {penguin}]\n[<defeasible> r2: {penguin} => -{bird}]"],
          check(ctx) {
            const b = w("bird", ctx.lang),
              c = w("flies", ctx.lang);
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const on = ctx.r.attacks.filter((a) => a.kind === "undermine" && ctx.r.arguments[witnessOf(ctx.r, a)].conclusion === b);
            const win = on.find((a) => a.succeeds);
            if (win && statusOf(ctx.r, c) !== "JUSTIFIED") {
              const premiseArg = witnessOf(ctx.r, win);
              const back = ctx.r.attacks.filter((a) => a.attacker === premiseArg && a.target === win.attacker);
              const parts = [attackLine(ctx.r, win), ...back.map((a) => attackLine(ctx.r, a))];
              parts.push(
                tx(
                  "Your argument uses no defeasible rule, so under last link it does not count as weaker than the premise and the attack succeeds.",
                  "Argümanınız feshedilebilir kural kullanmıyor. Bu yüzden son halkaya göre öncülden zayıf sayılmıyor ve saldırı başarılı oluyor.",
                ),
              );
              if (back.some((a) => a.succeeds))
                parts.push(tx(`The premise ${q(b)} attacks back successfully, so neither is accepted.`, `${q(b)} öncülü de başarılı bir karşılık veriyor, bu yüzden ikisi de kabul edilmiyor.`));
              else
                parts.push(tx(`The premise ${q(b)} cannot answer this attack, so it is defeated.`, `${q(b)} öncülü bu saldırıya karşılık veremiyor, bu yüzden yeniliyor.`));
              parts.push(claimLine(ctx.r, b), claimLine(ctx.r, c), claimReason(ctx.r, c));
              return { ok: true, msg: join(parts) };
            }
            if (on.length) return { ok: false, msg: join([attackLine(ctx.r, on[0]), whyFailed(ctx.r, on[0]), claimLine(ctx.r, c)]) };
            return {
              ok: false,
              msg: tx(
                `Nothing attacks the premise ${q(b)} yet. You need an argument whose conclusion is ${q(neg(b))}.`,
                `${q(b)} öncülüne henüz saldıran bir şey yok. Sonucu ${q(neg(b))} olan bir argümana ihtiyacınız var.`,
              ),
            };
          },
        },
        {
          id: "undermine-2",
          kind: "build",
          task: tx(
            "Penguins are birds that cannot fly. Add a rule saying that r1 does not apply when {penguin} holds, so that {flies} is overruled.",
            "Penguenler uçamayan kuşlardır. {penguin} geçerliyken r1 kuralının uygulanamayacağını söyleyen bir kural ekleyin. Böylece {flies} reddedilmiş olsun.",
          ),
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]",
          hint: tx("A rule whose conclusion is -r1 attacks the rule r1.", "Sonucu -r1 olan bir kural, r1 kuralına saldırır."),
          solution: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -r1]",
          wrong: ["[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]"],
          check(ctx) {
            const c = w("flies", ctx.lang),
              pg = w("penguin", ctx.lang);
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            if ((ctx.decls.facts || []).some((f) => f.literal === "-r1"))
              return {
                ok: false,
                msg: tx(
                  `That declares -r1 directly. The task asks for a rule that applies when ${q(pg)} holds and concludes -r1.`,
                  `Bu, -r1 ifadesini doğrudan bildiriyor. Görev, ${q(pg)} geçerliyken uygulanan ve -r1 sonucuna varan bir kural yazmak.`,
                ),
              };
            const cutters = newRules(ctx).filter((x) => x.consequent === "-r1" && x.antecedents.includes(pg));
            if (!cutters.length) {
              if (ctx.r.attacks.some((a) => a.kind === "rebut"))
                return {
                  ok: false,
                  msg: join([
                    claimLine(ctx.r, c),
                    tx("That attacks the conclusion. Attack the rule itself instead: your rule should conclude -r1.", "Bu, sonuca saldırıyor. Bunun yerine kuralın kendisine saldırın: kuralınızın sonucu -r1 olmalı."),
                  ]),
                };
              return {
                ok: false,
                msg: tx(`Add a rule whose condition includes ${q(pg)} and whose conclusion is -r1.`, `Koşulları arasında ${q(pg)} bulunan ve sonucu -r1 olan bir kural ekleyin.`),
              };
            }
            const names = cutters.map((x) => x.name);
            const cut = ctx.r.attacks.find((a) => a.kind === "undercut" && names.includes(ctx.r.arguments[a.attacker].rule));
            if (!cut) return { ok: false, msg: tx("Your rule never applies, so it attacks nothing. Check that its conditions can be derived.", "Kuralınız hiç uygulanmıyor, bu yüzden hiçbir şeye saldırmıyor. Koşullarının türetilebildiğini kontrol edin.") };
            const ok = cut.succeeds && statusOf(ctx.r, c) === "OVERRULED";
            return {
              ok,
              msg: join([
                attackLine(ctx.r, cut),
                claimLine(ctx.r, c),
                claimReason(ctx.r, c),
                ok
                  ? tx(
                      "An undercut does not argue for the opposite conclusion. It only says that the rule does not apply here.",
                      "Kurala saldırı karşıt sonuç için bir argüman kurmaz. Yalnızca kuralın burada geçerli olmadığını söyler.",
                    )
                  : tx("", ""),
              ]),
            };
          },
        },
      ],
    },
    {
      id: "preferences",
      title: tx("Preferences and defeat", "Tercihler ve başarılı saldırılar"),
      intro: tx(
        "Preferences decide the outcome of attacks between arguments. Writing [prefer_rule: r2 > r1] makes the rule r2 stronger than r1, and [prefer_premise: a > b] makes the premise a more reliable than b. A rebut or an undermine fails when the attacker is weaker. An attack that succeeds is called a defeat, or a successful attack. Undercuts, and attacks through a one-way contrary, are not affected by preferences.",
        "Tercihler, argümanlar arasındaki saldırıların sonucunu belirler. [kural_tercihi: r2 > r1] yazdığınızda r2 kuralı r1'den güçlü olur. [öncül_tercihi: a > b] ise a öncülünü b'den daha güvenilir kılar. Saldıran argüman daha zayıfsa sonuca ve öncüle yapılan saldırılar başarısız olur. Başarılı olan saldırı, saldırdığı argümanı yener. Kurala saldırılar ve tek yönlü bir karşıtlık üzerinden yapılan saldırılar ise tercihlerden etkilenmez.",
      ),
      exercises: [
        {
          id: "preferences-1",
          kind: "build",
          task: tx(
            "Back to the bird and the penguin. Add a single preference so that -{flies} is justified. Do not add anything else.",
            "Kuş ve penguen örneğine geri dönelim. Tek bir tercih ekleyerek -{flies} iddiasını gerekçelendirin. Başka bir şey eklemeyin.",
          ),
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]",
          hint: tx("Which rule should be the stronger one, r1 or r2?", "Hangi kural daha güçlü olmalı: r1 mi, r2 mi?"),
          solution: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]\n[<prefer_rule>: r2 > r1]",
          wrong: ["[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]\n[<prefer_rule>: r1 > r2]"],
          check(ctx) {
            const c = "-" + w("flies", ctx.lang);
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const add = added(ctx);
            if (add.count !== 1 || add.count !== add.rulePrefs.length + add.premisePrefs.length)
              return { ok: false, msg: tx("Add exactly one preference and nothing else.", "Yalnızca bir tercih ekleyin, başka bir şey eklemeyin.") };
            const msg = join([...lines(ctx.r), ...failures(ctx.r), claimLine(ctx.r, c)]);
            return { ok: statusOf(ctx.r, c) === "JUSTIFIED", msg };
          },
        },
        {
          id: "preferences-2",
          kind: "build",
          task: tx(
            "Two sources disagree about whether the shop is open. Add a premise preference so that {open} is justified.",
            "Dükkanın açık olup olmadığı konusunda iki kaynak farklı şey söylüyor. Bir öncül tercihi ekleyerek {open} iddiasını gerekçelendirin.",
          ),
          given: "[<premise>: {open}]\n[<premise>: -{open}]",
          hint: tx("A premise preference is written [prefer_premise: more reliable > less reliable].", "Öncül tercihi [öncül_tercihi: daha güvenilir > daha az güvenilir] biçiminde yazılır."),
          solution: "[<premise>: {open}]\n[<premise>: -{open}]\n[<prefer_premise>: {open} > -{open}]",
          wrong: ["[<premise>: {open}]\n[<premise>: -{open}]\n[<prefer_premise>: -{open} > {open}]"],
          check(ctx) {
            const c = w("open", ctx.lang);
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const add = added(ctx);
            if (add.count !== 1 || add.premisePrefs.length !== 1)
              return { ok: false, msg: tx("Add exactly one premise preference and nothing else.", "Yalnızca bir öncül tercihi ekleyin, başka bir şey eklemeyin.") };
            return { ok: statusOf(ctx.r, c) === "JUSTIFIED", msg: join([...lines(ctx.r), ...failures(ctx.r), claimLine(ctx.r, c)]) };
          },
        },
        {
          id: "preferences-3",
          kind: "predict",
          task: tx(
            "In this theory r1 is preferred to r2, while r2 undercuts r1. What is the status of {flies}?",
            "Bu kuramda r1, r2'ye tercih ediliyor. Öte yandan r2, r1 kuralına saldırıyor. {flies} iddiasının durumu nedir?",
          ),
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -r1]\n[<prefer_rule>: r1 > r2]",
          choices: ["OVERRULED", "JUSTIFIED", "UNDECIDED"],
          hint: tx("Do preferences affect undercuts?", "Tercihler kurala saldırıları etkiler mi?"),
          answer: (ctx) => statusOf(ctx.r, w("flies", ctx.lang)),
          explain(ctx) {
            return join([
              ...lines(ctx.r),
              tx(
                `Undercuts are not affected by preferences. The rule r2 does not compete with r1 on strength, it only says that r1 does not apply here. The argument for ${q(w("flies", "en"))} is therefore defeated and the claim stays overruled.`,
                `Kurala saldırı tercihlerden etkilenmez. r2 kuralı r1 ile güç yarışına girmez, yalnızca r1'in burada geçerli olmadığını söyler. Bu yüzden ${q(w("flies", "tr"))} için kurulan argüman yenilir ve iddia reddedilmiş kalır.`,
              ),
            ]);
          },
        },
      ],
    },
    {
      id: "conflicts",
      title: tx("Contraries and contradictories", "Karşıtlar ve çelişikler"),
      intro: tx(
        "Negation is not the only kind of conflict. Writing [contradictory: a ^ b] declares that a and b exclude each other, so arguments for them attack each other, just like x and -x. [contrary: a ^ b] works in one direction only: a attacks b, but b does not attack a. Attacks through a contrary are not affected by preferences. A declared conflict only creates an attack where the attacked argument has an attackable point: a premise, or a conclusion reached by a defeasible rule.",
        "Çatışmanın tek biçimi olumsuzlama değildir. [çelişik: a ^ b] yazdığınızda a ile b birbirini dışlar. Bu ifadeler için kurulan argümanlar, tıpkı x ile -x gibi, birbirine saldırır. [karşıt: a ^ b] ise tek yönlüdür: a, b'ye saldırır ama b, a'ya saldırmaz. Karşıtlık üzerinden yapılan saldırılar tercihlerden etkilenmez. Bir çatışma bildirmek, bu ifadelere varan her argüman arasında kendiliğinden saldırı oluşturmaz. Saldırılan argümanda saldırıya açık bir nokta bulunmalıdır: bir öncül ya da feshedilebilir bir kuralla varılan bir sonuç.",
      ),
      exercises: [
        {
          id: "conflicts-1",
          kind: "build",
          task: tx(
            "A defendant cannot be both guilty and innocent at the same time. Declare that {guilty} and {innocent} exclude each other, so that each attacks the other.",
            "Bir sanık aynı anda hem suçlu hem masum olamaz. {guilty} ile {innocent} ifadelerinin birbirini dışladığını bildirin. Böylece her biri diğerine saldırsın.",
          ),
          given: "[<premise>: {guilty}]\n[<premise>: {innocent}]",
          hint: tx("Two statements that exclude each other are contradictory: [contradictory: a ^ b].", "Birbirini dışlayan iki ifade çelişiktir: [çelişik: a ^ b]."),
          solution: "[<premise>: {guilty}]\n[<premise>: {innocent}]\n[<contradictory>: {guilty} ^ {innocent}]",
          wrong: ["[<premise>: {guilty}]\n[<premise>: {innocent}]\n[<contrary>: {guilty} ^ {innocent}]"],
          check(ctx) {
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const g = w("guilty", ctx.lang),
              i = w("innocent", ctx.lang);
            const cs = ctx.decls.contraries || [];
            const pair = (x) => [x.source, x.target].includes(g) && [x.source, x.target].includes(i);
            const sym = cs.some((x) => x.symmetric && pair(x));
            const oneWays = cs.filter((x) => !x.symmetric && pair(x));
            const bothWays = sym || (oneWays.some((x) => x.source === g) && oneWays.some((x) => x.source === i));
            if (!cs.some(pair))
              return { ok: false, msg: tx(`Declare a conflict between ${q(g)} and ${q(i)}.`, `${q(g)} ile ${q(i)} arasında bir çatışma bildirin.`) };
            if (!bothWays)
              return {
                ok: false,
                msg: join([
                  ...lines(ctx.r),
                  tx("The conflict you declared runs in one direction only, which makes it a contrary. Here the two statements should exclude each other.", "Bildirdiğiniz çatışma yalnızca tek yönde işliyor, bu da onu bir karşıtlık yapar. Burada iki ifadenin birbirini dışlaması gerekiyor."),
                ]),
              };
            return {
              ok: true,
              msg: join([
                ...lines(ctx.r),
                sym ? tx("", "") : tx("Two contraries in opposite directions work like one contradictory declaration.", "Karşıt yönlerde iki karşıtlık, tek bir çelişik bildirimi gibi işler."),
                claimLine(ctx.r, g),
                claimLine(ctx.r, i),
              ]),
            };
          },
        },
        {
          id: "conflicts-2",
          kind: "build",
          task: tx(
            "A witness says the suspect was somewhere else at the time. Declare a one-way conflict: {alibi} should attack {guilty}, but {guilty} should not attack the alibi. In the end {guilty} should be overruled.",
            "Bir tanık, şüphelinin olay sırasında başka bir yerde olduğunu söylüyor. Tek yönlü bir çatışma bildirin: {alibi} öncülü {guilty} iddiasına saldırsın, ama {guilty} iddiası tanık ifadesine saldırmasın. Sonunda {guilty} reddedilmiş olmalı.",
          ),
          given: "[<premise>: {alibi}]\n[<premise>: {seen}]\n[<defeasible> r1: {seen} => {guilty}]",
          hint: tx("A one-way conflict is a contrary: [contrary: attacker ^ attacked].", "Tek yönlü çatışma bir karşıtlıktır: [karşıt: saldıran ^ saldırılan]."),
          solution: "[<premise>: {alibi}]\n[<premise>: {seen}]\n[<defeasible> r1: {seen} => {guilty}]\n[<contrary>: {alibi} ^ {guilty}]",
          wrong: [
            "[<premise>: {alibi}]\n[<premise>: {seen}]\n[<defeasible> r1: {seen} => {guilty}]\n[<contradictory>: {alibi} ^ {guilty}]",
            "[<premise>: {alibi}]\n[<premise>: {seen}]\n[<defeasible> r1: {seen} => {guilty}]\n[<contrary>: {guilty} ^ {alibi}]",
          ],
          check(ctx) {
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const g = w("guilty", ctx.lang),
              al = w("alibi", ctx.lang);
            const r = ctx.r;
            const cs = ctx.decls.contraries || [];
            const forward = cs.find((x) => !x.symmetric && x.source === al && x.target === g);
            const backward = cs.find((x) => (x.symmetric && [x.source, x.target].includes(al) && [x.source, x.target].includes(g)) || (x.source === g && x.target === al));
            const base = [...lines(r), claimLine(r, g)];
            if (backward)
              return {
                ok: false,
                msg: join([
                  ...base,
                  tx(`Your declaration also lets ${q(g)} attack ${q(al)}, so the conflict runs both ways. Make it one-way.`, `Bildiriminiz ${q(g)} iddiasının da ${q(al)} öncülüne saldırmasına izin veriyor, yani çatışma iki yönlü. Onu tek yönlü yapın.`),
                ]),
              };
            if (!forward)
              return { ok: false, msg: join([...base, tx(`Declare a one-way conflict from ${q(al)} to ${q(g)}: [contrary: … ^ …].`, `${q(al)} ifadesinden ${q(g)} ifadesine tek yönlü bir çatışma bildirin: [karşıt: … ^ …].`)]) };
            const viaContrary = r.attacks.some((a) => a.succeeds && r.arguments[a.attacker].conclusion === al && r.arguments[a.target].conclusion === g);
            if (!viaContrary)
              return { ok: false, msg: join([...base, tx(`The declared conflict produces no successful attack from ${q(al)} on ${q(g)}.`, `Bildirilen çatışma, ${q(al)} ifadesinden ${q(g)} iddiasına başarılı bir saldırı oluşturmuyor.`)]) };
            return { ok: statusOf(r, g) === "OVERRULED", msg: join([...base, claimReason(r, g)]) };
          },
        },
        {
          id: "conflicts-3",
          kind: "predict",
          task: tx(
            "Now the evidence that the suspect was seen at the scene is preferred to the alibi. What is the status of {guilty} now?",
            "Şimdi şüphelinin olay yerinde görüldüğüne dair kanıt, tanık ifadesine tercih ediliyor. {guilty} iddiasının durumu şimdi nedir?",
          ),
          given: "[<premise>: {alibi}]\n[<premise>: {seen}]\n[<defeasible> r1: {seen} => {guilty}]\n[<contrary>: {alibi} ^ {guilty}]\n[<prefer_premise>: {seen} > {alibi}]",
          choices: ["OVERRULED", "JUSTIFIED", "UNDECIDED"],
          hint: tx("Do preferences affect attacks through a contrary?", "Tercihler, karşıtlık üzerinden yapılan saldırıları etkiler mi?"),
          answer: (ctx) => statusOf(ctx.r, w("guilty", ctx.lang)),
          explain(ctx) {
            return join([
              ...lines(ctx.r),
              tx(
                `An attack through a contrary is not affected by preferences. The priority given to the evidence changes nothing, and ${q(w("guilty", "en"))} stays overruled.`,
                `Karşıtlık üzerinden yapılan saldırı tercihlerden etkilenmez. Kanıta verilen öncelik bu yüzden hiçbir şeyi değiştirmez ve ${q(w("guilty", "tr"))} reddedilmiş kalır.`,
              ),
            ]);
          },
        },
      ],
    },
    {
      id: "semantics",
      title: tx("Semantics", "Semantikler"),
      intro: tx(
        "A semantics decides which sets of arguments can be accepted together. These sets are called extensions. Grounded semantics is cautious and always gives exactly one extension. Preferred semantics selects sets that contain no conflict, defend their members, and cannot be extended with further arguments while keeping these properties. There may be several. Stable semantics asks for a conflict-free set that defeats every argument outside it, and sometimes no such set exists. When there is at least one extension, a claim is justified if every extension contains an argument for it, defensible if only some do, and overruled if in every extension every argument for it is defeated. When there is no extension at all, claims get no status.",
        "Semantik, hangi argüman kümelerinin birlikte kabul edilebileceğini belirler. Bu kümelere kapsam denir. Temelli semantik temkinlidir ve her zaman tek bir kapsam verir. Tercih edilen semantik, kendi içinde çatışma içermeyen, üyelerini savunan ve bu özellikler korunarak daha fazla argüman eklenemeyen kümeleri seçer. Bu yüzden birden fazla kapsam çıkabilir. Kararlı semantik ise çatışmasız olan ve dışında kalan her argümanı yenen bir küme ister. Bazen böyle bir küme hiç bulunmaz. En az bir kapsam varsa, her kapsam iddia için bir argüman içerdiğinde iddia gerekçelendirilmiştir. Yalnızca bazı kapsamlar içeriyorsa savunulabilirdir. Her kapsamda iddia için kurulan her argüman yeniliyorsa reddedilmiştir. Hiç kapsam yoksa iddiaların durumu belirlenmez.",
      ),
      exercises: [
        {
          id: "semantics-1",
          kind: "predict",
          task: tx(
            "Back to the bird and the penguin, without preferences. This time we use preferred semantics. What is the status of {flies}?",
            "Tercihsiz kuş ve penguen örneğine geri dönelim. Bu kez tercih edilen semantiği kullanıyoruz. {flies} iddiasının durumu ne olur?",
          ),
          settings: { semantics: "preferred" },
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]",
          choices: ["JUSTIFIED", "DEFENSIBLE", "UNDECIDED"],
          hint: tx("In how many ways can the conflict be resolved?", "Bu çatışma kaç farklı şekilde çözülebilir?"),
          answer: (ctx) => statusOf(ctx.r, w("flies", ctx.lang)),
          explain(ctx) {
            const n = ctx.r.extensions.length;
            return tx(
              `This theory has ${n} preferred extensions. One accepts the argument for ${q(w("flies", "en"))}, the other the argument against it. A claim accepted in some extensions but not in all of them is defensible. Grounded semantics does not take sides, so it leaves the same claim undecided.`,
              `Bu kuramın ${n} tercih edilen kapsamı var. Birinde ${q(w("flies", "tr"))} için kurulan argüman, ötekinde ona karşı olan argüman kabul ediliyor. Kapsamların yalnızca bazılarında kabul edilen bir iddia savunulabilirdir. Temelli semantik ise taraf tutmadığı için aynı iddiayı kararsız bırakır.`,
            );
          },
        },
        {
          id: "semantics-2",
          kind: "predict",
          task: tx(
            "This theory contains a conflict about “p”. Whichever way it is resolved, a rule leads to “q”: r3 from “p”, or r4 from “-p”. Under preferred semantics, what is the status of “q”?",
            "Bu kuramda “p” konusunda bir çatışma var. Çatışma hangi yönde çözülürse çözülsün, “q” iddiasına giden bir kural bulunuyor: “p” varsa r3, “-p” varsa r4. Tercih edilen semantiğe göre “q” iddiasının durumu ne olur?",
          ),
          settings: { semantics: "preferred" },
          given: "[<premise>: a]\n[<premise>: b]\n[<defeasible> r1: a => p]\n[<defeasible> r2: b => -p]\n[<defeasible> r3: p => q]\n[<defeasible> r4: -p => q]",
          choices: ["JUSTIFIED", "DEFENSIBLE", "UNDECIDED"],
          hint: tx("Look at the extensions one at a time. Does each of them contain some argument for “q”?", "Kapsamlara tek tek bakın. Her kapsamda “q” için bir argüman var mı?"),
          answer: (ctx) => statusOf(ctx.r, "q"),
          explain() {
            return tx(
              "Each of the two preferred extensions contains an argument for “q”, but not the same one. One goes through “p”, the other through “-p”. That is why “q” is justified even though “p” itself is only defensible. Such a claim is called a floating conclusion. Under grounded semantics “q” would stay undecided.",
              "İki tercih edilen kapsamın her birinde “q” için bir argüman var, ama aynı argüman değil. Biri “p” üzerinden, öteki “-p” üzerinden ilerliyor. Bu yüzden “p” yalnızca savunulabilir olsa da “q” gerekçelendirilmiştir. Literatürde böyle iddialara “floating conclusion” (yüzen sonuç) denir. Temelli semantikte “q” kararsız kalırdı.",
            );
          },
        },
      ],
    },
    {
      id: "cycles",
      title: tx("Odd and even cycles", "Tek ve çift döngüler"),
      intro: tx(
        "Every stable extension is also a preferred extension, but a stable extension must do more: it must defeat every argument outside it. The two semantics therefore differ only when a preferred extension leaves an argument outside that it does not defeat. In a finite framework that can only happen when the successful attacks form a cycle of odd length. An even cycle on its own can be split: take every other argument and you defeat all the rest. An odd cycle cannot be split this way, so one argument is always left over. This is also why the two usually agree: most conflicts are two-way, which makes cycles of length two, and a preference often turns a two-way attack into a one-way defeat, which removes that cycle. Undercuts and one-way contraries, however, can still form odd cycles.",
        "Her kararlı kapsam aynı zamanda tercih edilen bir kapsamdır, ama kararlı kapsamdan daha fazlası beklenir: dışında kalan her argümanı yenmelidir. Bu yüzden iki semantik ancak tercih edilen bir kapsam, dışında bıraktığı bir argümanı yenmediğinde birbirinden ayrılır. Sonlu bir çerçevede bu yalnızca başarılı saldırılar tek uzunlukta bir döngü oluşturduğunda olabilir. Tek başına duran çift uzunluktaki bir döngü ikiye bölünebilir: argümanları birer atlayarak seçerseniz geri kalanların hepsini yenersiniz. Tek uzunluktaki bir döngü böyle bölünemez, bu yüzden her zaman bir argüman açıkta kalır. İki semantiğin çoğu zaman aynı sonucu vermesinin nedeni de budur. Çatışmaların çoğu iki yönlüdür ve uzunluğu iki olan döngüler oluşturur. Bir tercih de çoğu zaman iki yönlü bir saldırıyı tek yönlü bir başarılı saldırıya çevirerek o döngüyü ortadan kaldırır. Kurala saldırılar ve tek yönlü karşıtlıklar ise yine de tek uzunlukta döngüler oluşturabilir.",
      ),
      exercises: [
        {
          id: "cycles-1",
          kind: "predict",
          task: tx(
            "The bird and the penguin without preferences: the two arguments about {flies} defeat each other, a cycle of length two. How many stable extensions does this theory have?",
            "Tercihsiz kuş ve penguen örneği: {flies} hakkındaki iki argüman birbirini yeniyor. Bu, uzunluğu iki olan bir döngüdür. Bu kuramın kaç kararlı kapsamı var?",
          ),
          settings: { semantics: "stable" },
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]",
          choices: COUNT_CHOICES,
          hint: tx("Can you pick one side of the conflict so that it defeats the other?", "Çatışmanın bir tarafını, diğer tarafı yenecek şekilde seçebilir misiniz?"),
          answer: (ctx) => countAnswer(ctx.r),
          explain(ctx) {
            return tx(
              `The engine finds ${familyText(ctx.r, "en")}. Each stable extension takes one side of the even cycle and defeats the other, so nothing outside is left undefeated. Preferred semantics gives exactly the same two extensions.`,
              `Motor şu kapsamları buluyor: ${familyText(ctx.r, "tr")}. Her kararlı kapsam çift döngünün bir tarafını alıyor ve diğerini yeniyor, bu yüzden dışarıda yenilmemiş bir argüman kalmıyor. Tercih edilen semantik de tam olarak aynı iki kapsamı verir.`,
            );
          },
        },
        {
          id: "cycles-2",
          kind: "predict",
          task: tx(
            "Three premises in a one-way circle: “a” attacks “b”, “b” attacks “c”, and “c” attacks “a”. What does preferred semantics give?",
            "Tek yönlü bir daire oluşturan üç öncül: “a” “b”ye, “b” “c”ye, “c” de “a”ya saldırıyor. Tercih edilen semantik ne verir?",
          ),
          settings: { semantics: "preferred" },
          given: "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<contrary>: a ^ b]\n[<contrary>: b ^ c]\n[<contrary>: c ^ a]",
          choices: [
            { value: "empty", label: tx("one extension, the empty set", "tek kapsam, boş küme") },
            { value: "singletons", label: tx("three extensions: {a}, {b} and {c}", "üç kapsam: {a}, {b} ve {c}") },
            { value: "none", label: tx("no extension", "hiç kapsam yok") },
          ],
          hint: tx("Take {a} alone. Something defeats “a”. Can {a} defend it?", "Yalnızca {a} kümesini alın. “a” argümanını bir şey yeniyor. {a} onu savunabilir mi?"),
          answer: (ctx) => (!ctx.r.extensions.length ? "none" : ctx.r.extensions.length === 1 && family(ctx.r)[0] === "{}" ? "empty" : "singletons"),
          explain(ctx) {
            return tx(
              `The engine finds ${familyText(ctx.r, "en")}. No argument can be accepted on its own: “c” defeats “a”, and only “b” could defeat “c”, but “a” and “b” cannot be accepted together because “a” defeats “b”. The same holds for “b” and for “c”. So the only set that is conflict-free and defends its members is the empty set, and that is the preferred extension.`,
              `Motor şunu buluyor: ${familyText(ctx.r, "tr")}. Hiçbir argüman tek başına kabul edilemez: “c”, “a”yı yeniyor ve “c”yi ancak “b” yenebilir, ama “a” ile “b” birlikte kabul edilemez, çünkü “a” “b”yi yeniyor. Aynısı “b” ve “c” için de geçerli. Bu yüzden çatışmasız olan ve üyelerini savunan tek küme boş kümedir ve tercih edilen kapsam odur.`,
            );
          },
        },
        {
          id: "semantics-3",
          kind: "build",
          task: tx(
            "Write a theory for which stable semantics produces no extension at all. Use three premises called “a”, “b” and “c”, and let the one-way conflicts between them form a circle.",
            "Kararlı semantiğin hiç kapsam üretemediği bir kuram yazın. “a”, “b” ve “c” adında üç öncül kullanın ve aralarındaki tek yönlü çatışmalar bir daire oluştursun.",
          ),
          settings: { semantics: "stable" },
          given: "",
          hint: tx("Let “a” attack “b”, “b” attack “c”, and “c” attack “a”. Three contraries are enough.", "“a” “b”ye, “b” “c”ye, “c” de “a”ya saldırsın. Bunun için üç karşıtlık yazmanız yeterli."),
          solution: "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<contrary>: a ^ b]\n[<contrary>: b ^ c]\n[<contrary>: c ^ a]",
          wrong: ["[<premise>: a]\n[<premise>: b]\n[<contrary>: a ^ b]\n[<contrary>: b ^ a]", "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<contrary>: a ^ b]\n[<contrary>: b ^ c]"],
          check(ctx) {
            const three = ["a", "b", "c"];
            const facts = ctx.decls.facts || [];
            const prem = facts.filter((f) => f.kind === "premise").map((f) => f.literal);
            if (!hasAll(prem, three))
              return { ok: false, msg: tx("Use the three premises “a”, “b” and “c”.", "“a”, “b” ve “c” adındaki üç öncülü kullanın.") };
            const extra = facts.length !== 3 || (ctx.decls.rules || []).length || (ctx.decls.rulePrefs || []).length || (ctx.decls.premisePrefs || []).length || (ctx.decls.contraries || []).length !== 3;
            if (extra)
              return {
                ok: false,
                msg: tx(
                  "Write only the three premises and the three one-way conflicts of the circle, so that the result depends on the cycle alone.",
                  "Sonuç yalnızca döngüye bağlı olsun diye yalnızca üç öncülü ve dairenin üç tek yönlü çatışmasını yazın.",
                ),
              };
            if (!cycleOf(ctx, three))
              return {
                ok: false,
                msg: tx(
                  "The one-way conflicts between “a”, “b” and “c” should form a circle, for example “a” attacks “b”, “b” attacks “c” and “c” attacks “a”.",
                  "“a”, “b” ve “c” arasındaki tek yönlü çatışmalar bir daire oluşturmalı. Örneğin “a” “b”ye, “b” “c”ye, “c” de “a”ya saldırsın.",
                ),
              };
            const n = ctx.r.extensions.length;
            if (n === 0)
              return {
                ok: true,
                msg: tx(
                  "The three successful attacks form a cycle of odd length. A stable extension must be conflict-free and must attack every argument outside it. In an odd cycle no conflict-free set can do that, so stable semantics has no extension. (The set of all arguments does attack everything outside it, trivially, but it is not conflict-free.)",
                  "Üç başarılı saldırı tek uzunlukta bir döngü oluşturuyor. Kararlı bir kapsam hem çatışmasız olmalı hem de dışında kalan her argümana saldırmalıdır. Tek uzunluktaki bir döngüde hiçbir çatışmasız küme bunu yapamaz, bu yüzden kararlı semantiğin kapsamı yok. (Bütün argümanlardan oluşan küme dışındaki her şeye saldırır, çünkü dışında hiçbir şey kalmaz, ama çatışmasız değildir.)",
                ),
              };
            return { ok: false, msg: tx(`Stable semantics gives ${familyText(ctx.r, "en")}.`, `Kararlı semantik şunu veriyor: ${familyText(ctx.r, "tr")}.`) };
          },
        },
        {
          id: "cycles-3",
          kind: "build",
          task: tx(
            "Now make the cycle even. Using the four premises below, add one-way conflicts that run around a circle through all four, so that stable semantics has two extensions.",
            "Şimdi döngüyü çift yapın. Aşağıdaki dört öncülü kullanarak dördünün hepsinden geçen ve bir daire oluşturan tek yönlü çatışmalar ekleyin. Böylece kararlı semantiğin iki kapsamı olsun.",
          ),
          settings: { semantics: "stable" },
          given: "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<premise>: d]",
          hint: tx("Four contraries: “a” attacks “b”, “b” attacks “c”, “c” attacks “d”, and “d” attacks “a”.", "Dört karşıtlık: “a” “b”ye, “b” “c”ye, “c” “d”ye, “d” de “a”ya saldırsın."),
          solution: "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<premise>: d]\n[<contrary>: a ^ b]\n[<contrary>: b ^ c]\n[<contrary>: c ^ d]\n[<contrary>: d ^ a]",
          wrong: [
            "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<premise>: d]\n[<contrary>: a ^ b]\n[<contrary>: b ^ c]\n[<contrary>: c ^ a]",
            "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<premise>: d]\n[<contradictory>: a ^ b]\n[<contradictory>: c ^ d]",
          ],
          alternatives: [{ src: "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<premise>: d]\n[<contrary>: a ^ c]\n[<contrary>: c ^ b]\n[<contrary>: b ^ d]\n[<contrary>: d ^ a]" }],
          check(ctx) {
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const four = ["a", "b", "c", "d"];
            const add = added(ctx);
            const conflicts = add.contraries;
            if (add.count !== conflicts.length || conflicts.length !== 4 || conflicts.some((x) => x.symmetric))
              return {
                ok: false,
                msg: tx(
                  `Add exactly four one-way conflicts and nothing else. You added ${add.count} declaration(s), ${conflicts.filter((x) => !x.symmetric).length} of them one-way conflicts.`,
                  `Tam olarak dört tek yönlü çatışma ekleyin, başka bir şey eklemeyin. Siz ${add.count} bildirim eklediniz ve bunların ${conflicts.filter((x) => !x.symmetric).length} tanesi tek yönlü çatışma.`,
                ),
              };
            if (!cycleOf(ctx, four))
              return {
                ok: false,
                msg: tx(
                  "The four one-way conflicts should form a single circle through all four premises.",
                  "Dört tek yönlü çatışma, dört öncülün hepsinden geçen tek bir daire oluşturmalı.",
                ),
              };
            const n = ctx.r.extensions.length;
            if (n !== 2) return { ok: false, msg: tx(`Stable semantics gives ${familyText(ctx.r, "en")}.`, `Kararlı semantik şunu veriyor: ${familyText(ctx.r, "tr")}.`) };
            return {
              ok: true,
              msg: tx(
                `Stable semantics now gives ${familyText(ctx.r, "en")}. In a cycle of four, taking every other argument defeats the remaining two, and there are two ways to do that.`,
                `Kararlı semantik şimdi şunları veriyor: ${familyText(ctx.r, "tr")}. Dört argümanlı bir döngüde argümanları birer atlayarak seçmek geri kalan ikisini yener ve bunu yapmanın iki yolu vardır.`,
              ),
            };
          },
        },
        {
          id: "cycles-4",
          kind: "build",
          task: tx(
            "The odd cycle again, with no stable extension. Without deleting anything, add one new premise and one one-way conflict from it into the cycle, so that stable semantics has an extension again.",
            "Yine kararlı kapsamı olmayan tek döngü. Hiçbir şeyi silmeden yeni bir öncül ve bu öncülden döngüye giden tek yönlü bir çatışma ekleyin. Böylece kararlı semantiğin yeniden bir kapsamı olsun.",
          ),
          settings: { semantics: "stable" },
          given: "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<contrary>: a ^ b]\n[<contrary>: b ^ c]\n[<contrary>: c ^ a]",
          hint: tx("A new, undefeated argument that defeats one member of the cycle breaks it open.", "Döngünün bir üyesini yenen, yenilmemiş yeni bir argüman döngüyü kırar."),
          solution: "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<contrary>: a ^ b]\n[<contrary>: b ^ c]\n[<contrary>: c ^ a]\n[<premise>: d]\n[<contrary>: d ^ a]",
          wrong: [
            "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<contrary>: a ^ b]\n[<contrary>: b ^ c]\n[<contrary>: c ^ a]\n[<premise>: d]",
            "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<contrary>: a ^ b]\n[<contrary>: b ^ c]\n[<contrary>: c ^ a]\n[<premise>: d]\n[<contrary>: a ^ d]",
          ],
          check(ctx) {
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const three = ["a", "b", "c"];
            const add = added(ctx);
            const fresh = add.facts.filter((f) => f.kind === "premise" && !three.includes(f.literal));
            if (add.count !== 2 || fresh.length !== 1 || add.contraries.length !== 1)
              return {
                ok: false,
                msg: tx(
                  "Add exactly two declarations: one new premise and one one-way conflict from it into the cycle.",
                  "Tam olarak iki bildirim ekleyin: yeni bir öncül ve bu öncülden döngüye giden tek yönlü bir çatışma.",
                ),
              };
            const nu = fresh[0].literal,
              link = add.contraries[0];
            if (link.symmetric || link.source !== nu || !three.includes(link.target))
              return { ok: false, msg: tx(`The conflict should run one way, from ${q(nu)} to one of “a”, “b” or “c”.`, `Çatışma tek yönlü olmalı ve ${q(nu)} öncülünden “a”, “b” ya da “c”den birine gitmeli.`) };
            const r = ctx.r;
            const mine = r.arguments.findIndex((a) => a.kind === "premise" && a.conclusion === nu);
            const hit = r.attacks.find((a) => a.succeeds && a.attacker === mine && three.includes(r.arguments[a.target].conclusion));
            if (!hit || !r.extensions.length)
              return { ok: false, msg: tx(`Stable semantics still gives ${familyText(r, "en")}.`, `Kararlı semantik hâlâ şunu veriyor: ${familyText(r, "tr")}.`) };
            const undefeated = !r.attackers[mine].length;
            let pref = null;
            try {
              pref = AF.evaluate(ctx.source, Object.assign({}, SETTINGS, { semantics: "preferred" }));
            } catch (e) {}
            const same = pref && sameFamily(r, pref);
            return {
              ok: true,
              msg: join([
                tx(`Stable semantics now gives ${familyText(r, "en")}.`, `Kararlı semantik şimdi şunu veriyor: ${familyText(r, "tr")}.`),
                undefeated
                  ? tx(`Nothing defeats ${q(nu)}, and it defeats ${q(r.arguments[hit.target].conclusion)}, so the cycle is broken from outside and the remaining arguments can be split.`, `${q(nu)} öncülünü hiçbir şey yenmiyor ve o ${q(r.arguments[hit.target].conclusion)} öncülünü yeniyor. Böylece döngü dışarıdan kırılıyor ve geri kalan argümanlar bölünebiliyor.`)
                  : tx("", ""),
                same
                  ? tx("Preferred semantics gives the same result.", "Tercih edilen semantik de aynı sonucu veriyor.")
                  : pref
                    ? tx(`Preferred semantics gives ${familyText(pref, "en")}.`, `Tercih edilen semantik ise şunu veriyor: ${familyText(pref, "tr")}.`)
                    : tx("", ""),
              ]),
            };
          },
        },
        {
          id: "cycles-5",
          kind: "predict",
          task: tx(
            "“a” and “b” attack each other, “c” attacks “a”, and “c” also attacks itself (a cycle of length one). Preferred semantics gives one extension, {b}. How many stable extensions are there?",
            "“a” ile “b” birbirine saldırıyor, “c” “a”ya saldırıyor ve “c” kendisine de saldırıyor (uzunluğu bir olan bir döngü). Tercih edilen semantik tek bir kapsam veriyor: {b}. Kaç kararlı kapsam var?",
          ),
          settings: { semantics: "stable" },
          given: "[<premise>: a]\n[<premise>: b]\n[<premise>: c]\n[<contrary>: a ^ b]\n[<contrary>: b ^ a]\n[<contrary>: c ^ a]\n[<contrary>: c ^ c]",
          choices: COUNT_CHOICES,
          hint: tx("A stable extension must defeat “c” unless it contains it. What defeats “c”?", "Kararlı bir kapsam, “c”yi içermiyorsa onu yenmelidir. “c”yi ne yeniyor?"),
          answer: (ctx) => countAnswer(ctx.r),
          explain(ctx) {
            return tx(
              `The engine finds ${familyText(ctx.r, "en")}. Only “c” itself defeats “c”, so a conflict-free set can neither contain “c” nor defeat it. {b} is the preferred extension, but it leaves “c” outside without defeating it, so it is not stable.`,
              `Motor şunu buluyor: ${familyText(ctx.r, "tr")}. “c”yi yalnızca kendisi yeniyor. Bu yüzden çatışmasız bir küme “c”yi ne içerebilir ne de yenebilir. {b} tercih edilen kapsamdır, ama “c”yi yenmeden dışarıda bıraktığı için kararlı değildir.`,
            );
          },
        },
      ],
    },
    {
      id: "orderings",
      title: tx("Last link and weakest link", "Son halka ve en zayıf halka"),
      intro: tx(
        "When the outcome of an attack depends on preferences, the two arguments have to be compared. Last link compares their last defeasible rules. Usually that is the rule used in the final step. If the final step is a strict rule, the last defeasible rules are those found just below it, and there can be several. If neither argument uses a defeasible rule, their ordinary premises are compared instead. Weakest link looks at all of an argument's defeasible rules, and at its premises too when it has any. In this view an argument is only as strong as its weakest step.",
        "Bir saldırının sonucu tercihlere bağlıysa iki argümanın karşılaştırılması gerekir. Son halka, iki argümanın son feshedilebilir kurallarını karşılaştırır. Bu çoğu zaman son adımda kullanılan kuraldır. Son adım katı bir kuralsa, onun hemen altındaki son feshedilebilir kurallar dikkate alınır ve bunlar birden fazla olabilir. İki argüman da feshedilebilir kural kullanmıyorsa bunun yerine sıradan öncülleri karşılaştırılır. En zayıf halka ise argümanın bütün feshedilebilir kurallarına bakar, öncülü olan argümanlarda öncüllere de. Bu yaklaşıma göre bir argüman en zayıf adımı kadar güçlüdür.",
      ),
      exercises: [
        {
          id: "orderings-1",
          kind: "predict",
          task: tx(
            "“p” is reached in two steps, first with low and then with high. “-p” is reached in a single step, with mid. The rule high is stronger than mid, and mid is stronger than low. Under last link, which claim is justified?",
            "“p” iki adımda elde ediliyor: önce low, sonra high kuralıyla. “-p” ise tek adımda, mid kuralıyla elde ediliyor. high kuralı mid'den, mid kuralı da low'dan güçlü. Son halkaya göre hangi iddia gerekçelendirilmiştir?",
          ),
          given: "[<axiom>: a]\n[<defeasible> low: a => b]\n[<defeasible> high: b => p]\n[<defeasible> mid: a => -p]\n[<prefer_rule>: high > mid]\n[<prefer_rule>: mid > low]",
          choices: PCHOICES,
          hint: tx("Under last link, which rules are compared?", "Son halkada hangi kurallar karşılaştırılır?"),
          answer: (ctx) => pick(ctx.r),
          explain(ctx) {
            return join([
              ...lines(ctx.r),
              ...failures(ctx.r),
              tx(
                "The last step of the argument for “p” is high, and the last step of the argument for “-p” is mid. Since high is stronger, “p” wins.",
                "“p” için kurulan argümanın son adımı high, “-p” için kurulanınki ise mid. high daha güçlü olduğu için “p” kazanır.",
              ),
            ]);
          },
        },
        {
          id: "orderings-2",
          kind: "predict",
          task: tx("Now the same theory is evaluated with weakest link. Which claim is justified this time?", "Aynı kuramı bu kez en zayıf halkayla değerlendiriyoruz. Şimdi hangi iddia gerekçelendirilmiştir?"),
          settings: { ordering: "weakest_link" },
          given: "[<axiom>: a]\n[<defeasible> low: a => b]\n[<defeasible> high: b => p]\n[<defeasible> mid: a => -p]\n[<prefer_rule>: high > mid]\n[<prefer_rule>: mid > low]",
          choices: PCHOICES,
          hint: tx("Which is the weakest step of the argument for “p”?", "“p” için kurulan argümanın en zayıf adımı hangisi?"),
          answer: (ctx) => pick(ctx.r),
          explain() {
            return tx(
              "Weakest link looks at every step of the argument for “p” and so also sees low. Because mid is stronger than low, the argument for “p” counts as weaker. In the end “-p” is justified.",
              "En zayıf halka, “p” için kurulan argümanın bütün adımlarına bakar ve low kuralını da görür. mid kuralı low'dan güçlü olduğu için “p” argümanı daha zayıf sayılır. Sonuçta “-p” gerekçelendirilir.",
            );
          },
        },
        {
          id: "orderings-3",
          kind: "build",
          task: tx(
            "We still use weakest link. Change just one of the preferences so that “p” is justified. Leave the axiom and the rules as they are.",
            "Yine en zayıf halkayı kullanıyoruz. Tercihlerden yalnızca birini değiştirerek “p” iddiasını gerekçelendirin. Aksiyoma ve kurallara dokunmayın.",
          ),
          settings: { ordering: "weakest_link" },
          given: "[<axiom>: a]\n[<defeasible> low: a => b]\n[<defeasible> high: b => p]\n[<defeasible> mid: a => -p]\n[<prefer_rule>: high > mid]\n[<prefer_rule>: mid > low]",
          hint: tx("“p” loses because of its weakest step. Which preference makes that step weak?", "“p” en zayıf adımı yüzünden kaybediyor. O adımı hangi tercih zayıflatıyor?"),
          solution: "[<axiom>: a]\n[<defeasible> low: a => b]\n[<defeasible> high: b => p]\n[<defeasible> mid: a => -p]\n[<prefer_rule>: high > mid]\n[<prefer_rule>: low > mid]",
          wrong: ["[<axiom>: a]\n[<defeasible> low: a => b]\n[<defeasible> high: b => p]\n[<defeasible> mid: a => -p]\n[<prefer_rule>: mid > high]\n[<prefer_rule>: mid > low]"],
          check(ctx) {
            if (!sameExceptPreferences(ctx))
              return { ok: false, msg: tx("Change only the preferences. The axiom and the rules should stay as they are.", "Yalnızca tercihleri değiştirin. Aksiyom ve kurallar olduğu gibi kalmalı.") };
            const key = (x) => x.stronger + ">" + x.weaker;
            const before = (ctx.givenDecls.rulePrefs || []).map(key),
              after = (ctx.decls.rulePrefs || []).map(key);
            const removed = before.filter((x) => !after.includes(x)).length,
              addedN = after.filter((x) => !before.includes(x)).length;
            if (removed !== 1 || addedN !== 1 || (ctx.decls.premisePrefs || []).length)
              return {
                ok: false,
                msg: tx(
                  `Change exactly one preference: remove one of the given preferences and write one new one. You removed ${removed} and added ${addedN}.`,
                  `Tam olarak bir tercihi değiştirin: verilen tercihlerden birini silip yerine yeni bir tercih yazın. Siz ${removed} tercih silip ${addedN} tercih eklediniz.`,
                ),
              };
            return { ok: statusOf(ctx.r, "p") === "JUSTIFIED", msg: join([...lines(ctx.r), ...failures(ctx.r), claimLine(ctx.r, "p")]) };
          },
        },
      ],
    },
    {
      id: "sets",
      title: tx("Elitist and democratic set ordering", "Elitist ve demokratik küme sıralaması"),
      intro: tx(
        "Weakest link compares sets of rules, and the set ordering decides when one set is weaker than another. There are two options. With the elitist set ordering, a set X is weaker if one of its members is weaker than every member of Y. With the democratic set ordering, every member of X has to be weaker than at least one member of Y. The theories below use axioms, so only the rules are compared.",
        "En zayıf halka kural kümelerini karşılaştırır. Bir kümenin diğerinden ne zaman zayıf sayılacağını küme sıralaması belirler ve iki seçenek vardır. Elitist küme sıralamasında X kümesinin bir üyesi Y'nin bütün üyelerinden zayıfsa X daha zayıftır. Demokratik küme sıralamasında ise X'in her üyesi Y'nin en az bir üyesinden zayıf olmalıdır. Aşağıdaki kuramlarda aksiyom kullanıldığı için yalnızca kurallar karşılaştırılır.",
      ),
      exercises: [
        {
          id: "sets-1",
          kind: "predict",
          task: tx(
            "“p” is reached with the rules r1 and r2, and “-p” with the rule r3. The rule r3 is stronger than r1, and r2 is stronger than r3. Under weakest link with the elitist set ordering, which claim is justified?",
            "“p” iddiası r1 ve r2 kurallarıyla, “-p” iddiası ise r3 kuralıyla elde ediliyor. r3 kuralı r1'den, r2 kuralı da r3'ten güçlü. En zayıf halka ve elitist küme sıralamasına göre hangi iddia gerekçelendirilmiştir?",
          ),
          settings: { ordering: "weakest_link", setOrdering: "elitist" },
          given: "[<axiom>: a]\n[<axiom>: c]\n[<defeasible> r1: a => b]\n[<defeasible> r2: b => p]\n[<defeasible> r3: c => -p]\n[<prefer_rule>: r3 > r1]\n[<prefer_rule>: r2 > r3]",
          choices: PCHOICES,
          hint: tx("Is one of the rules of “p” weaker than every rule of “-p”?", "“p” argümanının kurallarından biri, “-p” argümanının bütün kurallarından zayıf mı?"),
          answer: (ctx) => pick(ctx.r),
          explain() {
            return tx(
              "With the elitist set ordering it is enough that r1 is weaker than r3, the only rule of “-p”. So {r1, r2} counts as weaker than {r3}, and “p” loses. In the end “-p” is justified.",
              "Elitist küme sıralamasında r1'in, “-p” argümanının tek kuralı olan r3'ten zayıf olması yeterlidir. Bu yüzden {r1, r2} kümesi {r3} kümesinden zayıf sayılır ve “p” kaybeder. Sonuçta “-p” gerekçelendirilir.",
            );
          },
        },
        {
          id: "sets-2",
          kind: "predict",
          task: tx("The same theory, this time with the democratic set ordering. Which claim is justified now?", "Aynı kuram, bu kez demokratik küme sıralamasıyla. Şimdi hangi iddia gerekçelendirilmiştir?"),
          settings: { ordering: "weakest_link", setOrdering: "democratic" },
          given: "[<axiom>: a]\n[<axiom>: c]\n[<defeasible> r1: a => b]\n[<defeasible> r2: b => p]\n[<defeasible> r3: c => -p]\n[<prefer_rule>: r3 > r1]\n[<prefer_rule>: r2 > r3]",
          choices: PCHOICES,
          hint: tx("Is every rule of “p” weaker than some rule of “-p”? And what about the other way round?", "“p” argümanının her kuralı, “-p” argümanının bir kuralından zayıf mı? Peki tersi?"),
          answer: (ctx) => pick(ctx.r),
          explain() {
            return tx(
              "With the democratic set ordering, r2 is not weaker than r3, so {r1, r2} does not count as weaker. On the other hand r3 is weaker than r2, so {r3} counts as weaker than {r1, r2}. This time “-p” loses and “p” is justified. The same preferences gave the opposite result.",
              "Demokratik küme sıralamasında r2, r3'ten zayıf olmadığı için {r1, r2} kümesi zayıf sayılmaz. Buna karşılık r3, r2'den zayıftır ve {r3} kümesi {r1, r2} kümesinden zayıf sayılır. Bu kez “-p” kaybeder ve “p” gerekçelendirilir. Aynı tercihler tam tersi bir sonuç verdi.",
            );
          },
        },
      ],
    },
    {
      id: "challenge",
      title: tx("Attacking and defending an existing theory", "Var olan bir kurama saldırmak ve onu savunmak"),
      intro: tx(
        "Time to bring everything together. You are given a theory and a goal. You may add declarations but not delete any. Each goal can be reached in more than one way, so before choosing one, look at which attacks fail and why.",
        "Şimdi öğrendiklerinizi bir araya getirme zamanı. Size bir kuram ve bir hedef veriliyor. Kurama bildirim ekleyebilirsiniz ama hiçbir şeyi silemezsiniz. Her hedefe ulaşmanın birden fazla yolu var. Bir yol seçmeden önce hangi saldırıların başarısız olduğuna ve nedenine bakın.",
      ),
      exercises: [
        {
          id: "challenge-1",
          kind: "build",
          task: tx(
            "The forecast says rain, so the picnic seems to be cancelled. A clear sky speaks against rain, but the rule based on the forecast is stronger. Without deleting anything, add declarations so that {cancelled} is overruled.",
            "Hava tahmini yağmur diyor, bu yüzden piknik iptal edilmiş görünüyor. Açık gökyüzü yağmura karşı bir işaret, ama tahmine dayanan kural daha güçlü. Hiçbir şeyi silmeden yeni bildirimler ekleyin ve {cancelled} iddiasını reddedilmiş hâle getirin.",
          ),
          given: "[<premise>: {forecast}]\n[<premise>: {clear}]\n[<defeasible> r1: {forecast} => {rain}]\n[<defeasible> r2: {rain} => {cancelled}]\n[<defeasible> r3: {clear} => -{rain}]\n[<prefer_rule>: r1 > r3]",
          hint: tx(
            "Attacking the conclusion of r1 does not work because of the preference. Which kind of attack is not affected by preferences?",
            "Tercih yüzünden r1'in sonucuna saldırmak işe yaramıyor. Hangi saldırı türü tercihlerden etkilenmez?",
          ),
          solution: "[<premise>: {forecast}]\n[<premise>: {clear}]\n[<defeasible> r1: {forecast} => {rain}]\n[<defeasible> r2: {rain} => {cancelled}]\n[<defeasible> r3: {clear} => -{rain}]\n[<prefer_rule>: r1 > r3]\n[<defeasible> r4: {clear} => -r1]",
          wrong: ["[<premise>: {forecast}]\n[<premise>: {clear}]\n[<defeasible> r1: {forecast} => {rain}]\n[<defeasible> r2: {rain} => {cancelled}]\n[<defeasible> r3: {clear} => -{rain}]\n[<prefer_rule>: r1 > r3]\n[<defeasible> r5: {clear} => -{cancelled}]"],
          check(ctx) {
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const c = w("cancelled", ctx.lang);
            if (factsAbout(ctx, c).length)
              return {
                ok: false,
                msg: tx(
                  `Do not simply declare ${q(c)} or its negation. The task is to attack the argument that leads to it.`,
                  `${q(c)} ifadesini ya da değilini doğrudan bildirmeyin. Görev, bu sonuca götüren argümana saldırmak.`,
                ),
              };
            const base = [...lines(ctx.r), ...failures(ctx.r), claimLine(ctx.r, c), claimReason(ctx.r, c)];
            if (statusOf(ctx.r, c) === "OVERRULED") return { ok: true, msg: join(base) };
            if (statusOf(ctx.r, c) === "UNDECIDED")
              return {
                ok: false,
                msg: join([...base, tx("Close. The picnic is now contested, but not overruled. Your attack has to win, not just draw.", "Yaklaştınız. Piknik artık tartışmalı hâle geldi, ama reddedilmedi. Saldırınızın berabere kalması değil, kazanması gerekiyor.")]),
              };
            return { ok: false, msg: join(base) };
          },
        },
        {
          id: "challenge-2",
          kind: "build",
          task: tx(
            "Penguins don't fly, and that rule is the stronger one, so {flies} is overruled. But the penguin here is a toy that can fly. Without deleting anything, add declarations so that {flies} is justified again.",
            "Penguenler uçmaz ve bu kural daha güçlü, bu yüzden {flies} reddedilmiş. Oysa buradaki penguen uçabilen bir oyuncak. Hiçbir şeyi silmeden yeni bildirimler ekleyin ve {flies} iddiasını yeniden gerekçelendirin.",
          ),
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]\n[<prefer_rule>: r2 > r1]",
          hint: tx(
            "If the argument against {flies} is defeated, the argument for {flies} is defended again. Which rule should not apply to this penguin?",
            "{flies} iddiasına karşı olan argüman yenilirse, {flies} için kurulan argüman yeniden savunulmuş olur. Bu penguen için hangi kural geçerli olmamalı?",
          ),
          solution: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]\n[<prefer_rule>: r2 > r1]\n[<premise>: {toy}]\n[<defeasible> r3: {toy} => -r2]",
          wrong: ["[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]\n[<prefer_rule>: r2 > r1]\n[<premise>: -{penguin}]"],
          check(ctx) {
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const c = w("flies", ctx.lang);
            if (factsAbout(ctx, c).length)
              return {
                ok: false,
                msg: tx(
                  `Do not simply declare ${q(c)} or its negation. The task is to deal with the argument against it.`,
                  `${q(c)} ifadesini ya da değilini doğrudan bildirmeyin. Görev, ona karşı olan argümanla başa çıkmak.`,
                ),
              };
            const base = [...lines(ctx.r), ...failures(ctx.r), claimLine(ctx.r, c)];
            if (statusOf(ctx.r, c) !== "JUSTIFIED") return { ok: false, msg: join([...base, claimReason(ctx.r, c)]) };
            const orig = argsWithRule(ctx.r, "r1").find((i) => label(ctx.r, i) === "IN");
            const defeaters = orig === undefined ? [] : ctx.r.attackers[orig];
            const reinstated = orig !== undefined && defeaters.length && defeaters.every((d) => label(ctx.r, d) === "OUT");
            const one = defeaters.length === 1;
            const note = reinstated
              ? tx(
                  `The original argument for ${q(c)}, ${q(ctx.r.arguments[orig].text)}, is still defeated by ${names(ctx.r, defeaters, "en")}, but ${one ? "that argument is" : "each of those is"} itself defeated by an accepted argument, so the original argument is defended again. This is called reinstatement.`,
                  `${q(c)} için kurulan ilk argüman, ${q(ctx.r.arguments[orig].text)}, hâlâ ${defeaters.map((d) => q(plain(ctx.r.arguments[d]))).join(", ")} tarafından yeniliyor. Ama ${one ? "bu argüman da" : "bunların her biri de"} kabul edilmiş bir argüman tarafından yenildiği için ilk argüman yeniden savunuluyor. Buna yeniden kazanım denir.`,
                )
              : claimReason(ctx.r, c);
            return { ok: true, msg: join([...base, note]) };
          },
        },
      ],
    },
    {
      id: "consistency",
      title: tx("Consistency and contrapositives", "Tutarlılık ve ters yönlü hâller"),
      intro: tx(
        "A strict rule p -> q has a contrapositive, -q -> -p: if q is false, p must be false as well. This is not the converse q -> p, which does not follow. Adding the contrapositives of strict rules is one of the conditions under which ASPIC+ guarantees consistent and closed results. Other conditions matter too, for example the axioms must be consistent, so contrapositives alone do not guarantee everything. ArgForge can add them for you. Without them, a theory may accept both a statement and its negation.",
        "p -> q katı kuralının ters yönlü hâli -q -> -p kuralıdır: q yanlışsa p de yanlış olmalıdır. Bu, q -> p biçimindeki tersine çevrilmiş kural değildir ve o kural buradan çıkmaz. Katı kuralların ters yönlü hâllerinin eklenmesi, ASPIC+'ın tutarlı ve kapalı sonuçları güvence altına aldığı koşullardan biridir. Başka koşullar da önemlidir, örneğin aksiyomlar birbiriyle tutarlı olmalıdır. Bu yüzden ters yönlü hâller tek başına her şeyi güvence altına almaz. ArgForge bu hâlleri sizin yerinize ekleyebilir. Eklenmezlerse bir kuram hem bir ifadeyi hem de onun değilini kabul edebilir.",
      ),
      exercises: [
        {
          id: "consistency-1",
          kind: "predict",
          task: tx(
            "“p” strictly implies “q”. On the other hand, “-q” is preferred to the premise “p”. Contrapositives are not added. Which of “q” and “-q” are justified?",
            "“p”, “q” iddiasını katı olarak gerektiriyor. Öte yandan “-q”, “p” öncülüne tercih ediliyor. Ters yönlü hâller eklenmiyor. “q” ve “-q” iddialarından hangileri gerekçelendirilmiştir?",
          ),
          given: "[<premise>: p]\n[<premise>: -q]\n[<strict> s1: p -> q]\n[<prefer_premise>: -q > p]",
          choices: QCHOICES,
          hint: tx("Can “-q” rebut “q”, which is reached by a strict rule? Is there anything that attacks the premise “p”? Can the argument for “q” defeat the premise “-q”?", "“-q”, katı bir kuralla elde edilen “q” sonucuna doğrudan saldırabilir mi? “p” öncülüne saldıran bir şey var mı? “q” argümanı “-q” öncülünü yenebilir mi?"),
          answer: (ctx) => pq(ctx.r),
          explain(ctx) {
            return join([
              ...lines(ctx.r),
              ...failures(ctx.r),
              tx(
                "The strict conclusion “q” cannot be rebutted directly. The argument for it could still be attacked through its premise “p”, but nothing in this theory argues against “p”. The attack of “q” on the premise “-q” fails as well, because “-q” is preferred. Both survive, and the result is inconsistent.",
                "Katı kuralla elde edilen “q” sonucuna doğrudan saldırılamaz. Bu argümana “p” öncülü üzerinden saldırılabilirdi, ama bu kuramda “p” öncülüne karşı bir argüman yok. “q” argümanının “-q” öncülüne saldırısı da “-q” tercih edildiği için başarısız olur. İkisi de ayakta kalır ve sonuç tutarsız olur.",
              ),
            ]);
          },
        },
        {
          id: "consistency-2",
          kind: "predict",
          task: tx("The same theory, now with contrapositives added. Which of “q” and “-q” are justified this time?", "Aynı kuram, bu kez ters yönlü hâller eklenerek değerlendiriliyor. Şimdi “q” ve “-q” iddialarından hangileri gerekçelendirilmiştir?"),
          settings: { transposition: true },
          given: "[<premise>: p]\n[<premise>: -q]\n[<strict> s1: p -> q]\n[<prefer_premise>: -q > p]",
          choices: QCHOICES,
          hint: tx("The contrapositive of p -> q is -q -> -p. What can an argument for “-p” attack?", "p -> q kuralının ters yönlü hâli -q -> -p'dir. “-p” için kurulan bir argüman neye saldırabilir?"),
          answer: (ctx) => pq(ctx.r),
          explain(ctx) {
            return tx(
              `The added rule -q -> -p gives an argument for “-p”, which attacks the premise “p”. Since “-q” is preferred to “p”, this attack succeeds. The argument for “q” loses the premise it rests on, and only “-q” and “-p” remain. According to the engine, “q” is ${statusWord(statusOf(ctx.r, "q"), "en")} and “-q” is ${statusWord(statusOf(ctx.r, "-q"), "en")}.`,
              `Eklenen -q -> -p kuralı “-p” için bir argüman kurar ve bu argüman “p” öncülüne saldırır. “-q”, “p” öncülüne tercih edildiği için saldırı başarılı olur. “q” argümanı dayandığı öncülü kaybeder ve ayakta yalnızca “-q” ile “-p” kalır. Motora göre “q” ${statusWord(statusOf(ctx.r, "q"), "tr")}, “-q” ise ${statusWord(statusOf(ctx.r, "-q"), "tr")}.`,
            );
          },
        },
      ],
    },
    {
      id: "schemes",
      title: tx("Argument schemes and critical questions", "Argüman şemaları ve kritik sorular"),
      intro: tx(
        "Everyday arguments follow recurring patterns called argument schemes. A well-known one is the argument from expert opinion: E is an expert in a field, E says that A, A belongs to that field, so presumably A. Each scheme comes with critical questions that point out how such an argument can go wrong. In ASPIC+ a scheme becomes a defeasible rule, and each critical question becomes one of the three kinds of attack: questioning a premise undermines, pointing to an exception undercuts, and a counter-argument rebuts.",
        "Gündelik argümanlar, argüman şeması denen tekrar eden kalıplara uyar. Bilinen örneklerden biri uzman görüşüne dayalı argümandır: E bir alanda uzmandır, E A'nın doğru olduğunu söylüyor, A o alana girer, o hâlde muhtemelen A. Her şemanın, böyle bir argümanın nerede yanılabileceğini gösteren kritik soruları vardır. ASPIC+'ta bir şema feshedilebilir bir kurala dönüşür. Her kritik soru da üç saldırı türünden birine karşılık gelir. Bir öncülü sorgulamak öncüle saldırıdır, bir istisnayı göstermek kurala saldırıdır, karşı bir argüman ise sonuca saldırıdır.",
      ),
      exercises: [
        {
          id: "schemes-1",
          kind: "build",
          task: tx(
            "Critical question: is Ayşe really an expert on medicines? Suppose a reliable record shows she is not. Add an argument that questions this premise, so that {safe} is no longer justified.",
            "Kritik soru: Ayşe gerçekten ilaç uzmanı mı? Güvenilir bir kaydın onun uzman olmadığını gösterdiğini varsayalım. Bu öncülü sorgulayan bir argüman ekleyin. Böylece {safe} artık gerekçelendirilmiş olmasın.",
          ),
          given: "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]",
          hint: tx("You need an argument whose conclusion is -{expA}.", "Sonucu -{expA} olan bir argümana ihtiyacınız var."),
          solution: "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: -{expA}]",
          wrong: [
            "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: -{safe}]",
            "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: {paid}]\n[<defeasible> r9: {paid} => -<rexpert>]",
          ],
          alternatives: [{ src: "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<axiom>: -{expA}]", mustNot: ["attacks back successfully", "başarılı bir karşılık"] }],
          check(ctx) {
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const e = w("expA", ctx.lang),
              c = w("safe", ctx.lang);
            const on = ctx.r.attacks.filter((a) => a.kind === "undermine" && ctx.r.arguments[witnessOf(ctx.r, a)].conclusion === e);
            const win = on.find((a) => a.succeeds);
            if (!on.length) {
              const other = ctx.r.attacks.find((a) => !ctx.r.arguments[a.attacker].conclusion.startsWith(ctx.r.arguments[a.target].conclusion));
              return {
                ok: false,
                msg: join([
                  ...lines(ctx.r),
                  tx(
                    `This critical question asks whether the premise ${q(e)} is true. Answer it with an argument for ${q(neg(e))}, which attacks that premise.`,
                    `Bu kritik soru ${q(e)} öncülünün doğru olup olmadığını soruyor. Ona, bu öncüle saldıran ${q(neg(e))} için bir argümanla cevap verin.`,
                  ),
                ]),
              };
            }
            if (!win) return { ok: false, msg: join([attackLine(ctx.r, on[0]), whyFailed(ctx.r, on[0]), claimLine(ctx.r, c)]) };
            const back = ctx.r.attacks.filter((a) => a.attacker === witnessOf(ctx.r, win) && a.target === win.attacker);
            return {
              ok: statusOf(ctx.r, c) !== "JUSTIFIED",
              msg: join([
                attackLine(ctx.r, win),
                ...back.map((a) => attackLine(ctx.r, a)),
                back.some((a) => a.succeeds)
                  ? tx(`The premise ${q(e)} attacks back successfully, so neither side is accepted.`, `${q(e)} öncülü de başarılı bir karşılık veriyor, bu yüzden iki taraf da kabul edilmiyor.`)
                  : tx(`The premise ${q(e)} cannot answer this attack, so it is defeated.`, `${q(e)} öncülü bu saldırıya karşılık veremiyor, bu yüzden yeniliyor.`),
                claimLine(ctx.r, c),
                tx("Questioning a premise of the scheme is an undermining attack.", "Şemanın bir öncülünü sorgulamak, öncüle saldırıdır."),
              ]),
            };
          },
        },
        {
          id: "schemes-2",
          kind: "build",
          task: tx(
            "Critical question: is Ayşe biased? It turns out she is paid by the manufacturer. That does not show the drug is unsafe. It only means her opinion should not be relied on here. Add a premise and a rule that say exactly this, so that {safe} is overruled.",
            "Kritik soru: Ayşe taraflı mı? Üreticiden para aldığı ortaya çıkıyor. Bu, ilacın güvenli olmadığını göstermez. Yalnızca onun görüşüne burada güvenilmemesi gerektiği anlamına gelir. Tam olarak bunu söyleyen bir öncül ve bir kural ekleyin. Böylece {safe} reddedilmiş olsun.",
          ),
          given: "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]",
          hint: tx("The rule should conclude that the scheme rule <rexpert> does not apply: -<rexpert>.", "Kural, şema kuralı olan <rexpert> kuralının geçerli olmadığı sonucuna varmalı: -<rexpert>."),
          solution: "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: {paid}]\n[<defeasible> <rbias>: {paid} => -<rexpert>]",
          wrong: [
            "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: {paid}]\n[<defeasible> <rbias>: {paid} => -{safe}]",
            "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: -<rexpert>]",
          ],
          check(ctx) {
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const c = w("safe", ctx.lang),
              pd = w("paid", ctx.lang),
              rn = k("rexpert", ctx.lang);
            if ((ctx.decls.facts || []).some((f) => f.literal === "-" + rn))
              return { ok: false, msg: tx(`That declares -${rn} directly. Write a rule that derives it from ${q(pd)}.`, `Bu, -${rn} ifadesini doğrudan bildiriyor. Onu ${q(pd)} ifadesinden türeten bir kural yazın.`) };
            const rules = newRules(ctx).filter((x) => x.consequent === "-" + rn && x.antecedents.includes(pd));
            if (!rules.length) {
              const rebut = ctx.r.attacks.find((a) => a.kind === "rebut");
              return {
                ok: false,
                msg: join([
                  ...(rebut ? [attackLine(ctx.r, rebut)] : []),
                  tx(
                    `Bias does not show that the drug is unsafe, so arguing for ${q(neg(c))} says too much. Write a rule from ${q(pd)} to -${rn}, which says that the expert rule does not apply here.`,
                    `Taraflılık ilacın güvenli olmadığını göstermez, bu yüzden ${q(neg(c))} için argüman kurmak fazlasını söyler. ${q(pd)} ifadesinden -${rn} sonucuna giden bir kural yazın. Bu kural, uzman kuralının burada geçerli olmadığını söyler.`,
                  ),
                ]),
              };
            }
            const cut = ctx.r.attacks.find((a) => a.kind === "undercut" && rules.some((x) => x.name === ctx.r.arguments[a.attacker].rule));
            if (!cut) return { ok: false, msg: tx(`Your rule never applies. Is ${q(pd)} declared as a premise?`, `Kuralınız hiç uygulanmıyor. ${q(pd)} bir öncül olarak bildirildi mi?`) };
            return {
              ok: cut.succeeds && statusOf(ctx.r, c) === "OVERRULED",
              msg: join([
                attackLine(ctx.r, cut),
                claimLine(ctx.r, c),
                claimReason(ctx.r, c),
                tx("Pointing to an exception to the scheme is an undercut. It does not claim the opposite conclusion.", "Şemaya bir istisna göstermek kurala saldırıdır. Karşıt sonucu ileri sürmez."),
              ]),
            };
          },
        },
        {
          id: "schemes-3",
          kind: "build",
          task: tx(
            "Critical question: do other experts agree? Mehmet, also an expert on medicines, says the drug is not safe. Apply the same scheme to Mehmet with a new rule, so that his argument rebuts Ayşe's. Without a preference, the question should remain open.",
            "Kritik soru: başka uzmanlar da aynı fikirde mi? Yine ilaç uzmanı olan Mehmet, ilacın güvenli olmadığını söylüyor. Aynı şemayı yeni bir kuralla Mehmet'e uygulayın. Böylece onun argümanı Ayşe'nin argümanının sonucuna saldırsın. Bir tercih olmadığı için soru açık kalmalı.",
          ),
          given: "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: {expM}]\n[<premise>: {saysM}]",
          hint: tx("Copy the pattern of <rexpert>: two conditions about Mehmet, and the conclusion -{safe}.", "<rexpert> kuralının kalıbını kopyalayın: Mehmet hakkında iki koşul ve -{safe} sonucu."),
          solution: "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: {expM}]\n[<premise>: {saysM}]\n[<defeasible> <rexpert2>: {expM} & {saysM} => -{safe}]",
          wrong: [
            "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: {expM}]\n[<premise>: {saysM}]\n[<premise>: -{safe}]",
            "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: {expM}]\n[<premise>: {saysM}]\n[<defeasible> <rexpert2>: {saysM} => -{safe}]",
          ],
          check(ctx) {
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const c = w("safe", ctx.lang);
            const need = [w("expM", ctx.lang), w("saysM", ctx.lang)];
            const rules = newRules(ctx).filter((x) => x.kind === "defeasible" && x.consequent === neg(c) && hasAll(x.antecedents, need));
            if (!rules.length)
              return {
                ok: false,
                msg: tx(
                  `Apply the scheme to Mehmet: a defeasible rule whose conditions are ${q(need[0])} and ${q(need[1])}, and whose conclusion is ${q(neg(c))}.`,
                  `Şemayı Mehmet'e uygulayın: koşulları ${q(need[0])} ve ${q(need[1])}, sonucu ${q(neg(c))} olan feshedilebilir bir kural yazın.`,
                ),
              };
            const att = ctx.r.attacks.find((a) => a.kind === "rebut" && rules.some((x) => x.name === ctx.r.arguments[a.attacker].rule));
            if (!att) return { ok: false, msg: join([claimLine(ctx.r, c)]) };
            const ok = statusOf(ctx.r, c) === "UNDECIDED";
            return {
              ok,
              msg: join([
                ...lines(ctx.r),
                claimLine(ctx.r, c),
                ok
                  ? tx("Two experts disagree and nothing decides between them, so the claim stays undecided. A counter-argument to the conclusion is a rebuttal.", "İki uzman farklı görüşte ve aralarında karar veren bir şey yok, bu yüzden iddia kararsız kalıyor. Sonuca karşı bir argüman, sonuca saldırıdır.")
                  : tx("The question was meant to stay open. Did you add a preference?", "Sorunun açık kalması gerekiyordu. Bir tercih mi eklediniz?"),
              ]),
            };
          },
        },
        {
          id: "schemes-4",
          kind: "predict",
          task: tx(
            "In this theory the bias question has been answered with the rule <rbias>. Which kind of attack does the engine find against Ayşe's argument?",
            "Bu kuramda taraflılık sorusu <rbias> kuralıyla cevaplanmış. Motor, Ayşe'nin argümanına karşı hangi tür saldırıyı buluyor?",
          ),
          given: "[<premise>: {expA}]\n[<premise>: {saysA}]\n[<defeasible> <rexpert>: {expA} & {saysA} => {safe}]\n[<premise>: {paid}]\n[<defeasible> <rbias>: {paid} => -<rexpert>]",
          choices: [
            { value: "undermine", label: tx("an attack on a premise", "öncüle saldırı") },
            { value: "undercut", label: tx("an attack on the rule", "kurala saldırı") },
            { value: "rebut", label: tx("an attack on the conclusion", "sonuca saldırı") },
          ],
          hint: tx("What does the conclusion -<rexpert> talk about?", "-<rexpert> sonucu neyden söz ediyor?"),
          answer: (ctx) => (ctx.r.attacks[0] || {}).kind,
          explain(ctx) {
            return join([
              ...lines(ctx.r),
              tx(
                "The conclusion names the scheme rule itself, so the attack targets the rule, not a premise or the conclusion. In general, critical questions about the conditions of the scheme undermine, questions about exceptions undercut, and questions about counter-evidence rebut.",
                "Sonuç, şema kuralının adını taşıyor. Bu yüzden saldırı bir öncüle ya da sonuca değil, kuralın kendisine yöneliyor. Genel olarak şemanın koşullarını sorgulayan kritik sorular öncüle, istisnaları soranlar kurala, karşı kanıtı soranlar ise sonuca saldırır.",
              ),
            ]);
          },
        },
      ],
    },
    {
      id: "modelling",
      title: tx("From text to theory", "Metinden kurama"),
      intro: tx(
        "Formalising a text is a skill of its own. Read for the claims, the reasons given for them, the exceptions, the conflicts and the priorities, then decide how each becomes a declaration. Use exactly the statements listed in each task, so that the engine can recognise them. Different formalisations can be equally good: the engine checks that yours has the required parts and reaches the right result.",
        "Bir metni biçimselleştirmek başlı başına bir beceridir. Metindeki iddiaları, bu iddiaların gerekçelerini, istisnaları, çatışmaları ve öncelikleri bulun. Sonra her birinin nasıl bir bildirime dönüşeceğine karar verin. Motorun tanıyabilmesi için her görevde verilen ifadeleri aynen kullanın. Farklı biçimselleştirmeler aynı derecede iyi olabilir. Motor, sizinkinin gerekli parçaları içerip içermediğini ve doğru sonuca varıp varmadığını kontrol eder.",
      ),
      exercises: [
        {
          id: "modelling-1",
          kind: "build",
          task: tx(
            "Text: “Normally, students who passed the exam get the certificate. Ali passed the exam. However, students who cheated do not get the certificate, and this takes priority. Ali cheated.” Formalise it using the statements {passed}, {cheated} and {cert}. The engine should find that {cert} is overruled.",
            "Metin: “Normalde sınavı geçen öğrenciler sertifika alır. Ali sınavı geçti. Ancak kopya çeken öğrenciler sertifika alamaz ve bu kural önceliklidir. Ali kopya çekti.” Bu metni {passed}, {cheated} ve {cert} ifadelerini kullanarak biçimselleştirin. Motor, {cert} iddiasının reddedildiği sonucuna varmalı.",
          ),
          given: "",
          hint: tx(
            "Two facts, a general rule, and an exception that wins. The exception can be a rule for -{cert} with a preference, or a rule that undercuts the general one.",
            "İki olgu, genel bir kural ve kazanan bir istisna. İstisna, bir tercihle birlikte -{cert} için bir kural olabilir ya da genel kurala saldıran bir kural olabilir.",
          ),
          solution: "[<premise>: {passed}]\n[<premise>: {cheated}]\n[<defeasible> r1: {passed} => {cert}]\n[<defeasible> r2: {cheated} => -{cert}]\n[<prefer_rule>: r2 > r1]",
          wrong: [
            "[<premise>: {passed}]\n[<premise>: {cheated}]\n[<defeasible> r1: {passed} => {cert}]\n[<defeasible> r2: {cheated} => -{cert}]",
            "[<premise>: {passed}]\n[<premise>: {cheated}]\n[<premise>: -{cert}]",
          ],
          alternatives: [{ src: "[<premise>: {passed}]\n[<premise>: {cheated}]\n[<defeasible> r1: {passed} => {cert}]\n[<defeasible> r2: {cheated} => -r1]" }],
          check(ctx) {
            const ps = w("passed", ctx.lang),
              ch = w("cheated", ctx.lang),
              c = w("cert", ctx.lang);
            const r = ctx.r;
            const facts = (ctx.decls.facts || []).map((f) => f.literal);
            const problems = [];
            if (!facts.includes(ps) || !facts.includes(ch))
              problems.push(tx(`${q(ps)} and ${q(ch)} are facts about Ali. Declare both.`, `${q(ps)} ve ${q(ch)}, Ali hakkındaki olgulardır. İkisini de bildirin.`));
            if (factsAbout(ctx, c).length)
              problems.push(tx(`${q(c)} is a conclusion in the text, not a fact. Derive it, or its negation, with rules.`, `${q(c)} metinde bir sonuçtur, olgu değildir. Onu ya da değilini kurallarla türetin.`));
            if (problems.length) return { ok: false, msg: join(problems) };
            const ruleOf = (i) => (ctx.decls.rules || []).find((x) => x.name === r.arguments[i].rule);
            const general = r.arguments.map((a, i) => i).filter((i) => {
              const rule = ruleOf(i);
              return rule && rule.kind === "defeasible" && rule.consequent === c && rule.antecedents.includes(ps);
            });
            if (!general.length)
              return {
                ok: false,
                msg: tx(
                  `The text says that passing normally leads to the certificate, but no argument applies such a rule. Write a defeasible rule from ${q(ps)} to ${q(c)} whose conditions can all be derived.`,
                  `Metne göre sınavı geçmek normalde sertifikaya götürür, ama böyle bir kuralı uygulayan bir argüman yok. ${q(ps)} ifadesinden ${q(c)} ifadesine giden ve bütün koşulları türetilebilen feshedilebilir bir kural yazın.`,
                ),
              };
            const generalRules = general.map((i) => r.arguments[i].rule);
            const exception = r.arguments.map((a, i) => i).filter((i) => {
              const rule = ruleOf(i);
              return rule && rule.antecedents.includes(ch) && (rule.consequent === neg(c) || generalRules.some((g) => rule.consequent === "-" + g));
            });
            if (!exception.length)
              return {
                ok: false,
                msg: tx(
                  `The exception never applies: no argument uses a rule from ${q(ch)} that concludes ${q(neg(c))} or attacks the general rule. Check that such a rule exists and that its conditions can be derived.`,
                  `İstisna hiç uygulanmıyor: ${q(ch)} ifadesinden çıkıp ${q(neg(c))} sonucuna varan ya da genel kurala saldıran bir kuralı kullanan argüman yok. Böyle bir kuralın olduğunu ve koşullarının türetilebildiğini kontrol edin.`,
                ),
              };
            const decisive = r.attacks.filter((a) => exception.includes(a.attacker) && general.includes(a.target));
            const wins = decisive.filter((a) => a.succeeds);
            const base = [...decisive.map((a) => attackLine(r, a)), ...decisive.filter((a) => !a.succeeds).map((a) => whyFailed(r, a))];
            if (!wins.length)
              return { ok: false, msg: join([...base, tx("The exception does not defeat the general rule. The text gives the exception priority: express that.", "İstisna genel kuralı yenmiyor. Metin istisnaya öncelik veriyor: bunu ifade edin.")]) };
            const out = statusOf(r, c) === "OVERRULED";
            return {
              ok: out,
              msg: join([
                ...base,
                ...r.attacks.filter((a) => general.includes(a.attacker) && exception.includes(a.target)).map((a) => attackLine(r, a)),
                claimLine(r, c),
                out
                  ? tx("The exception defeats the general rule, as the text says, so the certificate is overruled.", "Metinde söylendiği gibi istisna genel kuralı yeniyor, bu yüzden sertifika reddediliyor.")
                  : claimReason(r, c),
              ]),
            };
          },
        },
        {
          id: "modelling-2",
          kind: "build",
          task: tx(
            "Text: “Vehicles are not allowed in the park. Every ambulance is a vehicle. An ambulance on duty is allowed in, and this exception takes precedence over the general ban. The ambulance is on duty.” Formalise it using {vehicle}, {amb}, {duty} and {allowed}. The engine should find that {allowed} is justified.",
            "Metin: “Araçlar parka giremez. Her ambulans bir araçtır. Görevdeki bir ambulans parka girebilir ve bu istisna genel yasağa göre önceliklidir. Ambulans görevde.” Bu metni {vehicle}, {amb}, {duty} ve {allowed} ifadelerini kullanarak biçimselleştirin. Motor, {allowed} iddiasının gerekçelendirildiği sonucuna varmalı.",
          ),
          given: "",
          hint: tx(
            "“Every ambulance is a vehicle” has no exceptions, so it is a strict rule. The ban and the exception are defeasible, and the exception is preferred. The exception has two conditions, joined with &.",
            "“Her ambulans bir araçtır” istisnasızdır, yani katı bir kuraldır. Yasak ve istisna feshedilebilir kurallardır ve istisna tercih edilir. İstisnanın iki koşulu vardır, bunlar & ile bağlanır.",
          ),
          solution: "[<premise>: {amb}]\n[<premise>: {duty}]\n[<strict> s1: {amb} -> {vehicle}]\n[<defeasible> r1: {vehicle} => -{allowed}]\n[<defeasible> r2: {amb} & {duty} => {allowed}]\n[<prefer_rule>: r2 > r1]",
          wrong: [
            "[<premise>: {amb}]\n[<premise>: {duty}]\n[<premise>: {vehicle}]\n[<defeasible> r1: {vehicle} => -{allowed}]\n[<defeasible> r2: {amb} & {duty} => {allowed}]\n[<prefer_rule>: r2 > r1]",
            "[<premise>: {amb}]\n[<premise>: {duty}]\n[<strict> s1: {amb} -> {vehicle}]\n[<defeasible> r1: {vehicle} => -{allowed}]\n[<defeasible> r2: {duty} => {allowed}]\n[<prefer_rule>: r2 > r1]",
            "[<premise>: {amb}]\n[<premise>: {duty}]\n[<strict> s1: {amb} -> {vehicle}]\n[<defeasible> r1: {vehicle} => -{allowed}]\n[<defeasible> r2: {amb} & {duty} => {allowed}]",
          ],
          check(ctx) {
            const v = w("vehicle", ctx.lang),
              am = w("amb", ctx.lang),
              du = w("duty", ctx.lang),
              al = w("allowed", ctx.lang);
            const r = ctx.r;
            const facts = (ctx.decls.facts || []).map((f) => f.literal);
            const rules = ctx.decls.rules || [];
            const ruleOf = (i) => rules.find((x) => x.name === r.arguments[i].rule);
            const problems = [];
            if (!facts.includes(am) || !facts.includes(du)) problems.push(tx(`Declare the facts ${q(am)} and ${q(du)}.`, `${q(am)} ve ${q(du)} olgularını bildirin.`));
            if (factsAbout(ctx, v).length) problems.push(tx(`${q(v)} follows from ${q(am)} in the text, so derive it with a rule instead of declaring it.`, `Metinde ${q(v)}, ${q(am)} ifadesinden çıkıyor. Onu bildirmek yerine bir kuralla türetin.`));
            if (factsAbout(ctx, al).length) problems.push(tx(`${q(al)} is what the text concludes. Derive it with rules.`, `${q(al)}, metnin vardığı sonuçtur. Onu kurallarla türetin.`));
            if (problems.length) return { ok: false, msg: join(problems) };
            const vehicleArgs = r.arguments.map((a, i) => i).filter((i) => {
              const rule = ruleOf(i);
              return rule && rule.kind === "strict" && rule.consequent === v && rule.antecedents.includes(am);
            });
            if (!vehicleArgs.length)
              return { ok: false, msg: tx(`“Every ambulance is a vehicle” has no exceptions: write it as a strict rule from ${q(am)} to ${q(v)}.`, `“Her ambulans bir araçtır” istisnasızdır: bunu ${q(am)} ifadesinden ${q(v)} ifadesine giden katı bir kural olarak yazın.`) };
            const ban = r.arguments.map((a, i) => i).filter((i) => {
              const rule = ruleOf(i);
              return rule && rule.kind === "defeasible" && rule.consequent === neg(al) && r.arguments[i].children.some((ch) => vehicleArgs.includes(ch));
            });
            if (!ban.length)
              return {
                ok: false,
                msg: tx(
                  `The general ban never applies: no argument derives ${q(neg(al))} from the fact that the ambulance is a vehicle. Write a defeasible rule from ${q(v)} to ${q(neg(al))} whose conditions can all be derived.`,
                  `Genel yasak hiç uygulanmıyor: ambulansın bir araç olmasından ${q(neg(al))} sonucunu türeten bir argüman yok. ${q(v)} ifadesinden ${q(neg(al))} ifadesine giden ve bütün koşulları türetilebilen feshedilebilir bir kural yazın.`,
                ),
              };
            const exception = r.arguments.map((a, i) => i).filter((i) => {
              const rule = ruleOf(i);
              return rule && rule.kind === "defeasible" && rule.consequent === al && hasAll(rule.antecedents, [am, du]);
            });
            if (!exception.length)
              return {
                ok: false,
                msg: tx(
                  `The exception never applies: no argument derives ${q(al)} for an ambulance on duty. Its rule needs the conditions ${q(am)} and ${q(du)}, and both must be derivable.`,
                  `İstisna hiç uygulanmıyor: görevdeki ambulans için ${q(al)} sonucunu türeten bir argüman yok. Kuralının koşulları ${q(am)} ve ${q(du)} olmalı ve ikisi de türetilebilmeli.`,
                ),
              };
            const exceptionWins = r.attacks.filter((a) => exception.includes(a.attacker) && ban.includes(a.target));
            const banAttacks = r.attacks.filter((a) => ban.includes(a.attacker) && exception.includes(a.target));
            const base = [...exceptionWins.map((a) => attackLine(r, a)), ...banAttacks.map((a) => attackLine(r, a)), ...[...exceptionWins, ...banAttacks].filter((a) => !a.succeeds).map((a) => whyFailed(r, a))];
            const precedence = exceptionWins.some((a) => a.succeeds) && banAttacks.length && banAttacks.every((a) => !a.succeeds);
            if (!precedence)
              return {
                ok: false,
                msg: join([...base, claimLine(r, al), tx("The exception does not take precedence over the ban yet. The text says it does: which preference expresses that?", "İstisna henüz yasağa göre öncelikli değil. Metin öyle olduğunu söylüyor: bunu hangi tercih ifade eder?")]),
              };
            const ok = statusOf(r, al) === "JUSTIFIED";
            return {
              ok,
              msg: join([
                ...base,
                claimLine(r, al),
                ok
                  ? tx("The ban applies, but the exception defeats it while the ban's attack on the exception fails. So the specific exception beats the general ban, as the text says.", "Yasak uygulanıyor, ama istisna onu yeniyor ve yasağın istisnaya saldırısı başarısız oluyor. Böylece metinde söylendiği gibi özel istisna genel yasağı yeniyor.")
                  : claimReason(r, al),
              ]),
            };
          },
        },
        {
          id: "modelling-3",
          kind: "build",
          task: tx(
            "Text: “The witness says the car was red. The camera shows it was blue. A car cannot be both red and blue. The camera is more reliable than the witness.” The formalisation below gets two things wrong: the conflict runs in only one direction, and the priority is missing. Repair it so that {blue} is justified and {red} is overruled.",
            "Metin: “Tanık arabanın kırmızı olduğunu söylüyor. Kamera ise mavi olduğunu gösteriyor. Bir araba hem kırmızı hem mavi olamaz. Kamera tanıktan daha güvenilirdir.” Aşağıdaki biçimselleştirme iki noktada hatalı: çatışma yalnızca tek yönde işliyor ve öncelik eksik. Kuramı düzeltin. Böylece {blue} gerekçelendirilmiş, {red} reddedilmiş olsun.",
          ),
          given: "[<premise>: {wsays}]\n[<premise>: {cshows}]\n[<defeasible> r1: {wsays} => {red}]\n[<defeasible> r2: {cshows} => {blue}]\n[<contrary>: {red} ^ {blue}]",
          hint: tx("“Cannot be both” is a two-way conflict. The camera's rule should be the stronger one.", "“Hem … hem … olamaz” iki yönlü bir çatışmadır. Kameraya dayanan kural daha güçlü olmalı."),
          solution: "[<premise>: {wsays}]\n[<premise>: {cshows}]\n[<defeasible> r1: {wsays} => {red}]\n[<defeasible> r2: {cshows} => {blue}]\n[<contradictory>: {red} ^ {blue}]\n[<prefer_rule>: r2 > r1]",
          wrong: [
            "[<premise>: {wsays}]\n[<premise>: {cshows}]\n[<defeasible> r1: {wsays} => {red}]\n[<defeasible> r2: {cshows} => {blue}]\n[<contrary>: {blue} ^ {red}]",
            "[<premise>: {wsays}]\n[<premise>: {cshows}]\n[<defeasible> r1: {wsays} => {red}]\n[<defeasible> r2: {cshows} => {blue}]\n[<contradictory>: {red} ^ {blue}]",
          ],
          alternatives: [{ src: "[<premise>: {wsays}]\n[<premise>: {cshows}]\n[<defeasible> r1: {wsays} => {red}]\n[<defeasible> r2: {cshows} => {blue}]\n[<contradictory>: {red} ^ {blue}]\n[<prefer_premise>: {cshows} > {wsays}]\n[<prefer_rule>: r2 > r1]" }],
          check(ctx) {
            const rd = w("red", ctx.lang),
              bl = w("blue", ctx.lang);
            const r = ctx.r;
            const key = (x) => JSON.stringify(x);
            const keep = (part) => (ctx.givenDecls[part] || []).every((x) => (ctx.decls[part] || []).map(key).includes(key(x)));
            if (!keep("facts") || !keep("rules")) return { ok: false, msg: tx("Keep the two premises and the two rules. Only the conflict and the priority need repairing.", "İki öncülü ve iki kuralı koruyun. Yalnızca çatışmanın ve önceliğin düzeltilmesi gerekiyor.") };
            const cs = (ctx.decls.contraries || []).filter((x) => [x.source, x.target].includes(rd) && [x.source, x.target].includes(bl));
            const twoWay = cs.some((x) => x.symmetric) || (cs.some((x) => x.source === rd) && cs.some((x) => x.source === bl));
            if (!twoWay)
              return { ok: false, msg: join([...lines(r), tx("“Cannot be both” means each colour excludes the other: the conflict must run in both directions.", "“İkisi birden olamaz” her rengin diğerini dışladığı anlamına gelir: çatışma iki yönde de işlemeli.")]) };
            const redArgs = bearers(r, rd),
              blueArgs = bearers(r, bl);
            const blueOnRed = r.attacks.filter((a) => blueArgs.includes(a.attacker) && redArgs.includes(a.target));
            const redOnBlue = r.attacks.filter((a) => redArgs.includes(a.attacker) && blueArgs.includes(a.target));
            const base = [...blueOnRed.map((a) => attackLine(r, a)), ...redOnBlue.map((a) => attackLine(r, a)), ...[...blueOnRed, ...redOnBlue].filter((a) => !a.succeeds).map((a) => whyFailed(r, a))];
            const camera = blueOnRed.some((a) => a.succeeds) && redOnBlue.length && redOnBlue.every((a) => !a.succeeds);
            if (!camera)
              return { ok: false, msg: join([...base, claimLine(r, bl), claimLine(r, rd), tx("The text says the camera is more reliable. Add a preference that makes its side win.", "Metin kameranın daha güvenilir olduğunu söylüyor. Onun tarafını kazandıran bir tercih ekleyin.")]) };
            const ok = statusOf(r, bl) === "JUSTIFIED" && statusOf(r, rd) === "OVERRULED";
            return { ok, msg: join([...base, claimLine(r, bl), claimLine(r, rd), ok ? tx("Each colour attacks the other, and the preference makes the camera's side win.", "Her renk diğerine saldırıyor ve tercih kameranın tarafını kazandırıyor.") : claimReason(r, bl)]) };
          },
        },
      ],
    },
    {
      id: "labellings",
      title: tx("Labellings", "Etiketlemeler"),
      intro: tx(
        "A labelling gives every argument one of three labels: IN (accepted), OUT (defeated) or UNDEC (undecided). A labelling is complete when it obeys three rules. An argument is IN exactly when all the arguments that defeat it are OUT. It is OUT exactly when at least one argument that defeats it is IN. Otherwise it is UNDEC. The grounded labelling is the complete labelling that labels as few arguments IN as possible. Every complete labelling corresponds to a complete extension: its IN arguments.",
        "Etiketleme her argümana üç etiketten birini verir: IN (kabul edildi), OUT (yenildi) ya da UNDEC (kararsız). Bir etiketleme üç kurala uyuyorsa tamdır. Bir argüman, onu yenen bütün argümanlar OUT olduğunda ve ancak o zaman IN olur. Onu yenen argümanlardan en az biri IN olduğunda ve ancak o zaman OUT olur. Diğer durumlarda UNDEC olur. Temelli etiketleme, olabildiğince az argümanı IN olarak etiketleyen tam etiketlemedir. Her tam etiketleme bir tam kapsama karşılık gelir: o etiketlemedeki IN argümanlar.",
      ),
      exercises: [
        {
          id: "labellings-1",
          kind: "label",
          goal: "grounded",
          task: tx("Here r2 is preferred to r1. Label every argument so that the result is the grounded labelling.", "Burada r2, r1'e tercih ediliyor. Her argümanı etiketleyin. Sonuç temelli etiketleme olmalı."),
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]\n[<prefer_rule>: r2 > r1]",
          hint: tx("Start with arguments that nothing defeats: they must be IN.", "Hiçbir şeyin yenmediği argümanlarla başlayın: bunlar IN olmalı."),
        },
        {
          id: "labellings-2",
          kind: "label",
          goal: "grounded",
          task: tx("Now there is no preference. Label every argument so that the result is the grounded labelling.", "Şimdi hiçbir tercih yok. Her argümanı etiketleyin. Sonuç temelli etiketleme olmalı."),
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]",
          hint: tx("When two arguments defeat each other and nothing else decides, the grounded labelling makes neither of them IN.", "İki argüman birbirini yeniyor ve başka hiçbir şey karar vermiyorsa, temelli etiketleme ikisini de IN yapmaz."),
        },
        {
          id: "labellings-3",
          kind: "label",
          goal: "complete-in",
          target: "flies",
          task: tx(
            "The same theory has other complete labellings. Find one in which the argument for {flies} is IN.",
            "Aynı kuramın başka tam etiketlemeleri de var. {flies} için kurulan argümanın IN olduğu bir tane bulun.",
          ),
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]",
          hint: tx("If the argument for {flies} is IN, what must happen to the argument it defeats?", "{flies} için kurulan argüman IN ise, onun yendiği argümana ne olmalı?"),
        },
        {
          id: "labellings-4",
          kind: "label",
          goal: "grounded",
          task: tx(
            "A harder case with ten arguments. The toy penguin is back, so one argument is defeated but later defended. On top of that, two sources disagree about whether it is {windy}, and wind would stop the bird from migrating. Label all ten arguments so that the result is the grounded labelling.",
            "On argümanlı daha zor bir durum. Oyuncak penguen yine burada, yani bir argüman yeniliyor ama sonra yeniden savunuluyor. Üstelik iki kaynak havanın {windy} olup olmadığı konusunda farklı şeyler söylüyor ve rüzgar kuşun göç etmesini engelliyor. On argümanın hepsini etiketleyin. Sonuç temelli etiketleme olmalı.",
          ),
          given: "[<premise>: {bird}]\n[<premise>: {penguin}]\n[<premise>: {toy}]\n[<defeasible> r1: {bird} => {flies}]\n[<defeasible> r2: {penguin} => -{flies}]\n[<prefer_rule>: r2 > r1]\n[<defeasible> r3: {toy} => -r2]\n[<defeasible> r4: {flies} => {migrates}]\n[<premise>: {windy}]\n[<premise>: -{windy}]\n[<defeasible> r5: {windy} => -{migrates}]",
          hint: tx(
            "Work in rounds. First, everything that nothing defeats is IN. Then everything defeated by an IN argument is OUT, and everything whose defeaters are all OUT is IN. Repeat until nothing changes. Whatever is still unlabelled is UNDEC.",
            "Turlar hâlinde ilerleyin. Önce hiçbir şeyin yenmediği her şey IN olur. Sonra IN bir argüman tarafından yenilen her şey OUT, onu yenenlerin hepsi OUT olan her şey de IN olur. Hiçbir şey değişmeyene kadar tekrarlayın. Sonunda etiketsiz kalan her şey UNDEC olur.",
          ),
        },
      ],
    },
  ];

  const LABELS = { IN: ["IN (accepted)", "IN (kabul edildi)"], OUT: ["OUT (defeated)", "OUT (yenildi)"], UNDEC: ["UNDEC (undecided)", "UNDEC (kararsız)"] };
  const al = (r, i) => r.arguments[i].alias;
  const aliases = (r, xs) => xs.map((i) => al(r, i)).join(", ");

  function checkLabelling(e, ctx, input) {
    const r = ctx.r;
    const n = r.arguments.length;
    const lab = (i) => input[i];
    if (r.arguments.some((a, i) => !["IN", "OUT", "UNDEC"].includes(lab(i))))
      return { ok: false, msg: tx("Give every argument a label first.", "Önce her argümana bir etiket verin.") };
    const problems = [];
    for (let i = 0; i < n; i++) {
      const defs = r.attackers[i];
      const inDefs = defs.filter((d) => lab(d) === "IN"),
        undecDefs = defs.filter((d) => lab(d) === "UNDEC");
      const must = defs.every((d) => lab(d) === "OUT") ? "IN" : inDefs.length ? "OUT" : "UNDEC";
      if (lab(i) === must) continue;
      const A = al(r, i);
      if (lab(i) === "IN" && inDefs.length)
        problems.push(tx(`${A} is IN, but ${aliases(r, inDefs)}, which defeats it, is IN too. An argument with an IN defeater must be OUT.`, `${A} IN olarak etiketlenmiş, ama onu yenen argüman da IN: ${aliases(r, inDefs)}. IN olan bir argüman tarafından yenilen argüman OUT olmalıdır.`));
      else if (lab(i) === "IN")
        problems.push(tx(`${A} is IN, but ${aliases(r, undecDefs)}, which defeats it, is UNDEC rather than OUT. An argument is IN only when all its defeaters are OUT.`, `${A} IN, ama onu yenen ${aliases(r, undecDefs)} OUT değil, UNDEC. Bir argüman ancak onu yenenlerin hepsi OUT olduğunda IN olur.`));
      else if (lab(i) === "OUT" && !defs.length)
        problems.push(tx(`${A} is OUT, but nothing defeats it, so it must be IN.`, `${A} OUT, ama onu yenen hiçbir şey yok. Bu yüzden IN olmalı.`));
      else if (lab(i) === "OUT")
        problems.push(tx(`${A} is OUT, but none of the arguments that defeat it (${aliases(r, defs)}) is IN.`, `${A} OUT, ama onu yenen argümanların (${aliases(r, defs)}) hiçbiri IN değil.`));
      else if (must === "IN")
        problems.push(
          defs.length
            ? tx(`${A} is UNDEC, but every argument that defeats it is OUT, so it must be IN.`, `${A} UNDEC, ama onu yenen her argüman OUT. Bu yüzden IN olmalı.`)
            : tx(`${A} is UNDEC, but nothing defeats it, so it must be IN.`, `${A} UNDEC, ama onu yenen hiçbir şey yok. Bu yüzden IN olmalı.`),
        );
      else problems.push(tx(`${A} is UNDEC, but ${aliases(r, inDefs)}, which defeats it, is IN, so it must be OUT.`, `${A} UNDEC, ama onu yenen ${aliases(r, inDefs)} IN. Bu yüzden OUT olmalı.`));
    }
    if (problems.length) return { ok: false, msg: join([tx("This labelling is not complete.", "Bu etiketleme tam değil."), ...problems.slice(0, 4)]) };
    const ins = r.arguments.map((a, i) => i).filter((i) => lab(i) === "IN");
    const extNote = tx(`It is a complete labelling. Its IN arguments, {${aliases(r, ins)}}, form a complete extension.`, `Bu bir tam etiketleme. IN olan argümanları, {${aliases(r, ins)}}, bir tam kapsam oluşturur.`);
    if (e.goal === "grounded") {
      const diff = r.arguments.map((a, i) => i).filter((i) => lab(i) !== r.arguments[i].grounded);
      if (diff.length)
        return {
          ok: false,
          msg: join([
            extNote,
            tx(
              `But it is not the grounded labelling, which labels as few arguments IN as possible. ${diff.map((i) => `${al(r, i)} should be ${r.arguments[i].grounded}`).join(", ")}.`,
              `Ama bu, olabildiğince az argümanı IN olarak etiketleyen temelli etiketleme değil. ${diff.map((i) => `${al(r, i)} ${r.arguments[i].grounded} olmalı`).join(", ")}.`,
            ),
          ]),
        };
      return { ok: true, msg: join([extNote, tx("It is also the grounded labelling.", "Aynı zamanda temelli etiketlemedir.")]) };
    }
    const target = w(e.target, ctx.lang);
    const inTarget = bearers(r, target).filter((i) => lab(i) === "IN");
    if (!inTarget.length)
      return { ok: false, msg: join([extNote, tx(`But the argument for ${q(target)} is not IN here.`, `Ama burada ${q(target)} için kurulan argüman IN değil.`)]) };
    return {
      ok: true,
      msg: join([
        extNote,
        tx(`The argument ${aliases(r, inTarget)} for ${q(target)} is IN. Under preferred semantics this corresponds to one of the two preferred extensions.`, `${q(target)} için kurulan ${aliases(r, inTarget)} argümanı IN. Tercih edilen semantikte bu, iki tercih edilen kapsamdan birine karşılık gelir.`),
      ]),
    };
  }

  function defeatPairs(r) {
    const seen = new Set();
    const out = [];
    for (const [a, t] of r.defeats) {
      const key = a + ">" + t;
      if (!seen.has(key)) {
        seen.add(key);
        out.push([a, t]);
      }
    }
    return out;
  }

  function prepare(id, lang) {
    const e = exercise(id);
    const given = fill(e.given, lang);
    const ctx = context(lang, given, given, e.settings);
    return { r: ctx.r, pairs: ctx.r ? defeatPairs(ctx.r) : [] };
  }

  function exercise(id) {
    for (const l of LESSONS) for (const e of l.exercises) if (e.id === id) return e;
    throw new Error("unknown exercise " + id);
  }

  function evaluateAnswer(id, lang, input) {
    const e = exercise(id);
    const given = fill(e.given, lang);
    if (e.kind === "label") {
      const ctx = context(lang, given, given, e.settings);
      const out = checkLabelling(e, ctx, input);
      out.result = ctx.r;
      return out;
    }
    if (e.kind === "predict") {
      const ctx = context(lang, given, given, e.settings);
      const right = e.answer(ctx);
      const ok = input === right;
      const label = (v, lg) => {
        const c = e.choices.find((x) => (x.value || x) === v);
        return c && c.label ? c.label[lg] : statusWord(v, lg);
      };
      return {
        ok,
        msg: join([
          ok
            ? tx(`The engine agrees: ${label(right, "en")}.`, `Motor da aynı sonuca varıyor: ${label(right, "tr")}.`)
            : tx(`According to the engine, the answer is ${label(right, "en")}.`, `Motora göre doğru cevap: ${label(right, "tr")}.`),
          e.explain(ctx),
        ]),
        result: ctx.r,
      };
    }
    const ctx = context(lang, input, given, e.settings);
    if (ctx.error)
      return {
        ok: false,
        msg: tx(
          "The engine could not read the theory. " + (ctx.error.text ? ctx.error.text[0] : ctx.error.message),
          "Motor kuramı okuyamadı. " + (ctx.error.text ? ctx.error.text[1] : ctx.error.message),
        ),
        result: null,
      };
    const out = e.check(ctx);
    out.result = ctx.r;
    return out;
  }

  function graphModel(r, lang) {
    const nodes = [],
      edges = [];
    if (!r) return { nodes, edges };
    const byClaim = new Map();
    r.arguments.forEach((a, i) => (byClaim.get(a.conclusion) || byClaim.set(a.conclusion, []).get(a.conclusion)).push(i));
    for (const [claim, ids] of byClaim) {
      const s = statusOf(r, claim);
      const fact = ids.map((i) => r.arguments[i]).find((a) => a.kind === "premise" || a.kind === "axiom");
      nodes.push({
        id: "c:" + claim,
        label: claim,
        state: s === "JUSTIFIED" ? "IN" : s === "OVERRULED" ? "OUT" : "UNDEC",
        tag: fact ? (fact.kind === "axiom" ? k("axiom", lang) : k("premise", lang)).toUpperCase() : "",
        title: claim + ": " + statusWord(s, lang),
      });
    }
    const rules = new Map();
    r.arguments.forEach((a) => {
      if (a.rule && !rules.has(a.rule)) rules.set(a.rule, a);
    });
    for (const [name, a] of rules) {
      nodes.push({ id: "r:" + name, label: name + (a.kind === "strict" ? " →" : " ⇒"), shape: "ellipse", dashed: a.kind === "defeasible", title: a.text });
      [...new Set(a.children.map((c) => r.arguments[c].conclusion))].forEach((c) => edges.push({ source: "c:" + c, target: "r:" + name, kind: "derive" }));
      edges.push({ source: "r:" + name, target: "c:" + a.conclusion, kind: "derive" });
    }
    const seen = new Set();
    for (const a of r.attacks) {
      if (a.on !== r.arguments[a.target].key) continue;
      const from = "c:" + r.arguments[a.attacker].conclusion;
      const to = a.kind === "undercut" ? "r:" + r.arguments[a.target].rule : "c:" + r.arguments[a.target].conclusion;
      const key = from + "|" + to + "|" + a.succeeds;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: from, target: to, kind: a.succeeds ? "defeat" : "attack" });
    }
    return { nodes, edges };
  }

  return { LESSONS, SETTINGS, SYNTAX, SYNTAX_NOTE, LABELS, fill, fillText, exercise, evaluateAnswer, prepare, graphModel, statusWord, settingsText };
});

(function () {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const L = window.ArgForgeLearn;
  const KEY = "argforge-learn-progress";
  const lang = () => (document.documentElement.lang === "tr" ? "tr" : "en");
  let solved = {};
  try {
    solved = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch (e) {
    solved = {};
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(solved));
    } catch (e) {}
  };
  function el(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    for (const [key, v] of Object.entries(attrs || {})) {
      if (v === false || v === null || v === undefined) continue;
      if (key === "class") node.className = v;
      else node.setAttribute(key, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) node.append(kid instanceof Node ? kid : String(kid));
    return node;
  }
  const both = (t, tag = "span") => [el(tag, { class: "en" }, t.en), el(tag, { class: "tr" }, t.tr)];
  const bothFilled = (t, tag = "span") => [el(tag, { class: "en" }, L.fillText(t.en, "en")), el(tag, { class: "tr" }, L.fillText(t.tr, "tr"))];

  function progressText() {
    const total = L.LESSONS.reduce((n, l) => n + l.exercises.length, 0);
    const done = Object.keys(solved).filter((id) => solved[id]).length;
    return { en: `${done} of ${total} exercises solved`, tr: `${total} alıştırmadan ${done} tanesi çözüldü` };
  }

  function renderExercise(e, number) {
    const card = el("article", { class: "exercise", id: e.id });
    const badge = el("span", { class: "solved-badge", hidden: !solved[e.id] }, ...both({ en: "solved", tr: "çözüldü" }));
    card.append(el("h3", {}, ...both({ en: `Exercise ${number}`, tr: `Alıştırma ${number}` }), " ", badge));
    card.append(el("p", { class: "task" }, ...bothFilled(e.task)));
    card.append(el("p", { class: "settings-line" }, ...both(L.settingsText(e.settings))));
    const feedback = el("div", { class: "feedback", hidden: true, "aria-live": "polite" });
    const graph = el("div", { class: "mini-graph", hidden: true });
    let attempts = 0;
    const show = (out) => {
      feedback.hidden = false;
      feedback.className = "feedback " + (out.ok ? "good" : "again");
      feedback.replaceChildren(el("strong", {}, ...both(out.ok ? { en: "Correct. ", tr: "Doğru cevap. " } : { en: "Not yet. ", tr: "Henüz değil. " })), ...both(out.msg));
      if (out.result && window.ArgGraph) {
        graph.hidden = false;
        try {
          window.ArgGraph.render(graph, L.graphModel(out.result, lang()), { label: lang() === "tr" ? "İddialar ve kurallar" : "Claims and rules" });
          caption.hidden = false;
        } catch (err) {
          graph.hidden = true;
        }
      }
      if (out.ok) {
        solved[e.id] = true;
        save();
        badge.hidden = false;
        document.querySelectorAll(".learn-progress").forEach((n) => n.replaceChildren(...both(progressText())));
      }
    };
    if (e.kind === "label") {
      const inputs = {};
      for (const lg of ["en", "tr"]) {
        const block = el("div", { class: "lang-block " + lg });
        block.append(el("pre", { class: "given" }, L.fill(e.given, lg)));
        const prep = L.prepare(e.id, lg);
        {
          const table = el("table", { class: "syntax-table label-table" });
          const body = el("tbody");
          inputs[lg] = [];
          prep.r.arguments.forEach((a, i) => {
            const sel = el("select", { "aria-label": a.alias });
            sel.append(el("option", { value: "" }, "—"));
            for (const v of ["IN", "OUT", "UNDEC"]) sel.append(el("option", { value: v }, L.LABELS[v][lg === "tr" ? 1 : 0]));
            inputs[lg].push(sel);
            const shown = lg === "tr" ? a.text.replace(/^premise /, "öncül ").replace(/^axiom /, "aksiyom ") : a.text;
            body.append(el("tr", {}, el("td", {}, a.alias), el("td", {}, el("code", {}, shown)), el("td", {}, sel)));
          });
          table.append(body);
          block.append(el("div", { class: "table-wrap" }, table));
        }
        card.append(block);
      }
      const check = el("button", { type: "button", class: "primary" }, ...both({ en: "Check", tr: "Kontrol et" }));
      check.onclick = () => {
        attempts++;
        const lg = lang();
        const answer = inputs[lg].map((x) => x.value);
        show(L.evaluateAnswer(e.id, lg, answer));
      };
      const hint = el("button", { type: "button" }, ...both({ en: "Hint", tr: "İpucu" }));
      hint.onclick = () => show({ ok: false, msg: { en: L.fillText(e.hint.en, "en"), tr: L.fillText(e.hint.tr, "tr") } });
      card.append(el("div", { class: "actions" }, check, hint));
    } else if (e.kind === "predict") {
      card.append(el("pre", { class: "given en" }, L.fill(e.given, "en")), el("pre", { class: "given tr" }, L.fill(e.given, "tr")));
      const group = el("div", { class: "choices", role: "radiogroup" });
      for (const c of e.choices) {
        const value = c.value || c;
        const input = el("input", { type: "radio", name: e.id, value: value });
        const label = c.label || { en: L.statusWord(c, "en"), tr: L.statusWord(c, "tr") };
        group.append(el("label", { class: "choice" }, input, " ", ...both(label)));
      }
      card.append(group);
      const check = el("button", { type: "button", class: "primary" }, ...both({ en: "Check", tr: "Kontrol et" }));
      check.onclick = () => {
        const picked = group.querySelector("input:checked");
        if (!picked) {
          show({ ok: false, msg: { en: "Choose an answer first.", tr: "Önce bir cevap seçin." } });
          return;
        }
        attempts++;
        show(L.evaluateAnswer(e.id, lang(), picked.value));
      };
      const hint = el("button", { type: "button" }, ...both({ en: "Hint", tr: "İpucu" }));
      hint.onclick = () => show({ ok: false, msg: { en: L.fillText(e.hint.en, "en"), tr: L.fillText(e.hint.tr, "tr") } });
      card.append(el("div", { class: "actions" }, check, hint));
    } else {
      const editors = {};
      for (const lg of ["en", "tr"]) {
        editors[lg] = el("textarea", { class: "editor " + lg, rows: 6, spellcheck: "false", "aria-label": lg === "en" ? "Theory" : "Kuram" });
        editors[lg].value = L.fill(e.given, lg) + (e.given ? "\n" : "");
        card.append(editors[lg]);
      }
      const check = el("button", { type: "button", class: "primary" }, ...both({ en: "Check", tr: "Kontrol et" }));
      check.onclick = () => {
        attempts++;
        show(L.evaluateAnswer(e.id, lang(), editors[lang()].value));
        solution.hidden = attempts < 2;
      };
      const hint = el("button", { type: "button" }, ...both({ en: "Hint", tr: "İpucu" }));
      hint.onclick = () => show({ ok: false, msg: { en: L.fillText(e.hint.en, "en"), tr: L.fillText(e.hint.tr, "tr") } });
      const reset = el("button", { type: "button" }, ...both({ en: "Start again", tr: "Baştan başla" }));
      reset.onclick = () => {
        editors[lang()].value = L.fill(e.given, lang()) + (e.given ? "\n" : "");
        feedback.hidden = true;
        graph.hidden = true;
      };
      const solution = el("button", { type: "button", hidden: true }, ...both({ en: "Show a solution", tr: "Bir çözüm göster" }));
      solution.onclick = () => {
        editors[lang()].value = L.fill(e.solution, lang()) + "\n";
        show({
          ok: false,
          msg: {
            en: "Here is one possible solution. Other answers can be correct too. Press Check to see what the engine says.",
            tr: "Olası çözümlerden biri kutuda. Başka cevaplar da doğru olabilir. Motorun ne dediğini görmek için Kontrol et düğmesine basın.",
          },
        });
      };
      card.append(el("div", { class: "actions" }, check, hint, reset, solution));
    }
    const caption = el("p", { class: "graph-caption", hidden: true }, ...both({
      en: "Claims and rules: arguments with the same conclusion are drawn as one box. Red arrows are successful attacks, dashed arrows failed ones.",
      tr: "İddialar ve kurallar: aynı sonuca varan argümanlar tek kutuda gösterilir. Kırmızı oklar başarılı, kesikli oklar başarısız saldırılardır.",
    }));
    card.append(feedback, graph, caption);
    return card;
  }

  function render() {
    const root = document.getElementById("learn");
    if (!root) return;
    const toc = el("ol", { class: "learn-toc" });
    const body = [];
    let number = 0;
    L.LESSONS.forEach((lesson, n) => {
      toc.append(el("li", {}, el("a", { href: "#" + lesson.id }, ...both(lesson.title))));
      const section = el("section", { class: "lesson", id: lesson.id });
      section.append(el("h2", {}, `${n + 1}. `, ...both(lesson.title)));
      section.append(el("p", {}, ...both(lesson.intro)));
      lesson.exercises.forEach((e) => section.append(renderExercise(e, ++number)));
      body.push(section);
    });
    const reset = el("button", { type: "button", class: "linkish" }, ...both({ en: "Clear my progress", tr: "İlerlememi sil" }));
    reset.onclick = () => {
      solved = {};
      save();
      document.querySelectorAll(".solved-badge").forEach((b) => (b.hidden = true));
      document.querySelectorAll(".learn-progress").forEach((p) => p.replaceChildren(...both(progressText())));
    };
    const syntax = el("section", { class: "lesson syntax", id: "syntax" });
    syntax.append(el("h2", {}, ...both({ en: "Syntax at a glance", tr: "Sözdizimi özeti" })));
    syntax.append(el("p", {}, ...both(L.SYNTAX_NOTE)));
    for (const lg of ["en", "tr"]) {
      const table = el("table", { class: "syntax-table " + lg });
      table.append(el("thead", {}, el("tr", {}, el("th", {}, lg === "en" ? "Declaration" : "Bildirim"), el("th", {}, lg === "en" ? "How to write it" : "Nasıl yazılır"), el("th", {}, lg === "en" ? "Meaning" : "Anlamı"))));
      const body = el("tbody");
      for (const [name, code, meaning] of L.SYNTAX) body.append(el("tr", {}, el("td", {}, name[lg]), el("td", {}, el("code", {}, L.fill(code, lg))), el("td", {}, meaning[lg])));
      table.append(body);
      syntax.append(el("div", { class: "table-wrap " + lg }, table));
    }
    const syntaxLink = el("p", { class: "toc-syntax" }, el("a", { href: "#syntax" }, ...both({ en: "Syntax at a glance", tr: "Sözdizimi özeti" })));
    root.replaceChildren(
      el("section", {}, el("h2", {}, ...both({ en: "Learn structured argumentation", tr: "Yapılandırılmış argümantasyonu öğrenin" })),
        el("p", {}, ...both({
          en: "Short lessons on ASPIC+, each followed by exercises. Write a small theory or choose an answer, then press Check. The ArgForge engine evaluates your answer and explains what happened. Any answer that reaches the goal is accepted, not only the sample solution. Each exercise shows the settings it uses. Start with the syntax summary below if the notation is new to you.",
          tr: "ASPIC+ üzerine kısa dersler ve her dersin ardından alıştırmalar. Küçük bir kuram yazın ya da bir cevap seçin, sonra Kontrol et düğmesine basın. ArgForge motoru cevabınızı değerlendirir ve ne olduğunu açıklar. Yalnızca örnek çözüm değil, hedefe ulaşan her cevap kabul edilir. Her alıştırma kullandığı ayarları gösterir. Yazım biçimi size yeniyse aşağıdaki sözdizimi özetiyle başlayın.",
        })),
        el("p", { class: "learn-progress" }, ...both(progressText())), syntaxLink, toc, reset),
      syntax,
      ...body,
    );
  }
  function watchLanguage() {
    new MutationObserver(() => {
      document.querySelectorAll(".exercise .feedback, .exercise .mini-graph, .exercise .graph-caption").forEach((n) => (n.hidden = true));
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  function start() {
    render();
    watchLanguage();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
