/* ============================================================ */
/*  RS KITS — Desktop SPA — réplica fiel do sistema online       */
/* ============================================================ */
(function () {
  "use strict";

  /* ---------------- ícones (subset lucide, stroke) ---------------- */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    package: '<path d="M3 7l9-5 9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5"/><path d="M12 12v10"/>',
    barChart: '<line x1="3" y1="3" x2="3" y2="21" x3="3"><line x1="3" y1="21" x2="21" y2="21"/><path d="M7 17V9"/><path d="M12 17V5"/><path d="M17 17v-7"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/>',
    pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M7.5 15.5L20 3"/><path d="M14 7l3 3M17 4l3 3"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="18" y2="14"/><line x1="14" y1="18" x2="14" y2="21"/><line x1="18" y1="17" x2="21" y2="17"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    pencil: '<path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
    rotate: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    trash: '<polyline points="3 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/><path d="M13 14.66V17c0 .55-.47.98-.97 1.21C10.85 18.75 10 20.24 10 22"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    spreadsheet: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="10" y2="21"/><line x1="14" y1="9" x2="14" y2="21"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    hdd: '<line x1="12" y1="3" x2="12" y2="12"/><polyline points="8 8 12 12 16 8"/><path d="M3 16v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/>',
    packageCheck: '<path d="M3 7l9-5 9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5"/><path d="M12 12v10"/><polyline points="9 11 11 13 15 9"/>',
    sparkles: '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>',
    shieldAlert: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    fileUp: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="8 15 12 11 16 15"/>',
    link: '<path d="M9 17H7a5 5 0 0 1 0-10h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/>',
    filter: '<polyline points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    edit: '<path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  };

  function icon(name, size) {
    size = size || 18;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || "") + "</svg>";
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function num(v) { return (Number(v) || 0).toLocaleString("pt-BR"); }

  function jsStr(v) {
    return "'" + String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  }

  /* ---------------- estado ---------------- */
  var S = {
    user: null,
    events: [],
    athletesByEvent: {},
    selectedEventId: null,
    audit: [],
    delivery: null,
    settings: null,
  };

  var LS_USER = "rskits:user";

  /* ---------------- api ---------------- */
  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({}, opts.headers || {});
    if (S.user) headers["X-Userid"] = S.user.id;
    if (opts.json !== undefined) headers["Content-Type"] = "application/json";
    return fetch(path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
    }).then(function (res) {
      if (res.status === 401) { RS.logout(); throw new Error("Sessão expirada."); }
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.detail || "Erro na requisição.");
        return data;
      });
    });
  }

  function loadEvents() {
    return api("/api/events").then(function (list) {
      S.events = list;
      if (!S.selectedEventId && list.length) S.selectedEventId = list[0].id;
      if (S.selectedEventId && !list.some(function (e) { return e.id === S.selectedEventId; })) {
        S.selectedEventId = list.length ? list[0].id : null;
      }
      return list;
    });
  }

  function loadAthletes(eventId) {
    if (S.athletesByEvent[eventId]) return Promise.resolve(S.athletesByEvent[eventId]);
    return api("/api/events/" + eventId + "/athletes?limit=200000").then(function (data) {
      S.athletesByEvent[eventId] = data.athletes || [];
      return S.athletesByEvent[eventId];
    });
  }

  function selectedEvent() {
    return S.events.find(function (e) { return e.id === S.selectedEventId; }) || null;
  }

  /* campo atleta (ImportedRow do backend) -> Athlete da tela de entrega */
  function toAthlete(row) {
    return {
      id: row.id,
      pin: row.pin,
      num: row.num || "",
      nome: row.nomeAtleta || "",
      cpf: row.cpfAtleta || "",
      sexo: row.sexo === "F" ? "F" : "M",
      nascimento: row.nascto || "",
      cidadeUf: row.cidadeUf || "",
      equipe: row.equipe || "",
      distancia: row.modalidade || "",
      kit: row.kit || "",
      faixaEtaria: row.fxEtaria || "",
      categoriaEspecial: row.categEspecial || "",
      camiseta: row.camiseta || "",
      celular: row.cel || "",
      email: row.email || "",
      alerta: row.alerta || "",
      status: row.statusEntrega || "PENDENTE",
      dataEntrega: row.dataEntrega,
      usuarioEntrega: row.usuarioEntrega,
      obsEntrega: row.obsEntrega,
      nomeEntrega: row.nomeEntrega,
      cpfEntrega: row.cpfEntrega,
      foneEntrega: row.foneEntrega,
      emailEntrega: row.emailEntrega,
      terceiro: !!row.terceiro,
      dataEstorno: row.dataEstorno,
      usuarioEstorno: row.usuarioEstorno,
      contatoEmergencia: row.contato,
      relacaoAtleta: row.grauParentesco,
      telefoneEmergencia: row.celularContato,
      retirarKit: row.quemVaiRetirar,
      notas: row.notas,
      obs1: row.obs1,
      obs2: row.obs2,
    };
  }

  /* ---------------- segunda tela ---------------- */
  var SS_CHANNEL = "rs-kits-second-screen";
  var SS_KEY = "rs-kits:second-screen";
  var SS_AUTO_MS = 90000;

  function publishSecondScreen(athlete, mode) {
    var payload = {
      athlete: athlete,
      mode: mode,
      expiresAt: mode === "AUTOMATICO" ? Date.now() + SS_AUTO_MS : null,
    };
    try { localStorage.setItem(SS_KEY, JSON.stringify(payload)); } catch (e) {}
    if ("BroadcastChannel" in window) {
      var ch = new BroadcastChannel(SS_CHANNEL);
      ch.postMessage(payload);
      ch.close();
    }
  }

  function clearSecondScreen() {
    var payload = { athlete: null, mode: "MANUAL", expiresAt: null };
    try { localStorage.setItem(SS_KEY, JSON.stringify(payload)); } catch (e) {}
    if ("BroadcastChannel" in window) {
      var ch = new BroadcastChannel(SS_CHANNEL);
      ch.postMessage(payload);
      ch.close();
    }
  }

  /* ---------------- util UI ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var div = document.createElement("div");
    div.className = "toast";
    div.textContent = msg;
    document.body.appendChild(div);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { div.remove(); }, 3200);
  }

  function sidebarHTML(active) {
    var u = S.user;
    var items = [
      { key: "dashboard", label: "Dashboard", icon: "barChart", href: "#/dashboard" },
      { key: "delivery", label: "Entregar Kit", icon: "package", href: "#/delivery", featured: true },
    ];
    if (u.role === "ADMIN") items.push({ key: "import", label: "Importar Planilha", icon: "package", href: "#/import" });
    items.push({ key: "reports", label: "Relatórios", icon: "clipboard", href: "#/reports" });
    items.push({ key: "filters", label: "Filtros", icon: "pie", href: "#/filters" });
    if (u.role === "ADMIN") items.push({ key: "events", label: "Eventos", icon: "calendar", href: "#/events" });

    var nav = items.map(function (it) {
      var cls = "sidebar-item";
      if (it.key === active) cls += " active";
      if (it.featured) cls += " featured";
      return '<a class="' + cls + '" href="' + it.href + '">' + icon(it.icon, 18) + "<span>" + it.label + "</span>" +
        (it.featured ? '<span class="star">' + icon("star", 12) + "</span>" : "") + "</a>";
    }).join("");

    var settingsRow = u.role !== "OPERADOR"
      ? '<a href="#/settings" class="sidebar-settings ' + (active === "settings" ? "active" : "") + '">' + icon("settings", 18) + "<span>Configurações</span></a>"
      : "";

    return (
      '<aside class="sidebar">' +
        '<div class="sidebar-logo"><div class="logo-box">' + icon("package", 20) + '</div><span>RS KITS</span></div>' +
        '<nav class="sidebar-nav">' + nav + "</nav>" +
        '<div class="border-t border-slate-100 p-3">' +
          '<div class="sidebar-user">' +
            '<p class="name">' + esc(u.name) + "</p>" +
            '<p class="role">' + esc(u.role) + "</p>" +
            '<button type="button" class="btn-logout" onclick="RS.logout()">' + icon("logout", 14) + " Sair</button>" +
          "</div>" +
          settingsRow +
        "</div>" +
      "</aside>"
    );
  }

  function shell(active, headerHTML, contentHTML) {
    return (
      '<div class="min-h-screen bg-slate-50 text-slate-950">' +
        sidebarHTML(active) +
        '<div class="main-panel">' +
          (headerHTML || "") +
          '<main class="content">' + contentHTML + "</main>" +
        "</div>" +
      "</div>"
    );
  }

  /* ------------------------------------------------ LOGIN ---- */
  function renderLogin() {
    document.getElementById("app").innerHTML =
      '<div class="login-page">' +
        '<div class="blob blob-1"></div><div class="blob blob-2"></div>' +
        '<div class="login-card">' +
          '<div class="login-brand"><div class="logo-box">' + icon("package", 24) + '</div><span class="text-xl font-bold">RS KITS</span></div>' +
          '<h1 class="login-title">Entrar no sistema</h1>' +
          '<p class="login-sub">Painel de entrega e gerenciamento de kits</p>' +
          '<form id="login-form" class="mt-6 space-y-4">' +
            '<div><label class="text-sm font-semibold text-slate-700">Identificador (nome, e-mail ou CPF)</label>' +
            '<input id="login-id" class="input mt-1.5" autocomplete="username" placeholder="admin" required /></div>' +
            '<div><label class="text-sm font-semibold text-slate-700">Senha</label>' +
            '<input id="login-pass" type="password" class="input mt-1.5" autocomplete="current-password" placeholder="••••••" required /></div>' +
            '<p id="login-error" class="hidden text-xs font-semibold text-rose-600"></p>' +
            '<button type="submit" class="btn btn-lg btn-primary w-full">Entrar</button>' +
          "</form>" +
        "</div>" +
      "</div>";
    document.getElementById("login-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      RS.login(
        document.getElementById("login-id").value.trim(),
        document.getElementById("login-pass").value
      );
    });
  }

  /* ---------------- helpers de UI ---------------- */
  function headerHTML(title, sub, leading, trailing) {
    return (
      '<header class="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">' +
        '<div class="px-6 py-4 flex items-center gap-4">' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">' +
              '<span>Referência</span><span class="text-slate-300">/</span><span class="text-slate-500">' + esc(title) + "</span>" +
            "</div>" +
            (sub ? '<h1 class="text-xl font-bold tracking-tight mt-0.5">' + esc(sub) + "</h1>" : "") +
          "</div>" +
          (leading || "") +
          (trailing || "") +
        "</div>" +
      "</header>"
    );
  }

  function statusBadge(status) {
    if (status === "ENTREGUE")
      return '<span class="badge badge-emerald">' + icon("check", 12) + " ENTREGUE</span>";
    if (status === "ESTORNADO")
      return '<span class="badge badge-amber">' + icon("rotate", 12) + " ESTORNADO</span>";
    return '<span class="badge badge-blue">' + icon("clock", 12) + " PENDENTE</span>";
  }

  function athleteNumAvatar(a) {
    return '<div class="avatar ' + (a.status === "ENTREGUE" ? "avatar-emerald" : a.status === "ESTORNADO" ? "avatar-amber" : "avatar-blue") + '">' + esc(a.num || "-") + "</div>";
  }

  /* ============================================================== */
  /* DASHBOARD                                                     */
  /* ============================================================== */
  function ageYears(nascto) {
    var m = String(nascto || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return null;
    var d = new Date(+m[3], +m[2] - 1, +m[1]);
    if (isNaN(d)) return null;
    var now = new Date();
    var age = now.getFullYear() - d.getFullYear();
    var md = now.getMonth() - d.getMonth();
    if (md < 0 || (md === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  function ageGroup(age) {
    if (age == null) return "Sem data";
    if (age <= 20) return "Até 20 anos";
    if (age <= 30) return "21 a 30 anos";
    if (age <= 40) return "31 a 40 anos";
    if (age <= 50) return "41 a 50 anos";
    if (age <= 60) return "51 a 60 anos";
    return "61+ anos";
  }

  function svgAreaChart(points, w, h) {
    var max = Math.max.apply(null, points.concat([1]));
    var step = w / Math.max(points.length - 1, 1);
    var pts = points.map(function (v, i) {
      return [(i * step).toFixed(1), (h - (v / max) * (h - 16) - 8).toFixed(1)];
    });
    var line = pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
    var area = "0," + h + " " + line + " " + w + "," + h;
    return (
      '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" class="chart-svg">' +
        '<defs><linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#152238" stop-opacity=".28"/><stop offset="100%" stop-color="#152238" stop-opacity="0"/></linearGradient>' +
          '<linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#F5A623" stop-opacity=".22"/><stop offset="100%" stop-color="#F5A623" stop-opacity="0"/></linearGradient></defs>' +
        '<polygon points="' + area + '" fill="url(#gradBlue)"/>' +
        '<polyline points="' + line + '" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      "</svg>"
    );
  }

  function renderDashboard() {
    var ev = selectedEvent();
    if (!ev) {
      renderEmptyEvents();
      return;
    }
    loadAthletes(ev.id).then(function (rows) {
      var list = rows.map(toAthlete);
      var total = list.length;
      var entregues = list.filter(function (a) { return a.status === "ENTREGUE"; }).length;
      var estornados = list.filter(function (a) { return a.status === "ESTORNADO"; }).length;
      var pendentes = total - entregues;
      var pct = total ? Math.round((entregues / total) * 100) : 0;

      var days = [];
      var now = new Date();
      for (var i = 13; i >= 0; i--) {
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        days.push(d);
      }
      function dayLabel(d) { return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); }
      function sameDay(a, d) {
        var m = String(a.dataEntrega || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (!m) return false;
        return +m[3] === d.getFullYear() && +m[2] - 1 === d.getMonth() && +m[1] === d.getDate();
      }
      var series = days.map(function (d) { return list.filter(function (a) { return sameDay(a, d); }).length; });
      var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

      function topBy(field) {
        var map = {};
        list.forEach(function (a) { var k = a[field] || "—"; map[k] = (map[k] || 0) + 1; });
        return Object.keys(map).map(function (k) { return { k: k, n: map[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 6);
      }

      var header = headerHTML("Visão geral", ev.name + " — painel do evento",
        '<span class="text-sm text-slate-500">' + icon("calendar", 14) + " " + esc(ev.date || "Data a definir") + (ev.place ? " · " + esc(ev.place) : "") + "</span>",
        '<div class="flex items-center gap-2">' + statusChip(total, "Total de atletas", "blue") + statusChip(entregues, "Entregues", "emerald") + statusChip(pendentes, "Pendentes", "amber") + "</div>");

      var content =
        '<div class="grid gap-6">' +
          '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' +
            kpiCard(icon("users", 20), "Atletas no evento", num(total), "blue") +
            kpiCard(icon("check", 20), "Kits entregues", num(entregues), "emerald") +
            kpiCard(icon("clock", 20), "Pendentes de entrega", num(pendentes), "amber") +
          "</div>" +

          '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">' +
            '<div class="card lg:col-span-2">' +
              '<div class="flex items-center justify-between mb-4"><div><h3 class="card-title">Entregas — últimos 14 dias</h3>' +
              '<p class="card-sub">' + num(series.reduce(function (a, b) { return a + b; }, 0)) + " kits entregues no período</p></div>" +
              '<span class="badge badge-blue">' + pct + '% do evento</span></div>' +
              svgAreaChart(series, 600, 220) +
              '<div class="flex justify-between text-[10px] text-slate-400 mt-1">' +
                days.slice(0, 7).map(function (d) { return "<span>" + dayLabel(d) + "</span>"; }).join("") +
                '<span>⋯</span>' + days.slice(-2).map(function (d) { return "<span>" + dayLabel(d) + "</span>"; }).join("") +
              "</div>" +
            "</div>" +

            '<div class="flex flex-col gap-4">' +
              peaksCard(list, now, yesterday) +
              '<div class="card">' +
                '<div class="flex items-center gap-2 mb-3"><div class="ic-blue">' + icon("sparkles", 16) + '</div><h3 class="card-title">Últimas atividades</h3></div>' +
                '<div class="space-y-2">' +
                  (S.audit.slice(0, 6).map(function (log) {
                    var t = (log.timestamp || "").split(" ")[0] || "";
                    return '<div class="activity-row"><span class="activity-ic">' + icon(log.campo_alterado === "pacote_instalado" ? "packageCheck" : "sparkles", 13) + "</span><p>" +
                      '<span class="font-semibold">' + esc(log.usuario || "-") + "</span> · " + esc(log.campo_alterado || "-") +
                      '<span class="text-slate-400 text-xs block">' + esc(log.nome_atleta || "") + (t ? " · " + esc(t) : "") + "</span></p></div>";
                  }).join("") || '<p class="text-sm text-slate-400">Nenhuma atividade registrada ainda.</p>') +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>" +

          '<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">' +
            rankCard("Modalidades", topBy("distancia"), "barChart", "blue") +
            rankCard("Kits", topBy("kit"), "package", "emerald") +
            rankCard("Equipes", topBy("equipe"), "users", "amber") +
            rankCard("Cidades", topBy("cidadeUf"), "mapPin", "rose") +
          "</div>" +
        "</div>";

      renderShell("dashboard", header, content);
    });
  }

  function statusChip(n, label, color) {
    return '<div class="stat-chip stat-' + color + '"><p class="stat-num">' + num(n) + '</p><p class="stat-label">' + label + "</p></div>";
  }
  function kpiCard(ic, label, value, color) {
    return '<div class="card kpi">' +
      '<div class="ic ic-' + color + '">' + ic + "</div>" +
      '<div><p class="kpi-value">' + value + '</p><p class="kpi-label"><span class="text-slate-300">//</span> ' + label + "</p></div>" +
      "</div>";
  }
  function rankCard(title, rows, ico, color) {
    var max = rows.length ? rows[0].n : 1;
    return '<div class="card">' +
      '<div class="flex items-center gap-2 mb-3"><div class="ic ic-' + color + '">' + icon(ico, 16) + '</div><h3 class="card-title">' + title + "</h3></div>" +
      (rows.length ? rows.map(function (r) {
        return '<div class="rank-row"><div class="flex-1 min-w-0"><div class="flex justify-between text-sm"><span class="truncate font-medium">' + esc(r.k) + '</span><span class="font-semibold">' + num(r.n) + "</span></div>" +
          '<div class="rank-bar"><div class="rank-fill rank-' + color + '" style="width:' + Math.round((r.n / max) * 100) + '%"></div></div></div></div>';
      }).join("") : '<p class="text-sm text-slate-400">Sem dados.</p>') +
      "</div>";
  }
  function peaksCard(list, now, yesterday) {
    var t0 = 0, t1 = 0;
    function count(d) {
      return list.filter(function (a) {
        var m = String(a.dataEntrega || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        return m && +m[3] === d.getFullYear() && +m[2] - 1 === d.getMonth() && +m[1] === d.getDate();
      }).length;
    }
    t0 = count(now); t1 = count(yesterday);
    var diff = t0 - t1;
    return '<div class="card">' +
      '<div class="flex items-center gap-2 mb-3"><div class="ic ic-blue">' + icon("activity", 16) + '</div><h3 class="card-title">Pico dos últimos dias</h3></div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><p class="text-xs text-slate-400">Hoje</p><p class="peak-val">' + num(t0) + '</p><p class="text-xs text-slate-400">' + now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }) + "</p></div>" +
        '<div><p class="text-xs text-slate-400">Ontem</p><p class="peak-val">' + num(t1) + '</p><p class="text-xs text-slate-400">' + yesterday.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }) + "</p></div>" +
      "</div>" +
      '<p class="text-sm mt-3 ' + (diff >= 0 ? "text-emerald-600" : "text-rose-600") + '">' + icon(diff >= 0 ? "activity" : "rotate", 12) + " " + (diff >= 0 ? "▲" : "▼") + " " + Math.abs(diff) + (diff >= 0 ? " a mais que ontem" : " a menos que ontem") + "</p>" +
      "</div>";
  }

  function renderEmptyEvents() {
    var header = headerHTML("Dashboard", "Nenhum evento ativo", "", "");
    var isAdmin = S.user && S.user.role === "ADMIN";
    renderShell("dashboard", header,
      '<div class="empty-state">' +
        '<div class="empty-ic">' + icon("inbox", 28) + "</div>" +
        "<h2>Nenhum pacote de evento instalado</h2>" +
        "<p>Coloque um arquivo <strong>.rksits</strong> na pasta <code>packages/</code> ao lado do executável e reinicie. " + (isAdmin ? 'Ou crie um evento manualmente em <a href="#/events" class="underline text-blue-600">Eventos</a> e importe a planilha.' : "") + "</p>" +
      "</div>");
  }

  /* ============================================================== */
  /* ENTREGA DE KIT                                                */
  /* ============================================================== */
  var STATUS_FILTERS = [
    { key: null, label: "Todos" },
    { key: "PENDENTE", label: "Pendentes" },
    { key: "ENTREGUE", label: "Entregues" },
    { key: "ESTORNADO", label: "Estornados" },
  ];

  function deliveryState() {
    if (!S.delivery) S.delivery = { athletes: [], query: "", statusFilter: null, ssMode: "MANUAL" };
    return S.delivery;
  }

  function renderDelivery() {
    var ev = selectedEvent();
    if (!ev) { renderEmptyEvents(); return; }
    loadAthletes(ev.id).then(function (rows) {
      var st = deliveryState();
      st.athletes = rows.map(toAthlete);

      var header = headerHTML("Operação", "Entregar Kit",
        '<span class="flex items-center gap-2 text-sm text-slate-500">' + icon("package", 14) + " <strong>" + esc(ev.name) + "</strong>" +
          (ev.place ? " · " + esc(ev.place) : "") + (ev.date ? " · " + esc(ev.date) : "") + "</span>",
        '<button type="button" class="btn btn-outline" onclick="RS.openPin()">' + icon("qr", 16) + " PIN</button>" +
        '<button type="button" class="btn btn-amber" onclick="RS.openRaffle()">' + icon("trophy", 16) + " Realizar Sorteio</button>" +
        '<button type="button" class="btn btn-outline" onclick="RS.openReset()">' + icon("trash", 16) + " Zerar Entregas</button>" +
        '<button type="button" class="btn btn-outline" onclick="RS.openRenameEvent()">' + icon("pencil", 16) + " Alterar Nome do Evento</button>" +
        '<button type="button" class="btn btn-indigo" onclick="RS.openPublishCard()">' + icon("monitor", 16) + " Segunda tela</button>");

      updateDeliveryStats = function () { return true; };
      var content =
        '<div class="grid gap-4">' +
          '<div class="card delivery-searchbar">' +
            '<div class="flex flex-col md:flex-row md:items-center gap-3">' +
              '<div class="search-wrap flex-1">' +
                '<span class="search-ic">' + icon("search", 16) + "</span>" +
                '<input id="delivery-search" type="search" class="input-search" placeholder="Buscar por nome, número, CPF ou PIN…" value="' + esc(st.query) + '" oninput="RS.deliverySearch(this.value)" />' +
              "</div>" +
              '<div class="flex flex-wrap gap-1.5" id="status-chips">' +
                STATUS_FILTERS.map(function (f) {
                  var active = st.statusFilter === f.key;
                  return '<button type="button" class="chip ' + (active ? "chip-active" : "") + '" onclick="RS.setStatus(' + (f.key ? "'" + f.key + "'" : "null") + ')">' + f.label + "</button>";
                }).join("") +
              "</div>" +
              '<button type="button" class="btn btn-outline btn-sm" onclick="RS.deliverySearch(\'\')">' + icon("x", 14) + " Limpar</button>" +
            "</div>" +
            '<p class="mt-2 text-xs text-slate-400">Clique em um atleta para abrir a ficha e realizar a entrega do kit. Entregues em <span class="text-emerald-600 font-semibold">verde</span>, estornados em <span class="text-amber-500 font-semibold">amarelo</span>.</p>' +
          "</div>" +

          '<div class="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">' +
            '<div class="card p-0 overflow-hidden min-w-0">' +
              '<div class="delivery-table-head" id="delivery-count"></div>' +
              '<div class="delivery-table-wrap" id="delivery-list"></div>' +
            "</div>" +
            '<div class="flex flex-col gap-4">' +
              deliveryStatusBlock() +
              '<div class="card">' +
                '<div class="flex items-center gap-2 mb-2"><div class="ic ic-indigo">' + icon("monitor", 16) + '</div><h3 class="card-title">Segunda tela</h3></div>' +
                '<p class="text-xs text-slate-400 mb-3">Exibe a ficha do atleta para conferência com o operador.</p>' +
                '<div class="seg-toggle">' +
                  '<button type="button" class="seg-btn ' + (st.ssMode === "AUTOMATICO" ? "seg-active" : "") + '" onclick="RS.setSSMode(\'AUTOMATICO\')">Automático</button>' +
                  '<button type="button" class="seg-btn ' + (st.ssMode === "MANUAL" ? "seg-active" : "") + '" onclick="RS.setSSMode(\'MANUAL\')">Manual</button>' +
                "</div>" +
                '<p class="text-[11px] text-slate-400 mt-2">' + (st.ssMode === "AUTOMATICO" ? "A ficha aparece automaticamente por 90s." : "Libere a ficha manualmente por atleta.") + "</p>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>";

      renderShell("delivery", header, content);
      updateDeliveryTable();
    });
  }

  var updateDeliveryStats = function () {};

  function filteredAthletes() {
    var st = deliveryState();
    var q = st.query.trim().toLowerCase();
    return st.athletes.filter(function (a) {
      if (st.statusFilter && a.status !== st.statusFilter) return false;
      if (!q) return true;
      return (a.nome || "").toLowerCase().indexOf(q) >= 0 ||
        (a.num || "").toLowerCase().indexOf(q) >= 0 ||
        (a.cpf || "").indexOf(q) >= 0 ||
        (a.pin || "").indexOf(q) >= 0;
    });
  }

  function updateDeliveryTable() {
    var st = deliveryState();
    var list = filteredAthletes();
    var total = st.athletes.length;
    var entregues = st.athletes.filter(function (a) { return a.status === "ENTREGUE"; }).length;
    var pend = total - entregues;

    var head = document.getElementById("delivery-count");
    var body = document.getElementById("delivery-list");
    if (!head || !body) return;

    head.innerHTML =
      '<div class="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">' +
        '<span class="text-sm font-semibold">' + num(list.length) + " de " + num(total) + " atletas</span>" +
        '<span class="text-xs text-slate-400">' + icon("check", 11) + " " + num(entregues) + " entregues</span>" +
        '<span class="text-xs text-slate-400">' + icon("clock", 11) + " " + num(pend) + " pendentes</span>" +
      "</div>";

    if (!list.length) {
      body.innerHTML = '<div class="p-10 text-center"><div class="empty-ic">' + icon("search", 24) + "</div>" +
        "<p class='font-medium text-slate-500'>Nenhum atleta encontrado</p>" +
        '<p class="text-sm text-slate-400">Ajuste a busca ou o filtro de status.</p></div>';
      return;
    }

    var cols = [
      ["NUM", 64], ["Atleta", ""], ["CPF", 150], ["Sexo", 60], ["Nasc.", 96],
      ["Cidade/UF", 130], ["Equipe", ""], ["Dist.", 110], ["KIT", 90], ["Fx etária", 110],
      ["Categ. esp.", 110], ["Camiseta", 90], ["Cel", 140], ["Email", ""], ["Alerta", 90],
      ["Retirar kit", 120], ["Data estorno", 150], ["Usuário", 120], ["Data entrega", 150],
      ["Usuário entrega", 120], ["Nome entrega", 150], ["CPF entrega", 150],
      ["Fone entrega", 130], ["Email entrega", "", ], ["Status", 110],
    ];
    var thead = "<thead><tr>" + cols.map(function (c) {
      return '<th style="min-width:' + (c[1] || 120) + 'px">' + c[0] + "</th>";
    }).join("") + '<th class="py-1">&nbsp;</th></tr></thead>';

    var rows = list.map(function (a) {
      var cls = a.status === "ENTREGUE" ? "row-entregue" : a.status === "ESTORNADO" ? "row-estornado" : "";
      var cells =
        '<td><span class="font-mono font-semibold">' + esc(a.num || "-") + "</span></td>" +
        '<td><span class="font-medium">' + esc(a.nome || "-") + "</span>" +
          (a.alerta ? '<span class="alert-dot" title="' + esc(a.alerta) + '">' + icon("bell", 11) + "</span>" : "") + "</td>" +
        '<td class="font-mono">' + esc(a.cpf || "-") + "</td>" +
        "<td>" + esc(a.sexo || "-") + "</td>" +
        "<td>" + esc(a.nascimento || "-") + "</td>" +
        "<td>" + esc(a.cidadeUf || "-") + "</td>" +
        '<td class="font-medium">' + esc(a.equipe || "-") + "</td>" +
        "<td>" + esc(a.distancia || "-") + "</td>" +
        "<td>" + esc(a.kit || "-") + "</td>" +
        "<td>" + esc(a.faixaEtaria || "-") + "</td>" +
        "<td>" + esc(a.categoriaEspecial || "-") + "</td>" +
        "<td>" + esc(a.camiseta || "-") + "</td>" +
        "<td>" + esc(a.celular || "-") + "</td>" +
        '<td class="max-w-[200px]">' + esc(a.email || "-") + "</td>" +
        "<td>" + (a.alerta ? '<span class="text-amber-600 font-semibold">' + esc(a.alerta) + "</span>" : "-") + "</td>" +
        "<td>" + esc(a.retirarKit || "-") + "</td>" +
        "<td>" + esc(a.dataEstorno || "-") + "</td>" +
        "<td>" + esc(a.usuarioEstorno || "-") + "</td>" +
        "<td>" + esc(a.dataEntrega || "-") + "</td>" +
        "<td>" + esc(a.usuarioEntrega || "-") + "</td>" +
        "<td>" + esc(a.nomeEntrega || "-") + "</td>" +
        "<td>" + esc(a.cpfEntrega || "-") + "</td>" +
        "<td>" + esc(a.foneEntrega || "-") + "</td>" +
        "<td>" + esc(a.emailEntrega || "-") + "</td>" +
        "<td>" + statusBadge(a.status) + "</td>";

      var actions =
        '<button type="button" class="row-act act-view" title="Ver ficha" onclick="event.stopPropagation();RS.openDeliver(' + jsStr(a.id) + ')">' + icon("eye", 14) + "</button>" +
        '<button type="button" class="row-act act-edit" title="Editar informações" onclick="event.stopPropagation();RS.openEdit(' + jsStr(a.id) + ')">' + icon("pencil", 14) + "</button>" +
        '<button type="button" class="row-act act-monitor" title="Exibir na segunda tela" onclick="event.stopPropagation();RS.publishSS(' + jsStr(a.id) + ')">' + icon("monitor", 14) + "</button>" +
        (a.status !== "ENTREGUE"
          ? '<button type="button" class="row-act act-deliver" title="Entregar kit" onclick="event.stopPropagation();RS.openDeliver(' + jsStr(a.id) + ')">' + icon("check", 14) + "</button>"
          : '<button type="button" class="row-act act-reverse" title="Estornar entrega" onclick="event.stopPropagation();RS.reverseConfirm(' + jsStr(a.id) + ')">' + icon("rotate", 14) + "</button>");

      return '<tr class="' + cls + '" onclick="RS.openDeliver(' + jsStr(a.id) + ')"><td class="px-3 py-2"><div class="sticky-num">' + athleteNumAvatar(a) + "</div></td>" + cells + '<td class="px-3 py-2"><div class="row-actions">' + actions + "</div></td></tr>";
    }).join("");

    body.innerHTML = '<div class="delivery-table-scroll"><table class="delivery-table">' + thead + "<tbody>" + rows + "</tbody></table></div>";
  }

  function deliveryStatusBlock() {
    var st = deliveryState();
    var total = st.athletes.length;
    var entregues = st.athletes.filter(function (a) { return a.status === "ENTREGUE"; }).length;
    var estornados = st.athletes.filter(function (a) { return a.status === "ESTORNADO"; }).length;
    var pend = total - entregues - estornados;
    var pct = total ? Math.round((entregues / total) * 100) : 0;
    return (
      '<div class="card">' +
        '<h3 class="card-title mb-3">Status do evento</h3>' +
        '<div class="space-y-2">' +
          statusMini("Pendentes de entrega", pend, "blue") +
          statusMini("Kits entregues", entregues, "emerald") +
          statusMini("Entregas estornadas", estornados, "amber") +
        "</div>" +
        '<div class="mt-4">' +
          '<div class="flex justify-between text-xs font-semibold text-slate-500 mb-1"><span>Progresso</span><span>' + pct + "%</span></div>" +
          '<div class="progress"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        "</div>" +
      "</div>"
    );
  }
  function statusMini(label, n, color) {
    return '<div class="status-mini"><div class="mini-bar mini-' + color + '"><span class="dot dot-' + color + '"></span>' + label + '</div><span class="mini-num">' + num(n) + "</span></div>";
  }

  /* ---------- modal de entrega (ficha) ---------- */
  function openDeliverModal(id) {
    var st = deliveryState();
    var a = st.athletes.find(function (x) { return x.id === id; });
    if (!a) return;

    openModal(
      '<div class="modal-card delivery-modal">' +
        '<div class="flex items-start gap-3">' +
          athleteNumAvatar(a) +
          '<div class="flex-1 min-w-0">' +
            '<h2 class="text-lg font-bold leading-tight truncate">' + esc(a.nome) + "</h2>" +
            '<p class="text-sm text-slate-400">CPF: <span class="font-mono">' + esc(a.cpf || "—") + "</span></p>" +
          "</div>" +
          '<div class="flex flex-col items-end gap-1">' + statusBadge(a.status) +
            '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button>" +
          "</div>" +
        "</div>" +

        (a.alerta ? '<div class="alert-banner">' + icon("bell", 16) + "<span><strong>Alerta:</strong> " + esc(a.alerta) + "</span></div>" : "") +

        '<div class="delivery-ficha mt-4">' +
          fichaRow("Modalidade", a.distancia) +
          fichaRow("Camiseta", a.camiseta) +
          fichaRow("Equipe", a.equipe) +
          fichaRow("Faixa etária", a.faixaEtaria) +
          fichaRow("Categoria especial", a.categoriaEspecial) +
          fichaRow("Tipo do kit", a.kit) +
          fichaRow("Cidade/UF", a.cidadeUf) +
          fichaRow("Nascimento", a.nascimento) +
          fichaRow("Sexo", a.sexo) +
          fichaRow("Celular", a.celular) +
          fichaRow("E-mail", a.email) +
        "</div>" +

        (a.dataEntrega ? '<div class="delivery-done">' + icon("check", 16) + "<span>Entregue em <strong>" + esc(a.dataEntrega) + "</strong> por <strong>" + esc(a.usuarioEntrega || "-") + "</strong>" +
          (a.nomeEntrega && a.nomeEntrega !== a.nome ? " — entregue a <strong>" + esc(a.nomeEntrega) + "</strong>" : "") + ".<br><span class='text-xs opacity-70'>Eletrônico / presencial</span></span></div>" : "") +
        (a.dataEstorno ? '<div class="delivery-reversed">' + icon("rotate", 16) + "<span>Estornado em <strong>" + esc(a.dataEstorno) + "</strong> por <strong>" + esc(a.usuarioEstorno || "-") + "</strong> após confirmação de recebimento.</span></div>" : "") +

        (a.status !== "ENTREGUE" ? (
          '<div class="broadcaster mt-4">' +
            '<p class="text-sm font-semibold text-slate-700 mb-2">Quem vai retirar o kit?</p>' +
            '<div class="seg-toggle">' +
              '<button type="button" class="seg-btn seg-active" id="bc-self" onclick="RS.setBroadcaster(\'self\')">O próprio atleta</button>' +
              '<button type="button" class="seg-btn" id="bc-third" onclick="RS.setBroadcaster(\'third\')">Terceiro / Responsável</button>' +
            "</div>" +
            '<div id="bc-fields" class="hidden mt-3 grid gap-3 md:grid-cols-2">' +
              field("Identificação de quem retirou", "text", "bc-nome", "Nome completo") +
              field("CPF de quem retirou (opcional)", "text", "bc-cpf", "###.###.###-##") +
              field("Telefone (opcional)", "text", "bc-fone", "(##) #####-####") +
              field("E-mail (opcional)", "text", "bc-email", "email@exemplo.com") +
            "</div>" +
          "</div>"
        ) : "") +

        '<div class="flex flex-wrap gap-2 justify-end mt-5">' +
          '<button type="button" class="btn btn-indigo" onclick="RS.publishSS(' + jsStr(a.id) + ')">' + icon("monitor", 16) + " Espelhar</button>" +
          '<button type="button" class="btn btn-outline" onclick="RS.openEdit(' + jsStr(a.id) + ')">' + icon("pencil", 16) + " Editar cadastro</button>" +
          (a.status !== "ENTREGUE"
            ? '<button type="button" class="btn btn-emerald btn-lg" onclick="RS.confirmDeliver(' + jsStr(a.id) + ')">' + icon("check", 16) + " CONFIRMAR ENTREGA</button>"
            : '<button type="button" class="btn btn-amber btn-lg" onclick="RS.confirmReverse(' + jsStr(a.id) + ')">' + icon("rotate", 16) + " ESTORNAR ENTREGA</button>") +
        "</div>" +
      "</div>"
    );
  }
  function fichaRow(label, value) {
    return '<div class="ficha-row"><span class="ficha-label">' + label + '</span><span class="ficha-value">' + esc(value || "—") + "</span></div>";
  }
  function field(label, type, id, placeholder) {
    return '<div><label class="text-xs font-semibold text-slate-500">' + label + '</label>' +
      '<input id="' + id + '" type="' + type + '" class="input mt-1" placeholder="' + placeholder + '" /></div>';
  }

  function openPublishCardModal() {
    var st = deliveryState();
    openModal(
      '<div class="modal-card">' +
        '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-indigo">' + icon("monitor", 18) + '</div><h2 class="text-lg font-bold">Segunda tela</h2></div>' +
        '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
        '<p class="text-sm text-slate-500 mb-4">Exiba a ficha de um atleta para quem está do outro lado do balcão conferir os dados com você. Abra <strong>/second-screen.html</strong> em outro monitor ou janela.</p>' +
        '<div class="grid gap-3">' +
          '<button type="button" class="btn btn-indigo btn-lg" onclick="RS.openDeliverForSS()">' + icon("users", 18) + " Escolher atleta</button>" +
          '<button type="button" class="btn btn-outline" onclick="RS.clearSS()">' + icon("x", 18) + " Limpar / encerrar exibição</button>" +
        "</div>" +
      "</div>"
    );
  }
  function openDeliverForSSModal() {
    var list = filteredAthletes();
    openModal(
      '<div class="modal-card">' +
        '<div class="flex items-center justify-between mb-3"><h2 class="text-lg font-bold">Exibir na segunda tela</h2><button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
        '<div class="search-wrap mb-3"><span class="search-ic">' + icon("search", 16) + '</span><input id="ss-pick-search" class="input-search" placeholder="Buscar atleta…" oninput="RS.ssPickSearch(this.value)" /></div>' +
        '<div class="max-h-[50vh] overflow-auto space-y-1" id="ss-pick-list">' + ssPickRows(list) + "</div>" +
      "</div>"
    );
  }
  function ssPickRows(list) {
    if (!list.length) return '<p class="text-sm text-slate-400 p-3">Nenhum atleta.</p>';
    return list.slice(0, 100).map(function (a) {
      return '<button type="button" class="ss-pick-row" onclick="RS.publishSS(' + jsStr(a.id) + ');RS.closeModal()">' +
        athleteNumAvatar(a) + "<span class=\"min-w-0\"><strong class=\"block truncate\">" + esc(a.nome) + "</strong><small class=\"text-slate-400\">" + esc(a.cidadeUf || "") + " · " + esc(a.distancia || "") + "</small></span>" +
        statusBadge(a.status) + "</button>";
    }).join("");
  }

  /* ============================================================== */
  /* MODAIS (PIN, SORTEIO, RESET, RENAME, EDIÇÃO)                   */
  /* ============================================================== */
  function openPinModal() {
    openModal(
      '<div class="modal-card">' +
        '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-amber">' + icon("key", 18) + '</div><h2 class="text-lg font-bold">Buscar por PIN</h2></div>' +
        '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
        '<p class="text-sm text-slate-500 mb-3">Digite o PIN de 6 dígitos do atleta.</p>' +
        '<input id="pin-input" type="password" inputmode="numeric" maxlength="6" class="input input-pin" placeholder="••••••" oninput="RS.pinSearch()" autocomplete="off" />' +
        '<div id="pin-result" class="mt-3"></div>' +
      "</div>"
    );
    setTimeout(function () { var i = document.getElementById("pin-input"); if (i) i.focus(); }, 50);
  }

  function openRaffleModal() {
    var ev = selectedEvent();
    var list = deliveryState().athletes;
    function opts(values) {
      var arr = values.filter(Boolean).filter(function (v, i, self) { return v && self.indexOf(v) === i; }).sort();
      return '<option value="">Todos</option>' + arr.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join("");
    }
    openModal(
      '<div class="modal-card">' +
        '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-amber">' + icon("trophy", 18) + '</div><h2 class="text-lg font-bold">Realizar Sorteio</h2></div>' +
        '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
        '<p class="text-sm text-slate-500 mb-3">Filtre e sorteie um atleta do evento <strong>' + esc(ev ? ev.name : "") + "</strong>.</p>" +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">' +
          '<div><label class="text-xs font-semibold text-slate-500">Modalidade</label><select id="raf-modal" class="select mt-1" onchange="RS.raffleFilter()">' + opts(list.map(function (a) { return a.distancia; })) + "</select></div>" +
          '<div><label class="text-xs font-semibold text-slate-500">Faixa etária</label><select id="raf-age" class="select mt-1" onchange="RS.raffleFilter()">' + opts(list.map(function (a) { return a.faixaEtaria; })) + "</select></div>" +
          '<div><label class="text-xs font-semibold text-slate-500">Cidade</label><select id="raf-city" class="select mt-1" onchange="RS.raffleFilter()">' + opts(list.map(function (a) { return a.cidadeUf; })) + "</select></div>" +
        "</div>" +
        '<div id="raffle-box" class="raffle-box mt-4">' +
          '<div class="raffle-avatar">' + icon("trophy", 30) + "</div>" +
          '<p id="raffle-num" class="raffle-num">—</p>' +
          '<p id="raffle-name" class="raffle-name">Aguardando sorteio…</p>' +
        "</div>" +
        '<div class="flex flex-wrap gap-2 justify-end mt-4">' +
          '<button type="button" id="raf-run" class="btn btn-amber btn-lg" onclick="RS.raffleRun()">' + icon("trophy", 16) + " Sortear</button>" +
          '<button type="button" id="raf-register" class="btn btn-outline hidden" onclick="RS.raffleRegister()">' + icon("download", 16) + " Registrar resultado</button>" +
        "</div>" +
      "</div>"
    );
  }

  function openResetModal() {
    var ev = selectedEvent();
    openModal(
      '<div class="modal-card">' +
        '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-rose">' + icon("trash", 18) + '</div><h2 class="text-lg font-bold">Zerar todas as alterações e entregas</h2></div>' +
        '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
        '<p class="text-sm text-slate-500">Você está prestes a <strong class="text-rose-600">limpar todas as entregas e estornos</strong> deste evento.' +
        "<br>Os cadastros e alterações de dados permanecem; apenas os status de entrega voltam a <strong>PENDENTE</strong>.</p>" +
        '<div class="modal-confirm mt-4">' +
          '<label class="text-xs font-semibold text-slate-500 block mb-1.5">Digite <strong class="text-slate-700">ZERAR ENTREGAS</strong> para confirmar</label>' +
          '<input id="reset-input" class="input" placeholder="ZERAR ENTREGAS" oninput="RS.resetCheck(this.value)" />' +
        "</div>" +
        '<div class="flex justify-end gap-2 mt-5">' +
          '<button type="button" class="btn btn-outline" onclick="RS.closeModal()">Cancelar</button>' +
          '<button type="button" id="reset-go" class="btn btn-rose disabled" disabled onclick="RS.confirmReset()">' + icon("trash", 16) + " Zerar entregas</button>" +
        "</div>" +
      "</div>"
    );
  }

  function openRenameEventModal() {
    var ev = selectedEvent();
    openModal(
      '<div class="modal-card">' +
        '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-blue">' + icon("pencil", 18) + '</div><h2 class="text-lg font-bold">Alterar Nome do Evento / Prova</h2></div>' +
        '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
        '<label class="text-xs font-semibold text-slate-500 block mb-1.5">Nome atual: <strong>' + esc(ev ? ev.name : "") + "</strong></label>" +
        '<input id="rename-input" class="input" placeholder="Novo nome do evento / prova" value="' + esc(ev ? ev.name : "") + '" />' +
        '<div class="flex justify-end gap-2 mt-5">' +
          '<button type="button" class="btn btn-outline" onclick="RS.closeModal()">Cancelar</button>' +
          '<button type="button" class="btn btn-primary" onclick="RS.confirmRenameEvent()">' + icon("check", 16) + " Salvar nome</button>" +
        "</div>" +
      "</div>"
    );
  }

  function openEditModal(id) {
    var a = deliveryState().athletes.find(function (x) { return x.id === id; });
    if (!a) return;
    var equipes = deliveryState().athletes.map(function (x) { return x.equipe; }).filter(function (v, i, s) { return v && s.indexOf(v) === i; }).sort();
    var camisetas = ["PP", "P", "M", "G", "GG", "XGG", "Infantil"];
    openModal(
      '<div class="modal-card w-full max-w-2xl">' +
        '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-blue">' + icon("edit", 18) + '</div><h2 class="text-lg font-bold">Editar atleta</h2></div>' +
        '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
        '<div class="grid grid-cols-2 md:grid-cols-3 gap-3">' +
          '<input id="ed-num" class="input" value="' + esc(a.num) + '" placeholder="Número" />' +
          '<input id="ed-nome" class="input md:col-span-2" value="' + esc(a.nome) + '" placeholder="Nome completo" />' +
          '<input id="ed-cpf" class="input" value="' + esc(a.cpf) + '" placeholder="CPF" />' +
          '<input id="ed-nascto" class="input" value="' + esc(a.nascimento) + '" placeholder="Nascimento (dd/mm/aaaa)" />' +
          '<select id="ed-sexo" class="select">' + ["M", "F"].map(function (v) { return '<option ' + (a.sexo === v ? "selected" : "") + ' value="' + v + '">' + v + "</option>"; }).join("") + "</select>" +
          '<input id="ed-modal" class="input" value="' + esc(a.distancia) + '" placeholder="Modalidade / distância" />' +
          '<input id="ed-fx" class="input" value="' + esc(a.faixaEtaria) + '" placeholder="Faixa etária" />' +
          '<input id="ed-categ" class="input" value="' + esc(a.categoriaEspecial) + '" placeholder="Categoria especial" />' +
          '<select id="ed-camiseta" class="select">' + camisetas.map(function (v) { return '<option ' + (a.camiseta === v ? "selected" : "") + ' value="' + v + '">' + v + "</option>"; }).join("") + "</select>" +
          '<div class="md:col-span-2 relative"><p class="text-xs text-slate-400 mb-1">Equipe — escolha uma existente ou digite para criar nova</p>' +
            '<input id="ed-equipe" class="input" list="ed-equipes" value="' + esc(a.equipe) + '" placeholder="Equipe" />' +
            '<datalist id="ed-equipes">' + equipes.map(function (v) { return '<option value="' + esc(v) + '">'; }).join("") + "</datalist></div>" +
          '<input id="ed-cidade" class="input md:col-span-2" value="' + esc(a.cidadeUf) + '" placeholder="Cidade / UF" />' +
          '<input id="ed-cel" class="input" value="' + esc(a.celular) + '" placeholder="Celular" />' +
          '<input id="ed-email" class="input md:col-span-2" value="' + esc(a.email) + '" placeholder="E-mail" />' +
          '<input id="ed-retirar" class="input md:col-span-2" value="' + esc(a.retirarKit) + '" placeholder="Quem vai retirar o kit" />' +
          '<textarea id="ed-alerta" class="input md:col-span-2" placeholder="Alerta">' + esc(a.alerta) + "</textarea>" +
          '<textarea id="ed-notas" class="input md:col-span-2" placeholder="Notas">' + esc(a.notas) + "</textarea>" +
          '<input id="ed-obs1" class="input" value="' + esc(a.obs1) + '" placeholder="Obs 1" />' +
          '<input id="ed-obs2" class="input" value="' + esc(a.obs2) + '" placeholder="Obs 2" />' +
        "</div>" +
        '<div class="flex justify-end gap-2 mt-5">' +
          '<button type="button" class="btn btn-outline" onclick="RS.closeModal()">Cancelar</button>' +
          '<button type="button" class="btn btn-primary" onclick="RS.saveEdit(' + jsStr(id) + ')">' + icon("check", 16) + " Salvar alterações</button>" +
        "</div>" +
      "</div>"
    );
  }

  /* ============================================================== */
  /* IMPORTAR PLANILHA                                             */
  /* ============================================================== */
  var importedPreview = [];

  function renderImport(eventId) {
    var ev = selectedEvent();
    renderShell("import",
      headerHTML("Dados", "Importar Planilha", '<span class="text-sm text-slate-500">' + icon("package", 14) + " " + esc(ev ? ev.name : "") + "</span>", ""),
      '<div class="grid gap-6 max-w-3xl mx-auto">' +
        '<div class="card">' +
          '<div class="flex items-center gap-2 mb-2"><div class="ic ic-blue">' + icon("fileUp", 18) + '</div><h3 class="card-title">Importar atletas (CSV)</h3></div>' +
          '<p class="text-sm text-slate-500 mb-4">Envie a planilha <strong>.csv</strong> exportada online. Colunas reconhecidas: NUM, Nome Atleta, CPF Atleta, Distância, Equipe, Camiseta, Faixa Etária, Categoria Especial, Nascimento, Sexo, Cidade/UF, Cel, E-mail, Kit, Quem vai retirar o kit, Alerta, Notas, Obs1, Obs2. Atletas com CPF já existente serão <strong>atualizados</strong>.</p>' +
          '<label class="dropzone"><input type="file" accept=".csv,text/csv" onchange="RS.parseImportFile(this.files[0])" />' +
            '<span class="dz-ic">' + icon("fileUp", 22) + '</span><span>Clique para escolher o arquivo<br><small>.csv</small></span></label>' +
          '<div id="import-preview"></div>' +
        "</div>" +
        '<div class="card">' +
          '<div class="flex items-center gap-2 mb-2"><div class="ic ic-indigo">' + icon("hdd", 18) + '</div><h3 class="card-title">Backup / Modelo para relatório Excel</h3></div>' +
          '<p class="text-sm text-slate-500 mb-3">Baixe um JSON/CSV com os dados atuais informados pelo sistema — útil como base para o relatório <em>Excel - Modelo Exportação</em> online.</p>' +
          '<button type="button" class="btn btn-outline" onclick="RS.downloadBackup()">' + icon("download", 16) + " Baixar backup dos dados</button>" +
        "</div>" +
      "</div>");
  }

  /* ============================================================== */
  /* RELATÓRIOS                                                    */
  /* ============================================================== */
  var REPORT_COL_MAP = {
    num: "num", nomeAtleta: "nomeAtleta", kit: "kit", modalidade: "distancia", fxEtaria: "faixaEtaria",
    categEspecial: "categoriaEspecial", nascto: "nascimento", sexo: "sexo", equipe: "equipe",
    cidadeUf: "cidadeUf", camiseta: "camiseta", cpfAtleta: "cpfAtleta", cel: "cel", email: "email",
    quemVaiRetirar: "retirarKit", notas: "notas", obs1: "obs1", obs2: "obs2", alerta: "alerta",
    nomeEvento: "nomeEvento", status: "statusEntrega",
  };
  var REPORTS_TABS = [
    { key: "alteracoes", label: "Alterações & Auditoria", icon: "shieldAlert", sub: true },
    { key: "modelo", label: "Excel modelo e exportação", icon: "spreadsheet", sub: true },
    { key: "relacao", label: "Relação de entrega", icon: "packageCheck", sub: false },
  ];
  var REPORT_SUBS = {
    alteracoes: [
      { key: "estatico", label: "Relatório analítico (estático)" },
      { key: "linhas", label: "Excel — Linhas / Amarelo" },
      { key: "modelo-export", label: "Excel — Modelo Exportação" },
      { key: "full", label: "Excel — Dados Full" },
    ],
    modelo: [
      { key: "de-para", label: "Modelo de atualização (de/para)" },
      { key: "importar", label: "Importar atualizações" },
    ],
  };

  function reportBaseCols() {
    return [
      ["num", "NUM"], ["nomeAtleta", "Nome Atleta"], ["kit", "KIT"], ["distancia", "Distância"],
      ["faixaEtaria", "Faixa Etaria"], ["categoriaEspecial", "Categoria Especial"], ["nascimento", "Nascimento"],
      ["sexo", "Sexo"], ["equipe", "Equipe"], ["cidadeUf", "Cidade/UF"], ["camiseta", "Camiseta"],
      ["cpfAtleta", "CPF Atleta"], ["cel", "Cel"], ["email", "E-mail"], ["retirarKit", "Retirar KIT"],
      ["notas", "Notas"], ["obs1", "Obs1"], ["obs2", "Obs2"], ["alerta", "Alerta"], ["nomeEvento", "Nome Evento"],
    ];
  }
  function reportDeliveryCols() {
    return [
      ["statusEntrega", "status_entrega"], ["dataEntrega", "data_entrega"], ["usuarioEntrega", "usuario_entrega"],
      ["obsEntrega", "obs_entrega"], ["dataEstorno", "data_estorno"], ["usuarioEstorno", "usuario_estorno"],
    ];
  }
  function reportFullCols() {
    return reportBaseCols().concat(reportDeliveryCols());
  }
  function reportRecord(row) {
    var r = row;
    return {
      num: r.num, nomeAtleta: r.nomeAtleta, kit: r.kit, distancia: r.modalidade, faixaEtaria: r.fxEtaria,
      categoriaEspecial: r.categEspecial, nascimento: r.nascto, sexo: r.sexo, equipe: r.equipe,
      cidadeUf: r.cidadeUf, camiseta: r.camiseta, cpfAtleta: r.cpfAtleta, cel: r.cel, email: r.email,
      retirarKit: r.quemVaiRetirar, notas: r.notas, obs1: r.obs1, obs2: r.obs2, alerta: r.alerta,
      nomeEvento: r.nomeEvento, statusEntrega: r.statusEntrega, dataEntrega: r.dataEntrega,
      usuarioEntrega: r.usuarioEntrega, obsEntrega: r.obsEntrega, dataEstorno: r.dataEstorno,
      usuarioEstorno: r.usuarioEstorno,
    };
  }
  function changedColsFor(athleteRow) {
    var cols = new Set();
    var logs = (S.audit || []).filter(function (l) { return String(l.num_atleta) === String(athleteRow.num); });
    logs.forEach(function (l) {
      var c = l.campo_alterado;
      if (c === "edicao") {
        String(l.valor_novo || "").split(/[,;]\s*/).forEach(function (k) {
          var mapped = REPORT_COL_MAP[k.trim()];
          if (mapped) cols.add(mapped);
        });
      } else if (c === "status") {
        cols.add("statusEntrega");
      } else if (c === "importacao") {
        cols.add("nomeEvento");
      }
    });
    return cols;
  }

  function fetchReportsData() {
    var ev = selectedEvent();
    if (!ev) return Promise.resolve({ audit: [], rows: [] });
    return Promise.all([
      S.audit.length ? Promise.resolve(S.audit) : loadAudit(),
      loadAthletes(ev.id),
    ]).then(function (res) { return { audit: res[0], rows: res[1] }; });
  }
  function loadAudit() {
    return api("/api/audit").then(function (list) { S.audit = list || []; return S.audit; });
  }
  function exportCSV(filename, headers, rows) {
    var escC = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
    var lines = [];
    lines.push(headers.map(escC).join(";"));
    rows.forEach(function (r) { lines.push(headers.map(function (h) { return escC(r[h]); }).join(";")); });
    var blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 800);
  }

  function renderReports() {
    var ev = selectedEvent();
    if (!ev) { renderEmptyEvents(); return; }
    var tab = S.reportsTab || "alteracoes";
    S.reportsSub = S.reportsSub || {};
    var sub = S.reportsSub[tab] || (REPORT_SUBS[tab] && REPORT_SUBS[tab][0] ? REPORT_SUBS[tab][0].key : null);

    renderShell("reports",
      headerHTML("Relatórios", "Relatórios", '<span class="text-sm text-slate-500">' + icon("package", 14) + " " + esc(ev.name) + "</span>", ""),
      '<div class="flex gap-3 mb-4">' +
        REPORTS_TABS.map(function (t) {
          return '<button type="button" class="tab-btn ' + (tab === t.key ? "tab-active" : "") + '" onclick="RS.reportsTab(\'' + t.key + '\')">' + icon(t.icon, 15) + " " + t.label + "</button>";
        }).join("") +
      "</div>" +
      '<div id="reports-body">' + loadingBox() + "</div>");
    renderReportsBody();
  }

  function renderReportsBody() {
    var ev = selectedEvent();
    var tab = S.reportsTab || "alteracoes";
    var body = document.getElementById("reports-body");
    if (!body) return;
    body.innerHTML = loadingBox();
    fetchReportsData().then(function (data) {
      body.innerHTML = reportsBodyHTML(tab, data);
      if (tab === "relacao") {
        S.relationRows = data.rows.map(function (r) {
          var rec = reportRecord(r);
          rec.statusEntrega = rec.statusEntrega || r.status;
          return rec;
        });
        renderRelation();
      } else if (tab === "modelo") {
        renderModelo(data);
      }
    });
  }

  function reportsBodyHTML(tab, data) {
    if (tab === "alteracoes") return reportsAlteracoesHTML(data);
    if (tab === "modelo") return reportsModeloHTML(data);
    return reportsRelacaoHTML(data);
  }

  function reportsAlteracoesHTML(data) {
    var sub = S.reportsSub["alteracoes"] || "estatico";
    var ev = selectedEvent();
    var tabs = REPORT_SUBS["alteracoes"].map(function (t) {
      return '<button type="button" class="sub-tab ' + (sub === t.key ? "sub-tab-active" : "") + '" onclick="RS.reportsSub(\'alteracoes\',\'' + t.key + '\')">' + t.label + "</button>";
    }).join("");
    var html = '<div class="flex flex-wrap gap-2 mb-4">' + tabs + "</div>";

    if (sub === "estatico") {
      var logs = data.audit.slice(0, 200);
      html +=
        '<div class="flex justify-end mb-3">' +
          '<button type="button" class="btn btn-outline btn-sm" onclick="RS.exportAudit()">' + icon("download", 14) + " Exportar CSV (Agrupado)</button>" +
        "</div>" +
        '<div class="card p-0 overflow-hidden">' +
          '<div class="delivery-table-scroll"><table class="delivery-table">' +
            "<thead><tr><th>Data/Hora</th><th>Usuário</th><th>Atleta</th><th>Campo alterado</th><th>Antes</th><th>Depois</th><th>Origem</th></tr></thead><tbody>" +
            (logs.length ? logs.map(function (l) {
              return "<tr class='cursor-pointer'><td>" + esc(l.timestamp || "-") + "</td><td><span class='font-medium'>" + esc(l.usuario || "-") + "</span></td>" +
                "<td>" + esc(l.num_atleta ? "Nº " + l.num_atleta : "-") + (l.nome_atleta ? " · " + esc(l.nome_atleta) : "") + "</td>" +
                '<td><span class="badge badge-blue">' + esc(l.campo_alterado || "-") + "</span></td>" +
                "<td>" + esc(l.valor_anterior || "—") + "</td>" +
                "<td>" + esc(l.valor_novo || "—") + "</td>" +
                '<td class="text-slate-400">' + esc(l.dispositivo || "Desktop") + "</td></tr>";
            }).join("") : '<tr><td colspan="7" class="text-center text-sm text-slate-400 py-8">Nenhum registro de alteração.</td></tr>') +
            "</tbody></table></div>" +
        "</div>";
      return html;
    }

    var recs = data.rows.map(function (r) {
      var rec = reportRecord(r);
      rec.changed = changedColsFor(r);
      return rec;
    });

    if (sub === "modelo-export") {
      var exportRows = recs.filter(function (r) { return r.changed.size; });
      var cols = reportBaseCols();
      html += '<div class="flex justify-end mb-3"><button type="button" class="btn btn-outline btn-sm" onclick="RS.exportModelo()">' + icon("download", 14) + " Exportar Excel (CSV)</button></div>";
      html += '<div class="card p-0 overflow-hidden"><div class="delivery-table-scroll"><table class="delivery-table"><thead><tr>' +
        cols.map(function (c) { return "<th>" + c[1] + "</th>"; }).join("") + "</tr></thead><tbody>" +
        (exportRows.length ? exportRows.map(function (r) {
          return "<tr>" + cols.map(function (c) { return "<td>" + esc(r[c[0]] || "-") + "</td>"; }).join("") + "</tr>";
        }).join("") : '<tr><td colspan="' + cols.length + '" class="text-center text-sm text-slate-400 py-8">Nenhum atleta alterado.</td></tr>') +
        "</tbody></table></div></div>" +
        '<p class="text-xs text-slate-400 mt-2">' + num(exportRows.length) + " atleta(s) que sofreram alterações — base para o relatório <em>Excel - Modelo Exportação</em>.</p>";
      return html;
    }

    if (sub === "full") {
      var c2 = reportFullCols();
      html += '<div class="flex justify-end mb-3"><button type="button" class="btn btn-outline btn-sm" onclick="RS.exportFull()">' + icon("download", 14) + " Exportar Dados Full</button></div>";
      html += '<div class="card p-0 overflow-hidden"><div class="delivery-table-scroll"><table class="delivery-table"><thead><tr>' +
        c2.map(function (c) { return "<th>" + c[1] + "</th>"; }).join("") + "</tr></thead><tbody>" +
        (recs.length ? recs.map(function (r) {
          return "<tr>" + c2.map(function (c) { return "<td>" + esc(r[c[0]] || "-") + "</td>"; }).join("") + "</tr>";
        }).join("") : '<tr><td colspan="' + c2.length + '" class="text-center text-sm text-slate-400 py-8">Sem dados.</td></tr>') +
        "</tbody></table></div></div>";
      return html;
    }

    /* Linhas / Amarelo */
    if (sub === "linhas") {
      var c3 = reportFullCols();
      html += '<div class="flex justify-end mb-3"><button type="button" class="btn btn-outline btn-sm" onclick="RS.exportLinhas()">' + icon("download", 14) + " Exportar CSV (destaques)</button></div>";
      html += '<div class="card p-0 overflow-hidden"><div class="delivery-table-scroll"><table class="delivery-table"><thead><tr>' +
        c3.map(function (c) { return "<th>" + c[1] + "</th>"; }).join("") + "</tr></thead><tbody>" +
        (recs.length ? recs.map(function (r) {
          var changed = r.changed.size > 0;
          var attrs = changed ? 'class="row-changed"' : "";
          return "<tr " + attrs + ">" + c3.map(function (c) {
            var mark = changed && r.changed.has(c[0]) ? ' class="cell-changed"' : "";
            return "<td" + mark + ">" + esc(r[c[0]] || "-") + "</td>";
          }).join("") + "</tr>";
        }).join("") : '<tr><td colspan="' + c3.length + '" class="text-center text-sm text-slate-400 py-8">Sem dados.</td></tr>') +
        "</tbody></table></div></div>" +
        '<p class="text-xs text-slate-400 mt-2"><span class="cell-changed px-1.5 py-0.5 rounded">Exemplo</span> células em amarelo = o que foi alterado.</p>';
      return html;
    }
  }

  function reportsModeloHTML(data) {
    var sub = S.reportsSub["modelo"] || "de-para";
    var ev = selectedEvent();
    var tabs = REPORT_SUBS["modelo"].map(function (t) {
      return '<button type="button" class="sub-tab ' + (sub === t.key ? "sub-tab-active" : "") + '" onclick="RS.reportsSub(\'modelo\',\'' + t.key + '\')">' + t.label + "</button>";
    }).join("");
    var html = '<div class="flex flex-wrap gap-2 mb-4">' + tabs + "</div>";

    if (sub === "importar") {
      html +=
        '<div class="card">' +
          '<div class="flex items-center gap-2 mb-2"><div class="ic ic-blue">' + icon("fileUp", 18) + '</div><h3 class="card-title">Importar atualizações (de/para)</h3></div>' +
          '<p class="text-sm text-slate-500 mb-4">Faça o download do <strong>modelo de atualização</strong>, preencha somente os campos <span class="badge badge-amber">amarelos</span> que deseja alterar e suba o arquivo aqui. O sistema identifica o atleta pelo <strong>CPF</strong> e <strong>Número</strong>.</p>' +
          '<label class="dropzone"><input type="file" accept=".csv,text/csv" onchange="RS.importModelFile(this.files[0])" />' +
            '<span class="dz-ic">' + icon("fileUp", 22) + "</span><span>Clique para escolher o CSV de atualizações</span></label>" +
          '<div id="model-import-preview"></div>' +
        "</div>";
      return html;
    }

    html +=
      '<div class="flex justify-end gap-2 mb-3">' +
        '<button type="button" class="btn btn-outline btn-sm" onclick="RS.selectAllModel()">Selecionar todas</button>' +
        '<button type="button" class="btn btn-outline btn-sm" onclick="RS.exportModelTemplate()">' + icon("download", 14) + " Baixar modelo de atualização</button>" +
      "</div>" +
      '<div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">' +
        '<div class="card">' +
          '<h3 class="card-title mb-3">Colunas do relatório</h3>' +
          '<div class="space-y-1" id="model-cols">' +
            reportFullCols().map(function (c) {
              return '<label class="model-check"><input type="checkbox" checked value="' + c[1] + '" /> <span>' + c[1] + "</span></label>";
            }).join("") +
          "</div>" +
        "</div>" +
        '<div class="card p-0 overflow-hidden"><div class="delivery-table-scroll"><table class="delivery-table"><thead><tr id="model-head"></tr></thead><tbody id="model-body"></tbody></table></div></div>' +
      "</div>";
    return html;
  }

  function renderModelo(data) {
    var head = document.getElementById("model-head");
    var body = document.getElementById("model-body");
    if (!head || !body) return;
    var cols = document.querySelectorAll("#model-cols input:checked");
    var keys = Array.prototype.map.call(cols, function (c) { return c.value; });
    head.innerHTML = keys.map(function (k) { return "<th>" + k + "</th>"; }).join("") + '<th class="py-1">&nbsp;</th>';
    var recs = data.rows.map(function (r) {
      var rec = reportRecord(r);
      rec.changed = changedColsFor(r);
      return rec;
    });
    body.innerHTML = recs.length ? recs.map(function (r, i) {
      var changed = r.changed.size > 0;
      var cells = keys.map(function (k) {
        var colK = keyFromHeader(k);
        var mark = changed && r.changed.has(colK) ? ' class="cell-changed"' : "";
        return "<td" + mark + ">" + esc(r[colK] || "-") + "</td>";
      }).join("");
      return '<tr class="' + (changed ? "row-changed" : "") + '">' + cells +
        "<td>" + (changed ? '<span class="badge badge-amber">alterado</span>' : "") + "</td></tr>";
    }).join("") : '<tr><td colspan="' + (keys.length || 1) + '" class="text-center text-sm text-slate-400 py-8">Sem dados.</td></tr>';
  }
  function keyFromHeader(h) {
    var map = {};
    reportFullCols().forEach(function (c) { map[c[1]] = c[0]; });
    return map[h] || h;
  }

  var RELATION_COLS = [
    ["num", "NUM"], ["nomeAtleta", "Nome Atleta"], ["cpfAtleta", "CPF Atleta"], ["distancia", "Distância"],
    ["equipe", "Equipe"], ["cidadeUf", "Cidade/UF"], ["camiseta", "Camiseta"], ["faixaEtaria", "Faixa Etaria"],
    ["categoriaEspecial", "Categoria Especial"], ["nascimento", "Nascimento"], ["sexo", "Sexo"], ["cel", "Cel"],
    ["email", "E-mail"], ["retirarKit", "Retirar KIT"], ["statusEntrega", "Status Entrega"], ["dataEntrega", "Data Entrega"],
    ["usuarioEntrega", "Usuário Entrega"], ["dataEstorno", "Data Estorno"],
  ];

  function reportsRelacaoHTML(data) {
    var ev = selectedEvent();
    var html =
      '<div class="flex justify-end gap-2 mb-3">' +
        '<button type="button" class="btn btn-outline btn-sm" onclick="RS.relationSelectAll()">Marcar todas</button>' +
        '<button type="button" class="btn btn-outline btn-sm" onclick="RS.exportRelation()">' + icon("download", 14) + " Exportar CSV</button>" +
      "</div>" +
      '<div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">' +
        '<div class="card">' +
          '<h3 class="card-title mb-3">Colunas da relação</h3>' +
          '<p class="text-xs text-slate-400 mb-3">Colunas marcadas serão exibidas e exportadas.</p>' +
          '<div class="space-y-1" id="relation-cols">' +
            RELATION_COLS.map(function (c) {
              return '<label class="model-check"><input type="checkbox" checked value="' + c[1] + '" /> <span>' + c[1] + "</span></label>";
            }).join("") +
          "</div>" +
          '<button type="button" class="btn btn-outline btn-sm mt-3" onclick="RS.relationToggleAll(false)">Desmarcar todas</button>' +
        "</div>" +
        '<div class="card p-0 overflow-hidden"><div class="delivery-table-scroll"><table class="delivery-table"><thead><tr id="relation-head"></tr></thead><tbody id="relation-body"></tbody></table></div></div>' +
      "</div>";
    return html;
  }
  function renderRelation() {
    var head = document.getElementById("relation-head");
    var body = document.getElementById("relation-body");
    if (!head || !body) return;
    var cols = document.querySelectorAll("#relation-cols input:checked");
    var keys = Array.prototype.map.call(cols, function (c) { return c.value; });
    head.innerHTML = keys.map(function (k) { return "<th>" + k + "</th>"; }).join("");
    var recs = (S.relationRows || []);
    body.innerHTML = recs.length ? recs.map(function (r) {
      return "<tr>" + keys.map(function (k) { return "<td>" + esc(r[keyFromHeader(k)] || "-") + "</td>"; }).join("") + "</tr>";
    }).join("") : '<tr><td colspan="' + (keys.length || 1) + '" class="text-center text-sm text-slate-400 py-8">Sem dados.</td></tr>';
  }

  /* ============================================================== */
  /* FILTROS (relatórios dinâmicos)                                 */
  /* ============================================================== */
  var FILTERS_TABS = [
    { key: "MODALIDADE", label: "Modalidade" },
    { key: "EQUIPE", label: "Equipe" },
    { key: "CIDADE", label: "Cidade" },
    { key: "CAMISETA", label: "Camiseta" },
    { key: "SEXO", label: "Sexo" },
    { key: "SEXO_DIST", label: "Sexo e Distância" },
    { key: "IDADE", label: "Idade" },
    { key: "ENTREGAS_USU", label: "Entregas (Usuário)" },
    { key: "ENTREGAS_HORA", label: "Entregas (Dia/Hora)" },
  ];
  function renderFilters() {
    var ev = selectedEvent();
    if (!ev) { renderEmptyEvents(); return; }
    var tab = S.filtersTab || "MODALIDADE";
    S.filters = S.filters || {};
    loadAthletes(ev.id).then(function (rows) {
      var list = rows.map(toAthlete);
      renderShell("filters",
        headerHTML("Relatórios dinâmicos", "Filtros",
          '<span class="text-sm text-slate-500">' + icon("calendar", 14) + " " + esc(ev.name) + "</span>",
          evSelectHTML("filters")),
        '<div class="flex gap-3 flex-wrap mb-4">' +
          FILTERS_TABS.map(function (t) {
            return '<button type="button" class="tab-btn ' + (tab === t.key ? "tab-active" : "") + '" onclick="RS.filtersTab(\'' + t.key + '\')">' + t.label + "</button>";
          }).join("") +
        "</div>" +
        '<div class="card mb-4">' +
          '<div class="grid grid-cols-2 md:grid-cols-4 gap-3">' +
            filterSelect("Sexo", "f-sexo", '<option value="">Todos</option><option value="M">Masculino</option><option value="F">Feminino</option>') +
            filterSelect("Cidade", "f-cidade", uniqueOpts(list.map(function (a) { return a.cidadeUf; }))) +
            filterSelect("Camiseta", "f-camiseta", uniqueOpts(list.map(function (a) { return a.camiseta; }))) +
            filterSelect("Idade", "f-idade", '<option value="">Todas</option><option>Até 20 anos</option><option>21 a 30 anos</option><option>31 a 40 anos</option><option>41 a 50 anos</option><option>51 a 60 anos</option><option>61+ anos</option>') +
          "</div>" +
          '<div class="flex gap-2 mt-3">' +
            '<button type="button" class="btn btn-outline btn-sm" onclick="RS.resetFilters()">' + icon("x", 14) + " Limpar filtros</button>" +
            '<button type="button" class="btn btn-outline btn-sm" onclick="RS.exportFilters()">' + icon("download", 14) + " Exportar CSV</button>" +
          "</div>" +
        "</div>" +
        '<div id="filters-body">' + loadingBox() + "</div>");
      renderFiltersBody();
    });
  }
  function filterSelect(label, id, opts) {
    var options = (opts.charAt && opts.charAt(0)) ? opts : opts.join("");
    return '<div><label class="text-xs font-semibold text-slate-500 block mb-1">' + label + '</label><select id="' + id + '" class="select" onchange="RS.filtersChanged()">' + options + "</select></div>";
  }
  function uniqueOpts(values) {
    var arr = values.filter(function (v, i, s) { return v && s.indexOf(v) === i; }).sort();
    return '<option value="">Todos</option>' + arr.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join("");
  }
  function evSelectHTML(screen) {
    var evs = S.events;
    if (!evs.length) return "";
    return '<select class="select select-sm" onchange="RS.changeEvent(this.value)">' + evs.map(function (e) {
      return '<option value="' + esc(e.id) + '" ' + (e.id === S.selectedEventId ? "selected" : "") + ">" + esc(e.name) + "</option>";
    }).join("") + "</select>";
  }

  function filtersBodyRecord(a) {
    return {
      num: a.num, nomeAtleta: a.nome, cpfAtleta: a.cpf, sexo: a.sexo, nascimento: a.nascimento,
      cidadeUf: a.cidadeUf, equipe: a.equipe, modalidade: a.distancia, faixaEtaria: a.faixaEtaria,
      categoriaEspecial: a.categoriaEspecial, camiseta: a.camiseta, status: a.status, dataEntrega: a.dataEntrega,
      usuarioEntrega: a.usuarioEntrega,
    };
  }
  function applyFilters(list) {
    var f = S.filters || {};
    var fSexo = f.fSexo, fCidade = f.fCidade, fCamiseta = f.fCamiseta, fIdade = f.fIdade;
    return list.filter(function (a) {
      if (fSexo && a.sexo !== fSexo) return false;
      if (fCidade && a.cidadeUf !== fCidade) return false;
      if (fCamiseta && a.camiseta !== fCamiseta) return false;
      if (fIdade && ageGroup(ageYears(a.nascimento)) !== fIdade) return false;
      return true;
    });
  }
  function groupedCount(list, keyFn) {
    var map = {};
    list.forEach(function (a) { var k = keyFn(a) || "—"; map[k] = (map[k] || 0) + 1; });
    return Object.keys(map).map(function (k) { return { k: k, n: map[k] }; }).sort(function (a, b) { return b.n - a.n; });
  }
  function renderFiltersBody() {
    var ev = selectedEvent();
    var tab = S.filtersTab || "MODALIDADE";
    var body = document.getElementById("filters-body");
    if (!body) return;
    loadAthletes(ev.id).then(function (rows) {
      var list = applyFilters(rows.map(toAthlete));
      var title, groups, colLabel;
      if (tab === "MODALIDADE") { title = "Modalidades"; colLabel = "Modalidade"; groups = groupedCount(list, function (a) { return a.modalidade; }); }
      else if (tab === "EQUIPE") { title = "Equipes"; colLabel = "Equipe"; groups = groupedCount(list, function (a) { return a.equipe; }); }
      else if (tab === "CIDADE") { title = "Cidades"; colLabel = "Cidade"; groups = groupedCount(list, function (a) { return a.cidadeUf; }); }
      else if (tab === "CAMISETA") { title = "Tamanhos de camiseta"; colLabel = "Camiseta"; groups = groupedCount(list, function (a) { return a.camiseta; }); }
      else if (tab === "SEXO") { title = "Atletas por sexo"; colLabel = "Sexo"; groups = groupedCount(list, function (a) { return a.sexo; }); }
      else if (tab === "SEXO_DIST") {
        title = "Sexo × Distância"; colLabel = "Sexo / Distância";
        var map = {};
        list.forEach(function (a) { var k = (a.sexo || "-") + " · " + (a.modalidade || "-") + " · " + (a.cidadeUf || "-"); map[k] = (map[k] || 0) + 1; });
        groups = Object.keys(map).map(function (k) { return { k: k, n: map[k] }; }).sort(function (a, b) { return b.n - a.n; });
      }
      else if (tab === "IDADE") {
        title = "Faixas de idade"; colLabel = "Faixa etária";
        groups = groupedCount(list, function (a) { return ageGroup(ageYears(a.nascimento)); });
      }
      else if (tab === "ENTREGAS_USU") {
        title = "Entregas por dia/usuário"; colLabel = "Data / Usuário";
        var m2 = {};
        list.forEach(function (a) {
          if (!a.dataEntrega) return;
          var dia = (a.dataEntrega || "").split(" ")[0];
          var k = (dia || "-") + " · " + (a.usuarioEntrega || "-");
          m2[k] = (m2[k] || 0) + 1;
        });
        groups = Object.keys(m2).map(function (k) { return { k: k, n: m2[k] }; }).sort(function (a, b) { return b.n - a.n; });
      }
      else {
        title = "Entregas por dia/hora"; colLabel = "Data / Hora";
        var m3 = {};
        list.forEach(function (a) {
          if (!a.dataEntrega) return;
          var p = a.dataEntrega.split(" ");
          var hh = (p[1] || "").slice(0, 5);
          var k = (p[0] || "-") + " " + (hh ? "às " + hh + "h" : "");
          m3[k] = (m3[k] || 0) + 1;
        });
        groups = Object.keys(m3).map(function (k) { return { k: k, n: m3[k] }; }).sort(function (a, b) { return b.n - a.n; });
      }

      var total = list.length;
      var max = groups.length ? groups[0].n : 1;
      body.innerHTML =
        '<div class="grid gap-4">' +
          '<div class="grid grid-cols-3 gap-4">' +
            kpiCard(icon("users", 20), "Atletas (filtrados)", num(total), "blue") +
            kpiCard(icon("pie", 20), "Grupos", num(groups.length), "emerald") +
            kpiCard(icon("activity", 20), "Entregues (filtrados)", num(list.filter(function (a) { return a.status === "ENTREGUE"; }).length), "amber") +
          "</div>" +
          '<div class="card">' +
            '<div class="flex items-center justify-between mb-4"><div><h3 class="card-title">' + title + "</h3>" +
            '<p class="card-sub">Total de ' + num(total) + " atletas" + (total ? " · filtros ativos" : "") + "</p></div></div>" +
            (groups.length ? groups.map(function (g) {
              return '<div class="filters-group">' +
                '<div class="flex justify-between text-sm font-medium"><span>' + esc(g.k) + '</span><span class="font-semibold">' + num(g.n) + "</span></div>" +
                '<div class="rank-bar"><div class="rank-fill rank-blue" style="width:' + Math.round((g.n / max) * 100) + '%"></div></div>' +
                "</div>";
            }).join("") : '<p class="text-sm text-slate-400">Nenhum registro com os filtros atuais.</p>') +
          "</div>" +
        "</div>";
    });
  }

  /* ============================================================== */
  /* EVENTOS (admin)                                               */
  /* ============================================================== */
  function renderEvents() {
    loadEvents().then(function () {
      var ev = selectedEvent();
      var listRows = S.events.map(function (e) {
        var sel = e.id === S.selectedEventId;
        return '<div class="event-row">' +
          '<div class="flex items-center gap-3 flex-1 min-w-0">' +
            '<div class="ic ' + (sel ? "ic-blue" : "ic-slate") + '">' + icon("calendar", 18) + "</div>" +
            '<div class="min-w-0"><p class="font-semibold truncate">' + esc(e.name) + "</p>" +
            '<p class="text-xs text-slate-400">' + esc(e.date || "Data a definir") + (e.place ? " · " + esc(e.place) : "") + "</p></div>" +
          "</div>" +
          '<span class="badge ' + (sel ? "badge-blue" : "badge-slate") + '">' + (sel ? "Evento ativo" : "Selecionar") + "</span>" +
          '<div class="flex gap-1">' +
            '<button type="button" class="row-act act-view" title="Usar este evento" onclick="RS.selectEvent(' + jsStr(e.id) + ')">' + icon("check", 14) + "</button>" +
            '<button type="button" class="row-act act-edit" title="Renomear" onclick="RS.openRenameEvent(' + jsStr(e.id) + ')">' + icon("pencil", 14) + "</button>" +
            '<button type="button" class="row-act act-deliver" title="Gerar pacote .rksits" onclick="RS.generatePackage(' + jsStr(e.id) + ')">' + icon("hdd", 14) + "</button>" +
            '<button type="button" class="row-act act-monitor" title="Configurar organizador do pacote" onclick="RS.openPackageConfig(' + jsStr(e.id) + ')">' + icon("users", 14) + "</button>" +
            '<button type="button" class="row-act act-reverse" title="Excluir evento" onclick="RS.deleteEvent(' + jsStr(e.id) + ')">' + icon("trash", 14) + "</button>" +
          "</div>" +
        "</div>";
      }).join("");

      renderShell("events",
        headerHTML("Eventos", "Eventos e provas",
          '<span class="text-sm text-slate-500">' + num(S.events.length) + " evento(s)</span>",
          '<button type="button" class="btn btn-primary" onclick="RS.openCreateEvent()">' + icon("plus", 16) + ' Novo evento</button>'),
        '<div class="grid gap-4 max-w-3xl">' +
          '<div class="card">' +
            '<h3 class="card-title mb-3">Eventos instalados</h3>' +
            (S.events.length ? listRows : '<div class="empty-state py-6"><div class="empty-ic">' + icon("inbox", 26) + '</div><p class="text-sm text-slate-400">Nenhum evento. Instale um .rksits em packages/ ou crie um novo.</p></div>') +
          "</div>" +
          '<div class="card">' +
            '<div class="flex items-center gap-2 mb-2"><div class="ic ic-emerald">' + icon("packageCheck", 18) + '</div><h3 class="card-title">Pacotes instalados</h3></div>' +
            '<p class="text-sm text-slate-400 mb-3">Cada pacote .rksits presente na pasta <code>packages/</code> é instalado automaticamente na abertura. Após alterar o nome de um evento (nos Utilitários da entrega), o pacote <strong>não é reinstalado</strong> para não desfazer sua alteração.</p>' +
          "</div>" +
        "</div>");
    });
  }

  /* ============================================================== */
  /* CONFIGURAÇÕES                                                 */
  /* ============================================================== */
  var SETTINGS_TABS = [
    { key: "operadores", label: "Operadores" },
    { key: "organizadores", label: "Organizadores" },
    { key: "admins", label: "Administradores" },
  ];
  function settingsTabsForRole() {
    if (S.user && S.user.role === "ORGANIZADOR") return [{ key: "operadores", label: "Operadores" }];
    return SETTINGS_TABS;
  }
  function renderSettings() {
    api("/api/users").then(function (users) {
      var tab = S.settingsTab || "operadores";
      var roles = { operadores: "OPERADOR", organizadores: "ORGANIZADOR", admins: "ADMIN" };
      var roleKey = roles[tab] || "OPERADOR";
      var canCreate = S.user.role === "ADMIN" || (tab === "operadores" && S.user.role === "ORGANIZADOR");
      var rows = users.filter(function (u) { return u.role === roleKey; });
      var self = users.find(function (u) { return u.id === S.user.id; });

      renderShell("settings",
        headerHTML("Configurações", "Configurações",
          '<span class="text-sm text-slate-500">' + icon("shieldAlert", 14) + " " + esc(S.user.name) + " (" + esc(S.user.role) + ")</span>",
          ""),
        '<div class="grid gap-4 max-w-4xl">' +
          '<div class="flex gap-2 flex-wrap">' +
            settingsTabsForRole().map(function (t) {
              return '<button type="button" class="tab-btn ' + (tab === t.key ? "tab-active" : "") + '" onclick="RS.settingsTab(\'' + t.key + '\')">' + t.label + "</button>";
            }).join("") +
          "</div>" +
          '<div class="card"><h3 class="card-title mb-1">Importação manual de pacote (.rksits)</h3>' +
            '<p class="text-sm text-slate-400 mb-3">Se um pacote novo for copiado para <code>packages/</code> sem reiniciar o programa, use:</p>' +
            '<button type="button" class="btn btn-outline btn-sm" onclick="RS.listPackages()">' + icon("hdd", 14) + ' Ver pacotes disponíveis</button>' +
            '<div id="packages-box"></div></div>' +
          '<div class="card p-0 overflow-hidden">' +
            '<div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">' +
              '<h3 class="card-title">' + tab.charAt(0).toUpperCase() + tab.slice(1) + "</h3>" +
              (canCreate ? '<button type="button" class="btn btn-outline btn-sm" onclick="RS.openCreateUser()">' + icon("plus", 14) + " Novo " + (tab === "organizadores" ? "organizador" : tab === "admins" ? "administrador" : "operador") + "</button>" : "") +
            "</div>" +
            '<div class="delivery-table-scroll"><table class="delivery-table"><thead><tr><th>Nome</th><th>E-mail</th><th>CPF</th><th>Vinculado a</th><th></th></tr></thead><tbody>' +
              (rows.length ? rows.map(function (u) {
                var own = u.id === S.user.id;
                var canEdit = S.user.role === "ADMIN" || (S.user.role === "ORGANIZADOR" && u.organizer_id === (self && self.id));
                return "<tr><td><span class='font-medium'>" + esc(u.name) + "</span>" + (own ? ' <span class="badge badge-blue">você</span>' : "") + "</td>" +
                  "<td>" + esc(u.email || "-") + "</td><td class='font-mono'>" + esc(u.cpf || "-") + "</td>" +
                  "<td class='text-slate-400'>" + (u.organizer_id ? (function () { var _o = users.find(function (x) { return x.id === u.organizer_id; }); return _o ? esc(_o.name) : "-"; })() : "-") + "</td>" +
                  "<td>" + (canEdit ? '<div class="row-actions">' +
                    '<button type="button" class="row-act act-edit" onclick="RS.openEditUser(' + jsStr(u.id) + ')">' + icon("pencil", 14) + "</button>" +
                    (u.id !== "admin" ? '<button type="button" class="row-act act-reverse" onclick="RS.deleteUser(' + jsStr(u.id) + ')">' + icon("trash", 14) + "</button>" : "") +
                    "</div>" : "") + "</td></tr>";
              }).join("") : '<tr><td colspan="5" class="text-center text-sm text-slate-400 py-8">Nenhum usuário nesta categoria.</td></tr>') +
            "</tbody></table></div>" +
          "</div>" +
        "</div>");
    });
  }

  /* ============================================================== */
  /* ROUTER + RS                                                   */
  /* ============================================================== */
  function openModal(html) {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = '<div class="modal-box">' + html + "</div>";
    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    return overlay;
  }

  function loadingBox() {
    return '<div class="flex items-center justify-center py-16 text-slate-400">' +
      '<div class="spinner"></div><span class="ml-3 text-sm">Carregando…</span></div>';
  }

  function renderShell(active, headerHTML, contentHTML) {
    document.getElementById("app").innerHTML = shell(active, headerHTML, contentHTML);
  }

  function currentRoute() {
    return (window.location.hash || "#/dashboard").replace(/^#/, "");
  }

  var RS = {
    go: function (hash) { window.location.hash = hash; },

    login: function (identifier, password) {
      var err = document.getElementById("login-error");
      api("/api/auth/login", { method: "POST", json: { identifier: identifier, password: password } })
        .then(function (data) {
          S.user = data.user;
          try { localStorage.setItem(LS_USER, JSON.stringify(data.user)); } catch (e) {}
          RS.go("#/dashboard");
        })
        .catch(function (e) {
          if (err) { err.textContent = e.message; err.classList.remove("hidden"); }
        });
    },

    logout: function () {
      S.user = null;
      try { localStorage.removeItem(LS_USER); } catch (e) {}
      clearSecondScreen();
      RS.go("#/login");
    },

    closeModal: function () {
      var els = document.querySelectorAll(".modal-overlay");
      Array.prototype.forEach.call(els, function (el) { el.remove(); });
    },

    /* ---------- entrega ---------- */
    deliverySearch: function (v) {
      deliveryState().query = v || "";
      updateDeliveryTable();
    },
    setStatus: function (f) {
      deliveryState().statusFilter = f;
      var chips = document.getElementById("status-chips");
      if (chips) chips.innerHTML = STATUS_FILTERS.map(function (fl) {
        var active = deliveryState().statusFilter === fl.key;
        return '<button type="button" class="chip ' + (active ? "chip-active" : "") + '" onclick="RS.setStatus(' + (fl.key ? "'" + fl.key + "'" : "null") + ')">' + fl.label + "</button>";
      }).join("");
      updateDeliveryTable();
    },
    setSSMode: function (m) {
      deliveryState().ssMode = m;
      if (m === "MANUAL") clearSecondScreen();
      toast(m === "AUTOMATICO" ? "Segunda tela: automática (90s por atleta)." : "Segunda tela: manual.");
      renderDelivery();
    },
    openDeliver: function (id) { openDeliverModal(id); },
    openEdit: function (id) { openEditModal(id); },
    setBroadcaster: function (mode) {
      var self = document.getElementById("bc-self");
      var third = document.getElementById("bc-third");
      var fields = document.getElementById("bc-fields");
      if (self && third) {
        self.classList.toggle("seg-active", mode === "self");
        third.classList.toggle("seg-active", mode === "third");
      }
      if (fields) fields.classList.toggle("hidden", mode !== "third");
    },
    confirmDeliver: function (id) {
      var a = deliveryState().athletes.find(function (x) { return x.id === id; });
      if (!a) return;
      var third = document.getElementById("bc-third") && document.getElementById("bc-third").classList.contains("seg-active");
      var body = {
        athlete_id: id,
        usuario: S.user.name,
        terceiro: third,
        nome_entrega: third ? (document.getElementById("bc-nome").value || "") : "",
        cpf_entrega: third ? (document.getElementById("bc-cpf").value || "") : "",
        fone_entrega: third ? (document.getElementById("bc-fone").value || "") : "",
        email_entrega: third ? (document.getElementById("bc-email").value || "") : "",
      };
      api("/api/events/" + S.selectedEventId + "/deliver", { method: "POST", json: body })
        .then(function (res) {
          applyAthleteResponse(res.athlete);
          RS.closeModal();
          toast("Kit entregue para " + a.nome);
          if (deliveryState().ssMode === "AUTOMATICO") {
            var up = deliveryState().athletes.find(function (x) { return x.id === id; });
            if (up) publishSecondScreen(up, "AUTOMATICO");
          }
        })
        .catch(function (e) { toast(e.message); });
    },
    reverseConfirm: function (id) {
      var a = deliveryState().athletes.find(function (x) { return x.id === id; });
      if (!a) return;
      if (!window.confirm("Estornar a entrega do kit de " + a.nome + "? Após a confirmação de recebimento, a entrega será revertida para PENDENTE.")) return;
      api("/api/events/" + S.selectedEventId + "/reverse", { method: "POST", json: { athlete_id: id, usuario: S.user.name } })
        .then(function (res) {
          applyAthleteResponse(res.athlete);
          RS.closeModal();
          toast("Entrega estornada.");
        })
        .catch(function (e) { toast(e.message); });
    },
    confirmReverse: function (id) { RS.reverseConfirm(id); },
    publishSS: function (id) {
      var a = deliveryState().athletes.find(function (x) { return x.id === id; });
      if (!a) return;
      publishSecondScreen(a, deliveryState().ssMode || "MANUAL");
      toast("Atleta enviado para a segunda tela.");
      if (deliveryState().ssMode === "MANUAL") RS.closeModal();
    },
    clearSS: function () { clearSecondScreen(); toast("Segunda tela limpa."); },
    openPublishCard: function () { openPublishCardModal(); },
    openDeliverForSS: function () { openDeliverForSSModal(); },
    ssPickSearch: function (v) {
      var list = filteredAthletes().filter(function (a) {
        var q = v.trim().toLowerCase();
        if (!q) return true;
        return (a.nome || "").toLowerCase().indexOf(q) >= 0 || (a.num || "").indexOf(q) >= 0;
      });
      var el = document.getElementById("ss-pick-list");
      if (el) el.innerHTML = ssPickRows(list);
    },

    /* ---------- PIN ---------- */
    openPin: function () { openPinModal(); },
    pinSearch: function () {
      var val = (document.getElementById("pin-input").value || "").trim();
      var box = document.getElementById("pin-result");
      if (!box) return;
      if (val.length < 3) { box.innerHTML = ""; return; }
      var matches = deliveryState().athletes.filter(function (a) { return String(a.pin || "").indexOf(val) >= 0; });
      box.innerHTML = matches.slice(0, 6).map(function (a) {
        return '<button type="button" class="ss-pick-row" onclick="RS.pinOpen(' + jsStr(a.id) + ')">' +
          athleteNumAvatar(a) + "<span class=\"min-w-0\"><strong class=\"block truncate\">" + esc(a.nome) + "</strong><small class=\"text-slate-400\">" + esc(a.cpf || "") + "</small></span>" +
          statusBadge(a.status) + "</button>";
      }).join("") || (val.length >= 5 ? '<p class="text-sm text-slate-400">Nenhum atleta com este PIN.</p>' : "");
    },
    pinOpen: function (id) { RS.closeModal(); openDeliverModal(id); },

    /* ---------- sorteio ---------- */
    openRaffle: function () { openRaffleModal(); },
    raffleFilter: function () { /* filtros aplicados no sorteio */ },
    rafflePool: function () {
      var list = filteredAthletes();
      var m = document.getElementById("raf-modal"), a = document.getElementById("raf-age"), c = document.getElementById("raf-city");
      return list.filter(function (x) {
        if (m && m.value && x.distancia !== m.value) return false;
        if (a && a.value && x.faixaEtaria !== a.value) return false;
        if (c && c.value && x.cidadeUf !== c.value) return false;
        return true;
      });
    },
    raffleRun: function () {
      var pool = RS.rafflePool();
      var run = document.getElementById("raf-run");
      var reg = document.getElementById("raf-register");
      if (!pool.length) { toast("Nenhum atleta com os filtros atuais."); return; }
      run.disabled = true;
      var steps = 15, step = 0;
      S.raffleResult = null;
      var timer = setInterval(function () {
        var a = pool[Math.floor(Math.random() * pool.length)];
        document.getElementById("raffle-num").textContent = a.num || "—";
        document.getElementById("raffle-name").textContent = a.nome;
        step++;
        if (step >= steps) {
          clearInterval(timer);
          S.raffleResult = a;
          run.disabled = false;
          run.textContent = "Sortear novamente";
          run.innerHTML = RS_icon("trophy", 16) + " Sortear de novo";
          reg.classList.remove("hidden");
          if (deliveryState().ssMode === "AUTOMATICO") publishSecondScreen(a, "AUTOMATICO");
        }
      }, 120);
    },
    raffleRegister: function () {
      var a = S.raffleResult;
      if (!a) { toast("Realize um sorteio primeiro."); return; }
      api("/api/audit", { method: "POST", json: { acao: "sorteio", entidadeId: a.num || a.id, detalhe: a.nome + " — sorteado no evento" } })
        .then(function () { toast("Sorteio registrado no sistema."); RS.closeModal(); })
        .catch(function (e) { toast(e.message); });
    },

    /* ---------- reset / rename ---------- */
    openReset: function () { openResetModal(); },
    resetCheck: function (v) {
      var btn = document.getElementById("reset-go");
      var ok = String(v || "").toUpperCase() === "ZERAR ENTREGAS";
      if (btn) { btn.classList.toggle("disabled", !ok); btn.disabled = !ok; }
    },
    confirmReset: function () {
      api("/api/events/" + S.selectedEventId + "/reset", { method: "POST" })
        .then(function (res) {
          RS.closeModal();
          toast(res.reset + " entregas zeradas (todas voltaram a PENDENTE).");
          invalidateAthletes(S.selectedEventId);
          renderDelivery();
        })
        .catch(function (e) { toast(e.message); });
    },
    openRenameEvent: function (id) { S.renameEventId = id || S.selectedEventId; openRenameEventModal(); },
    confirmRenameEvent: function () {
      var name = (document.getElementById("rename-input").value || "").trim();
      var id = S.renameEventId || S.selectedEventId;
      if (!name) { toast("Informe o novo nome."); return; }
      api("/api/events/" + id, { method: "PATCH", json: { name: name } })
        .then(function () {
          RS.closeModal();
          toast("Nome do evento/prova atualizado.");
          invalidateAthletes(id);
          loadEvents().then(function () { RS.route(); });
        })
        .catch(function (e) { toast(e.message); });
    },

    /* ---------- edição de atleta ---------- */
    saveEdit: function (id) {
      var ev = S.selectedEventId;
      function val(el) { var n = document.getElementById(el); return n ? n.value : null; }
      var payload = {};
      var fields = [
        ["num", "ed-num"], ["nomeAtleta", "ed-nome"], ["cpfAtleta", "ed-cpf"], ["nascto", "ed-nascto"],
        ["sexo", "ed-sexo"], ["modalidade", "ed-modal"], ["fxEtaria", "ed-fx"], ["categEspecial", "ed-categ"],
        ["camiseta", "ed-camiseta"], ["equipe", "ed-equipe"], ["cidadeUf", "ed-cidade"],
        ["cel", "ed-cel"], ["email", "ed-email"], ["quemVaiRetirar", "ed-retirar"],
        ["alerta", "ed-alerta"], ["notas", "ed-notas"], ["obs1", "ed-obs1"], ["obs2", "ed-obs2"],
      ];
      fields.forEach(function (f) { var v = val(f[1]); if (v !== null) payload[f[0]] = v.trim(); });
      api("/api/events/" + ev + "/athletes/" + id, { method: "PATCH", json: payload })
        .then(function (ath) {
          applyAthleteResponse(ath);
          RS.closeModal();
          toast("Cadastro atualizado.");
          invalidateAthletes(ev);
          updateDeliveryTable();
        })
        .catch(function (e) { toast(e.message); });
    },

    /* ---------- importar ---------- */
    parseImportFile: function (file) {
      if (!file) return;
      var preview = document.getElementById("import-preview");
      var reader = new FileReader();
      reader.onload = function () {
        var text = String(reader.result);
        var sep = text.split(";").length > text.split(",").length ? ";" : ",";
        var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
        if (!lines.length) { preview.innerHTML = '<p class="text-sm text-rose-600 mt-2">Arquivo vazio.</p>'; return; }
        var headers = lines[0].split(sep).map(function (h) { return h.trim(); });
        var rows = [];
        for (var i = 1; i < lines.length; i++) {
          var parts = lines[i].split(sep);
          var row = {};
          headers.forEach(function (h, j) { row[h] = (parts[j] || "").trim(); });
          if (Object.values(row).some(function (v) { return v; })) rows.push(row);
        }
        importedPreview = rows;
        preview.innerHTML =
          '<div class="mt-4 rounded-xl border border-slate-200 overflow-hidden">' +
            '<div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">' +
              '<span class="text-sm font-semibold">' + num(rows.length) + " atletas lidos</span>" +
              '<div class="flex gap-2"><button type="button" class="btn btn-outline btn-sm" onclick="RS.parseImportFile(null);document.getElementById(\'import-file-clear\') && null">Cancelar</button>' +
              '<button type="button" class="btn btn-primary btn-sm" onclick="RS.confirmImport()">' + icon("check", 14) + " Importar no sistema</button></div></div>" +
            '<div class="overflow-auto max-h-[280px]"><table class="delivery-table"><thead><tr>' +
              headers.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
              rows.slice(0, 12).map(function (r) {
                return "<tr>" + headers.map(function (h) { return "<td>" + esc(r[h] || "") + "</td>"; }).join("") + "</tr>";
              }).join("") + (rows.length > 12 ? '<tr><td colspan="' + headers.length + '" class="text-center text-xs text-slate-400">… mais ' + (rows.length - 12) + " linhas</td></tr>" : "") +
            "</tbody></table></div></div>";
      };
      reader.readAsText(file);
    },
    confirmImport: function () {
      var ev = S.selectedEventId;
      if (!importedPreview.length) { toast("Nenhum dado para importar."); return; }
      var rows = importedPreview.map(function (r, i) {
        return {
          num: r["NUM"] || r["Num"] || r["num"] || "",
          nomeAtleta: r["Nome Atleta"] || r["NOME ATLETA"] || r["nome"] || "",
          cpfAtleta: r["CPF Atleta"] || r["CPF"] || "",
          modalidade: r["Distância"] || r["DISTÂNCIA"] || r["Distancia"] || "",
          fxEtaria: r["Faixa Etária"] || r["FAIXA ETÁRIA"] || r["Faixa Etaria"] || "",
          categEspecial: r["Categoria Especial"] || r["CATEGORIA ESPECIAL"] || "",
          equipe: r["Equipe"] || r["EQUIPE"] || "",
          cidadeUf: r["Cidade/UF"] || r["CIDADE/UF"] || "",
          camiseta: r["Camiseta"] || r["CAMISETA"] || "",
          sexo: r["Sexo"] || r["SEXO"] || "",
          nascto: r["Nascimento"] || r["Nascto."] || "",
          cel: r["Cel"] || r["CEL"] || "",
          email: r["E-mail"] || r["EMAIL"] || r["email"] || "",
          kit: r["KIT"] || r["Kit"] || "",
          quemVaiRetirar: r["Retirar KIT"] || r["Quem vai retirar o kit"] || "",
          alerta: r["Alerta"] || r["ALERTA"] || "",
          notas: r["Notas"] || r["NOTAS"] || "",
          obs1: r["Obs1"] || r["OBS1"] || "",
          obs2: r["Obs2"] || r["OBS2"] || "",
        };
      });
      api("/api/events/" + ev + "/athletes", { method: "POST", json: { athletes: rows } })
        .then(function (res) {
          toast(num(res.imported) + " novos, " + num(res.updated) + " atualizados.");
          importedPreview = [];
          invalidateAthletes(ev);
          renderImport();
        })
        .catch(function (e) { toast(e.message); });
    },
    downloadBackup: function () {
      loadAthletes(S.selectedEventId).then(function (rows) {
        exportCSV("backup-atletas-" + (S.selectedEventId || "evento") + ".csv",
          reportFullCols().map(function (c) { return c[1]; }),
          rows.map(reportRecord));
      });
    },

    /* ---------- relatórios ---------- */
    reportsTab: function (k) {
      S.reportsTab = k;
      S.reportsSub = S.reportsSub || {};
      var first = (REPORT_SUBS[k] && REPORT_SUBS[k][0]) ? REPORT_SUBS[k][0].key : null;
      if (first) S.reportsSub[k] = first;
      renderReports();
    },
    reportsSub: function (tab, sub) {
      S.reportsSub = S.reportsSub || {};
      S.reportsSub[tab] = sub;
      renderReportsBody();
    },
    exportAudit: function () {
      exportCSV("relatorio-alteracoes-agrupado.csv",
        ["Data/Hora", "Usuário", "Nº Atleta", "Nome Atleta", "Campo Alterado", "Antes", "Depois"],
        (S.audit || []).map(function (l) {
          return { "Data/Hora": l.timestamp, "Usuário": l.usuario, "Nº Atleta": l.num_atleta, "Nome Atleta": l.nome_atleta, "Campo Alterado": l.campo_alterado, "Antes": l.valor_anterior, "Depois": l.valor_novo };
        }));
      toast("CSV criado.");
    },
    exportModelo: function () {
      loadAthletes(S.selectedEventId).then(function (rows) {
        var recs = rows.map(function (r) { var rec = reportRecord(r); rec.changed = changedColsFor(r); return rec; })
          .filter(function (r) { return r.changed.size; });
        var cols = reportBaseCols();
        if (!recs.length) { toast("Nenhum atleta alterado."); return; }
        exportCSV("relatorio-alteracoes-modelo-exportacao.csv", cols.map(function (c) { return c[1]; }), recs);
        toast("CSV criado.");
      });
    },
    exportLinhas: function () {
      loadAthletes(S.selectedEventId).then(function (rows) {
        var cols = reportFullCols();
        exportCSV("relatorio-linhas-amarelo.csv", cols.map(function (c) { return c[1]; }), rows.map(function (r) { return Object.assign(reportRecord(r), { _mark: changedColsFor(r) }); }));
        toast("CSV criado.");
      });
    },
    exportFull: function () {
      loadAthletes(S.selectedEventId).then(function (rows) {
        var cols = reportFullCols();
        exportCSV("relatorio-dados-full.csv", cols.map(function (c) { return c[1]; }), rows.map(reportRecord));
        toast("CSV criado.");
      });
    },
    selectAllModel: function () {
      var cb = document.querySelectorAll("#model-cols input");
      Array.prototype.forEach.call(cb, function (c) { c.checked = true; });
      fetchReportsData().then(function (data) { renderModelo(data); });
    },
    exportModelTemplate: function () {
      chooseModelCols().then(function (keys) {
        toast("Modelo com " + keys.length + " coluna(s).");
      });
    },
    importModelFile: function (file) {
      var box = document.getElementById("model-import-preview");
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var text = String(reader.result);
        var sep = text.split(";").length > text.split(",").length ? ";" : ",";
        var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
        if (lines.length < 2) { box.innerHTML = '<p class="text-sm text-rose-600 mt-2">Arquivo sem linhas de dados.</p>'; return; }
        var headers = lines[0].split(sep).map(function (h) { return h.trim(); });
        var data = [];
        for (var i = 1; i < lines.length; i++) {
          var parts = lines[i].split(sep);
          var row = {};
          headers.forEach(function (h, j) { row[h] = (parts[j] || "").trim(); });
          if (Object.values(row).filter(function (v) { return v; }).length > 1) data.push(row);
        }
        box.innerHTML =
          '<div class="mt-4 rounded-xl border border-slate-200 p-4 bg-amber-50 border-amber-200">' +
            '<p class="text-sm font-semibold text-amber-900 mb-2">' + num(data.length) + " atualizações pendentes de confirmação</p>" +
            '<div class="flex gap-2">' +
              '<button type="button" class="btn btn-primary btn-sm" onclick="RS.applyModelImport()">' + icon("check", 14) + " Confirmar importação</button>" +
              '<button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById(\'model-import-preview\').innerHTML=\'\'">Cancelar</button>' +
            "</div></div>";
        S.modelImportData = data;
      };
      reader.readAsText(file);
    },
    applyModelImport: function () {
      var rows = S.modelImportData || [];
      var ev = S.selectedEventId;
      if (!rows.length) { toast("Nada a importar."); return; }
      var updates = [];
      rows.forEach(function (r) {
        var rec = {};
        var num = r["NUM"] || "";
        var cpf = r["CPF Atleta"] || "";
        if (!num && !cpf) return;
        Object.keys(r).forEach(function (h) {
          var v = r[h];
          if (!v || v === "-") return;
          var k = keyFromHeader(h);
          if (k === "num" || k === "cpfAtleta") return;
          rec[k] = v;
        });
        if (Object.keys(rec).length) rec.num = num;
        if (Object.keys(rec).length) { rec.cpfAtleta = cpf; updates.push(rec); }
      });
      if (!updates.length) { toast("Nenhuma alteração identificada."); return; }
      api("/api/events/" + ev + "/athletes", { method: "POST", json: { athletes: updates } })
        .then(function (res) {
          toast(num(res.updated) + " atletas atualizados.");
          S.modelImportData = null;
          document.getElementById("model-import-preview").innerHTML = "";
          invalidateAthletes(ev);
        })
        .catch(function (e) { toast(e.message); });
    },
    relationSelectAll: function () {
      var cb = document.querySelectorAll("#relation-cols input");
      Array.prototype.forEach.call(cb, function (c) { c.checked = true; });
      renderRelation();
    },
    relationToggleAll: function (on) {
      var cb = document.querySelectorAll("#relation-cols input");
      Array.prototype.forEach.call(cb, function (c) { c.checked = on; });
      renderRelation();
    },
    exportRelation: function () {
      var keys = Array.prototype.map.call(document.querySelectorAll("#relation-cols input:checked"), function (c) { return c.value; });
      if (!keys.length) { toast("Marque ao menos uma coluna."); return; }
      loadAthletes(S.selectedEventId).then(function (rows) {
        var recs = rows.map(function (r) {
          var rec = reportRecord(r);
          rec.statusEntrega = rec.statusEntrega || r.status;
          return rec;
        });
        exportCSV("relacao-entrega.csv", keys, recs.map(function (r) {
          var out = {};
          keys.forEach(function (k) { out[k] = r[keyFromHeader(k)]; });
          return out;
        }));
        toast("CSV criado.");
      });
    },

    /* ---------- filtros ---------- */
    filtersTab: function (k) { S.filtersTab = k; renderFilters(); },
    filtersChanged: function () {
      var f = S.filters = S.filters || {};
      f.fSexo = document.getElementById("f-sexo").value;
      f.fCidade = document.getElementById("f-cidade").value;
      f.fCamiseta = document.getElementById("f-camiseta").value;
      f.fIdade = document.getElementById("f-idade").value;
      renderFiltersBody();
    },
    resetFilters: function () {
      S.filters = {};
      ["f-sexo", "f-cidade", "f-camiseta", "f-idade"].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ""; });
      renderFiltersBody();
    },
    exportFilters: function () {
      loadAthletes(S.selectedEventId).then(function (rows) {
        var cols = [
          ["num", "NUM"], ["nomeAtleta", "Nome Atleta"], ["sexo", "Sexo"], ["faixaEtaria", "Faixa Etária"],
          ["cidadeUf", "Cidade/UF"], ["camiseta", "Camiseta"], ["modalidade", "Modalidade"], ["status", "Status"],
        ];
        exportCSV("filtros.csv", cols.map(function (c) { return c[1]; }), applyFilters(rows.map(toAthlete)).map(function (a) {
          var r = filtersBodyRecord(a); return r;
        }).map(function (r) {
          var out = {};
          cols.forEach(function (c) { out[c[1]] = r[c[0]]; });
          return out;
        }));
        toast("CSV criado.");
      });
    },
    changeEvent: function (id) {
      S.selectedEventId = id;
      invalidateAthletes(id);
      RS.route();
    },

    /* ---------- eventos ---------- */
    selectEvent: function (id) {
      S.selectedEventId = id;
      invalidateAthletes(id);
      loadEvents().then(function () { renderEvents(); });
      toast("Evento ativo: " + (S.events.find(function (e) { return e.id === id; }) || {}).name);
    },
    openCreateEvent: function () {
      api("/api/users").then(function (users) {
        var orgs = users.filter(function (u) { return u.role === "ORGANIZADOR"; });
        openModal(
          '<div class="modal-card">' +
            '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-blue">' + icon("calendar", 18) + '</div><h2 class="text-lg font-bold">Novo evento / prova</h2></div>' +
            '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
            '<div class="grid gap-3">' +
              '<div><label class="text-xs font-semibold text-slate-500">Nome do evento / prova</label><input id="ev-name" class="input mt-1" placeholder="Ex.: Corrida de Rua 10km" /></div>' +
              '<div class="grid grid-cols-2 gap-3">' +
                '<div><label class="text-xs font-semibold text-slate-500">Data</label><input id="ev-date" class="input mt-1" placeholder="dd/mm/aaaa" /></div>' +
                '<div><label class="text-xs font-semibold text-slate-500">Local</label><input id="ev-place" class="input mt-1" placeholder="Cidade / Local" /></div>' +
              "</div>" +
              '<div><label class="text-xs font-semibold text-slate-500">Organizador responsável (link do pacote)</label><select id="ev-org" class="select mt-1"><option value="">Sem organizador</option>' +
                orgs.map(function (o) { return '<option value="' + esc(o.id) + '">' + esc(o.name) + "</option>"; }).join("") + "</select></div>" +
            "</div>" +
            '<div class="flex justify-end gap-2 mt-5">' +
              '<button type="button" class="btn btn-outline" onclick="RS.closeModal()">Cancelar</button>' +
              '<button type="button" class="btn btn-primary" onclick="RS.saveEvent()">' + icon("check", 16) + " Criar evento</button>" +
            "</div></div>"
        );
      });
    },
    saveEvent: function () {
      var name = document.getElementById("ev-name").value.trim();
      if (!name) { toast("Informe o nome."); return; }
      var orgId = document.getElementById("ev-org").value;
      api("/api/events", { method: "POST", json: { name: name, date: document.getElementById("ev-date").value, place: document.getElementById("ev-place").value } })
        .then(function (res) {
          if (orgId) {
            return api("/api/events/" + res.id + "/package-config", { method: "POST", json: { organizer_id: orgId } }).then(function () { return res; });
          }
          return res;
        })
        .then(function (res) {
          RS.closeModal();
          toast("Evento criado: " + res.name);
          S.selectedEventId = res.id;
          loadEvents().then(function () { renderEvents(); });
        })
        .catch(function (e) { toast(e.message); });
    },
    generatePackage: function (id) {
      api("/api/events/" + id + "/package", { method: "POST" })
        .then(function (res) {
          var msg = "Pacote gerado: " + res.filename;
          if (res.organizer) msg += "\n\nSenha offline do organizador: " + res.organizer.offlinePassword;
          window.alert(msg);
        })
        .catch(function (e) { toast(e.message); });
    },
    openPackageConfig: function (id) {
      api("/api/events/" + id + "/package-config").then(function (cfg) {
        cfg = cfg || {};
        cfg.organizers = cfg.organizers || [];
        openModal(
          '<div class="modal-card">' +
            '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-indigo">' + icon("users", 18) + '</div><h2 class="text-lg font-bold">Organizador do pacote</h2></div>' +
            '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
            '<p class="text-sm text-slate-500 mb-3">O pacote .rksits carrega este organizador com acesso offline (senha numérica de 6 dígitos gerada na exportação).</p>' +
              '<select id="pkg-org" class="select">' +
                '<option value="">Nenhum (desvinculado)</option>' +
                cfg.organizers.map(function (o) { return '<option value="' + esc(o.id) + '" ' + (cfg.organizer_id === o.id ? "selected" : "") + ">" + esc(o.name) + "</option>"; }).join("") +
            "</select>" +
            '<div class="flex justify-end gap-2 mt-5">' +
              '<button type="button" class="btn btn-outline" onclick="RS.closeModal()">Cancelar</button>' +
              '<button type="button" class="btn btn-primary" onclick="RS.savePackageConfig(' + jsStr(id) + ')">Salvar</button>' +
            "</div></div>"
        );
      });
    },
    savePackageConfig: function (id) {
      var org = document.getElementById("pkg-org").value;
      api("/api/events/" + id + "/package-config", { method: "POST", json: { organizer_id: org } })
        .then(function () { RS.closeModal(); toast("Organizador do pacote atualizado."); })
        .catch(function (e) { toast(e.message); });
    },
    deleteEvent: function (id) {
      var ev = S.events.find(function (e) { return e.id === id; });
      if (!window.confirm("Excluir o evento \"" + (ev ? ev.name : "") + "\"? Os dados de entrega serão removidos (sem alterar o pacote .rksits em packages/).")) return;
      api("/api/events/" + id + "/delete", { method: "DELETE" })
        .then(function () {
          toast("Evento excluído.");
          if (S.selectedEventId === id) S.selectedEventId = null;
          loadEvents().then(function () { renderEvents(); });
        })
        .catch(function (e) { toast(e.message); });
    },

    /* ---------- configurações ---------- */
    settingsTab: function (k) { S.settingsTab = k; renderSettings(); },
    openCreateUser: function () {
      var tab = S.settingsTab || "operadores";
      var role = tab === "organizadores" ? "ORGANIZADOR" : tab === "admins" ? "ADMIN" : "OPERADOR";
      openModal(
        '<div class="modal-card">' +
          '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-blue">' + icon("plus", 18) + '</div><h2 class="text-lg font-bold">Novo usuário (' + role.toLowerCase() + ")</h2></div>" +
          '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
          '<div class="grid gap-3">' +
            '<div><label class="text-xs font-semibold text-slate-500">Nome</label><input id="u-name" class="input mt-1" placeholder="Nome completo" /></div>' +
            '<div class="grid grid-cols-2 gap-3">' +
              '<div><label class="text-xs font-semibold text-slate-500">E-mail</label><input id="u-email" class="input mt-1" placeholder="email@exemplo.com" /></div>' +
              '<div><label class="text-xs font-semibold text-slate-500">CPF</label><input id="u-cpf" class="input mt-1" placeholder="000.000.000-00" /></div>' +
            "</div>" +
            (role === "ORGANIZADOR" ? '<div class="grid grid-cols-2 gap-3"><div><label class="text-xs font-semibold text-slate-500">CNPJ</label><input id="u-cnpj" class="input mt-1" placeholder="00.000.000/0000-00" /></div>' +
              '<div><label class="text-xs font-semibold text-slate-500">Telefone</label><input id="u-phone" class="input mt-1" placeholder="(00) 00000-0000" /></div></div>' : "") +
            '<div><label class="text-xs font-semibold text-slate-500">Senha</label><input id="u-pass" type="password" class="input mt-1" placeholder="Senha inicial" /></div>' +
          "</div>" +
          '<div class="flex justify-end gap-2 mt-5">' +
            '<button type="button" class="btn btn-outline" onclick="RS.closeModal()">Cancelar</button>' +
            '<button type="button" class="btn btn-primary" onclick="RS.saveNewUser(' + jsStr(role) + ')">' + icon("check", 16) + " Criar</button>" +
          "</div></div>"
      );
    },
    saveNewUser: function (role) {
      var body = {
        name: document.getElementById("u-name").value.trim(),
        email: document.getElementById("u-email").value.trim(),
        cpf: document.getElementById("u-cpf").value.trim(),
        password: document.getElementById("u-pass").value,
      };
      if (role === "ORGANIZADOR") { body.cnpj = document.getElementById("u-cnpj").value.trim(); body.phone = document.getElementById("u-phone").value.trim(); }
      if (!body.name || !body.password) { toast("Nome e senha são obrigatórios."); return; }
      var url = role === "ORGANIZADOR" ? "/api/organizers" : "/api/operators";
      api(url, { method: "POST", json: body })
        .then(function () {
          RS.closeModal();
          toast("Usuário criado.");
          renderSettings();
        })
        .catch(function (e) { toast(e.message); });
    },
    openEditUser: function (id) {
      api("/api/users").then(function (users) {
        var u = users.find(function (x) { return x.id === id; });
        if (!u) return;
        openModal(
          '<div class="modal-card">' +
            '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="ic ic-blue">' + icon("pencil", 18) + '</div><h2 class="text-lg font-bold">Editar usuário</h2></div>' +
            '<button type="button" class="btn-ghost" onclick="RS.closeModal()">' + icon("x", 16) + "</button></div>" +
            '<div class="grid gap-3">' +
              '<div><label class="text-xs font-semibold text-slate-500">Nome</label><input id="u-name" class="input mt-1" value="' + esc(u.name) + '" /></div>' +
              '<div class="grid grid-cols-2 gap-3"><div><label class="text-xs font-semibold text-slate-500">E-mail</label><input id="u-email" class="input mt-1" value="' + esc(u.email) + '" /></div>' +
              '<div><label class="text-xs font-semibold text-slate-500">CPF</label><input id="u-cpf" class="input mt-1" value="' + esc(u.cpf) + '" /></div></div>' +
              '<div><label class="text-xs font-semibold text-slate-500">Nova senha (opcional)</label><input id="u-pass" type="password" class="input mt-1" placeholder="Deixe vazio para manter" /></div>' +
            "</div>" +
            '<div class="flex justify-end gap-2 mt-5">' +
              '<button type="button" class="btn btn-outline" onclick="RS.closeModal()">Cancelar</button>' +
              '<button type="button" class="btn btn-primary" onclick="RS.saveEditUser(' + jsStr(id) + ')">' + icon("check", 16) + " Salvar</button>" +
            "</div></div>"
        );
      });
    },
    saveEditUser: function (id) {
      var body = {
        name: document.getElementById("u-name").value.trim(),
        email: document.getElementById("u-email").value.trim(),
        cpf: document.getElementById("u-cpf").value.trim(),
      };
      var pass = document.getElementById("u-pass").value;
      if (pass) body.password = pass;
      api("/api/users/" + id, { method: "PATCH", json: body })
        .then(function () { RS.closeModal(); toast("Usuário atualizado."); renderSettings(); })
        .catch(function (e) { toast(e.message); });
    },
    deleteUser: function (id) {
      if (!window.confirm("Excluir este usuário?")) return;
      api("/api/users/" + id, { method: "DELETE" })
        .then(function () { toast("Usuário excluído."); renderSettings(); })
        .catch(function (e) { toast(e.message); });
    },
    listPackages: function () {
      api("/api/packages").then(function (res) {
        var box = document.getElementById("packages-box");
        if (!box) return;
        box.innerHTML = (res.packages || []).map(function (p) {
          return '<div class="flex items-center gap-2 mt-2"><span class="badge ' + (p.installed ? "badge-emerald" : "badge-amber") + '">' + (p.installed ? "instalado" : "novo") + "</span>" +
            '<span class="text-sm font-mono">' + esc(p.filename) + "</span>" +
            (p.installed ? "" : '<button type="button" class="btn btn-outline btn-sm" onclick="RS.installPackage(\'' + esc(p.filename) + '\')">' + icon("download", 14) + " Instalar" + "</button>") +
            "</div>";
        }).join("") || '<p class="text-sm text-slate-400 mt-2">Nenhum pacote na pasta packages/.</p>';
      });
    },
    installPackage: function (filename) {
      api("/api/packages/install", { method: "POST", json: { filename: filename } })
        .then(function (res) {
          toast("Pacote instalado: " + res.event);
          S.selectedEventId = res.event_id;
          invalidateAthletes(res.event_id);
          loadEvents().then(function () { RS.route(); });
        })
        .catch(function (e) { toast(e.message); });
    },

    /* ---------- router ---------- */
    route: function () {
      var u = S.user;
      var route = currentRoute();
      if (!u) { renderLogin(); return; }
      if (route === "/login") { RS.go("#/dashboard"); return; }

      loadEvents().then(function () {
        var r = currentRoute();
        if (r === "/dashboard") return renderDashboard();
        if (r === "/delivery") return renderDelivery();
        if (r === "/import") {
          if (u.role !== "ADMIN") { RS.go("#/dashboard"); return; }
          return renderImport();
        }
        if (r === "/reports") return renderReports();
        if (r === "/filters") return renderFilters();
        if (r === "/events") {
          if (u.role !== "ADMIN") { RS.go("#/dashboard"); return; }
          return renderEvents();
        }
        if (r === "/settings") {
          if (u.role === "OPERADOR") { RS.go("#/dashboard"); return; }
          return renderSettings();
        }
        renderDashboard();
      });
    },

    init: function () {
      try { var raw = localStorage.getItem(LS_USER); if (raw) S.user = JSON.parse(raw); } catch (e) {}
      window.addEventListener("hashchange", RS.route);
      if (!S.user) {
        if (!currentRoute().startsWith("/login")) history.replaceState(null, "", "#/login");
      }
      RS.route();
    },
  };

  function applyAthleteResponse(ath) {
    if (!ath || typeof ath === "string") return;
    var st = deliveryState();
    var idx = st.athletes.findIndex(function (x) { return x.id === ath.id; });
    if (idx >= 0) st.athletes[idx] = toAthlete(ath);
    else st.athletes.push(toAthlete(ath));
    var cached = S.athletesByEvent[S.selectedEventId];
    if (cached) {
      var cdx = cached.findIndex(function (x) { return x.id === ath.id; });
      if (cdx >= 0) cached[cdx] = ath;
    }
    updateDeliveryTable();
  }
  function invalidateAthletes(id) {
    S.athletesByEvent[id] = null;
  }
  function chooseModelCols() {
    return new Promise(function (resolve) {
      var keys = Array.prototype.map.call(document.querySelectorAll("#model-cols input:checked"), function (c) { return c.value; });
      loadAthletes(S.selectedEventId).then(function (rows) {
        var recs = rows.map(function (r) { var rec = reportRecord(r); rec.changed = changedColsFor(r); return rec; });
        var csvRows = recs.map(function (r) {
          var out = {};
          keys.forEach(function (k) { out[k] = r.changed.has(keyFromHeader(k)) ? r[keyFromHeader(k)] : ""; });
          return out;
        });
        exportCSV("modelo-atualizacao.csv", keys, csvRows);
        toast("Modelo baixado — preencha somente as células amarelas.");
        resolve(keys);
      });
    });
  }
  function RS_icon(name, size) { return icon(name, size); }

  window.RS = RS;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { RS.init(); });
  } else {
    RS.init();
  }
})();