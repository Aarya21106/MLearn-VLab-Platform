// Module-type Web Worker running Pyodide. Pyodide ships as an ES module
// (pyodide.mjs) as of the v314 line, so this must be loaded with
// `new Worker(url, { type: "module" })` and use a static import rather than
// the older classic-worker + importScripts() pattern.
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.4/full/pyodide.mjs";

const CORE_PACKAGES = ["numpy", "pandas", "matplotlib", "scikit-learn", "scipy"];

const FIGURE_CAPTURE_CODE = `
def __mlearn_capture_figures():
    import matplotlib.pyplot as plt
    import base64, io
    figures = []
    for num in plt.get_fignums():
        fig = plt.figure(num)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight")
        buf.seek(0)
        figures.append(base64.b64encode(buf.read()).decode("ascii"))
    plt.close("all")
    return figures

__mlearn_capture_figures()
`;

let pyodideReadyPromise = null;
// Persistent kernel-style globals so variables/imports from one cell are
// visible to the next, matching real notebook semantics.
let sessionGlobals = null;

async function initPyodide() {
  const pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.4/full/",
  });

  postMessage({ type: "progress", message: "Loading numpy, pandas, matplotlib, scikit-learn, scipy..." });
  await pyodide.loadPackage(CORE_PACKAGES);

  // Headless backend so plt.show() doesn't error inside the worker.
  await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use("Agg")
`);

  const dict = pyodide.globals.get("dict");
  sessionGlobals = dict();

  return pyodide;
}

function getPyodide() {
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = initPyodide();
  }
  return pyodideReadyPromise;
}

async function runCode(pyodide, code) {
  const stdoutLines = [];
  const stderrLines = [];

  pyodide.setStdout({ batched: (msg) => stdoutLines.push(msg) });
  pyodide.setStderr({ batched: (msg) => stderrLines.push(msg) });

  let error = null;
  let figures = [];
  try {
    await pyodide.runPythonAsync(code, { globals: sessionGlobals });
    const figResult = await pyodide.runPythonAsync(FIGURE_CAPTURE_CODE);
    figures = figResult && figResult.toJs ? figResult.toJs() : figResult ?? [];
  } catch (err) {
    error = err && err.message ? err.message : String(err);
  } finally {
    pyodide.setStdout({});
    pyodide.setStderr({});
  }

  return {
    stdout: stdoutLines.join("\n"),
    stderr: stderrLines.join("\n"),
    error,
    figures,
  };
}

/** Runs student code + autograder code together in a brand-new globals dict
 * (not the interactive sessionGlobals), so grading is never polluted by
 * leftover state from experimentation. */
async function runSubmit(pyodide, studentCode, autograderCode) {
  const dict = pyodide.globals.get("dict");
  const freshGlobals = dict();
  dict.destroy();

  const stdoutLines = [];
  const stderrLines = [];
  pyodide.setStdout({ batched: (msg) => stdoutLines.push(msg) });
  pyodide.setStderr({ batched: (msg) => stderrLines.push(msg) });

  let error = null;
  let result = null;
  try {
    await pyodide.runPythonAsync(studentCode, { globals: freshGlobals });
    await pyodide.runPythonAsync(autograderCode, { globals: freshGlobals });
    const resultPy = freshGlobals.get("RESULT");
    if (resultPy !== undefined) {
      result =
        resultPy && resultPy.toJs
          ? resultPy.toJs({ dict_converter: Object.fromEntries })
          : resultPy;
      if (resultPy && resultPy.destroy) resultPy.destroy();
    }
  } catch (err) {
    error = err && err.message ? err.message : String(err);
  } finally {
    pyodide.setStdout({});
    pyodide.setStderr({});
    freshGlobals.destroy();
  }

  return {
    stdout: stdoutLines.join("\n"),
    stderr: stderrLines.join("\n"),
    error,
    result,
  };
}

self.onmessage = async (event) => {
  const { type, id } = event.data;

  if (type === "init") {
    try {
      await getPyodide();
      postMessage({ type: "ready" });
    } catch (err) {
      postMessage({ type: "init-error", message: err && err.message ? err.message : String(err) });
    }
    return;
  }

  if (type === "reset-session") {
    try {
      const pyodide = await getPyodide();
      const dict = pyodide.globals.get("dict");
      if (sessionGlobals && sessionGlobals.destroy) sessionGlobals.destroy();
      sessionGlobals = dict();
      dict.destroy();
      postMessage({ type: "session-reset" });
    } catch (err) {
      postMessage({ type: "session-reset", error: err && err.message ? err.message : String(err) });
    }
    return;
  }

  if (type === "load-dataset") {
    const { dataset } = event.data;
    try {
      const pyodide = await getPyodide();
      pyodide.FS.writeFile(dataset.filename, dataset.content);
      postMessage({ type: "dataset-loaded" });
    } catch (err) {
      postMessage({ type: "dataset-error", message: err && err.message ? err.message : String(err) });
    }
    return;
  }

  if (type === "submit-run") {
    const { studentCode, autograderCode } = event.data;
    try {
      const pyodide = await getPyodide();
      const result = await runSubmit(pyodide, studentCode, autograderCode);
      postMessage({ type: "submit-result", id, ...result });
    } catch (err) {
      postMessage({
        type: "submit-result",
        id,
        stdout: "",
        stderr: "",
        error: err && err.message ? err.message : String(err),
        result: null,
      });
    }
    return;
  }

  if (type === "run") {
    const { code } = event.data;
    try {
      const pyodide = await getPyodide();
      const result = await runCode(pyodide, code);
      postMessage({ type: "result", id, ...result });
    } catch (err) {
      postMessage({
        type: "result",
        id,
        stdout: "",
        stderr: "",
        error: err && err.message ? err.message : String(err),
        figures: [],
      });
    }
  }
};
