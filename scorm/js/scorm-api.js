/*
 * Minimal SCORM 1.2 runtime wrapper.
 * Locates the LMS API object in an ancestor/opener window and exposes
 * a small set of helpers. Falls back to an in-memory no-op API when no
 * LMS is present (e.g. previewing the module directly in a browser),
 * so the module is fully testable outside Canvas.
 */
var SCORM = (function () {
  var api = null;
  var initialized = false;
  var standalone = false;

  function findAPI(win) {
    var attempts = 0;
    while (win.API == null && win.parent != null && win.parent !== win && attempts < 500) {
      attempts++;
      win = win.parent;
    }
    return win.API || null;
  }

  function locateAPI() {
    var found = findAPI(window);
    if (!found && window.opener) {
      found = findAPI(window.opener);
    }
    return found;
  }

  function makeStandaloneAPI() {
    var store = {};
    return {
      LMSInitialize: function () { return "true"; },
      LMSFinish: function () { return "true"; },
      LMSGetValue: function (key) { return store[key] || ""; },
      LMSSetValue: function (key, value) { store[key] = value; return "true"; },
      LMSCommit: function () { return "true"; },
      LMSGetLastError: function () { return "0"; },
      LMSGetErrorString: function () { return ""; },
      LMSGetDiagnostic: function () { return ""; }
    };
  }

  function init() {
    if (initialized) return true;
    api = locateAPI();
    if (!api) {
      standalone = true;
      api = makeStandaloneAPI();
      console.info("[SCORM] No LMS API found — running in standalone preview mode.");
    }
    var result = api.LMSInitialize("");
    initialized = result === "true" || result === true;
    return initialized;
  }

  function setValue(key, value) {
    if (!api) return false;
    return api.LMSSetValue(key, String(value)) === "true";
  }

  function getValue(key) {
    if (!api) return "";
    return api.LMSGetValue(key);
  }

  function commit() {
    if (!api) return false;
    return api.LMSCommit("") === "true";
  }

  function finish() {
    if (!api) return false;
    var result = api.LMSFinish("");
    initialized = false;
    return result === "true";
  }

  function isStandalone() {
    return standalone;
  }

  return {
    init: init,
    setValue: setValue,
    getValue: getValue,
    commit: commit,
    finish: finish,
    isStandalone: isStandalone
  };
})();
