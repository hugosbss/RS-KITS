(function () {
  "use strict";

  var SCREEN = document.getElementById("screen");
  var CHANNEL_NAME = "rs-kits-second-screen";
  var STORAGE_KEY = "rs-kits:second-screen";
  var AUTOMATIC_MS = 90000;

  function readPayload() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function Detail(label, value, cls) {
    var d = document.createElement("div");
    var l = document.createElement("p");
    l.className = cls ? "lbl " + cls : "lbl";
    l.textContent = label;
    var v = document.createElement("p");
    if (cls === "ss-details") v.className = "val";
    else if (cls === "ss-health") v.className = "val";
    else v.className = "val";
    v.textContent = value || "-";
    d.appendChild(l);
    d.appendChild(v);
    return d;
  }

  function renderLoading() {
    SCREEN.innerHTML = "";
    var brand = document.createElement("div");
    brand.innerHTML = '<p class="ss-brand">RS - KITS</p>';
    SCREEN.appendChild(brand);

    var center = document.createElement("div");
    center.className = "flex-1 flex flex-col items-center justify-center text-center";
    center.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; text-align:center;";

    var box = document.createElement("div");
    box.style.cssText = "width:96px;height:96px;margin-top:2.5rem;position:relative;";
    box.innerHTML =
      '<div style="position:absolute;inset:0;border-radius:9999px;border:4px solid rgba(148,163,184,.15);"></div>' +
      '<div class="pulse" style="position:absolute;inset:0;border-radius:9999px;border:4px solid #93c5fd;border-top-color:transparent;transform:rotate(45deg);"></div>' +
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#93c5fd;font-weight:900;font-size:14px;">RS</div>';
    center.appendChild(box);

    var msg = document.createElement("p");
    msg.className = "mt-10 text-lg font-bold text-slate-100";
    msg.textContent = "Aguardando atleta";
    center.appendChild(msg);

    var sub = document.createElement("p");
    sub.className = "mt-2 text-sm text-slate-400";
    sub.textContent = "O próximo atleta será exibido aqui após a seleção no painel de atendimento.";
    center.appendChild(sub);

    SCREEN.appendChild(center);

    var eventInfo = document.createElement("div");
    eventInfo.className = "mt-auto pt-6 text-center";
    eventInfo.style.cssText = "margin-top:auto;padding-top:1.5rem;text-align:center;border-top:1px solid var(--slate-800);width:100%;";
    eventInfo.innerHTML = "";
    eventInfo.id = "ss-event";
    SCREEN.appendChild(eventInfo);
  }

  function renderAthlete(a) {
    SCREEN.innerHTML = "";
    var open = document.createElement("div");
    open.className = "mt-6";
    var grid = document.createElement("div");
    grid.className = "ss-grid";
    grid.style.cssText = "margin-top:1.5rem;";

    var numPanel = document.createElement("div");
    numPanel.className = "ss-num-panel";
    numPanel.innerHTML = '<p class="label">Número do atleta</p><p class="num">' + esc(a.num) + "</p>";
    grid.appendChild(numPanel);

    var namePanel = document.createElement("div");
    namePanel.className = "ss-name-panel";
    namePanel.innerHTML =
      '<p class="label">Nome completo</p>' +
      "<h2>" + esc(a.nome) + "</h2>" +
      '<p class="nasc">Nascimento: ' + esc(a.nascimento) + "</p>";
    grid.appendChild(namePanel);

    open.appendChild(grid);

    var details = document.createElement("div");
    details.className = "ss-details";
    details.appendChild(Detail("Modalidade", a.distancia));
    details.appendChild(Detail("Equipe", a.equipe));
    details.appendChild(Detail("Categoria / Faixa etária", (a.categoriaEspecial && a.categoriaEspecial !== "Não" ? a.categoriaEspecial : "Geral") + " · " + (a.faixaEtaria || "-")));
    details.appendChild(Detail("Kit", a.kit));
    details.appendChild(Detail("Camiseta", a.camiseta));
    open.appendChild(details);

    var health = document.createElement("div");
    health.className = "ss-health";
    if (a.alerta) {
      var alert = document.createElement("div");
      alert.style.cssText = "border:1px solid var(--amber-200);background:var(--amber-50);color:var(--amber-900);border-radius:1rem;padding:.75rem 1rem;font-size:12px;font-weight:600;margin-bottom:1rem;";
      alert.textContent = "Alerta: " + a.alerta;
      health.appendChild(alert);
    }
    health.innerHTML +=
      '<div class="hdr"><div class="ic">♥</div><h3>Saúde e emergência</h3></div>';
    var hgrid = document.createElement("div");
    hgrid.className = "ss-health-grid";
    hgrid.appendChild(Detail("Convênio médico", a.convenioMedico || "Não informado", "ss-health"));
    hgrid.appendChild(Detail("Tipo sanguíneo", a.tipoSanguineo || "Não informado", "ss-health"));
    hgrid.appendChild(Detail("Contato de emergência", a.contatoEmergencia || "-", "ss-health"));
    hgrid.appendChild(Detail("Relação com o atleta", a.relacaoAtleta || "-", "ss-health"));
    hgrid.appendChild(Detail("Telefone de emergência", a.telefoneEmergencia || "-", "ss-health"));
    health.appendChild(hgrid);
    open.appendChild(health);

    var footer = document.createElement("footer");
    footer.className = "flex items-center justify-between pt-6 text-sm text-slate-400";
    footer.style.cssText = "margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:1.5rem;font-size:14px;color:var(--slate-400);";
    footer.innerHTML = '<span>Confira seus dados com o operador.</span>';
    open.appendChild(footer);
    open.style.cssText = "flex:1;display:flex;flex-direction:column;";
    SCREEN.appendChild(open);
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function applyPayload(p) {
    if (!p || !p.athlete) { renderLoading(); return; }
    if (p.expiresAt && p.expiresAt <= Date.now()) { renderLoading(); return; }
    renderAthlete(p.athlete);
  }

  applyPayload(readPayload());

  if ("BroadcastChannel" in window) {
    var channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", function (e) { applyPayload(e.data); });
  }
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) applyPayload(readPayload());
  });
})();