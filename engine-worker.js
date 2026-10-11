"use strict";
importScripts("argforge-core.js");
self.postMessage({ ready: true });
self.onmessage = (event) => {
  const { id, source, options } = event.data;
  try {
    const result = ArgForge.evaluate(source, options);
    delete result.theory;
    delete result.submitted;
    self.postMessage({ id, ok: true, result });
  } catch (e) {
    self.postMessage({
      id,
      ok: false,
      error: { code: e.code, line: e.line, column: e.column, text: e.text, message: e.message },
    });
  }
};
