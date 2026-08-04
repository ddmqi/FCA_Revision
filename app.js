/* =========================================================
   CISI Revision Hub — application logic (no framework, no build step)
   ========================================================= */
(function(){
"use strict";

var DATA = window.CISI_DATA || {};
var EXAM_KEYS = ["regulation","securities","derivatives"];
var EXAM_COLORS = { regulation:"#9a6b1f", securities:"#0f7a6e", derivatives:"#5b6bd6" };

/* ---------- storage helpers (safe: falls back to in-memory if localStorage is blocked, eg some file:// contexts) ---------- */
var memoryStorage = {};
var storageAvailable = (function(){
  try{ var t="__cisi_test__"; localStorage.setItem(t,"1"); localStorage.removeItem(t); return true; }
  catch(e){ return false; }
})();
function lsGet(key){
  if(storageAvailable){ try{ return localStorage.getItem(key); }catch(e){} }
  return Object.prototype.hasOwnProperty.call(memoryStorage,key) ? memoryStorage[key] : null;
}
function lsSet(key, val){
  if(storageAvailable){ try{ localStorage.setItem(key, val); return; }catch(e){} }
  memoryStorage[key] = val;
}

var STORE_KEY = "cisi_revision_progress_v1";
function loadStore(){
  try{ return JSON.parse(lsGet(STORE_KEY)) || {}; }catch(e){ return {}; }
}
function saveStore(s){
  try{ lsSet(STORE_KEY, JSON.stringify(s)); }catch(e){}
}
var store = loadStore();
function ensureExam(examKey){
  if(!store[examKey]) store[examKey] = { chapters:{}, cards:{} };
  return store[examKey];
}
function ensureChapter(examKey, chId){
  var ex = ensureExam(examKey);
  if(!ex.chapters[chId]) ex.chapters[chId] = { visitedSummary:false, visitedDetail:false, bestScore:null, attempts:0 };
  return ex.chapters[chId];
}
function markVisited(examKey, chId, tab){
  var c = ensureChapter(examKey, chId);
  if(tab==="summary") c.visitedSummary = true;
  if(tab==="detail") c.visitedDetail = true;
  saveStore(store);
}
function recordQuizResult(examKey, chId, pct){
  var c = ensureChapter(examKey, chId);
  c.attempts = (c.attempts||0) + 1;
  if(c.bestScore===null || pct > c.bestScore) c.bestScore = pct;
  saveStore(store);
}
function cardState(examKey, cardId){
  var ex = ensureExam(examKey);
  return ex.cards[cardId] || null;
}
function setCardState(examKey, cardId, known){
  var ex = ensureExam(examKey);
  ex.cards[cardId] = { known: known, ts: Date.now() };
  saveStore(store);
}

/* ---------- theme ---------- */
function initTheme(){
  var saved = lsGet("cisi_theme");
  var theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark":"light");
  document.documentElement.setAttribute("data-theme", theme);
}
function toggleTheme(){
  var cur = document.documentElement.getAttribute("data-theme");
  var next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  lsSet("cisi_theme", next);
  renderThemeIcon();
}
function renderThemeIcon(){
  var el = document.getElementById("themeIcon");
  if(!el) return;
  var dark = document.documentElement.getAttribute("data-theme")==="dark";
  el.innerHTML = dark ? ICON.sun : ICON.moon;
}
initTheme();

/* ---------- icons ---------- */
var ICON = {
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  chevron:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
  cards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 6V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg>',
  quiz:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>',
  refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>'
};

/* ---------- utilities ---------- */
function esc(s){ return (s==null?"":String(s)); }
function stripHtml(html){ var d=document.createElement("div"); d.innerHTML=html||""; return d.textContent||""; }
function pct(n,d){ return d>0 ? Math.round(n/d*100) : 0; }
function shuffle(arr){
  var a = arr.slice();
  for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}
function examTitle(k){ return DATA[k] ? DATA[k].title : k; }

function chapterProgressPct(examKey, ch){
  var st = ensureChapter(examKey, ch.id);
  var parts = 0, total = 3;
  if(st.visitedSummary) parts++;
  if(st.visitedDetail) parts++;
  if(st.bestScore!==null && st.bestScore>=70) parts++;
  return Math.round(parts/total*100);
}
function examReadiness(examKey){
  var exam = DATA[examKey];
  if(!exam || !exam.chapters.length) return 0;
  var sum=0;
  exam.chapters.forEach(function(ch){ sum += chapterProgressPct(examKey, ch); });
  return Math.round(sum/exam.chapters.length);
}

/* ---------- routing ---------- */
function parseHash(){
  var h = location.hash.replace(/^#\/?/, "");
  var parts = h.split("/").filter(Boolean).map(decodeURIComponent);
  return parts; // [] | [exam] | [exam, chId] | [exam, chId, tab] | [exam, '_quiz'] | [exam,'_cards']
}
function navigate(path){ location.hash = "#/" + path.map(encodeURIComponent).join("/"); }
window.addEventListener("hashchange", render);

/* ---------- root render ---------- */
var app = document.getElementById("app");

function render(){
  var parts = parseHash();
  closeSearch();
  if(parts.length===0){ renderHome(); renderTopbar(null); return; }
  var examKey = parts[0];
  if(!DATA[examKey]){ renderHome(); renderTopbar(null); return; }
  renderTopbar(examKey);

  if(parts.length===1){ renderExamOverview(examKey); return; }

  var second = parts[1];
  if(second === "_quiz"){ renderFullQuiz(examKey); return; }
  if(second === "_cards"){ renderAllFlashcards(examKey); return; }

  var chId = second;
  var chapter = DATA[examKey].chapters.find(function(c){ return c.id===chId; });
  if(!chapter){ renderExamOverview(examKey); return; }
  var tab = parts[2] || "summary";
  renderChapter(examKey, chapter, tab);
}

/* ---------- topbar ---------- */
function renderTopbar(activeExam){
  var bar = document.getElementById("topbar");
  var switcherHtml = EXAM_KEYS.filter(function(k){return DATA[k];}).map(function(k){
    return '<button data-exam="'+k+'" class="'+(k===activeExam?"active":"")+'">'+examTitle(k)+'</button>';
  }).join("");

  bar.innerHTML =
    '<div class="brand" id="brandHome"><div class="mark">C</div><div><div>CISI Revision Hub</div><div class="sub">Level 3 &middot; Exam prep</div></div></div>' +
    '<div class="exam-switcher" id="examSwitcher">'+switcherHtml+'</div>' +
    '<div class="topbar-spacer"></div>' +
    '<div class="search-box" id="searchBox">'+ICON.search+
      '<input type="text" id="searchInput" placeholder="'+(activeExam? "Search "+examTitle(activeExam)+"…" : "Search…")+'" autocomplete="off"/>'+
      '<div class="search-results" id="searchResults"></div>'+
    '</div>' +
    '<button class="icon-btn" id="themeBtn" title="Toggle theme"><span id="themeIcon"></span></button>';

  document.getElementById("brandHome").onclick = function(){ navigate([]); };
  Array.prototype.forEach.call(bar.querySelectorAll("#examSwitcher button"), function(b){
    b.onclick = function(){ navigate([b.getAttribute("data-exam")]); };
  });
  document.getElementById("themeBtn").onclick = toggleTheme;
  renderThemeIcon();

  var input = document.getElementById("searchInput");
  input.oninput = function(){ doSearch(activeExam, input.value); };
  input.onfocus = function(){ if(input.value.trim()) doSearch(activeExam, input.value); };
  document.addEventListener("click", function(e){
    if(!document.getElementById("searchBox").contains(e.target)) closeSearch();
  }, { once:false });
}
function closeSearch(){
  var r = document.getElementById("searchResults");
  if(r){ r.classList.remove("open"); r.innerHTML=""; }
}
function doSearch(examKey, qRaw){
  var results = document.getElementById("searchResults");
  var q = (qRaw||"").trim().toLowerCase();
  if(q.length < 2){ closeSearch(); return; }
  var hits = [];
  var keysToSearch = examKey ? [examKey] : EXAM_KEYS;
  keysToSearch.forEach(function(ek){
    var exam = DATA[ek];
    if(!exam) return;
    exam.chapters.forEach(function(ch){
      var hay = (ch.title + " " + stripHtml(ch.summaryHtml||"")).toLowerCase();
      (ch.sections||[]).forEach(function(s){ hay += " " + s.heading.toLowerCase() + " " + stripHtml(s.html).toLowerCase(); });
      if(hay.indexOf(q) !== -1){
        var idx = hay.indexOf(q);
        hits.push({ kind: examTitle(ek)+" · Chapter", title: ch.title, snippet: contextSnippet(hay, q), go:[ek, ch.id, "summary"] });
      }
      (ch.flashcards||[]).forEach(function(fc,i){
        var t = (fc.front+" "+fc.back).toLowerCase();
        if(t.indexOf(q)!==-1){
          hits.push({ kind: examTitle(ek)+" · Flashcard", title: fc.front, snippet: fc.back, go:[ek, ch.id, "flashcards"] });
        }
      });
    });
  });
  if(hits.length===0){
    results.innerHTML = '<div class="sr-empty">No matches</div>';
  } else {
    results.innerHTML = hits.slice(0,12).map(function(h,i){
      return '<div class="sr-item" data-i="'+i+'"><div class="sr-kind">'+esc(h.kind)+'</div><div class="sr-title">'+esc(h.title)+'</div><div class="sr-snippet">'+esc(h.snippet)+'</div></div>';
    }).join("");
    Array.prototype.forEach.call(results.querySelectorAll(".sr-item"), function(el){
      el.onclick = function(){ navigate(hits[+el.getAttribute("data-i")].go); closeSearch(); };
    });
  }
  results.classList.add("open");
}
function contextSnippet(hay, q){
  var i = hay.indexOf(q);
  var start = Math.max(0, i-40);
  return (start>0?"…":"") + hay.slice(start, i+q.length+60).trim() + "…";
}

/* ---------- home ---------- */
function renderHome(){
  var keys = EXAM_KEYS.filter(function(k){return DATA[k];});
  var cards = keys.map(function(k){
    var exam = DATA[k];
    var readiness = examReadiness(k);
    return '<div class="exam-card" data-exam="'+k+'">' +
      '<span class="tag">'+esc(exam.subtitle)+'</span>' +
      '<h3>'+esc(exam.title)+'</h3>' +
      '<div class="fmt">'+esc(exam.examFormat)+'</div>' +
      '<div class="stats">' +
        '<div class="stat"><b>'+exam.chapterCount+'</b>chapters</div>' +
        '<div class="stat"><b>'+exam.mcqCount+'</b>MCQs</div>' +
        '<div class="stat"><b>'+exam.flashcardCount+'</b>flashcards</div>' +
      '</div>' +
      '<div class="readiness">' +
        '<div class="readiness-bar"><div style="width:'+readiness+'%"></div></div>' +
        '<div class="readiness-label"><span>Readiness</span><span>'+readiness+'%</span></div>' +
      '</div>' +
    '</div>';
  }).join("");

  app.innerHTML =
    '<div class="hero">' +
      '<h1>Get exam-ready.</h1>' +
      '<p>Every notion, every figure, every question style the examiner could throw at you — across all three CISI papers, in one place.</p>' +
    '</div>' +
    '<div class="exam-grid">'+cards+'</div>' +
    '<div class="footer-note">Built from your CISI study manuals · Data stays on this device (localStorage)</div>';

  Array.prototype.forEach.call(app.querySelectorAll(".exam-card"), function(el){
    el.onclick = function(){ navigate([el.getAttribute("data-exam")]); };
  });
}

/* ---------- exam overview ---------- */
function renderExamOverview(examKey){
  var exam = DATA[examKey];
  renderSidebar(examKey, null);
  var rows = exam.chapters.map(function(ch){
    var st = ensureChapter(examKey, ch.id);
    var p = chapterProgressPct(examKey, ch);
    return '<div class="chapter-row" data-ch="'+ch.id+'">' +
      '<div class="chapter-num">'+ch.number+'</div>' +
      '<div class="ct-mid"><div class="ct-title">'+esc(ch.title)+'</div><div class="ct-weight">'+esc(ch.examWeight||"")+'</div></div>' +
      '<div class="ct-metrics">' +
        '<div class="mini-stat"><div class="v">'+(ch.mcqs?ch.mcqs.length:0)+'</div><div class="k">MCQs</div></div>' +
        '<div class="mini-stat"><div class="v">'+(ch.flashcards?ch.flashcards.length:0)+'</div><div class="k">Cards</div></div>' +
        '<div class="mini-stat"><div class="v">'+(st.bestScore===null?"—":st.bestScore+"%") +'</div><div class="k">Best</div></div>' +
        '<div class="chapter-progress-ring" style="--pct:'+p+'"></div>' +
      '</div>' +
      '<span class="chevron">'+ICON.chevron+'</span>' +
    '</div>';
  }).join("");

  var readiness = examReadiness(examKey);

  app.innerHTML =
    '<div class="main-narrow">' +
    '<div class="overview-head">' +
      '<div><h1>'+esc(exam.title)+'</h1><div class="fmt">'+esc(exam.examFormat)+'</div></div>' +
      '<div class="overview-actions">' +
        '<button class="btn btn-teal" id="allCardsBtn">'+ICON.cards+' All flashcards</button>' +
        '<button class="btn btn-primary" id="fullQuizBtn">'+ICON.quiz+' Full exam simulation</button>' +
      '</div>' +
    '</div>' +
    '<div class="stat-row">' +
      '<div class="stat-pill"><div class="n">'+exam.chapterCount+'</div><div class="l">Chapters</div></div>' +
      '<div class="stat-pill"><div class="n">'+exam.mcqCount+'</div><div class="l">Practice MCQs</div></div>' +
      '<div class="stat-pill"><div class="n">'+exam.flashcardCount+'</div><div class="l">Flashcards</div></div>' +
      '<div class="stat-pill"><div class="n">'+readiness+'%</div><div class="l">Your readiness</div></div>' +
    '</div>' +
    '<div class="chapter-grid">'+rows+'</div>' +
    '</div>';

  Array.prototype.forEach.call(app.querySelectorAll(".chapter-row"), function(el){
    el.onclick = function(){ navigate([examKey, el.getAttribute("data-ch"), "summary"]); };
  });
  document.getElementById("fullQuizBtn").onclick = function(){ navigate([examKey, "_quiz"]); };
  document.getElementById("allCardsBtn").onclick = function(){ navigate([examKey, "_cards"]); };
}

/* ---------- sidebar ---------- */
function renderSidebar(examKey, activeChId){
  var old = document.getElementById("sidebarWrap");
  if(old) old.remove();
  var exam = DATA[examKey];
  var wrap = document.createElement("div");
  wrap.id = "sidebarWrap";
  wrap.style.display = "contents";
  var links = exam.chapters.map(function(ch){
    var p = chapterProgressPct(examKey, ch);
    return '<div class="chapter-link '+(ch.id===activeChId?"active":"")+'" data-ch="'+ch.id+'">' +
      '<div class="chapter-num">'+ch.number+'</div>' +
      '<div class="chapter-link-text"><div class="chapter-link-title">'+esc(ch.title)+'</div><div class="chapter-link-meta">'+esc(ch.examWeight||"")+'</div></div>' +
      '<div class="chapter-progress-ring" style="--pct:'+p+'" title="'+p+'% reviewed"></div>' +
    '</div>';
  }).join("");
  wrap.innerHTML = '<aside class="sidebar"><div class="sidebar-title">'+esc(exam.title)+'</div>' + links + '</aside>';
  var layout = document.getElementById("layout");
  layout.insertBefore(wrap, document.getElementById("app"));
  Array.prototype.forEach.call(wrap.querySelectorAll(".chapter-link"), function(el){
    el.onclick = function(){ navigate([examKey, el.getAttribute("data-ch"), "summary"]); };
  });
}

/* ---------- chapter view ---------- */
function renderChapter(examKey, chapter, tab){
  renderSidebar(examKey, chapter.id);
  if(tab==="summary") markVisited(examKey, chapter.id, "summary");
  if(tab==="detail") markVisited(examKey, chapter.id, "detail");

  var tabs = [
    ["summary","Summary", ICON.book],
    ["detail","Detailed notes", ICON.book],
    ["quiz","Quiz ("+(chapter.mcqs?chapter.mcqs.length:0)+")", ICON.quiz],
    ["flashcards","Flashcards ("+(chapter.flashcards?chapter.flashcards.length:0)+")", ICON.cards]
  ];
  var tabHtml = tabs.map(function(t){
    return '<button data-tab="'+t[0]+'" class="'+(t[0]===tab?"active":"")+'">'+t[1]+'</button>';
  }).join("");

  app.innerHTML =
    '<div class="chapter-head">' +
      '<div class="crumb"><a data-nav="home">Home</a> / <a data-nav="exam">'+esc(DATA[examKey].title)+'</a> / '+esc(chapter.title)+'</div>' +
      '<h1>'+chapter.number+'. '+esc(chapter.title)+'</h1>' +
      (chapter.examWeight? '<span class="weight-badge">'+ICON.target+' '+esc(chapter.examWeight)+'</span>' : '') +
    '</div>' +
    '<div class="tabbar" id="tabbar">'+tabHtml+'</div>' +
    '<div id="tabContent"></div>';

  app.querySelector('[data-nav="home"]').onclick = function(){ navigate([]); };
  app.querySelector('[data-nav="exam"]').onclick = function(){ navigate([examKey]); };
  Array.prototype.forEach.call(app.querySelectorAll("#tabbar button"), function(b){
    b.onclick = function(){ navigate([examKey, chapter.id, b.getAttribute("data-tab")]); };
  });

  var content = document.getElementById("tabContent");
  if(tab==="summary") renderSummaryTab(content, chapter);
  else if(tab==="detail") renderDetailTab(content, chapter);
  else if(tab==="quiz") renderQuizTab(content, examKey, chapter);
  else if(tab==="flashcards") renderFlashcardsTab(content, examKey, chapter);
  else renderSummaryTab(content, chapter);
}

function renderSummaryTab(content, chapter){
  content.innerHTML = '<div class="summary-card"><div class="prose">'+(chapter.summaryHtml||"<p>No summary available.</p>")+'</div></div>';
}
function renderDetailTab(content, chapter){
  var secs = (chapter.sections||[]).map(function(s){
    return '<div class="section-block"><h3 class="sec-h">'+esc(s.heading)+'</h3><div class="prose">'+s.html+'</div></div>';
  }).join("");
  content.innerHTML = secs || '<div class="empty-state">No detailed notes available.</div>';
}

/* ---------- quiz (chapter-level) ---------- */
function renderQuizTab(content, examKey, chapter){
  var mcqs = chapter.mcqs || [];
  if(mcqs.length===0){ content.innerHTML = '<div class="empty-state">No questions for this chapter yet.</div>'; return; }
  runQuizUI(content, examKey, chapter.title, shuffle(mcqs), function(pct){
    recordQuizResult(examKey, chapter.id, pct);
  }, { chapterId: chapter.id });
}

/* ---------- full exam simulation ---------- */
function renderFullQuiz(examKey){
  renderSidebar(examKey, null);
  var exam = DATA[examKey];
  var all = [];
  exam.chapters.forEach(function(ch){ (ch.mcqs||[]).forEach(function(q){ all.push(Object.assign({}, q, { _chapter: ch.title, _chId: ch.id })); }); });

  app.innerHTML = '<div class="quiz-shell">' +
    '<div class="chapter-head"><div class="crumb"><a data-nav="home">Home</a> / <a data-nav="exam">'+esc(exam.title)+'</a> / Full exam simulation</div>' +
    '<h1>Full exam simulation</h1></div>' +
    '<div class="quiz-config">' +
      '<div>How many questions?</div>' +
      '<div class="opt-row" id="lenChips"></div>' +
      '<button class="btn btn-primary" id="startFullQuiz" style="align-self:flex-start;">'+ICON.quiz+' Start</button>' +
    '</div></div>';

  app.querySelector('[data-nav="home"]').onclick = function(){ navigate([]); };
  app.querySelector('[data-nav="exam"]').onclick = function(){ navigate([examKey]); };

  var options = [20, 40, all.length];
  var chosen = options[0];
  var chips = document.getElementById("lenChips");
  chips.innerHTML = options.map(function(n,i){
    return '<button class="chip '+(i===0?"active":"")+'" data-n="'+n+'">'+n+' questions</button>';
  }).join("");
  Array.prototype.forEach.call(chips.querySelectorAll(".chip"), function(c){
    c.onclick = function(){
      Array.prototype.forEach.call(chips.querySelectorAll(".chip"), function(x){x.classList.remove("active");});
      c.classList.add("active"); chosen = +c.getAttribute("data-n");
    };
  });

  document.getElementById("startFullQuiz").onclick = function(){
    var set = shuffle(all).slice(0, chosen);
    var container = document.querySelector(".quiz-shell");
    runQuizUI(container, examKey, exam.title+" — Full simulation", set, function(pctScore, byChapter){
      // record per chapter too
      Object.keys(byChapter).forEach(function(chId){
        var b = byChapter[chId];
        recordQuizResult(examKey, chId, pct(b.correct, b.total));
      });
    }, { isFullExam:true });
  };
}

/* ---------- generic quiz runner ---------- */
function runQuizUI(container, examKey, label, questions, onFinish, opts){
  opts = opts || {};
  var idx = 0, correctCount = 0, answered = null;
  var byChapter = {}; // chId -> {correct,total}

  function renderQ(){
    var q = questions[idx];
    var barPct = Math.round(idx/questions.length*100);
    var letters = ["A","B","C","D","E","F"];
    container.innerHTML =
      (container.classList && container.classList.contains("quiz-shell") ? "" : "") +
      '<div class="quiz-progress"><div class="bar"><div style="width:'+barPct+'%"></div></div><div class="count">Question '+(idx+1)+' / '+questions.length+'</div></div>' +
      '<div class="q-card">' +
        '<div class="q-text">'+esc(q.question)+'</div>' +
        '<div class="q-opts" id="qOpts">' +
          q.options.map(function(o,i){
            return '<button class="q-opt" data-i="'+i+'"><span class="letter">'+letters[i]+'</span><span>'+esc(o)+'</span></button>';
          }).join("") +
        '</div>' +
        '<div id="explainWrap"></div>' +
        '<div class="q-actions"><span></span><button class="btn btn-primary" id="nextBtn" style="display:none;">'+(idx===questions.length-1?"See results":"Next question")+' '+ICON.chevron+'</button></div>' +
      '</div>';
    answered = false;
    Array.prototype.forEach.call(container.querySelectorAll(".q-opt"), function(btn){
      btn.onclick = function(){
        if(answered) return;
        answered = true;
        var chosen = +btn.getAttribute("data-i");
        var correct = q.correctIndex;
        Array.prototype.forEach.call(container.querySelectorAll(".q-opt"), function(b2,i2){
          b2.classList.add("disabled");
          if(i2===correct) b2.classList.add("correct");
          else if(i2===chosen) b2.classList.add("incorrect");
          else b2.classList.add("dim");
        });
        var isCorrect = chosen===correct;
        if(isCorrect) correctCount++;
        if(opts.isFullExam){
          var chId = q._chId;
          if(!byChapter[chId]) byChapter[chId] = {correct:0,total:0};
          byChapter[chId].total++;
          if(isCorrect) byChapter[chId].correct++;
        }
        document.getElementById("explainWrap").innerHTML =
          '<div class="explain-box"><b>'+(isCorrect?"Correct. ":"Not quite. ")+'</b>'+esc(q.explanation||"")+'</div>';
        document.getElementById("nextBtn").style.display = "inline-flex";
      };
    });
    document.getElementById("nextBtn").onclick = function(){
      idx++;
      if(idx >= questions.length){ renderResult(); }
      else renderQ();
    };
  }

  function renderResult(){
    var p = pct(correctCount, questions.length);
    var breakdownHtml = "";
    if(opts.isFullExam){
      breakdownHtml = '<div class="breakdown">' + Object.keys(byChapter).map(function(chId){
        var ch = DATA[examKey].chapters.find(function(c){return c.id===chId;});
        var b = byChapter[chId];
        return '<div class="breakdown-row"><span>'+esc(ch?ch.title:chId)+'</span><span>'+b.correct+'/'+b.total+' ('+pct(b.correct,b.total)+'%)</span></div>';
      }).join("") + '</div>';
    }
    container.innerHTML =
      '<div class="quiz-result">' +
        '<div class="score-circle" style="--pct:'+p+'"><div class="inner"><div class="pctnum">'+p+'%</div><div class="pctlbl">SCORE</div></div></div>' +
        '<h2>'+(p>=80?"Excellent work.":p>=60?"Good progress.":"Keep drilling this one.")+'</h2>' +
        '<div style="color:var(--text-faint);font-size:13.5px;">'+correctCount+' correct out of '+questions.length+' — '+esc(label)+'</div>' +
        breakdownHtml +
        '<div class="result-actions">' +
          '<button class="btn btn-primary" id="retryBtn">'+ICON.refresh+' Try again</button>' +
          '<button class="btn" id="backBtn">'+ICON.home+' Back</button>' +
        '</div>' +
      '</div>';
    onFinish(p, byChapter);
    document.getElementById("retryBtn").onclick = function(){
      idx=0; correctCount=0; byChapter={}; questions = shuffle(questions); renderQ();
    };
    document.getElementById("backBtn").onclick = function(){ history.back(); };
  }

  renderQ();
}

/* ---------- flashcards (chapter) ---------- */
function renderFlashcardsTab(content, examKey, chapter){
  var cards = (chapter.flashcards||[]).map(function(fc, i){ return Object.assign({}, fc, { _id: examKey+":"+chapter.id+":"+i }); });
  runFlashcardUI(content, examKey, chapter.title, cards);
}
function renderAllFlashcards(examKey){
  renderSidebar(examKey, null);
  var exam = DATA[examKey];
  var cards = [];
  exam.chapters.forEach(function(ch){
    (ch.flashcards||[]).forEach(function(fc,i){ cards.push(Object.assign({}, fc, { _id: examKey+":"+ch.id+":"+i, _chapter: ch.title })); });
  });
  app.innerHTML = '<div class="chapter-head"><div class="crumb"><a data-nav="home">Home</a> / <a data-nav="exam">'+esc(exam.title)+'</a> / All flashcards</div><h1>All flashcards</h1></div><div id="fcRoot"></div>';
  app.querySelector('[data-nav="home"]').onclick = function(){ navigate([]); };
  app.querySelector('[data-nav="exam"]').onclick = function(){ navigate([examKey]); };
  runFlashcardUI(document.getElementById("fcRoot"), examKey, exam.title+" — all chapters", cards);
}

function runFlashcardUI(container, examKey, label, cards){
  var deck = shuffle(cards);
  var pos = 0;
  var knownCount = 0;

  function counts(){
    var known=0;
    deck.forEach(function(c){ var s=cardState(examKey,c._id); if(s&&s.known) known++; });
    return known;
  }

  function draw(){
    if(deck.length===0){
      container.innerHTML = '<div class="fc-toolbar"><div></div></div><div class="fc-empty">No flashcards here.</div>';
      return;
    }
    if(pos>=deck.length) pos=0;
    var c = deck[pos];
    var known = counts();
    container.innerHTML =
      '<div class="fc-toolbar">' +
        '<div class="fc-stats">'+esc(label)+' &middot; <b>'+known+'</b>/'+deck.length+' marked known</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn btn-sm" id="shuffleBtn">'+ICON.shuffle+' Shuffle</button>' +
          '<button class="btn btn-sm" id="resetBtn">'+ICON.refresh+' Reset progress</button>' +
        '</div>' +
      '</div>' +
      '<div class="fc-stage">' +
        '<div class="fc-count">Card '+(pos+1)+' / '+deck.length+(c._chapter?' &middot; '+esc(c._chapter):'')+'</div>' +
        '<div class="flashcard" id="fcCard"><div class="flashcard-inner">' +
          '<div class="fc-face fc-front"><span class="fc-kicker">Term</span><div class="fc-txt">'+esc(c.front)+'</div><span class="fc-hint">Click to flip</span></div>' +
          '<div class="fc-face fc-back"><span class="fc-kicker">Answer</span><div class="fc-txt">'+esc(c.back)+'</div></div>' +
        '</div></div>' +
        '<div class="fc-controls">' +
          '<button class="btn fc-review" id="reviewBtn">Review again</button>' +
          '<button class="btn" id="prevBtn">&larr; Prev</button>' +
          '<button class="btn" id="nextBtn">Next &rarr;</button>' +
          '<button class="btn fc-know" id="knowBtn">Know it &check;</button>' +
        '</div>' +
      '</div>';

    var cardEl = document.getElementById("fcCard");
    cardEl.onclick = function(){ cardEl.classList.toggle("flipped"); };
    document.getElementById("nextBtn").onclick = function(e){ e.stopPropagation(); pos=(pos+1)%deck.length; draw(); };
    document.getElementById("prevBtn").onclick = function(e){ e.stopPropagation(); pos=(pos-1+deck.length)%deck.length; draw(); };
    document.getElementById("knowBtn").onclick = function(e){ e.stopPropagation(); setCardState(examKey,c._id,true); pos=(pos+1)%deck.length; draw(); };
    document.getElementById("reviewBtn").onclick = function(e){ e.stopPropagation(); setCardState(examKey,c._id,false); pos=(pos+1)%deck.length; draw(); };
    document.getElementById("shuffleBtn").onclick = function(){ deck = shuffle(deck); pos=0; draw(); };
    document.getElementById("resetBtn").onclick = function(){
      deck.forEach(function(c2){ var ex=ensureExam(examKey); delete ex.cards[c2._id]; });
      saveStore(store); draw();
    };
  }
  draw();
}

/* ---------- boot ---------- */
render();

})();
