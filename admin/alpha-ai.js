(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const db = window.supabase?.createClient(window.ALPHA_SUPABASE_URL, window.ALPHA_SUPABASE_ANON_KEY);
  if (!db) return;
  let historyBusy = false;

  function profile(form) {
    const values = name => Array.from(form.elements[name] || []).filter(x => x.checked).map(x => x.value);
    return {
      areas: values("area"),
      industries: values("industry"),
      autonomy: form.elements.autonomy?.value || "high",
      reports: form.elements.reports?.value || "both",
      updatedAt: new Date().toISOString()
    };
  }
  function inject() {
    const form = $("#alphaAiConfigForm");
    if (!form || $("#alphaAiRunBtn")) return;
    const actions = $(".form-actions", form);
    if (!actions) return;
    const run = document.createElement("button");
    run.type = "button";
    run.id = "alphaAiRunBtn";
    run.className = "action-btn gold-btn";
    run.textContent = "RUN LEAD DISCOVERY";
    actions.append(run);
    const status = document.createElement("p");
    status.id = "alphaAiRunStatus";
    status.className = "note";
    status.textContent = "Free discovery source: OpenStreetMap public business listings.";
    form.append(status);
    const grid = $(".agent-grid");
    if (grid && !$("#alphaAiHistory")) {
      const panel = document.createElement("section");
      panel.className = "panel agent-history-panel";
      panel.id = "alphaAiHistory";
      panel.innerHTML = '<div class="panel-head"><div><h3>Agent activity & outreach drafts</h3><p>Saved server-side in your ALPHA CREATIVE CRM</p></div><button type="button" class="action-btn" id="alphaAiRefresh">REFRESH</button></div><div class="agent-history-columns"><div><b>Recent discovery runs</b><div id="alphaAiRuns" class="record-list"><p class="note">Loading activity…</p></div></div><div><b>Personalised drafts</b><div id="alphaAiDrafts" class="agent-drafts"><p class="note">Loading drafts…</p></div></div></div>';
      grid.insertAdjacentElement("afterend", panel);
      $("#alphaAiRefresh").addEventListener("click", loadHistory);
    }
    loadHistory();
  }
  async function loadHistory() {
    if (historyBusy || !$("#alphaAiHistory")) return;
    historyBusy = true;
    try {
      const [runs, drafts] = await Promise.all([
        db.from("alpha_agent_runs").select("id,status,summary,inserted_count,started_at").order("started_at", {ascending:false}).limit(5),
        db.from("alpha_agent_drafts").select("id,subject,message,status,created_at,agency_leads(business_name)").order("created_at", {ascending:false}).limit(5)
      ]);
      if (runs.error) throw runs.error;
      if (drafts.error) throw drafts.error;
      $("#alphaAiRuns").innerHTML = runs.data.length ? runs.data.map(r => '<div class="record"><div><strong>'+esc(r.status.toUpperCase())+'</strong><p>'+esc(r.summary || "Lead discovery run")+'</p><small>'+new Date(r.started_at).toLocaleString("en-IN")+'</small></div><span>'+Number(r.inserted_count||0)+' saved</span></div>').join("") : '<p class="note">No runs yet. Start your first scan.</p>';
      $("#alphaAiDrafts").innerHTML = drafts.data.length ? drafts.data.map(d => '<article class="agent-draft"><b>'+esc(d.subject||"Outreach draft")+'</b><small>'+esc(d.agency_leads?.business_name||"Prospect")+' · '+esc(d.status)+'</small><p>'+esc(d.message)+'</p></article>').join("") : '<p class="note">Drafts will appear after discovery.</p>';
    } catch (e) {
      if ($("#alphaAiRuns")) $("#alphaAiRuns").innerHTML = '<p class="note">'+esc(e.message||e)+'</p>';
    } finally { historyBusy = false; }
  }
  document.addEventListener("submit", e => {
    if (e.target?.id !== "alphaAiConfigForm") return;
    e.preventDefault();
    const cfg = profile(e.target);
    localStorage.setItem("alphaAiAgentConfig", JSON.stringify({
      industries: cfg.industries, areas: cfg.areas, autonomy: cfg.autonomy, reports: cfg.reports, updatedAt: cfg.updatedAt
    }));
    const saveStatus = $("#alphaAiSaveStatus");
    if (saveStatus) saveStatus.textContent = "Saved on this device at " + new Date().toLocaleString("en-IN") + ".";
    const status = $("#alphaAiRunStatus");
    if (status) status.textContent = "Agent profile saved. Discovery is ready.";
  }, true);
  document.addEventListener("click", async e => {
    if (e.target?.id === "alphaAiRunBtn") {
      const form = $("#alphaAiConfigForm");
      if (!form) return;
      const cfg = profile(form);
      if (!cfg.areas.length || !cfg.industries.length) {
        $("#alphaAiRunStatus").textContent = "Select at least one area and one industry.";
        return;
      }
      localStorage.setItem("alphaAiAgentConfig", JSON.stringify({
        industries: cfg.industries, areas: cfg.areas, autonomy: cfg.autonomy, reports: cfg.reports, updatedAt: cfg.updatedAt
      }));
      const button = e.target;
      button.disabled = true;
      button.textContent = "SEARCHING PUBLIC LISTINGS…";
      $("#alphaAiRunStatus").textContent = "Searching OpenStreetMap and checking for existing CRM records. This can take a minute.";
      try {
        const {data, error} = await db.functions.invoke("alpha-lead-discovery", {body:{areas:cfg.areas, industries:cfg.industries}});
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Discovery did not complete.");
        $("#alphaAiRunStatus").textContent = data.summary;
        await loadHistory();
        const nav = $('[data-view="alpha-ai"]');
        if (nav) nav.click();
      } catch (err) {
        $("#alphaAiRunStatus").textContent = "Discovery failed: " + (err.message || String(err));
      } finally {
        button.disabled = false;
        button.textContent = "RUN LEAD DISCOVERY";
      }
    }
  });
  const observer = new MutationObserver(inject);
  const start = () => {
    const root = $("#viewRoot");
    if (root) { observer.observe(root, {childList:true,subtree:true}); inject(); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();
})();