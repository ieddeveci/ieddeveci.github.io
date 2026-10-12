"use strict";

(() => {
  const AF = window.ArgForge;
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, text) => {
    const e =
      tag === "svg" ||
      ["g", "rect", "text", "tspan", "path", "marker", "defs", "line", "title"].includes(tag)
        ? document.createElementNS(NS, tag)
        : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const TR = {
    "ArgForge — structured argumentation in your browser":
      "ArgForge — tarayıcınızda yapılandırılmış argümantasyon",
    "Write or generate a theory of premises, rules and preferences. See which arguments survive.":
      "Öncüller, kurallar ve tercihlerden oluşan bir kuram yazın ya da üretin. Hangi argümanların ayakta kaldığını görün.",
    "Source on GitHub": "GitHub'daki kaynak",
    "Generate a random theory": "Rastgele bir kuram üret",
    Cancel: "İptal",
    "Evaluating… {s} s": "Değerlendiriliyor… {s} sn",
    "Evaluation cancelled. It runs again when you change something, or press “Evaluate again”.":
      "Değerlendirme iptal edildi. Bir şeyi değiştirdiğinizde ya da “Yeniden değerlendir”e bastığınızda tekrar çalışır.",
    "Evaluate again": "Yeniden değerlendir",
    "Show failed attacks": "Başarısız saldırıları göster",
    "Graph for the claim {c}": "{c} iddiasının grafiği",
    "Graph of the arguments that bear on this claim": "Bu iddiayla ilgili argümanların grafiği",
    "{n} arguments bear on this claim; too many to draw.":
      "Bu iddiayla ilgili {n} argüman var. Hepsini çizmek için çok fazla.",
    "The claim's arguments with their immediate connections only: what each is directly built from, and the arguments that attack it or that it attacks. Colours show each argument's label; click one to follow its own connections.":
      "Yalnızca iddianın argümanları ve doğrudan bağlantıları: her birinin doğrudan neyden kurulduğu ve ona saldıran ya da onun saldırdığı argümanlar. Renkler her argümanın etiketini gösterir. Bir argümanın kendi bağlantılarını izlemek için ona tıklayın.",
    "{x} attacks {y}, but the attack fails":
      "{x}, {y} argümanına saldırır ama saldırı başarısız olur",
    " (on {w})": " ({w} üzerinden)",
    Extension: "Kapsam",
    "of {n}": "/ {n}",
    Previous: "Önceki",
    Next: "Sonraki",
    "Add a declaration": "Bildirim ekle",
    "Click a button to add a declaration to the theory, then type over its placeholders.":
      "Kurama bir bildirim eklemek için bir düğmeye tıklayın, ardından yer tutucuların üzerine yazın.",
    "Fill in the placeholders (such as <X1>); the theory is evaluated as soon as none are left. The results shown are for the previous theory.":
      "Yer tutucuları (örneğin <X1>) doldurun. Hiçbiri kalmadığında kuram değerlendirilir. Gösterilen sonuçlar önceki kurama aittir.",
    "the axioms contradict each other ({x} and {y}), so the results may be inconsistent; no option can repair this":
      "aksiyomlar birbiriyle çelişiyor ({x} ve {y}), bu yüzden sonuçlar tutarsız olabilir. Bunu hiçbir seçenek düzeltemez",
    "a contrary targets an axiom or a strict conclusion, which ASPIC+ does not allow, so the results may be inconsistent":
      "bir karşıtlık bir aksiyomu ya da katı bir sonucu hedefliyor. ASPIC+ buna izin vermez, bu yüzden sonuçlar tutarsız olabilir",
    "{n} contrapositive(s) of strict rules are missing, so the results may be inconsistent (tick “Add contrapositives of strict rules”)":
      "katı kuralların {n} ters yönlü hâli eksik, bu yüzden sonuçlar tutarsız olabilir (“Katı kuralların ters yönlü hâllerini ekle” seçeneğini işaretleyin)",
    Premise: "Öncül",
    Axiom: "Aksiyom",
    "Strict rule": "Katı kural",
    "Defeasible rule": "Feshedilebilir kural",
    "Rule preference": "Kural tercihi",
    "Premise preference": "Öncül tercihi",
    Contrary: "Karşıt",
    Contradictory: "Çelişik",
    fails: "başarısız",
    "There is no {s} extension for this theory; the labels shown are the  ones.":
      "Bu kuram için {s} kapsam yok. Gösterilen etiketler temelli olanlardır.",
    "In the  extension:": "Temelli kapsamda:",
    : "temelli",
    complete: "tam",
    preferred: "tercih edilen",
    stable: "kararlı",
    "In extension {k} of {n}:": "{n} kapsamın {k}. kapsamında:",
    "Nothing defeats it, so it is accepted.": "Onu hiçbir şey yenmiyor, bu yüzden kabul edildi.",
    "Accepted because every argument that defeats it is itself defeated by an accepted argument: ":
      "Kabul edildi, çünkü onu yenen her argüman da kabul edilmiş bir argüman tarafından yeniliyor: ",
    " is defeated by ": " şunun tarafından yeniliyor: ",
    "Undecided: no accepted argument defeats it, but these defeaters are themselves undecided: ":
      "Kararsız: onu kabul edilmiş hiçbir argüman yenmiyor, ama şu yenenler de kararsız: ",
    "Attacks that fail because the attacker is weaker under the chosen preferences: ":
      "Saldıran seçilen tercihlere göre daha zayıf olduğu için başarısız olan saldırılar: ",
    " and {n} more": " ve {n} tane daha",
    "The claim {c}": "{c} iddiası",
    "The {s} semantics has no extension for this theory, so no claim has a status.":
      "{s} semantiğin bu kuram için kapsamı yok, bu yüzden hiçbir iddianın durumu yok.",
    "The  extension contains an argument for it: ":
      "Temelli kapsam onun için bir argüman içeriyor: ",
    "Every one of the {n} extensions contains an argument for it, not necessarily the same one. ":
      "{n} kapsamın her biri onun için bir argüman içeriyor. Bu argüman her seferinde aynı olmak zorunda değil. ",
    "In this extension: ": "Bu kapsamda: ",
    "Accepted in {k} of {n} extensions (": "{n} kapsamın {k} tanesinde kabul edildi (",
    "); in the others no argument for it is accepted.":
      "). Diğerlerinde onun için hiçbir argüman kabul edilmedi.",
    "In every extension, every argument for it is defeated. In this extension: ":
      "Her kapsamda, onun için olan her argüman yenildi. Bu kapsamda: ",
    " by ": " şunun tarafından: ",
    "No extension accepts it, but not every argument for it is always defeated. In this extension: ":
      "Hiçbir kapsam onu kabul etmiyor, ama onun için olan argümanların hepsi her kapsamda yenilmiyor. Bu kapsamda: ",
    "undecided ": "kararsız ",
    "In the  extension, every argument for it is defeated: ":
      "Temelli kapsamda, onun için olan her argüman yenildi: ",
    "The  extension does not accept it, but not every argument for it is defeated: ":
      "Temelli kapsam onu kabul etmiyor, ama onun için olan her argüman yenilmiş değil: ",
    "defeated ": "yenilmiş ",
    "The background evaluation stopped unexpectedly, most likely because the browser ran out of memory: this theory has too many extensions for the chosen semantics. Try  semantics or a smaller theory.":
      "Arka plandaki değerlendirme beklenmedik biçimde durdu. Büyük olasılıkla tarayıcının belleği yetmedi, çünkü bu kuramın seçilen semantik için çok fazla kapsamı var. Temelli semantiği ya da daha küçük bir kuramı deneyin.",
    Introduction: "Giriş",
    Workspace: "Çalışma alanı",
    Learn: "Öğren",
    Glossary: "Sözlük",
    Report: "Rapor",
    Sections: "Bölümler",
    Language: "Dil",
    Theory: "Kuram",
    "Start from": "Başlangıç",
    "My own theory": "Kendi kuramım",
    "Random size": "Rastgele boyut",
    Small: "Küçük",
    Medium: "Orta",
    Large: "Büyük",
    Seed: "Tohum",
    Generate: "Üret",
    "Theory text": "Kuram metni",
    "How to write a theory": "Kuram nasıl yazılır",
    Semantics: "Semantik",
    "Grounded": "Temelli",
    "Preferred":
      "Tercih edilen",
    "Stable": "Kararlı",
    "Complete": "Tam",
    "Comparing arguments": "Argümanların karşılaştırılması",
    "Last link": "Son halka",
    "Weakest link": "En zayıf halka",
    "Comparing sets": "Küme sıralaması",
    Elitist: "Elitist",
    Democratic: "Demokratik",
    "Add contrapositives of strict rules": "Katı kuralların ters yönlü hâllerini ekle",
    Evaluate: "Değerlendir",
    "Copy link": "Bağlantıyı kopyala",
    "How the claims are argued": "İddialar nasıl savunuluyor",
    "Graph detail": "Grafik ayrıntısı",
    "Claims and rules": "İddialar ve kurallar",
    "Every argument": "Her argüman",
    accepted: "kabul edildi",
    defeated: "yenildi",
    undecided: "kararsız",
    "rule (dashed = defeasible)": "kural (kesik çizgi = feshedilebilir)",
    derives: "türetir",
    defeats: "yener",
    "Show defeats": "Yenilgileri göster",
    Claims: "İddialar",
    Claim: "İddia",
    Status: "Durum",
    "Accepted in": "Kabul oranı",
    "Justified: accepted in every extension. Defensible: in some. Overruled: every argument for it is defeated in every extension. Undecided: none of these.":
      "Gerekçelendirilmiş: her kapsamda kabul edilir. Savunulabilir: bazılarında kabul edilir. Reddedilmiş: onun için kurulan her argüman her kapsamda yenilir. Kararsız: bunların hiçbiri.",
    Argument: "Argüman",
    "Select an argument in the graph or the list.": "Grafikten veya listeden bir argüman seçin.",
    "All arguments, grouped by claim": "Tüm argümanlar, iddiaya göre gruplanmış",
    "An argument is a derivation tree. Each different combination of sub-arguments is its own argument, so one claim can have several.":
      "Argüman bir türetme ağacıdır. Alt argümanların her farklı birleşimi ayrı bir argümandır. Bu yüzden bir iddianın birden fazla argümanı olabilir.",
    Justified: "Gerekçelendirilmiş",
    Defensible: "Savunulabilir",
    Overruled: "Reddedilmiş",
    Undecided: "Kararsız",
    "No extension": "Kapsam yok",
    "{a} arguments, {d} defeats, {e} extension(s) · {ms} ms":
      "{a} argüman, {d} başarılı saldırı, {e} kapsam · {ms} ms",
    "Note: ": "Not: ",
    "rules are cyclic, so each argument stands for a class of similar arguments":
      "kurallar döngüsel, bu yüzden her argüman benzer argümanlardan oluşan bir sınıfı temsil ediyor",
    "No {s} extension exists. Showing grounded labels.":
      "{s} kapsam yok. Temelli etiketler gösteriliyor.",
    "Grounded extension": "Temelli kapsam",
    "Extension {n}": "Kapsam {n}",
    "{n} arguments are too many to draw one by one; showing claims and rules.":
      "{n} argüman tek tek çizmek için çok fazla. Bu yüzden iddialar ve kurallar gösteriliyor.",
    "Graph of claims, rules and defeats": "İddialar, kurallar ve yenilgiler grafiği",
    "{p}% of extensions": "%{p}",
    "{x} undercuts rule {r}": "{x}, {r} kuralına saldırır",
    "{x} undermines {y}": "{x}, {y} öncülüne saldırır",
    "{x} rebuts {y}": "{x}, {y} sonucuna saldırır",
    "{x} defeats {y}": "{x}, {y} argümanını yener",
    "{alias} concludes {c} ": "{alias}, {c} sonucuna varır ",
    "premises it relies on: {list}": "dayandığı öncüller: {list}",
    "axioms: {list}": "aksiyomlar: {list}",
    "defeasible rules: {list}": "feshedilebilir kurallar: {list}",
    "grounded: {label}": "temelli: {label}",
    " (settled in round {n})": " ({n}. turda belirlendi)",
    "strength: {v} (h-categorizer; 1 means nothing defeats it)":
      "güç: {v} (h-categorizer, 1 onu hiçbir şeyin yenmediği anlamına gelir)",
    "Nothing defeats it.": "Hiçbir argüman onu yenmiyor.",
    "Accepted because every defeater is itself defeated by an accepted argument: ":
      "Kabul edildi, çünkü onu yenen her argüman kabul edilmiş bir argüman tarafından yeniliyor: ",
    " is answered by ": " → yanıtlayan: ",
    "Defeated by accepted argument(s): ": "Kabul edilmiş argüman(lar) tarafından yenildi: ",
    "{n} attack(s) on it fail because the attacker is weaker under the chosen preference setting.":
      "Ona yönelik {n} saldırı başarısız, çünkü seçilen tercih ayarında saldıran daha zayıf.",
    "Link copied. Anyone opening it sees this theory and these settings.":
      "Bağlantı kopyalandı. Açan herkes bu kuramı ve bu ayarları görür.",
    "Link is in the address bar; copy it from there.":
      "Bağlantı adres çubuğunda. Oradan kopyalayabilirsiniz.",
    " (random theory, seed {n})": " (rastgele kuram, tohum {n})",
    " · skipped seeds too large for the browser: {list}":
      " · tarayıcı için çok büyük olduğu için atlanan tohumlar: {list}",
    "{n} argument": "{n} argüman",
    "{n} arguments": "{n} argüman",
    "×{n} arguments": "×{n} argüman",
    "1 argument": "1 argüman",
    premise: "öncül",
    axiom: "aksiyom",
    "Nothing to draw yet.": "Henüz çizilecek bir şey yok.",
    "Zoom in": "Yakınlaştır",
    "Zoom out": "Uzaklaştır",
    "Fit to view": "Görünüme sığdır",
    Fit: "Sığdır",
    "Extension to display": "Gösterilecek kapsam",
    Legend: "Açıklama",
    "{n} arguments and {d} defeats": "{n} argüman ve {d} başarılı saldırı",
  };
  const SYNTAX = {
    ENG: "[premise: bird]                 can be attacked\n[axiom: penguin]                cannot be attacked\n[defeasible r1: bird => flies]  usually holds\n[strict s1: penguin -> bird]    always holds\n[defeasible r2: penguin => -flies]\n[prefer_rule: r2 > r1]          r2 beats r1\n[prefer_premise: a > b]\n[contrary: x ^ y]               x attacks y one way (premises and defeasible\n                                conclusions only), whatever the preferences\n[contradictory: x ^ y]          x and y attack each other (the same targets);\n                                preferences decide\n[defeasible r3: ill => -r1]     attacks rule r1 itself",
    TUR: "[öncül: kuş]                       saldırıya açık\n[aksiyom: penguen]                 saldırıya kapalı\n[feshedilebilir r1: kuş => uçar]   genellikle geçerli\n[katı s1: penguen -> kuş]          her zaman geçerli\n[feshedilebilir r2: penguen => -uçar]\n[kural_tercihi: r2 > r1]           r2, r1'den güçlü\n[öncül_tercihi: a > b]\n[karşıt: x ^ y]                    x, y'ye tek yönlü saldırır (yalnızca öncüllere\n                                   ve feshedilebilir sonuçlara). Tercihler bunu değiştirmez\n[çelişik: x ^ y]                   x ve y birbirine saldırır (aynı hedeflere).\n                                   Tercihler belirler\n[feshedilebilir r3: hasta => -r1]  r1 kuralının kendisine saldırır",
  };
  const KEYWORDS = [
    ["premise", "öncül"],
    ["axiom", "aksiyom"],
    ["strict", "katı"],
    ["defeasible", "feshedilebilir"],
    ["prefer_rule", "kural_tercihi"],
    ["prefer_premise", "öncül_tercihi"],
    ["contrary", "karşıt"],
    ["contradictory", "çelişik"],
  ];
  function outsideQuotes(text) {
    const mask = new Array(text.length).fill(true);
    let inside = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inside) {
        mask[i] = false;
        if (ch === "\\") {
          if (i + 1 < text.length) mask[i + 1] = false;
          i++;
        } else if (ch === '"') inside = false;
      } else if (ch === '"') {
        mask[i] = false;
        inside = true;
      }
    }
    return mask;
  }
  function translateKeywords(text, to) {
    const map = new Map(KEYWORDS.map(([en, tr]) => (to === "TUR" ? [en, tr] : [tr, en])));
    const free = outsideQuotes(text);
    return text.replace(/\[(\s*)([^\s:\]]+)/g, (m, ws, word, offset) =>
      free[offset] && map.has(word) ? "[" + ws + map.get(word) : m,
    );
  }
  function hasPlaceholder(text) {
    const free = outsideQuotes(text);
    const re = new RegExp(PLACEHOLDER.source, "g");
    let m;
    while ((m = re.exec(text))) if (free[m.index]) return true;
    return false;
  }
  let LANG = (() => {
    const q = new URLSearchParams(location.search).get("lang");
    if (q) return q.toLowerCase().startsWith("tr") ? "TUR" : "ENG";
    try {
      const saved = localStorage.getItem("argforge-web-language");
      if (saved) return saved;
    } catch (e) {}
    return (navigator.language || "").toLowerCase().startsWith("tr") ? "TUR" : "ENG";
  })();
  const T = (text, vars = {}) =>
    (LANG === "TUR" && TR[text] !== undefined ? TR[text] : text).replace(/\{(\w+)\}/g, (_, k) =>
      String(vars[k]),
    );
  window.ArgForgeT = T;
  function applyStatic() {
    document.documentElement.lang = LANG === "TUR" ? "tr" : "en";
    document.querySelectorAll("[data-t]").forEach((node) => {
      if (!node.dataset.en) node.dataset.en = node.textContent.replace(/\s+/g, " ").trim();
      node.textContent = T(node.dataset.en);
    });
    document
      .querySelectorAll("[data-t-label]")
      .forEach((node) => node.setAttribute("aria-label", T(node.dataset.tLabel)));
    const titleNode = document.querySelector("title[data-en]");
    document.title = titleNode
      ? titleNode.dataset[LANG === "TUR" ? "tr" : "en"]
      : T("ArgForge — structured argumentation in your browser");
    document.querySelectorAll("a[data-nav]").forEach((link) => {
      link.href = link.dataset.nav + "?lang=" + (LANG === "TUR" ? "tr" : "en");
    });
    $("syntax-body").textContent = SYNTAX[LANG];
    $("language").value = LANG;
  }
  const EXAMPLES = [
    {
      en: "Birds and penguins",
      tr: "Kuşlar ve penguenler",
      src: "[premise: bird]\n[premise: penguin]\n[defeasible r1: bird => flies]\n[defeasible r2: penguin => -flies]\n[prefer_rule: r2 > r1]\n",
      src_tr:
        "[öncül: kuş]\n[öncül: penguen]\n[feshedilebilir r1: kuş => uçar]\n[feshedilebilir r2: penguen => -uçar]\n[kural_tercihi: r2 > r1]\n",
      note: "Birds usually fly, penguins usually do not, and the penguin rule is stronger: “flies” is overruled.",
      note_tr:
        "Kuşlar genellikle uçar, penguenler genellikle uçmaz ve penguen kuralı daha güçlüdür: “uçar” reddedilir.",
    },
    {
      en: "Nixon diamond",
      tr: "Nixon elması",
      src: "[premise: quaker]\n[premise: republican]\n[defeasible r1: quaker => pacifist]\n[defeasible r2: republican => -pacifist]\n",
      src_tr:
        "[öncül: quaker]\n[öncül: cumhuriyetçi]\n[feshedilebilir r1: quaker => barışçı]\n[feshedilebilir r2: cumhuriyetçi => -barışçı]\n",
      note: "Two equally strong rules disagree. Grounded semantics stays undecided; preferred semantics gives two extensions, one for each view.",
      note_tr:
        "Eşit güçte iki kural çelişir. Temelli semantik kararsız kalır; tercih edilen semantik her görüş için bir tane olmak üzere iki kapsam verir.",
      settings: {
        semantics: "preferred",
      },
    },
    {
      en: "Rebut: attacking a conclusion",
      tr: "Sonuca saldırı",
      src: "[premise: forecast_sunny]\n[premise: dark_clouds]\n[defeasible r1: forecast_sunny => -rain]\n[defeasible r2: dark_clouds => rain]\n[prefer_rule: r2 > r1]\n",
      src_tr:
        "[öncül: tahmin_güneşli]\n[öncül: kara_bulutlar]\n[feshedilebilir r1: tahmin_güneşli => -yağmur]\n[feshedilebilir r2: kara_bulutlar => yağmur]\n[kural_tercihi: r2 > r1]\n",
      note: "The two arguments conclude opposite things. The stronger rule r2 wins the rebuttal: “rain” is justified.",
      note_tr:
        "İki argüman zıt sonuçlara varır. Daha güçlü r2 kuralı sonuca saldırıyı kazanır: “yağmur” gerekçelendirilir.",
    },
    {
      en: "Undermine: attacking a premise",
      tr: "Öncüle saldırı",
      src: "[premise: shop_open]\n[premise: -shop_open]\n[defeasible r1: shop_open => buy_bread_there]\n[prefer_premise: -shop_open > shop_open]\n",
      src_tr:
        "[öncül: dükkan_açık]\n[öncül: -dükkan_açık]\n[feshedilebilir r1: dükkan_açık => ekmeği_oradan_al]\n[öncül_tercihi: -dükkan_açık > dükkan_açık]\n",
      note: "An old website says the shop is open; the owner says it is closed, and the owner is more reliable. The premise “shop_open” is undermined, and everything built on it falls with it.",
      note_tr:
        "Eski bir web sitesi dükkanın açık olduğunu, sahibi ise kapalı olduğunu söylüyor ve sahibi daha güvenilir. “dükkan_açık” öncülüne saldırılır ve ona dayanan her şey de düşer.",
    },
    {
      en: "Undercut: attacking a rule",
      tr: "Kurala saldırı",
      src: "[premise: looks_red]\n[premise: red_lighting]\n[defeasible r1: looks_red => is_red]\n[defeasible r2: red_lighting => -r1]\n[prefer_rule: r1 > r2]\n",
      src_tr:
        "[öncül: kırmızı_görünüyor]\n[öncül: kırmızı_ışık]\n[feshedilebilir r1: kırmızı_görünüyor => kırmızı]\n[feshedilebilir r2: kırmızı_ışık => -r1]\n[kural_tercihi: r1 > r2]\n",
      note: "Under red lighting, “looks red” no longer supports “is red”: r2 says rule r1 does not apply. Undercuts ignore preferences, so even though r1 is preferred, “is_red” is overruled.",
      note_tr:
        "Kırmızı ışık altında “kırmızı görünüyor”, “kırmızı” sonucunu artık desteklemez: r2, r1 kuralının geçerli olmadığını söyler. Kurala saldırılar tercihleri dikkate almaz; r1 tercih edilse bile “kırmızı” reddedilir.",
    },
    {
      en: "Last link vs weakest link",
      tr: "Son halka ve en zayıf halka",
      src: "[axiom: a]\n[defeasible low: a => b]\n[defeasible high: b => p]\n[defeasible mid: a => -p]\n[prefer_rule: high > mid]\n[prefer_rule: mid > low]\n",
      src_tr:
        "[aksiyom: a]\n[feshedilebilir dusuk: a => b]\n[feshedilebilir yuksek: b => p]\n[feshedilebilir orta: a => -p]\n[kural_tercihi: yuksek > orta]\n[kural_tercihi: orta > dusuk]\n",
      note: "The argument for p ends in a strong rule but contains a weak one. With “Last link: last defeasible rules decide”, p wins; switch to “Weakest link: weakest step decides” and -p wins.",
      note_tr:
        "p argümanı güçlü bir kuralla biter ama zayıf bir kural içerir. “Son halka” ile p kazanır. “En zayıf halka” seçeneğine geçtiğinizde -p kazanır.",
      settings: {
        ordering: "last_link",
      },
    },
    {
      en: "Elitist vs democratic",
      tr: "Elitist ve demokratik",
      src: "[axiom: a]\n[defeasible x1: a => p1]\n[defeasible x2: a => p2]\n[defeasible t: p1 & p2 => q]\n[defeasible y: a => -q]\n[prefer_rule: y > x1]\n[prefer_rule: x2 > y]\n[prefer_rule: t > y]\n",
      src_tr:
        "[aksiyom: a]\n[feshedilebilir x1: a => p1]\n[feshedilebilir x2: a => p2]\n[feshedilebilir t: p1 & p2 => q]\n[feshedilebilir y: a => -q]\n[kural_tercihi: y > x1]\n[kural_tercihi: x2 > y]\n[kural_tercihi: t > y]\n",
      note: "Compared by all their rules (weakest link), q's argument uses x1, x2 and t; -q's uses y, where x1 < y < x2. Elitist: one weaker rule (x1) is enough to lose, so -q wins. Switch to “Democratic”: every rule must be weaker, so q wins.",
      note_tr:
        "Tüm kurallarına göre karşılaştırıldığında (en zayıf halka) q argümanı x1, x2 ve t'yi, -q argümanı y'yi kullanır; burada x1 < y < x2. Elitist: kaybetmek için daha zayıf tek bir kural (x1) yeter, -q kazanır. “Demokratik” seçeneğine geçin: her kural daha zayıf olmalıdır, q kazanır.",
      settings: {
        ordering: "weakest_link",
        setOrdering: "elitist",
      },
    },
  ];
  const exampleName = (e) => (LANG === "TUR" ? e.tr : e.en);
  const exampleSource = (e) => (LANG === "TUR" ? e.src_tr : e.src);
  const exampleNote = (e) => (LANG === "TUR" ? e.note_tr : e.note);
  function showExampleNote() {
    const ex = $("example"),
      box = $("example-note");
    const e = ex.value !== "" ? EXAMPLES[Number(ex.value)] : null;
    box.textContent = e ? exampleNote(e) : "";
    box.hidden = !e;
  }
  function applyExampleSettings(e) {
    const s = {
      semantics: "grounded",
      ordering: "last_link",
      setOrdering: "elitist",
      ...(e.settings || {}),
    };
    $("semantics").value = s.semantics;
    $("ordering").value = s.ordering;
    $("set-ordering").value = s.setOrdering;
  }
  const LABEL_EN = {
    IN: "accepted",
    OUT: "defeated",
    UNDEC: "undecided",
  };
  const LABEL = new Proxy(LABEL_EN, {
    get: (t, k) => T(t[k]),
  });
  const STATUS = {
    JUSTIFIED: "Justified",
    DEFENSIBLE: "Defensible",
    OVERRULED: "Overruled",
    UNDECIDED: "Undecided",
    NO_EXTENSIONS: "No extension",
  };
  const statusText = (s) => T(STATUS[s] || s);
  const SEMANTICS_NAMES = {
    grounded: ["grounded", "temelli"],
    preferred: ["preferred", "tercih edilen"],
    stable: ["stable", "kararlı"],
    complete: ["complete", "tam"],
  };
  const semanticsName = (s) => (SEMANTICS_NAMES[s] || [s, s])[LANG === "TUR" ? 1 : 0];
  const state = {
    result: null,
    view: 0,
    selected: null,
    mode: "claims",
  };
  function status(text, error = false) {
    $("status").textContent = text;
    $("status").className = error ? "error" : "";
  }
  function options() {
    return {
      semantics: $("semantics").value,
      ordering: $("ordering").value,
      setOrdering: $("set-ordering").value,
      transposition: $("transposition").checked,
    };
  }
  let worker = null,
    workerBroken = false,
    workerReady = false,
    pending = null,
    runId = 0,
    ticker = null;
  function workerUrl() {
    const core = document.querySelector('script[src*="argforge-core.js"]');
    return core ? core.src.replace(/argforge-core\.js.*$/, "engine-worker.js") : "engine-worker.js";
  }
  function engine() {
    if (workerBroken || typeof Worker === "undefined") return null;
    if (!worker) {
      try {
        worker = new Worker(workerUrl());
        worker.onmessage = onWorker;
        worker.onerror = (ev) => {
          if (ev.preventDefault) ev.preventDefault();
          worker = null;
          if (!workerReady) {
            workerBroken = true;
            if (pending) runHere(pending);
            return;
          }
          workerReady = false;
          if (pending) {
            pending = null;
            hideRunning();
            failed({
              message: T(
                "The background evaluation stopped unexpectedly, most likely because the browser ran out of memory: this theory has too many extensions for the chosen semantics. Try grounded semantics or a smaller theory.",
              ),
            });
          }
        };
      } catch (e) {
        workerBroken = true;
        return null;
      }
    }
    return worker;
  }
  const PLACEHOLDER = /<[A-Za-z0-9_]+>/;
  const TEMPLATES = [
    ["Premise", "[premise: <X>]"],
    ["Axiom", "[axiom: <X>]"],
    ["Strict rule", "[strict <RN>: <X1> -> <X2>]"],
    ["Defeasible rule", "[defeasible <RN>: <X1> => <X2>]"],
    ["Rule preference", "[prefer_rule: <R1> > <R2>]"],
    ["Premise preference", "[prefer_premise: <X1> > <X2>]"],
    ["Contrary", "[contrary: <X1> ^ <X2>]"],
    ["Contradictory", "[contradictory: <X1> ^ <X2>]"],
  ];
  function selectPlaceholder(area, from) {
    const re = new RegExp(PLACEHOLDER.source, "g");
    re.lastIndex = from;
    let m = re.exec(area.value);
    if (!m) {
      re.lastIndex = 0;
      m = re.exec(area.value);
    }
    if (!m) return false;
    area.focus();
    area.setSelectionRange(m.index, m.index + m[0].length);
    return true;
  }
  function insertDeclaration(template) {
    const area = $("source");
    const text = LANG === "TUR" ? translateKeywords(template, "TUR") : template;
    const pos = typeof area.selectionEnd === "number" ? area.selectionEnd : area.value.length;
    const before = area.value.slice(0, pos),
      after = area.value.slice(pos);
    const lineStart = before.lastIndexOf("\n") + 1;
    const lineEnd = after.indexOf("\n");
    const head =
      before.slice(0, lineStart) +
      (before.slice(lineStart) + (lineEnd < 0 ? after : after.slice(0, lineEnd))).trimEnd();
    const tail = lineEnd < 0 ? "" : after.slice(lineEnd);
    const prefix = head && !head.endsWith("\n") ? "\n" : "";
    area.value = head + prefix + text + (tail ? tail : "\n");
    $("example").value = "";
    showExampleNote();
    selectPlaceholder(area, head.length + prefix.length);
    later();
  }
  function renderInsertBar() {
    const bar = $("insert-bar");
    bar.replaceChildren();
    for (const [label, template] of TEMPLATES) {
      const b = el("button", { type: "button", class: "insert" }, T(label));
      b.title = LANG === "TUR" ? translateKeywords(template, "TUR") : template;
      b.onclick = () => insertDeclaration(template);
      bar.append(b);
    }
  }
  function evaluate(note) {
    $("evaluate").hidden = true;
    if (hasPlaceholder($("source").value)) {
      if (pending && worker) {
        worker.terminate();
        worker = null;
        pending = null;
        hideRunning();
      }
      markStale(true);
      status(
        T(
          "Fill in the placeholders (such as <X1>); the theory is evaluated as soon as none are left. The results shown are for the previous theory.",
        ),
      );
      return;
    }
    if (pending && worker) {
      worker.terminate();
      worker = null;
    }
    const request = {
      id: ++runId,
      source: $("source").value,
      options: options(),
      started: performance.now(),
      seed: note && typeof note === "object" && "seed" in note ? note.seed : null,
    };
    pending = request;
    markStale(true);
    const w = engine();
    if (!w) return runHere(request);
    w.postMessage({ id: request.id, source: request.source, options: request.options });
    showRunning(request);
  }
  function runHere(request) {
    pending = null;
    hideRunning();
    try {
      finish(request, AF.evaluate(request.source, request.options));
    } catch (e) {
      failed(e);
    }
  }
  function onWorker(ev) {
    const d = ev.data;
    if (d && d.ready) {
      workerReady = true;
      return;
    }
    if (!pending || d.id !== pending.id) return;
    const request = pending;
    pending = null;
    hideRunning();
    if (d.ok) finish(request, d.result);
    else failed(d.error);
  }
  function showRunning(request) {
    $("cancel").hidden = false;
    clearInterval(ticker);
    const tick = () =>
      status(
        T("Evaluating… {s} s", { s: Math.round((performance.now() - request.started) / 1000) }),
      );
    tick();
    ticker = setInterval(tick, 1000);
  }
  function hideRunning() {
    $("cancel").hidden = true;
    clearInterval(ticker);
  }
  function cancel() {
    if (!pending) return;
    if (worker) worker.terminate();
    worker = null;
    pending = null;
    hideRunning();
    $("evaluate").hidden = false;
    status(
      T(
        "Evaluation cancelled. It runs again when you change something, or press “Evaluate again”.",
      ),
      true,
    );
  }
  function errorText(e) {
    if (e && typeof e.render === "function") return e.render(LANG);
    if (e && e.text) {
      const where = e.line
        ? LANG === "TUR"
          ? `Satır ${e.line}, sütun ${e.column}: `
          : `Line ${e.line}, column ${e.column}: `
        : "";
      return where + e.text[LANG === "TUR" ? 1 : 0];
    }
    return (e && e.message) || String(e);
  }
  function failed(e) {
    markStale(false);
    state.result = null;
    render();
    status(errorText(e), true);
  }
  function markStale(on) {
    const layout = document.querySelector(".layout");
    if (layout) layout.classList.toggle("stale", !!on && !!state.result);
  }
  function finish(request, result) {
    result.claims = Object.assign(Object.create(null), result.claims);
    markStale(false);
    state.result = result;
    state.view = 0;
    if (state.selected !== null && state.selected >= state.result.arguments.length)
      state.selected = null;
    render();
    const r = state.result;
    state.lastRun = { ms: Math.round(performance.now() - request.started), seed: request.seed };
    status(resultStatus());
  }
  function resultStatus() {
    const r = state.result,
      run = state.lastRun || { ms: 0, seed: null };
    const notes = [];
    const wd = r.wellDefinedness;
    if ((wd.axiomConflicts || []).length) {
      const [x, y] = wd.axiomConflicts[0];
      notes.push(
        T(
          "the axioms contradict each other ({x} and {y}), so the results may be inconsistent; no option can repair this",
          { x, y },
        ),
      );
    }
    if ((wd.illFormedContraries || []).length)
      notes.push(
        T(
          "a contrary targets an axiom or a strict conclusion, which ASPIC+ does not allow, so the results may be inconsistent",
        ),
      );
    if ((wd.missingTranspositions || []).length)
      notes.push(
        T(
          "{n} contrapositive(s) of strict rules are missing, so the results may be inconsistent (tick “Add contrapositives of strict rules”)",
          { n: wd.missingTranspositions.length },
        ),
      );
    if (r.cyclic)
      notes.push(T("rules are cyclic, so each argument stands for a class of similar arguments"));
    return (
      T("{a} arguments, {d} defeats, {e} extension(s) · {ms} ms", {
        a: r.arguments.length,
        d: r.defeats.length,
        e: r.extensions.length,
        ms: run.ms,
      }) +
      (notes.length ? ". " + T("Note: ") + notes.join("; ") + "." : "") +
      (run.seed !== null && run.seed !== undefined
        ? T(" (random theory, seed {n})", { n: run.seed })
        : "")
    );
  }
  let timer = null;
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(evaluate, 450);
  };
  function labelling() {
    const r = state.result;
    if (r.extensions.length) return r.labellings[state.view];
    return r.arguments.map((a) => a.grounded);
  }
  function render() {
    renderViews();
    renderGraph();
    renderClaims();
    renderArguments();
    renderDetail();
  }
  function renderViews() {
    const box = $("views");
    box.replaceChildren();
    const r = state.result;
    if (!r) return;
    if (!r.extensions.length) {
      box.append(
        el(
          "span",
          {
            class: "note",
          },
          T("No {s} extension exists. Showing grounded labels.", {
            s: semanticsName(r.semantics),
          }),
        ),
      );
      return;
    }
    if (r.extensions.length > 12) {
      const n = r.extensions.length;
      const go = (v) => {
        state.view = Math.min(n, Math.max(1, v)) - 1;
        render();
      };
      const input = el("input", {
        type: "number",
        min: "1",
        max: String(n),
        value: String(state.view + 1),
      });
      input.setAttribute("aria-label", T("Extension"));
      input.onchange = () => go(Number(input.value) || 1);
      const prev = el("button", { type: "button" }, T("Previous"));
      prev.onclick = () => go(state.view);
      const next = el("button", { type: "button" }, T("Next"));
      next.onclick = () => go(state.view + 2);
      const label = el("span", { class: "note" });
      label.append(
        T("Extension") + " ",
        input,
        " " + T("of {n}", { n }) + ` (${r.extensions[state.view].length})`,
      );
      box.append(prev, label, next);
      return;
    }
    r.extensions.forEach((ext, i) => {
      const name =
        r.semantics === "grounded"
          ? T("Grounded extension")
          : T("Extension {n}", {
              n: i + 1,
            });
      const b = el(
        "button",
        {
          type: "button",
          "aria-pressed": String(i === state.view),
        },
        `${name} (${ext.length})`,
      );
      b.onclick = () => {
        state.view = i;
        render();
      };
      box.append(b);
    });
  }
  const KIND_TAG = {
    premise: "P",
    axiom: "AX",
    strict: "S",
    defeasible: "D",
  };
  const KIND_TAG_TR = {
    premise: "Ö",
    axiom: "AK",
    strict: "K",
    defeasible: "F",
  };
  const kindTag = (k) => (LANG === "TUR" ? KIND_TAG_TR : KIND_TAG)[k];
  function graphModel() {
    const r = state.result,
      labels = labelling(),
      nodes = [],
      edges = [];
    const showDefeats = $("show-defeats").checked;
    if (state.mode === "claims") {
      const bearers = new Map();
      r.arguments.forEach((a, i) =>
        (bearers.get(a.conclusion) || bearers.set(a.conclusion, []).get(a.conclusion)).push(i),
      );
      for (const [claim, ids] of bearers) {
        const st = ids.map((i) => labels[i]);
        const fact = ids
          .map((i) => r.arguments[i])
          .find((a) => a.kind === "premise" || a.kind === "axiom");
        nodes.push({
          id: "c:" + claim,
          label: claim,
          state: st.includes("IN") ? "IN" : st.every((x) => x === "OUT") ? "OUT" : "UNDEC",
          tag: [
            fact ? kindTag(fact.kind) : "",
            ids.length > 1
              ? T("×{n} arguments", {
                  n: ids.length,
                })
              : T("1 argument"),
          ]
            .filter(Boolean)
            .join(" · "),
          title: `${claim}: ${statusText((r.claims[claim] || {}).status)}`,
        });
      }
      const rules = new Map();
      r.arguments.forEach((a) => {
        if (a.rule && !rules.has(a.rule)) rules.set(a.rule, a);
      });
      for (const [name, a] of rules) {
        nodes.push({
          id: "r:" + name,
          label: `${name} ${a.kind === "strict" ? "→" : "⇒"}`,
          shape: "ellipse",
          dashed: a.kind === "defeasible",
          title: a.text,
        });
        [...new Set(a.children.map((c) => r.arguments[c].conclusion))].forEach((c) =>
          edges.push({
            source: "c:" + c,
            target: "r:" + name,
            kind: "derive",
          }),
        );
        edges.push({
          source: "r:" + name,
          target: "c:" + a.conclusion,
          kind: "derive",
        });
      }
      if (showDefeats) {
        const seen = new Set();
        for (const a of r.attacks) {
          if (!a.succeeds || a.on !== r.arguments[a.target].key) continue;
          const from = r.arguments[a.attacker].conclusion,
            to = r.arguments[a.target].conclusion;
          const target = a.kind === "undercut" ? "r:" + r.arguments[a.target].rule : "c:" + to;
          const k = from + "\0" + target;
          if (seen.has(k)) continue;
          seen.add(k);
          edges.push({
            source: "c:" + from,
            target: target,
            kind: "defeat",
            title:
              a.kind === "undercut"
                ? T("{x} undercuts rule {r}", {
                    x: from,
                    r: r.arguments[a.target].rule,
                  })
                : T(a.kind === "undermine" ? "{x} undermines {y}" : "{x} rebuts {y}", {
                    x: from,
                    y: to,
                  }),
          });
        }
      }
      return {
        nodes: nodes,
        edges: edges,
      };
    }
    r.arguments.forEach((a, i) => {
      nodes.push({
        id: "a:" + i,
        label: a.conclusion,
        tag: `${a.alias} · ${kindTag(a.kind)}`,
        state: labels[i],
        title: `${a.alias}: ${argumentText(a)}`,
      });
      if (a.rule) {
        nodes.push({
          id: "i:" + i,
          label: `${a.rule} ${a.kind === "strict" ? "→" : "⇒"}`,
          shape: "ellipse",
          dashed: a.kind === "defeasible",
          title: a.text,
        });
        a.children.forEach((c) =>
          edges.push({
            source: "a:" + c,
            target: "i:" + i,
            kind: "derive",
          }),
        );
        edges.push({
          source: "i:" + i,
          target: "a:" + i,
          kind: "derive",
        });
      }
    });
    if (showDefeats)
      for (const [x, y] of r.defeats)
        edges.push({
          source: "a:" + x,
          target: "a:" + y,
          kind: "defeat",
          title: T("{x} defeats {y}", {
            x: r.arguments[x].alias,
            y: r.arguments[y].alias,
          }),
        });
    return {
      nodes: nodes,
      edges: edges,
    };
  }
  function renderGraph() {
    const canvas = $("canvas");
    const r = state.result;
    if (!r) return canvas.replaceChildren();
    if (state.mode === "arguments" && r.arguments.length > 150) {
      const p = el(
        "p",
        {
          class: "empty",
        },
        T("{n} arguments are too many to draw one by one; showing claims and rules.", {
          n: r.arguments.length,
        }),
      );
      state.mode = "claims";
      syncMode();
      ArgGraph.render(canvas, graphModel(), graphOptions());
      return canvas.prepend(p);
    }
    ArgGraph.render(canvas, graphModel(), graphOptions());
  }
  function graphOptions() {
    return {
      label: T("Graph of claims, rules and defeats"),
      selected:
        state.selected === null
          ? null
          : state.mode === "claims"
            ? "c:" + state.result.arguments[state.selected].conclusion
            : "a:" + state.selected,
      onSelect: (id) => {
        if (id.startsWith("r:")) return;
        if (id.startsWith("c:")) {
          const claim = id.slice(2);
          const labels = labelling();
          const ids = state.result.arguments
            .map((a, i) => i)
            .filter((i) => state.result.arguments[i].conclusion === claim);
          select(ids.find((i) => labels[i] === "IN") ?? ids[0]);
          return;
        }
        select(Number(id.slice(2)));
      },
    };
  }
  function syncMode() {
    $("mode-claims").setAttribute("aria-pressed", String(state.mode === "claims"));
    $("mode-arguments").setAttribute("aria-pressed", String(state.mode === "arguments"));
  }
  function select(i) {
    state.selected = i;
    renderGraph();
    renderDetail();
    const title = $("detail-title");
    if (title.scrollIntoView)
      title.scrollIntoView({
        block: "nearest",
      });
  }
  function badge(text, cls) {
    return el(
      "span",
      {
        class: "badge " + cls,
      },
      text,
    );
  }
  function renderClaims() {
    const body = $("claims").querySelector("tbody");
    body.replaceChildren();
    const r = state.result;
    if (!r) return;
    for (const [claim, info] of Object.entries(r.claims)) {
      const tr = el("tr");
      tr.append(
        el(
          "td",
          {
            class: "claim",
          },
          claim,
        ),
      );
      const td = el("td");
      td.append(badge(statusText(info.status), info.status));
      tr.append(td);
      tr.append(
        el(
          "td",
          {},
          info.acceptance === null
            ? "—"
            : T("{p}% of extensions", {
                p: Math.round(info.acceptance * 100),
              }),
        ),
      );
      tr.className = "clickable";
      tr.tabIndex = 0;
      const pick = () => {
        const labels = labelling();
        const ids = r.arguments.map((a, i) => i).filter((i) => r.arguments[i].conclusion === claim);
        select(ids.find((i) => labels[i] === "IN") ?? ids[0]);
      };
      tr.onclick = pick;
      tr.onkeydown = (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          pick();
        }
      };
      body.append(tr);
    }
  }
  function builtFrom(r, a) {
    return a.rule
      ? `${a.rule}(${a.children.map((c) => r.arguments[c].alias).join(", ")})`
      : `${T(a.kind)} ${a.conclusion}`;
  }
  function renderArguments() {
    const list = $("argument-list");
    list.replaceChildren();
    const r = state.result;
    if (!r) return;
    const labels = labelling();
    const groups = new Map();
    r.arguments.forEach((a, i) =>
      (groups.get(a.conclusion) || groups.set(a.conclusion, []).get(a.conclusion)).push(i),
    );
    for (const [claim, ids] of [...groups].sort((x, y) => x[0].localeCompare(y[0]))) {
      const d = el("details");
      if (ids.length <= 2) d.open = true;
      const summary = el("summary");
      summary.append(
        `${claim} `,
        badge(statusText(r.claims[claim].status), r.claims[claim].status),
        " " +
          T(ids.length > 1 ? "{n} arguments" : "{n} argument", {
            n: ids.length,
          }),
      );
      d.append(summary);
      const ul = el("ul");
      for (const i of ids) {
        const b = el(
          "button",
          {
            type: "button",
          },
          r.arguments[i].alias,
        );
        b.onclick = () => select(i);
        const li = el("li");
        li.append(b, ` ${builtFrom(r, r.arguments[i])}  `, badge(LABEL[labels[i]], labels[i]));
        ul.append(li);
      }
      d.append(ul);
      list.append(d);
    }
  }
  function tree(r, i, depth = 0) {
    const a = r.arguments[i];
    const line =
      "  ".repeat(depth) +
      `${a.alias}: ${a.rule ? a.text : T(a.kind) + " " + a.conclusion}  [${builtFrom(r, a)}]`;
    return [line, ...a.children.map((c) => tree(r, c, depth + 1))].join("\n");
  }
  function argumentText(a) {
    return a.rule ? a.text : `${T(a.kind)} ${a.conclusion}`;
  }
  function claimLevelModel(claim) {
    const r = state.result,
      labels = labelling();
    const byClaim = new Map();
    r.arguments.forEach((a, i) =>
      (byClaim.get(a.conclusion) || byClaim.set(a.conclusion, []).get(a.conclusion)).push(i),
    );
    const bearers = new Set(byClaim.get(claim) || []);
    const showFailed = $("claim-failed").checked;
    const keyIndex = new Map(r.arguments.map((a, i) => [a.key, i]));
    const nodes = new Map(),
      edges = [],
      seen = new Set();
    const claimNode = (c) => {
      if (nodes.has("c:" + c)) return "c:" + c;
      const ids = byClaim.get(c) || [];
      const st = ids.map((i) => labels[i]);
      const fact = ids
        .map((i) => r.arguments[i])
        .find((a) => a.kind === "premise" || a.kind === "axiom");
      nodes.set("c:" + c, {
        id: "c:" + c,
        label: c,
        state: st.includes("IN")
          ? "IN"
          : st.length && st.every((x) => x === "OUT")
            ? "OUT"
            : "UNDEC",
        tag: [
          fact ? kindTag(fact.kind) : "",
          ids.length > 1 ? T("×{n} arguments", { n: ids.length }) : T("1 argument"),
        ]
          .filter(Boolean)
          .join(" · "),
        title: `${c}: ${statusText((r.claims[c] || {}).status)}`,
      });
      return "c:" + c;
    };
    const ruleNode = (a) => {
      if (!nodes.has("r:" + a.rule))
        nodes.set("r:" + a.rule, {
          id: "r:" + a.rule,
          label: `${a.rule} ${a.kind === "strict" ? "→" : "⇒"}`,
          shape: "ellipse",
          dashed: a.kind === "defeasible",
          title: a.text,
        });
      return "r:" + a.rule;
    };
    claimNode(claim);
    for (const b of bearers) {
      const a = r.arguments[b];
      if (!a.rule) continue;
      const rid = ruleNode(a);
      for (const c of new Set(a.children.map((k) => r.arguments[k].conclusion))) {
        const key = "d:" + c + ">" + rid;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push({ source: claimNode(c), target: rid, kind: "derive" });
        }
      }
      const key = "d:" + rid + ">" + claim;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ source: rid, target: "c:" + claim, kind: "derive" });
      }
    }
    for (const a of r.attacks) {
      if (!(bearers.has(a.target) || bearers.has(a.attacker)) || !(a.succeeds || showFailed))
        continue;
      const w = keyIndex.has(a.on) ? r.arguments[keyIndex.get(a.on)] : r.arguments[a.target];
      const from = claimNode(r.arguments[a.attacker].conclusion);
      const to = a.kind === "undercut" ? ruleNode(w) : claimNode(w.conclusion);
      const key = (a.succeeds ? "x:" : "f:") + from + ">" + to;
      if (seen.has(key)) continue;
      seen.add(key);
      const x = r.arguments[a.attacker].conclusion;
      edges.push({
        source: from,
        target: to,
        kind: a.succeeds ? "defeat" : "attack",
        title:
          (a.kind === "undercut"
            ? T("{x} undercuts rule {r}", { x, r: w.rule })
            : T(a.kind === "undermine" ? "{x} undermines {y}" : "{x} rebuts {y}", {
                x,
                y: w.conclusion,
              })) + (a.succeeds ? "" : " · " + T("fails")),
      });
    }
    return { nodes: [...nodes.values()], edges, size: nodes.size };
  }
  function claimGraphModel(claim) {
    if (state.claimMode !== "arguments") return claimLevelModel(claim);
    const r = state.result,
      labels = labelling();
    const bearers = new Set(
      r.arguments.map((a, i) => i).filter((i) => r.arguments[i].conclusion === claim),
    );
    const showFailed = $("claim-failed").checked;
    const shown = new Set(bearers);
    for (const b of bearers) for (const c of r.arguments[b].children) shown.add(c);
    const touching = r.attacks.filter(
      (a) => (bearers.has(a.target) || bearers.has(a.attacker)) && (a.succeeds || showFailed),
    );
    for (const a of touching) {
      shown.add(a.attacker);
      shown.add(a.target);
    }
    const nodes = [],
      edges = [],
      seen = new Set();
    for (const i of shown) {
      const a = r.arguments[i];
      nodes.push({
        id: "a:" + i,
        label: a.conclusion,
        tag: `${a.alias} · ${kindTag(a.kind)}`,
        state: labels[i],
        title: `${a.alias}: ${argumentText(a)}`,
      });
    }
    for (const b of bearers) {
      const a = r.arguments[b];
      if (!a.rule) continue;
      nodes.push({
        id: "i:" + b,
        label: `${a.rule} ${a.kind === "strict" ? "→" : "⇒"}`,
        shape: "ellipse",
        dashed: a.kind === "defeasible",
        title: a.text,
      });
      a.children.forEach((c) => edges.push({ source: "a:" + c, target: "i:" + b, kind: "derive" }));
      edges.push({ source: "i:" + b, target: "a:" + b, kind: "derive" });
    }
    const keyIndex = new Map(r.arguments.map((a, i) => [a.key, i]));
    const onWhat = (a) => {
      const w = keyIndex.get(a.on);
      return w !== undefined && w !== a.target ? T(" (on {w})", { w: r.arguments[w].alias }) : "";
    };
    for (const a of touching) {
      const key = a.attacker + (a.succeeds ? ">" : "~") + a.target;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        source: "a:" + a.attacker,
        target: "a:" + a.target,
        kind: a.succeeds ? "defeat" : "attack",
        title: a.succeeds
          ? T("{x} defeats {y}", {
              x: r.arguments[a.attacker].alias,
              y: r.arguments[a.target].alias,
            }) + onWhat(a)
          : T("{x} attacks {y}, but the attack fails", {
              x: r.arguments[a.attacker].alias,
              y: r.arguments[a.target].alias,
            }) + onWhat(a),
      });
    }
    return { nodes, edges, size: shown.size };
  }
  function renderClaimGraph() {
    const box = $("claim-graph-box"),
      r = state.result;
    if (!r || state.selected === null) {
      box.hidden = true;
      return;
    }
    const claim = r.arguments[state.selected].conclusion;
    box.hidden = false;
    $("claim-graph-title").textContent = T("Graph for the claim {c}", { c: claim });
    const model = claimGraphModel(claim);
    const canvas = $("claim-canvas");
    if (model.size > 150) {
      canvas.replaceChildren(
        el(
          "p",
          { class: "empty" },
          T("{n} arguments bear on this claim; too many to draw.", { n: model.size }),
        ),
      );
      return;
    }
    $("claim-mode-claims").setAttribute("aria-pressed", String(state.claimMode !== "arguments"));
    $("claim-mode-arguments").setAttribute("aria-pressed", String(state.claimMode === "arguments"));
    ArgGraph.render(canvas, model, {
      label: T("Graph of the arguments that bear on this claim"),
      selected: state.claimMode === "arguments" ? "a:" + state.selected : "c:" + claim,
      onSelect: (id) => {
        if (id.startsWith("a:")) select(Number(id.slice(2)));
        else if (id.startsWith("c:")) {
          const c = id.slice(2),
            labels = labelling();
          const ids = r.arguments.map((a, i) => i).filter((i) => r.arguments[i].conclusion === c);
          if (ids.length) select(ids.find((i) => labels[i] === "IN") ?? ids[0]);
        }
      },
    });
  }
  function renderDetail() {
    renderClaimGraph();
    const box = $("detail");
    box.replaceChildren();
    const r = state.result;
    if (!r || state.selected === null) {
      box.append(
        el(
          "p",
          {
            class: "note",
          },
          T("Select an argument in the graph or the list."),
        ),
      );
      return;
    }
    const i = state.selected,
      a = r.arguments[i],
      labels = labelling();
    const head = el("p");
    head.append(
      el(
        "b",
        {},
        T("{alias} concludes {c} ", {
          alias: a.alias,
          c: a.conclusion,
        }),
      ),
      badge(LABEL[labels[i]], labels[i]),
    );
    box.append(head);
    box.append(
      el(
        "div",
        {
          class: "tree",
        },
        tree(r, i),
      ),
    );
    const facts = [];
    if (a.premises.length)
      facts.push(
        T("premises it relies on: {list}", {
          list: a.premises.join(", "),
        }),
      );
    if (a.axioms.length)
      facts.push(
        T("axioms: {list}", {
          list: a.axioms.join(", "),
        }),
      );
    if (a.defeasibleRules.length)
      facts.push(
        T("defeasible rules: {list}", {
          list: a.defeasibleRules.join(", "),
        }),
      );
    facts.push(
      T("grounded: {label}", {
        label: LABEL[a.grounded],
      }) +
        (a.groundedRound !== null
          ? T(" (settled in round {n})", {
              n: a.groundedRound,
            })
          : ""),
    );
    facts.push(
      T("strength: {v} (h-categorizer; 1 means nothing defeats it)", {
        v: a.strength.toFixed(3),
      }),
    );
    const ul = el("ul");
    facts.forEach((f) => ul.append(el("li", {}, f)));
    box.append(ul);
    const x = AF.explainArgument(r, i, state.view);
    const why = el("div");
    const link = (j) => {
      const b = el("button", { type: "button", class: "linkish" }, r.arguments[j].alias);
      b.onclick = () => select(j);
      return b;
    };
    const list = (p, items, sep = ", ") =>
      items.forEach((j, k) => {
        if (k) p.append(sep);
        p.append(link(j));
      });
    const cap = (t) => t.charAt(0).toLocaleUpperCase(LANG === "TUR" ? "tr" : "en") + t.slice(1);
    const defeatedBy = (p, target, by, verb) => {
      if (LANG === "TUR") {
        p.append(link(target), ", ");
        list(p, by);
        p.append(verb ? " tarafından yeniliyor" : " tarafından");
      } else {
        p.append(link(target), verb ? " is defeated by " : " by ");
        list(p, by);
      }
    };
    const grounded = r.semantics === "grounded";
    const ctx = el("p", { class: "note" });
    if (x.context.kind === "none")
      ctx.append(
        cap(
          T("There is no {s} extension for this theory; the labels shown are the grounded ones.", {
            s: T(r.semantics),
          }),
        ),
      );
    else if (x.context.kind === "grounded") ctx.append(T("In the grounded extension:"));
    else ctx.append(T("In extension {k} of {n}:", { k: x.context.index + 1, n: x.context.count }));
    why.append(ctx);
    const p = el("p");
    if (x.reason.type === "unattacked") p.append(T("Nothing defeats it, so it is accepted."));
    else if (x.reason.type === "defended") {
      p.append(
        T(
          "Accepted because every argument that defeats it is itself defeated by an accepted argument: ",
        ),
      );
      x.reason.answers.forEach((a, k) => {
        if (k) p.append("; ");
        defeatedBy(p, a.defeater, a.answeredBy, true);
      });
    } else if (x.reason.type === "defeated") {
      p.append(T("Defeated by accepted argument(s): "));
      list(p, x.reason.by);
    } else {
      p.append(
        T(
          "Undecided: no accepted argument defeats it, but these defeaters are themselves undecided: ",
        ),
      );
      list(p, x.reason.by);
    }
    why.append(p);
    if (x.failed.length) {
      const f = el("p", { class: "note" });
      f.append(
        T("Attacks that fail because the attacker is weaker under the chosen preferences: "),
      );
      x.failed.slice(0, 8).forEach((a, k) => {
        if (k) f.append("; ");
        f.append(link(a.attacker));
        if (a.on !== i) f.append(T(" (on {w})", { w: r.arguments[a.on].alias }));
      });
      if (x.failed.length > 8) f.append(T(" and {n} more", { n: x.failed.length - 8 }));
      why.append(f);
    }
    box.append(why);
    const c = AF.explainClaim(r, a.conclusion);
    const cbox = el("div", { class: "claim-why" });
    const h = el("p");
    h.append(
      el("b", {}, T("The claim {c}", { c: a.conclusion }) + " "),
      badge(statusText(c.status), c.status),
    );
    cbox.append(h);
    const q = el("p");
    const exts = (indices) => {
      indices.slice(0, 8).forEach((k, m) => {
        if (m) q.append(", ");
        q.append(String(k + 1));
      });
      if (indices.length > 8) q.append(T(" and {n} more", { n: indices.length - 8 }));
    };
    const here = c.perExtension[state.view];
    if (c.status === "NO_EXTENSIONS")
      q.append(
        cap(
          T("The {s} semantics has no extension for this theory, so no claim has a status.", {
            s: T(r.semantics),
          }),
        ),
      );
    else if (c.status === "JUSTIFIED") {
      if (c.count === 1) {
        q.append(T("The grounded extension contains an argument for it: "));
        list(q, here.accepted);
      } else {
        q.append(
          T(
            "Every one of the {n} extensions contains an argument for it, not necessarily the same one. ",
            { n: c.count },
          ),
        );
        q.append(T("In this extension: "));
        list(q, here.accepted);
      }
    } else if (c.status === "DEFENSIBLE") {
      q.append(T("Accepted in {k} of {n} extensions (", { k: c.acceptedIn.length, n: c.count }));
      exts(c.acceptedIn);
      q.append(T("); in the others no argument for it is accepted."));
    } else if (c.status === "OVERRULED") {
      q.append(
        grounded
          ? T("In the grounded extension, every argument for it is defeated: ")
          : T("In every extension, every argument for it is defeated. In this extension: "),
      );
      here.defeated.forEach((d, k) => {
        if (k) q.append("; ");
        defeatedBy(q, d.argument, d.by, false);
      });
    } else {
      q.append(
        grounded
          ? T(
              "The grounded extension does not accept it, but not every argument for it is defeated: ",
            )
          : T(
              "No extension accepts it, but not every argument for it is always defeated. In this extension: ",
            ),
      );
      if (here.undecided.length) {
        q.append(T("undecided "));
        list(q, here.undecided);
      }
      here.defeated.forEach((d, k) => {
        q.append(here.undecided.length || k ? "; " : "", T("defeated "));
        defeatedBy(q, d.argument, d.by, false);
      });
    }
    cbox.append(q);
    box.append(cbox);
  }
  function share() {
    const data = {
      s: $("source").value,
      ...options(),
      lang: LANG,
    };
    const url = location.href.split("#")[0] + "#" + encodeURIComponent(JSON.stringify(data));
    history.replaceState(null, "", url);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
      () => status(T("Link copied. Anyone opening it sees this theory and these settings.")),
      () => status(T("Link is in the address bar; copy it from there.")),
    );
  }
  function restore() {
    if (!location.hash) return false;
    try {
      const d = JSON.parse(decodeURIComponent(location.hash.slice(1)));
      $("source").value = d.s || "";
      if (d.semantics) $("semantics").value = d.semantics;
      if (d.ordering) $("ordering").value = d.ordering;
      if (d.setOrdering) $("set-ordering").value = d.setOrdering;
      $("transposition").checked = d.transposition !== false;
      if (d.lang === "TUR" || d.lang === "ENG") LANG = d.lang;
      return true;
    } catch (e) {
      return false;
    }
  }
  function randomSeed() {
    if (typeof crypto !== "undefined" && crypto.getRandomValues)
      return crypto.getRandomValues(new Uint32Array(1))[0] >>> 1;
    return Math.floor(Math.random() * 2 ** 31);
  }
  function generate() {
    let seed = randomSeed(),
      text = AF.generateSource(seed, AF.variedParams(seed, "any"));
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const probe = AF.evaluate(text, { ...options(), semantics: "grounded", maxArguments: 300 });
        if (probe.arguments.length >= 3) break;
      } catch (e) {}
      seed = randomSeed();
      text = AF.generateSource(seed, AF.variedParams(seed, "any"));
    }
    $("source").value = LANG === "TUR" ? translateKeywords(text, "TUR") : text;
    $("example").value = "";
    showExampleNote();
    evaluate({ seed });
  }

  function init() {
    const ex = $("example");
    const fillExamples = () => {
      const keep = ex.value;
      ex.replaceChildren(
        el(
          "option",
          {
            value: "",
          },
          T("My own theory"),
        ),
      );
      EXAMPLES.forEach((e, i) =>
        ex.append(
          el(
            "option",
            {
              value: String(i),
            },
            exampleName(e),
          ),
        ),
      );
      ex.value = keep;
    };
    fillExamples();
    $("language").onchange = () => {
      LANG = $("language").value;
      try {
        localStorage.setItem("argforge-web-language", LANG);
      } catch (e) {}
      applyStatic();
      renderInsertBar();
      fillExamples();
      $("source").value = translateKeywords($("source").value, LANG);
      showExampleNote();
      if (state.result) {
        render();
        status(resultStatus());
      } else evaluate();
    };
    ex.onchange = () => {
      if (ex.value !== "") applyExampleSettings(EXAMPLES[Number(ex.value)]);
      showExampleNote();
      if (ex.value === "") return;
      $("source").value = exampleSource(EXAMPLES[Number(ex.value)]);
      state.selected = null;
      evaluate();
    };
    $("random").onclick = generate;
    $("cancel").onclick = cancel;
    $("claim-failed").onchange = renderClaimGraph;
    $("claim-mode-claims").onclick = () => {
      state.claimMode = "claims";
      renderClaimGraph();
    };
    $("claim-mode-arguments").onclick = () => {
      state.claimMode = "arguments";
      renderClaimGraph();
    };
    $("evaluate").onclick = evaluate;
    if ($("share")) $("share").onclick = share;
    $("source").addEventListener("input", () => {
      ex.value = "";
      later();
    });
    $("source").addEventListener("keydown", (ev) => {
      if (ev.key !== "Tab" || ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      const area = $("source");
      if (PLACEHOLDER.test(area.value) && selectPlaceholder(area, area.selectionEnd))
        ev.preventDefault();
    });
    renderInsertBar();
    for (const id of ["semantics", "ordering", "set-ordering", "transposition"])
      $(id).onchange = evaluate;
    $("show-defeats").onchange = renderGraph;
    $("mode-claims").onclick = () => {
      state.mode = "claims";
      syncMode();
      renderGraph();
    };
    $("mode-arguments").onclick = () => {
      state.mode = "arguments";
      syncMode();
      renderGraph();
    };
    if (!restore()) {
      ex.value = "0";
      $("source").value = exampleSource(EXAMPLES[0]);
    }
    applyStatic();
    fillExamples();
    evaluate();
  }
  init();
})();
