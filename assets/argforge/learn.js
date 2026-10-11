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
        en = `their premises are compared: ${set(pa)} against ${set(pv)}`;
        tr = `öncülleri karşılaştırılır: ${set(pa)} ile ${set(pv)}`;
      } else if (!pa.length && !pv.length) {
        en = `all their defeasible rules are compared: ${set(ra)} against ${set(rv)}`;
        tr = `bütün feshedilebilir kuralları karşılaştırılır: ${set(ra)} ile ${set(rv)}`;
      } else {
        en = `both their defeasible rules (${set(ra)} against ${set(rv)}) and their premises (${set(pa)} against ${set(pv)}) are compared`;
        tr = `hem feshedilebilir kuralları (${set(ra)} ile ${set(rv)}) hem de öncülleri (${set(pa)} ile ${set(pv)}) karşılaştırılır`;
      }
      return tx(
        `Under weakest link with ${dem ? "democratic" : "elitist"} comparison, ${en}. ${a.alias} comes out weaker, so its attack fails.`,
        `En zayıf halkada ${dem ? "demokratik" : "elitist"} karşılaştırmayla ${tr}. ${a.alias} daha zayıf kaldığı için saldırısı başarısız olur.`,
      );
    }
    const la = lastDef(r, attack.attacker),
      lv = lastDef(r, witnessOf(r, attack));
    if (la.length || lv.length) {
      const extra = la.length && !lv.length;
      return tx(
        `Under last link, the last defeasible rules of the two arguments are compared: ${set(la)} for ${a.alias} and ${set(lv)} for ${v.alias}. ${a.alias} comes out weaker, so its attack fails.${extra ? " A non-empty set always counts as weaker than an empty one." : ""}`,
        `Son halkada iki argümanın son feshedilebilir kuralları karşılaştırılır: ${a.alias} için ${set(la)}, ${v.alias} için ${set(lv)}. ${a.alias} daha zayıf kaldığı için saldırısı başarısız olur.${extra ? " Boş olmayan bir küme, boş kümeden her zaman daha zayıf sayılır." : ""}`,
      );
    }
    return tx(
      `Neither argument uses a defeasible rule, so their premises are compared: ${set(a.premises)} against ${set(v.premises)}. ${a.alias} comes out weaker, so its attack fails.`,
      `İki argüman da feshedilebilir kural kullanmadığı için öncülleri karşılaştırılır: ${set(a.premises)} ile ${set(v.premises)}. ${a.alias} daha zayıf kaldığı için saldırısı başarısız olur.`,
    );
  }

  function attackLine(r, attack) {
    const a = r.arguments[attack.attacker],
      t = r.arguments[attack.target];
    const ok = attack.succeeds;
    return tx(
      `${a.alias} (${a.conclusion}) ${KIND[attack.kind][0]} ${t.alias} (${t.conclusion}), ${ok ? "and the attack succeeds" : "but the attack fails"}.`,
      `${a.alias} (${a.conclusion}), ${t.alias} (${t.conclusion}) argümanının ${KIND[attack.kind][1]} ${ok ? "ve saldırı başarılı oluyor" : "ama saldırı başarısız oluyor"}.`,
    );
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
      `Settings: ${SEM[st.semantics][0]} semantics · ${st.ordering === "last_link" ? "last link" : "weakest link"} · ${st.setOrdering} comparison · contrapositives ${st.transposition ? "added" : "not added"}`,
      `Ayarlar: ${SEM[st.semantics][1]} semantik · ${st.ordering === "last_link" ? "son halka" : "en zayıf halka"} · ${st.setOrdering === "elitist" ? "elitist" : "demokratik"} karşılaştırma · ters yönlü hâller ${st.transposition ? "ekleniyor" : "eklenmiyor"}`,
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
            if (statusOf(ctx.r, c) === "JUSTIFIED" && fact)
              return {
                ok: true,
                msg: tx(
                  `Your premise forms the argument A1 for ${q(c)}. Nothing attacks it, so the claim is justified.`,
                  `Öncülünüz ${q(c)} için A1 argümanını oluşturdu. Ona saldıran bir şey olmadığı için iddia gerekçelendirilmiş oldu.`,
                ),
              };
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
            const viaRule = ctx.r.arguments.find((a) => a.conclusion === c && a.kind === "defeasible");
            if (statusOf(ctx.r, c) === "JUSTIFIED" && viaRule)
              return {
                ok: true,
                msg: tx(
                  `The argument ${viaRule.alias} applies the rule ${viaRule.rule} to the premise ${q(rn)}. Nothing attacks it, so ${q(c)} is justified.`,
                  `${viaRule.alias} argümanı, ${viaRule.rule} kuralını ${q(rn)} öncülüne uyguluyor. Ona saldıran bir şey olmadığı için ${q(c)} gerekçelendirilmiş oldu.`,
                ),
              };
            if (ctx.r.arguments.find((a) => a.conclusion === c && a.kind === "strict"))
              return {
                ok: false,
                msg: tx(
                  "That is a strict rule (->). The conclusion comes out right, but a strict rule says that rain always makes the streets wet. Rain usually does, not always, so use a defeasible rule (=>).",
                  "Bu bir katı kural (->). Sonuç doğru çıkıyor, ama katı kural yağmurun sokakları her zaman ıslattığını söyler. Yağmur sokakları genellikle ıslatır, her zaman değil. O yüzden feshedilebilir bir kural (=>) kullanın.",
                ),
              };
            if (statusOf(ctx.r, c) === "JUSTIFIED")
              return {
                ok: false,
                msg: tx(
                  `Right now ${q(c)} is justified only because you declared it directly. The task is to derive it from ${q(rn)} with a rule.`,
                  `Şu anda ${q(c)} yalnızca onu doğrudan bildirdiğiniz için gerekçelendirilmiş. Görev, bu sonucu ${q(rn)} ifadesinden bir kuralla türetmek.`,
                ),
              };
            return {
              ok: false,
              msg: join([claimLine(ctx.r, c), tx(`Add a defeasible rule whose condition is ${q(rn)} and whose conclusion is ${q(c)}.`, `Koşulu ${q(rn)}, sonucu ${q(c)} olan feshedilebilir bir kural ekleyin.`)]),
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
            const c = w("slippery", ctx.lang);
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const chained = ctx.r.arguments.find((a) => a.conclusion === c && a.defeasibleRules.length >= 2);
            if (statusOf(ctx.r, c) === "JUSTIFIED" && chained)
              return {
                ok: true,
                msg: tx(
                  `The argument ${chained.alias} is built in two steps and uses the rules ${chained.defeasibleRules.join(" and ")}. So ${q(c)} is justified.`,
                  `${chained.alias} argümanı iki adımda kuruluyor ve ${chained.defeasibleRules.join(" ile ")} kurallarını kullanıyor. Böylece ${q(c)} gerekçelendirilmiş oldu.`,
                ),
              };
            if (statusOf(ctx.r, c) === "JUSTIFIED")
              return {
                ok: false,
                msg: tx(
                  `Right now ${q(c)} is justified, but in a single step. Go through ${q(w("wet", "en"))} first and only then to ${q(c)}.`,
                  `Şu anda ${q(c)} gerekçelendirilmiş, ama tek adımda. Önce ${q(w("wet", "tr"))} ifadesine, oradan da ${q(c)} ifadesine gidin.`,
                ),
              };
            return { ok: false, msg: join([claimLine(ctx.r, c), claimLine(ctx.r, w("wet", ctx.lang))]) };
          },
        },
      ],
    },
    {
      id: "rebut",
      title: tx("Negation and rebutting", "Olumsuzlama ve sonuca saldırı"),
      intro: tx(
        "The statement -x is the negation of x. An argument for -x attacks an argument that reaches x through a defeasible rule. This kind of attack is called rebutting. A conclusion reached through a strict rule cannot be rebutted.",
        "-x ifadesi x'in değilidir. -x için kurulan bir argüman, x sonucuna feshedilebilir bir kuralla varan argümana saldırır. Bu saldırı türüne sonuca saldırı denir. Katı bir kuralla elde edilen bir sonuca bu şekilde saldırılamaz.",
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
            const att = ctx.r.attacks.find((a) => a.kind === "rebut" && ctx.r.arguments[a.target].conclusion === c);
            if (att)
              return {
                ok: true,
                msg: join([
                  attackLine(ctx.r, att),
                  claimLine(ctx.r, c),
                  tx(
                    "Arguments for x and -x rebut each other. When there is no preference between them, neither can win.",
                    "x ve -x için kurulan argümanlar birbirinin sonucuna saldırır. Aralarında bir tercih yoksa hiçbiri kazanamaz.",
                  ),
                ]),
              };
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
                `Nothing attacks the argument for ${q(c)} yet. The attacking argument must conclude ${q("-" + c)}.`,
                `${q(c)} için kurulan argümana henüz saldıran bir şey yok. Saldıran argümanın sonucu ${q("-" + c)} olmalı.`,
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
            if (win && statusOf(ctx.r, c) !== "JUSTIFIED")
              return {
                ok: true,
                msg: join([
                  attackLine(ctx.r, win),
                  claimLine(ctx.r, c),
                  tx(
                    "An argument that uses no defeasible rule does not count as weaker than the premise, so the attack succeeds. The premise attacks back, so both end up undecided.",
                    "Feshedilebilir kural kullanmayan bir argüman öncülden zayıf sayılmaz, bu yüzden saldırı başarılı oldu. Öncül de karşılık verdiği için ikisi de kararsız kaldı.",
                  ),
                ]),
              };
            if (on.length) return { ok: false, msg: join([attackLine(ctx.r, on[0]), whyFailed(ctx.r, on[0])]) };
            return {
              ok: false,
              msg: tx(
                `Nothing attacks the premise ${q(b)} yet. You need an argument whose conclusion is ${q("-" + b)}.`,
                `${q(b)} öncülüne henüz saldıran bir şey yok. Sonucu ${q("-" + b)} olan bir argümana ihtiyacınız var.`,
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
            const c = w("flies", ctx.lang);
            if (!keptGiven(ctx)) return { ok: false, msg: missingGiven };
            const cut = ctx.r.attacks.find((a) => a.kind === "undercut" && a.succeeds);
            if (cut && statusOf(ctx.r, c) === "OVERRULED")
              return {
                ok: true,
                msg: join([
                  attackLine(ctx.r, cut),
                  claimLine(ctx.r, c),
                  tx(
                    `An undercut does not argue for ${q("-" + w("flies", "en"))}. It only says that r1 does not work here. The argument for ${q(w("flies", "en"))} is defeated and nothing else supports it.`,
                    `Kurala saldırı ${q("-" + w("flies", "tr"))} için bir argüman kurmaz, yalnızca r1 kuralının burada işlemediğini söyler. Böylece ${q(w("flies", "tr"))} için kurulan argüman yenilir ve onu destekleyen başka bir argüman kalmaz.`,
                  ),
                ]),
              };
            if (ctx.r.attacks.some((a) => a.kind === "rebut"))
              return {
                ok: false,
                msg: join([
                  claimLine(ctx.r, c),
                  tx("That attacks the conclusion. Attack the rule itself instead: the conclusion of your rule should be -r1.", "Bu, sonuca saldırıyor. Bunun yerine kuralın kendisine saldırın: kuralınızın sonucu -r1 olmalı."),
                ]),
              };
            return {
              ok: false,
              msg: join([claimLine(ctx.r, c), tx("There is no undercut yet. The conclusion of your rule should be -r1.", "Henüz kurala bir saldırı yok. Kuralınızın sonucu -r1 olmalı.")]),
            };
          },
        },
      ],
    },
    {
      id: "preferences",
      title: tx("Preferences and defeat", "Tercihler ve yenilgi"),
      intro: tx(
        "Preferences decide the outcome of attacks between arguments. Writing [prefer_rule: r2 > r1] makes the rule r2 stronger than r1, and [prefer_premise: a > b] makes the premise a more reliable than b. A rebut or an undermine fails when the attacker is weaker. An attack that succeeds is called a defeat. Undercuts, and attacks through a one-way contrary, are not affected by preferences.",
        "Tercihler, argümanlar arasındaki saldırıların sonucunu belirler. [kural_tercihi: r2 > r1] yazdığınızda r2 kuralı r1'den güçlü olur. [öncül_tercihi: a > b] ise a öncülünü b'den daha güvenilir kılar. Saldıran argüman daha zayıfsa sonuca ve öncüle yapılan saldırılar başarısız olur. Başarılı bir saldırıya yenilgi denir. Kurala saldırılar ve tek yönlü bir karşıtlık üzerinden yapılan saldırılar ise tercihlerden etkilenmez.",
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
            "In this theory r1 is preferred to r2, while r2 undercuts r1. Is {flies} still overruled?",
            "Bu kuramda r1, r2'ye tercih ediliyor. Öte yandan r2, r1 kuralına saldırıyor. {flies} hâlâ reddedilmiş mi?",
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
        "Negation is not the only kind of conflict. Writing [contradictory: a ^ b] declares that a and b exclude each other, so arguments for them attack each other, just like x and -x. [contrary: a ^ b] works in one direction only: a attacks b, but b does not attack a. Attacks through a contrary are not affected by preferences.",
        "Çatışmanın tek biçimi olumsuzlama değildir. [çelişik: a ^ b] yazdığınızda a ile b birbirini dışlar. Bu ifadeler için kurulan argümanlar, tıpkı x ile -x gibi, birbirine saldırır. [karşıt: a ^ b] ise tek yönlüdür: a, b'ye saldırır ama b, a'ya saldırmaz. Karşıtlık üzerinden yapılan saldırılar tercihlerden etkilenmez.",
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
            const won = ctx.r.attacks.filter((a) => a.succeeds);
            const one = (x, y) => won.some((a) => ctx.r.arguments[a.attacker].conclusion === x && ctx.r.arguments[a.target].conclusion === y);
            if (one(g, i) && one(i, g)) return { ok: true, msg: join([...lines(ctx.r), claimLine(ctx.r, g), claimLine(ctx.r, i)]) };
            if (one(g, i) || one(i, g))
              return {
                ok: false,
                msg: join([
                  ...lines(ctx.r),
                  tx("The attack runs in one direction only, which makes it a contrary. Here the two statements should attack each other.", "Saldırı yalnızca tek yönde ilerliyor, bu da onu bir karşıtlık yapar. Burada iki ifadenin birbirine saldırması gerekiyor."),
                ]),
              };
            return { ok: false, msg: tx("There is no attack between the two premises yet. Declare a conflict between them.", "İki öncül arasında henüz bir saldırı yok. Aralarında bir çatışma bildirin.") };
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
            const back = ctx.r.attacks.some((a) => ctx.r.arguments[a.attacker].conclusion === g && ctx.r.arguments[witnessOf(ctx.r, a)].conclusion === al);
            const base = [...lines(ctx.r), claimLine(ctx.r, g)];
            if (back)
              return {
                ok: false,
                msg: join([
                  ...base,
                  tx(`${q(g)} also attacks ${q(al)}, so the conflict runs both ways. Make it one-way.`, `${q(g)} da ${q(al)} öncülüne saldırıyor, yani çatışma iki yönlü. Onu tek yönlü yapın.`),
                ]),
              };
            return { ok: statusOf(ctx.r, g) === "OVERRULED", msg: join(base) };
          },
        },
        {
          id: "conflicts-3",
          kind: "predict",
          task: tx(
            "Now the evidence that the suspect was seen at the scene is preferred to the alibi. Does this preference change the result? Is {guilty} still overruled?",
            "Şimdi şüphelinin olay yerinde görüldüğüne dair kanıt, tanık ifadesine tercih ediliyor. Bu tercih sonucu değiştirir mi? {guilty} hâlâ reddedilmiş mi?",
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
        "A semantics decides which sets of arguments can be accepted together. These sets are called extensions. Grounded semantics is cautious and always gives exactly one extension. Preferred semantics looks for the largest sets that can defend themselves, so there may be several. Stable semantics asks an extension to defeat every argument outside it, and sometimes no such set exists. A claim is justified if every extension supports it, and defensible if only some do.",
        "Semantik, hangi argüman kümelerinin birlikte kabul edilebileceğini belirler. Bu kümelere kapsam denir. Temelli semantik temkinlidir ve her zaman tek bir kapsam verir. Tercih edilen semantik, kendini savunabilen en büyük kümeleri arar, bu yüzden birden fazla kapsam çıkabilir. Kararlı semantik ise bir kapsamın, dışında kalan her argümanı yenmesini ister. Bazen böyle bir küme hiç bulunmaz. Bir iddia her kapsamda destekleniyorsa gerekçelendirilmiştir. Yalnızca bazı kapsamlarda destekleniyorsa savunulabilirdir.",
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
            const n = ctx.r.extensions.length;
            if (n === 0)
              return {
                ok: true,
                msg: tx(
                  "The defeats form a cycle with an odd number of links. A set that defeats every argument outside it would have to contain some argument together with the argument that defeats it. Such a set cannot exist, so stable semantics has no extension.",
                  "Yenilgiler, tek sayıda halkadan oluşan bir döngü oluşturuyor. Dışındaki her argümanı yenen bir küme, bir argümanı onu yenen argümanla birlikte içermek zorunda kalırdı. Böyle bir küme olamayacağı için kararlı semantiğin kapsamı yok.",
                ),
              };
            return {
              ok: false,
              msg: tx(
                `Stable semantics still has ${n} extension(s). The defeats between the three premises should form a circle, each running in one direction.`,
                `Kararlı semantiğin hâlâ ${n} kapsamı var. Üç öncül arasındaki yenilgiler, her biri tek yönlü olacak şekilde bir daire oluşturmalı.`,
              ),
            };
          },
        },
      ],
    },
    {
      id: "orderings",
      title: tx("Last link and weakest link", "Son halka ve en zayıf halka"),
      intro: tx(
        "When the outcome of an attack depends on preferences, the two arguments have to be compared. Last link looks only at the final step of each argument, its last defeasible rule. Weakest link looks at all of an argument's defeasible rules, and at its premises too when it has any. In this view an argument is only as strong as its weakest step.",
        "Bir saldırının sonucu tercihlere bağlıysa iki argümanın karşılaştırılması gerekir. Son halka yalnızca her argümanın son adımına, yani son feshedilebilir kuralına bakar. En zayıf halka ise argümanın bütün feshedilebilir kurallarına bakar, öncülü olan argümanlarda öncüllere de. Bu yaklaşıma göre bir argüman en zayıf adımı kadar güçlüdür.",
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
            return { ok: statusOf(ctx.r, "p") === "JUSTIFIED", msg: join([...lines(ctx.r), ...failures(ctx.r), claimLine(ctx.r, "p")]) };
          },
        },
      ],
    },
    {
      id: "sets",
      title: tx("Elitist and democratic comparison", "Elitist ve demokratik karşılaştırma"),
      intro: tx(
        "Weakest link compares sets of rules, and there are two ways to say that one set is weaker than another. With elitist comparison, a set X is weaker if one of its members is weaker than every member of Y. With democratic comparison, every member of X has to be weaker than at least one member of Y. The theories below use axioms, so only the rules are compared.",
        "En zayıf halka kural kümelerini karşılaştırır. Bir kümenin diğerinden zayıf olduğunu söylemenin iki yolu vardır. Elitist karşılaştırmada X kümesinin bir üyesi Y'nin bütün üyelerinden zayıfsa X daha zayıftır. Demokratik karşılaştırmada ise X'in her üyesi Y'nin en az bir üyesinden zayıf olmalıdır. Aşağıdaki kuramlarda aksiyom kullanıldığı için yalnızca kurallar karşılaştırılır.",
      ),
      exercises: [
        {
          id: "sets-1",
          kind: "predict",
          task: tx(
            "“p” is reached with the rules r1 and r2, and “-p” with the rule r3. The rule r3 is stronger than r1, and r2 is stronger than r3. Under weakest link with elitist comparison, which claim is justified?",
            "“p” iddiası r1 ve r2 kurallarıyla, “-p” iddiası ise r3 kuralıyla elde ediliyor. r3 kuralı r1'den, r2 kuralı da r3'ten güçlü. En zayıf halka ve elitist karşılaştırmaya göre hangi iddia gerekçelendirilmiştir?",
          ),
          settings: { ordering: "weakest_link", setOrdering: "elitist" },
          given: "[<axiom>: a]\n[<axiom>: c]\n[<defeasible> r1: a => b]\n[<defeasible> r2: b => p]\n[<defeasible> r3: c => -p]\n[<prefer_rule>: r3 > r1]\n[<prefer_rule>: r2 > r3]",
          choices: PCHOICES,
          hint: tx("Is one of the rules of “p” weaker than every rule of “-p”?", "“p” argümanının kurallarından biri, “-p” argümanının bütün kurallarından zayıf mı?"),
          answer: (ctx) => pick(ctx.r),
          explain() {
            return tx(
              "With elitist comparison it is enough that r1 is weaker than r3, the only rule of “-p”. So {r1, r2} counts as weaker than {r3}, and “p” loses. In the end “-p” is justified.",
              "Elitist karşılaştırmada r1'in, “-p” argümanının tek kuralı olan r3'ten zayıf olması yeterlidir. Bu yüzden {r1, r2} kümesi {r3} kümesinden zayıf sayılır ve “p” kaybeder. Sonuçta “-p” gerekçelendirilir.",
            );
          },
        },
        {
          id: "sets-2",
          kind: "predict",
          task: tx("The same theory, this time with democratic comparison. Which claim is justified now?", "Aynı kuram, bu kez demokratik karşılaştırmayla. Şimdi hangi iddia gerekçelendirilmiştir?"),
          settings: { ordering: "weakest_link", setOrdering: "democratic" },
          given: "[<axiom>: a]\n[<axiom>: c]\n[<defeasible> r1: a => b]\n[<defeasible> r2: b => p]\n[<defeasible> r3: c => -p]\n[<prefer_rule>: r3 > r1]\n[<prefer_rule>: r2 > r3]",
          choices: PCHOICES,
          hint: tx("Is every rule of “p” weaker than some rule of “-p”? And what about the other way round?", "“p” argümanının her kuralı, “-p” argümanının bir kuralından zayıf mı? Peki tersi?"),
          answer: (ctx) => pick(ctx.r),
          explain() {
            return tx(
              "With democratic comparison, r2 is not weaker than r3, so {r1, r2} does not count as weaker. On the other hand r3 is weaker than r2, so {r3} counts as weaker than {r1, r2}. This time “-p” loses and “p” is justified. The same preferences gave the opposite result.",
              "Demokratik karşılaştırmada r2, r3'ten zayıf olmadığı için {r1, r2} kümesi zayıf sayılmaz. Buna karşılık r3, r2'den zayıftır ve {r3} kümesi {r1, r2} kümesinden zayıf sayılır. Bu kez “-p” kaybeder ve “p” gerekçelendirilir. Aynı tercihler tam tersi bir sonuç verdi.",
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
            const base = [...lines(ctx.r), ...failures(ctx.r), claimLine(ctx.r, c)];
            if (statusOf(ctx.r, c) === "OVERRULED") return { ok: true, msg: join(base) };
            if (statusOf(ctx.r, c) === "UNDECIDED")
              return {
                ok: false,
                msg: join([
                  ...base,
                  tx("Close. The picnic is now contested, but not overruled. Your attack has to win, not just draw.", "Yaklaştınız. Piknik artık tartışmalı hâle geldi, ama reddedilmedi. Saldırınızın berabere kalması değil, kazanması gerekiyor."),
                ]),
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
            const base = [...lines(ctx.r), ...failures(ctx.r), claimLine(ctx.r, c)];
            if (statusOf(ctx.r, c) === "JUSTIFIED")
              return {
                ok: true,
                msg: join([
                  ...base,
                  tx(
                    `The argument against ${q(c)} is defeated, so the argument for ${q(c)} is defended again. This is called reinstatement.`,
                    `${q(c)} iddiasına karşı olan argüman yenildiği için ${q(c)} argümanı yeniden savunuluyor. Buna yeniden kazanım denir.`,
                  ),
                ]),
              };
            return { ok: false, msg: join(base) };
          },
        },
      ],
    },
    {
      id: "consistency",
      title: tx("Consistency and contrapositives", "Tutarlılık ve ters yönlü hâller"),
      intro: tx(
        "Strict rules work in both directions: if p -> q holds and q is false, then p must be false as well. ASPIC+ guarantees consistent results only when the strict rules are closed under contrapositives, and ArgForge can add these for you. Without them, a theory may accept both a statement and its negation.",
        "Katı kuralların sonuçları iki yönde işler. p -> q doğruysa ve q yanlışsa p de yanlış olmalıdır. ASPIC+, sonuçların tutarlı olmasını ancak katı kurallar ters yönlü hâllerine göre kapalıysa güvence altına alır. ArgForge bu hâlleri sizin yerinize ekleyebilir. Eklenmezlerse bir kuram hem bir ifadeyi hem de onun değilini kabul edebilir.",
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
          hint: tx("Can “-q” attack “q”, which is a strict conclusion? Can the argument for “q” defeat the premise “-q”?", "“-q”, katı bir sonuç olan “q” iddiasına saldırabilir mi? “q” argümanı “-q” öncülünü yenebilir mi?"),
          answer: (ctx) => pq(ctx.r),
          explain(ctx) {
            return join([
              ...lines(ctx.r),
              ...failures(ctx.r),
              tx(
                "A strict conclusion cannot be attacked, so “-q” cannot touch “q”. The attack of “q” on the premise “-q” fails as well, because “-q” is preferred. Both survive, and the result is inconsistent.",
                "Katı bir sonuca saldırılamadığı için “-q”, “q” iddiasına dokunamaz. “q” argümanının “-q” öncülüne saldırısı da “-q” tercih edildiği için başarısız olur. İkisi de ayakta kalır ve sonuç tutarsız olur.",
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
  ];

  function exercise(id) {
    for (const l of LESSONS) for (const e of l.exercises) if (e.id === id) return e;
    throw new Error("unknown exercise " + id);
  }

  function evaluateAnswer(id, lang, input) {
    const e = exercise(id);
    const given = fill(e.given, lang);
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

  return { LESSONS, SETTINGS, SYNTAX, SYNTAX_NOTE, fill, fillText, exercise, evaluateAnswer, graphModel, statusWord, settingsText };
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
          window.ArgGraph.render(graph, L.graphModel(out.result, lang()), { label: "Argument graph" });
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
    if (e.kind === "predict") {
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
    card.append(feedback, graph);
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
      document.querySelectorAll(".exercise .feedback, .exercise .mini-graph").forEach((n) => (n.hidden = true));
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  function start() {
    render();
    watchLanguage();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
