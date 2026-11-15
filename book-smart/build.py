#!/usr/bin/env python3
"""Build Book Smart into one self-contained HTML file.

Reads the lesson designs in src/*.dc.html (the same files as the design
canvas), embeds the images in assets/, and writes index.html: a single page
with a small runtime that plays every lesson. No internet access is needed at
runtime except for the Google Fonts stylesheet, which falls back to system
fonts if it is blocked.

Usage:  python3 book-smart/build.py
"""
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
ASSETS = ROOT / "assets"
OUT = ROOT / "index.html"

# Page order: the module map first, then the lessons.
PAGES = [
    ("Main.dc.html", "Overview"),
    ("Why.dc.html", "1. Why the catalog?"),
    ("Record.dc.html", "2. Book record"),
    ("CallNumbers.dc.html", "3. Call numbers"),
    ("Search.dc.html", "4. Find an ebook"),
]

# Uploaded canvas images -> local files, embedded as data URIs.
BLOBS = {
    "6b8bda79a7ceaa4be1f36470ec8c0fdf": "blue-devil.png",
    "b2a2aec44e62c8accce2ee4ce2459e4b": "perkins-exterior.jpg",
    "a1ffb2b00b5f4ea89a00d20067c407c5": "library-arch.jpg",
}
MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}


def data_uri(name):
    path = ASSETS / name
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{MIME[path.suffix.lower()]};base64,{b64}"


def parse_page(name):
    html = (SRC / name).read_text(encoding="utf-8")
    tpl = html.split("<x-dc>", 1)[1].split("</x-dc>", 1)[0]
    tpl = re.sub(r"<helmet>.*?</helmet>", "", tpl, flags=re.S)
    m = re.search(r"<script type=\"text/x-dc\" data-dc-script[^>]*>(.*?)</script>", html, re.S)
    if not m:
        raise SystemExit(f"{name}: no logic script found")
    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).strip()
    for blob_id, file_name in BLOBS.items():
        tpl = tpl.replace(f"/_blob/{blob_id}", data_uri(file_name))
    if "/_blob/" in tpl:
        raise SystemExit(f"{name}: an image is referenced that is not in BLOBS")
    return {"tpl": tpl.strip(), "code": m.group(1).strip(), "title": title}


RUNTIME = r"""
(function () {
  'use strict';
  var PAGES = __PAGES__;
  var NAV = __NAV__;
  var app = document.getElementById('bs-app');
  var tabs = document.getElementById('bs-tabs');
  var current = NAV[0][0];
  var instances = {}, templates = {};
  var pending = [], scheduled = false;

  function schedule(cb) {
    if (cb) pending.push(cb);
    if (scheduled) return;
    scheduled = true;
    Promise.resolve().then(function () {
      scheduled = false;
      render(false);
      var cbs = pending; pending = [];
      cbs.forEach(function (f) { f(); });
    });
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch, cb) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    schedule(cb);
  };
  DCLogic.prototype.forceUpdate = function (cb) { schedule(cb); };

  function instance(name) {
    if (!instances[name]) {
      var Comp = new Function('DCLogic', PAGES[name].code + '\nreturn Component;')(DCLogic);
      instances[name] = new Comp({});
    }
    return instances[name];
  }
  function template(name) {
    if (!templates[name]) {
      var t = document.createElement('template');
      t.innerHTML = PAGES[name].tpl;
      templates[name] = t.content;
    }
    return templates[name];
  }

  /* ---- holes ---- */
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var ANY = /\{\{\s*([^}]+?)\s*\}\}/g;
  function lookup(expr, scope) {
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if (/^(['"]).*\1$/.test(expr)) return expr.slice(1, -1);
    var parts = expr.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function attrValue(raw, scope) {
    var m = raw.match(WHOLE);
    if (m) return lookup(m[1], scope);
    return raw.replace(ANY, function (_, e) { var v = lookup(e, scope); return v == null ? '' : String(v); });
  }
  function interp(text, scope) {
    return text.replace(ANY, function (_, e) { var v = lookup(e, scope); return v == null ? '' : String(v); });
  }
  var EVENTS = { onClick: 'click', onChange: 'input', onInput: 'input', onKeyDown: 'keydown', onKeyUp: 'keyup', onFocus: 'focusin', onBlur: 'focusout' };

  /* ---- render template -> fresh DOM nodes ---- */
  function renderNodes(parent, scope) {
    var out = [];
    parent.childNodes.forEach(function (n) { out.push.apply(out, renderNode(n, scope)); });
    return out;
  }
  function renderNode(n, scope) {
    if (n.nodeType === 3) return [document.createTextNode(interp(n.nodeValue, scope))];
    if (n.nodeType !== 1) return [];
    var tag = n.localName;
    if (tag === 'helmet' || tag === 'dc-import') return [];
    if (tag === 'sc-if') return attrValue(n.getAttribute('value') || '', scope) ? renderNodes(n, scope) : [];
    if (tag === 'sc-for') {
      var list = attrValue(n.getAttribute('list') || '', scope) || [];
      var as = n.getAttribute('as') || 'item', out = [];
      list.forEach(function (item, i) {
        var s = Object.create(scope); s[as] = item; s.$index = i;
        out.push.apply(out, renderNodes(n, s));
      });
      return out;
    }
    var el = n.namespaceURI === 'http://www.w3.org/1999/xhtml' ? document.createElement(tag) : document.createElementNS(n.namespaceURI, tag);
    el.__on = {};
    Array.prototype.forEach.call(n.attributes, function (a) {
      var name = a.name;
      if (name.indexOf('hint-') === 0) return;
      var reactName = name.replace(/^on([a-z])/, function (_, c) { return 'on' + c.toUpperCase(); });
      var evt = null;
      Object.keys(EVENTS).forEach(function (k) { if (k.toLowerCase() === name.toLowerCase()) evt = EVENTS[k]; });
      if (evt) { var fn = attrValue(a.value, scope); if (typeof fn === 'function') el.__on[evt] = fn; return; }
      var v = attrValue(a.value, scope);
      if ((tag === 'input' || tag === 'textarea') && name === 'value') { el.__value = v == null ? '' : String(v); el.value = el.__value; return; }
      if (v === false || v == null) return;
      el.setAttribute(name, v === true ? '' : String(v));
    });
    renderNodes(n, scope).forEach(function (c) { el.appendChild(c); });
    return [el];
  }

  /* ---- patch live DOM so focus and typing survive re-renders ---- */
  function patch(parent, nodes) {
    var live = Array.prototype.slice.call(parent.childNodes);
    nodes.forEach(function (n, i) {
      var l = live[i];
      if (!l) { parent.appendChild(n); return; }
      if (l.nodeType !== n.nodeType || (n.nodeType === 1 && (l.localName !== n.localName || l.namespaceURI !== n.namespaceURI))) { parent.replaceChild(n, l); return; }
      if (n.nodeType === 3) { if (l.nodeValue !== n.nodeValue) l.nodeValue = n.nodeValue; return; }
      Array.prototype.slice.call(l.attributes).forEach(function (a) { if (!n.hasAttribute(a.name)) l.removeAttribute(a.name); });
      Array.prototype.forEach.call(n.attributes, function (a) { if (l.getAttribute(a.name) !== a.value) l.setAttribute(a.name, a.value); });
      l.__on = n.__on;
      if (n.__value !== undefined && l.value !== n.__value) l.value = n.__value;
      patch(l, Array.prototype.slice.call(n.childNodes));
    });
    for (var i = nodes.length; i < live.length; i++) parent.removeChild(live[i]);
  }

  function render(newPage) {
    var inst = instance(current);
    var scope = Object.assign(Object.create(null), inst.renderVals());
    var nodes = renderNodes(template(current), scope);
    if (newPage) app.textContent = '';
    patch(app, nodes);
    renderTabs();
    if (newPage) {
      document.title = PAGES[current].title + ' · Book Smart';
      window.scrollTo(0, 0);
      app.focus({ preventScroll: true });
    }
  }
  function renderTabs() {
    tabs.textContent = '';
    NAV.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bs-tab' + (p[0] === current ? ' on' : '');
      b.textContent = p[1];
      if (p[0] === current) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', function () { go(p[0]); });
      tabs.appendChild(b);
    });
  }
  function go(name) { if (PAGES[name]) { current = name; render(true); } }

  ['click', 'input', 'keydown', 'keyup', 'focusin', 'focusout'].forEach(function (type) {
    app.addEventListener(type, function (e) {
      if (type === 'click') {
        var a = e.target.closest('a[href]');
        if (a && /\.dc\.html$/.test(a.getAttribute('href'))) { e.preventDefault(); go(a.getAttribute('href').split('/').pop()); return; }
      }
      var el = e.target;
      while (el && el !== app) {
        if (el.__on && el.__on[type]) { el.__on[type](e); return; }
        el = el.parentNode;
      }
    });
  });

  render(true);
})();
"""

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Book Smart</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
body{margin:0;background:#E9ECF1;font-family:'Noto Sans',system-ui,-apple-system,'Segoe UI',sans-serif;color:#262626}
a{color:#012169}a:hover{color:#00539B}
button,input,select,textarea{font-family:inherit}
:focus-visible{outline:3px solid #00539B;outline-offset:2px}
#bs-app:focus{outline:none}
.bs-bar{background:#1B2333;color:#FFFFFF}
.bs-bar-in{max-width:1440px;margin:0 auto;padding:10px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 20px}
.bs-brand{font-weight:800;font-size:17px;margin-right:auto}
.bs-brand small{display:block;font-size:12px;font-weight:600;color:#C9D0DC}
.bs-tabs{display:flex;flex-wrap:wrap;gap:6px}
.bs-tab{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid #3A4458;background:transparent;color:#D5DAE3;font-size:14px;font-weight:600;cursor:pointer}
.bs-tab.on{background:#F2C14E;border-color:#F2C14E;color:#1B2333}
</style>
</head>
<body>
<header class="bs-bar">
  <div class="bs-bar-in">
    <div class="bs-brand">Book Smart<small>Finding books at Duke Libraries</small></div>
    <nav class="bs-tabs" id="bs-tabs" aria-label="Lessons"></nav>
  </div>
</header>
<main id="bs-app" tabindex="-1"></main>
<script>
__RUNTIME__
</script>
</body>
</html>
"""


def main():
    pages = {name: parse_page(name) for name, _ in PAGES}
    pages_json = json.dumps(pages, ensure_ascii=False).replace("</", "<\\/")
    nav_json = json.dumps([[n, label] for n, label in PAGES], ensure_ascii=False)
    runtime = RUNTIME.replace("__PAGES__", pages_json).replace("__NAV__", nav_json)
    OUT.write_text(PAGE.replace("__RUNTIME__", runtime), encoding="utf-8")
    print(f"Built {OUT.relative_to(ROOT.parent)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
