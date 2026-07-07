(function () {
  "use strict";

  var STEPS = ["welcome", "authority", "searching", "wrapup"];
  var state = {
    authority: {
      assignments: {},   // sourceId -> needId
      placedZoneFor: {}, // needId -> sourceId
      lockedCorrect: {}, // sourceId -> true
      selectedNeedId: null,
      wrongAttempts: 0
    },
    searching: {
      history: [],       // { query, level }
      successReached: false
    }
  };

  // ---------- navigation ----------

  function goToStep(name) {
    STEPS.forEach(function (s) {
      var section = document.getElementById("step-" + s);
      var navItem = document.querySelector('.progress-step[data-step="' + s + '"]');
      var idx = STEPS.indexOf(s);
      var targetIdx = STEPS.indexOf(name);
      section.hidden = s !== name;
      navItem.classList.toggle("is-active", s === name);
      navItem.classList.toggle("is-done", idx < targetIdx);
    });
    document.getElementById("main").scrollTo && window.scrollTo(0, 0);
    SCORM.setValue("cmi.core.lesson_location", name);
    SCORM.commit();
  }

  // ---------- Authority activity ----------

  function renderAuthority() {
    var data = DATA.authority;
    document.getElementById("authority-prompt").textContent = data.prompt;

    var needList = document.getElementById("need-list");
    needList.innerHTML = "";
    data.needs.forEach(function (need) {
      if (state.authority.placedZoneFor[need.id]) return; // already placed somewhere
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "need-card";
      btn.draggable = true;
      btn.dataset.id = need.id;
      btn.textContent = need.text;
      btn.addEventListener("click", onNeedClick);
      btn.addEventListener("dragstart", onNeedDragStart);
      btn.addEventListener("dragend", onNeedDragEnd);
      li.appendChild(btn);
      needList.appendChild(li);
    });

    var sourceList = document.getElementById("source-list");
    if (!sourceList.dataset.built) {
      sourceList.innerHTML = "";
      data.sourceDisplayOrder.forEach(function (sourceId) {
        var source = data.sources.filter(function (s) { return s.id === sourceId; })[0];
        var li = document.createElement("li");
        li.className = "source-zone";
        li.dataset.id = source.id;
        li.tabIndex = 0;
        li.setAttribute("role", "button");
        li.setAttribute("aria-label", "Place selected situation here: " + source.text);

        var label = document.createElement("span");
        label.className = "source-label";
        label.textContent = source.text;
        li.appendChild(label);

        var slot = document.createElement("div");
        slot.className = "placed-slot";
        li.appendChild(slot);

        var feedback = document.createElement("div");
        feedback.className = "zone-feedback";
        li.appendChild(feedback);

        li.addEventListener("click", onZoneActivate);
        li.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onZoneActivate.call(li, e);
          }
        });
        li.addEventListener("dragover", onZoneDragOver);
        li.addEventListener("dragleave", onZoneDragLeave);
        li.addEventListener("drop", onZoneDrop);

        sourceList.appendChild(li);
      });
      sourceList.dataset.built = "true";
    }
    refreshZonesFromState();
  }

  function refreshZonesFromState() {
    var zones = document.querySelectorAll(".source-zone");
    zones.forEach(function (zone) {
      var sourceId = zone.dataset.id;
      var needId = state.authority.assignments[sourceId];
      var slot = zone.querySelector(".placed-slot");
      slot.innerHTML = "";
      if (needId) {
        var need = DATA.authority.needs.filter(function (n) { return n.id === needId; })[0];
        var card = document.createElement("div");
        card.className = "placed-card";
        card.textContent = need.text;
        slot.appendChild(card);
      }
      zone.classList.toggle("is-correct", !!state.authority.lockedCorrect[sourceId]);
    });
  }

  function onNeedClick(e) {
    var id = e.currentTarget.dataset.id;
    var alreadySelected = state.authority.selectedNeedId === id;
    document.querySelectorAll(".need-card").forEach(function (c) { c.classList.remove("is-selected"); });
    state.authority.selectedNeedId = alreadySelected ? null : id;
    if (!alreadySelected) e.currentTarget.classList.add("is-selected");
  }

  function onNeedDragStart(e) {
    e.dataTransfer.setData("text/plain", e.currentTarget.dataset.id);
    e.currentTarget.classList.add("is-dragging");
  }

  function onNeedDragEnd(e) {
    e.currentTarget.classList.remove("is-dragging");
  }

  function onZoneDragOver(e) {
    var zone = e.currentTarget;
    if (state.authority.lockedCorrect[zone.dataset.id]) return;
    e.preventDefault();
    zone.classList.add("is-dragover");
  }

  function onZoneDragLeave(e) {
    e.currentTarget.classList.remove("is-dragover");
  }

  function onZoneDrop(e) {
    var zone = e.currentTarget;
    if (state.authority.lockedCorrect[zone.dataset.id]) return;
    e.preventDefault();
    zone.classList.remove("is-dragover");
    var needId = e.dataTransfer.getData("text/plain");
    if (needId) placeNeedInZone(needId, zone.dataset.id);
  }

  function onZoneActivate(e) {
    var zone = e.currentTarget || this;
    var sourceId = zone.dataset.id;
    if (state.authority.lockedCorrect[sourceId]) return;

    if (state.authority.selectedNeedId) {
      placeNeedInZone(state.authority.selectedNeedId, sourceId);
      state.authority.selectedNeedId = null;
    } else if (state.authority.assignments[sourceId]) {
      // pick the placed need back up
      var needId = state.authority.assignments[sourceId];
      delete state.authority.assignments[sourceId];
      delete state.authority.placedZoneFor[needId];
      zone.classList.remove("is-incorrect");
      zone.querySelector(".zone-feedback").textContent = "";
      renderAuthority();
    }
  }

  function placeNeedInZone(needId, sourceId) {
    // bump anything currently in this zone back to the list
    var existingNeed = state.authority.assignments[sourceId];
    if (existingNeed) delete state.authority.placedZoneFor[existingNeed];

    // remove this need from any zone it previously occupied
    var previousZone = state.authority.placedZoneFor[needId];
    if (previousZone) delete state.authority.assignments[previousZone];

    state.authority.assignments[sourceId] = needId;
    state.authority.placedZoneFor[needId] = sourceId;

    document.querySelectorAll(".need-card").forEach(function (c) { c.classList.remove("is-selected"); });
    document.querySelectorAll(".source-zone").forEach(function (z) {
      z.classList.remove("is-incorrect");
      z.querySelector(".zone-feedback").textContent = "";
    });

    renderAuthority();
  }

  function checkAuthority() {
    var data = DATA.authority;
    var zones = document.querySelectorAll(".source-zone");
    var wrongTexts = [];

    zones.forEach(function (zone) {
      var sourceId = zone.dataset.id;
      if (state.authority.lockedCorrect[sourceId]) return;
      var needId = state.authority.assignments[sourceId];
      if (!needId) return;

      if (data.correctPairs[needId] === sourceId) {
        state.authority.lockedCorrect[sourceId] = true;
        zone.classList.add("is-correct");
        zone.classList.remove("is-incorrect");
        zone.querySelector(".zone-feedback").className = "zone-feedback correct";
        zone.querySelector(".zone-feedback").textContent = data.feedback[needId];
      } else {
        state.authority.wrongAttempts++;
        var needText = data.needs.filter(function (n) { return n.id === needId; })[0].text;
        wrongTexts.push(needText);
        delete state.authority.assignments[sourceId];
        delete state.authority.placedZoneFor[needId];
      }
    });

    renderAuthority();

    var correctCount = Object.keys(state.authority.lockedCorrect).length;
    var statusEl = document.getElementById("authority-status");
    if (correctCount === data.needs.length) {
      statusEl.textContent = "All 6 matched correctly. Nice work.";
      document.querySelector('[data-action="continue-authority"]').disabled = false;
    } else if (wrongTexts.length > 0) {
      statusEl.textContent = correctCount + " of " + data.needs.length + " correct so far. " +
        data.wrongFeedback + " Give another look to: " + wrongTexts.join("; ") + ".";
    } else {
      statusEl.textContent = correctCount + " of " + data.needs.length + " correct so far. Place the rest, then check again.";
    }
  }

  function authorityScore() {
    var correctCount = Object.keys(state.authority.lockedCorrect).length;
    if (correctCount < DATA.authority.needs.length) return 0;
    var penalty = state.authority.wrongAttempts * 5;
    return Math.max(20, 50 - penalty);
  }

  // ---------- Searching activity ----------

  function renderSearching() {
    document.getElementById("searching-prompt").textContent = DATA.searching.taskPrompt;
    document.getElementById("searching-note").textContent = DATA.searching.note;
    renderSearchHistory();
  }

  function analyzeQuery(query) {
    var q = query.toLowerCase();
    var groups = DATA.searching.topicGroups;
    var matched = Object.keys(groups).filter(function (key) {
      return groups[key].some(function (term) { return q.indexOf(term) !== -1; });
    });
    var hasConnector = /\b(and|or|not)\b/i.test(query) || /"[^"]+"/.test(query);
    var n = matched.length;

    if (n === 0) {
      return { count: "184,236", level: 0,
        message: "That's a lot of results to sort through — this term is too broad or off-topic. Try adding words specific to your topic: who's affected, what platform, and what outcome you're studying." };
    }
    if (n === 1) {
      return { count: "9,417", level: 1,
        message: "Better, but still broad. You've got one part of your topic — try adding another concept (who's affected, or what outcome you're studying)." };
    }
    if (n === 2 && !hasConnector) {
      return { count: "642", level: 2,
        message: "Getting focused — you've combined two concepts. Connect them explicitly with a Boolean operator (AND) or search an exact phrase in quotation marks to sharpen this further." };
    }
    if (n === 2 && hasConnector) {
      return { count: "211", level: 3,
        message: "Nice — connecting terms narrows the field. Now bring in the concept you're still missing." };
    }
    if (n === 3 && !hasConnector) {
      return { count: "96", level: 4,
        message: "You've got all three concepts represented. Connect them explicitly with AND (or quotation marks for exact phrases) to get a tightly focused result set." };
    }
    return { count: "27", level: 5, success: true,
      message: "This is a well-constructed search — specific, connected, and focused. Here's what a real result list might include:" };
  }

  function renderSearchHistory() {
    var list = document.getElementById("search-history");
    list.innerHTML = "";
    state.searching.history.forEach(function (entry) {
      var li = document.createElement("li");
      li.textContent = "“" + entry.query + "” — about " + entry.count + " results";
      list.appendChild(li);
    });
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    var input = document.getElementById("search-input");
    var query = input.value.trim();
    if (!query) return;

    var result = analyzeQuery(query);
    state.searching.history.push({ query: query, count: result.count });
    renderSearchHistory();

    var resultEl = document.getElementById("search-result");
    resultEl.classList.toggle("tier-success", !!result.success);

    var html = '<div class="result-count">About ' + result.count + " results</div>";
    html += '<div class="result-tip">' + escapeHtml(result.message) + "</div>";
    if (result.success) {
      state.searching.successReached = true;
      html += '<ul class="citation-list">' +
        DATA.searching.sampleCitations.map(function (c) { return "<li>" + escapeHtml(c) + "</li>"; }).join("") +
        "</ul>";
      document.querySelector('[data-action="continue-searching"]').disabled = false;
    }
    resultEl.innerHTML = html;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function searchScore() {
    return state.searching.successReached ? 50 : 0;
  }

  // ---------- Wrap up ----------

  function renderWrapup() {
    var total = authorityScore() + searchScore();
    document.getElementById("wrapup-score").textContent =
      "Practice score: " + total + " / 100";
    SCORM.setValue("cmi.core.score.raw", total);
    SCORM.setValue("cmi.core.score.min", "0");
    SCORM.setValue("cmi.core.score.max", "100");
    SCORM.setValue("cmi.core.lesson_status", total >= 70 ? "passed" : "completed");
    SCORM.commit();
  }

  function finishModule() {
    SCORM.commit();
    SCORM.finish();
    var btn = document.querySelector('[data-action="finish"]');
    btn.disabled = true;
    btn.textContent = "Module complete";
  }

  // ---------- wiring ----------

  document.addEventListener("DOMContentLoaded", function () {
    SCORM.init();
    if (SCORM.getValue("cmi.core.lesson_status") === "not attempted") {
      SCORM.setValue("cmi.core.lesson_status", "incomplete");
    }
    SCORM.commit();

    document.querySelector('[data-action="start"]').addEventListener("click", function () {
      renderAuthority();
      goToStep("authority");
    });
    document.querySelector('[data-action="check-authority"]').addEventListener("click", checkAuthority);
    document.querySelector('[data-action="continue-authority"]').addEventListener("click", function () {
      renderSearching();
      goToStep("searching");
    });
    document.getElementById("search-form").addEventListener("submit", handleSearchSubmit);
    document.querySelector('[data-action="continue-searching"]').addEventListener("click", function () {
      renderWrapup();
      goToStep("wrapup");
    });
    document.querySelector('[data-action="finish"]').addEventListener("click", finishModule);

    window.addEventListener("beforeunload", function () {
      SCORM.commit();
    });
  });
})();
