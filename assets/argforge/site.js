"use strict";

(function () {
  const KEY = "argforge-web-language";
  const $ = (id) => document.getElementById(id);
  function initialLanguage() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q) return q.toLowerCase().startsWith("tr") ? "TUR" : "ENG";
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "TUR" || saved === "ENG") return saved;
    } catch (e) {}
    return (navigator.language || "").toLowerCase().startsWith("tr") ? "TUR" : "ENG";
  }
  let LANG = initialLanguage();
  function apply() {
    const tr = LANG === "TUR";
    document.documentElement.lang = tr ? "tr" : "en";
    const title = document.querySelector("title");
    if (title && title.dataset.en) document.title = tr ? title.dataset.tr : title.dataset.en;
    document.querySelectorAll("[data-label-en]").forEach((node) => {
      node.setAttribute("aria-label", tr ? node.dataset.labelTr : node.dataset.labelEn);
    });
    document.querySelectorAll("[data-placeholder-en]").forEach((node) => {
      node.placeholder = tr ? node.dataset.placeholderTr : node.dataset.placeholderEn;
    });
    document.querySelectorAll("a[data-nav]").forEach((link) => {
      const hash = link.dataset.hash || "";
      link.href = link.dataset.nav + "?lang=" + (tr ? "tr" : "en") + hash;
    });
    const select = $("language");
    if (select) select.value = LANG;
    filter();
  }
  function filter() {
    const box = $("gloss-filter");
    if (!box) return;
    const words = box.value
      .trim()
      .toLocaleLowerCase(LANG === "TUR" ? "tr" : "en")
      .split(/\s+/)
      .filter(Boolean);
    let shown = 0;
    document.querySelectorAll(".gloss .entry").forEach((entry) => {
      const text = entry.textContent.toLocaleLowerCase(LANG === "TUR" ? "tr" : "en");
      const visible = words.every((w) => text.includes(w));
      entry.hidden = !visible;
      if (visible) shown++;
    });
    document.querySelectorAll(".gloss-group").forEach((group) => {
      group.hidden = !group.querySelector(".entry:not([hidden])");
    });
    const empty = $("gloss-empty");
    if (empty) empty.hidden = shown > 0;
  }
  document.addEventListener("DOMContentLoaded", () => {
    const select = $("language");
    if (select)
      select.addEventListener("change", () => {
        LANG = select.value === "TUR" ? "TUR" : "ENG";
        try {
          localStorage.setItem(KEY, LANG);
        } catch (e) {}
        apply();
      });
    const box = $("gloss-filter");
    if (box) box.addEventListener("input", filter);
    apply();
  });
})();
