(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const db = window.ALPHA_SUPABASE_CLIENT || window.supabase?.createClient(window.ALPHA_SUPABASE_URL, window.ALPHA_SUPABASE_ANON_KEY);
  if (db) window.ALPHA_SUPABASE_CLIENT = db;
  if (!db) return;
  let historyBusy = false;
  let historyLoaded = false;

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
    if (!form) return;
    const actions = $(".form-actions", form);
    if (actions && !$("#alphaAiRunBtn")) {
      const run = document.createElement("button");
      run.type = "button";
      run.id = "alphaAiRunBtn";
      run.className = "action-btn gold-btn";
      run.textContent = "RUN LEAD DISCOVERY";
      actions.append(run);
    }
    if (!$("#alphaAiRunStatus")) {
      const status = document.createElement("p");
      status.id = "alphaAiRunStatus";
      status.className = "note";
      status.textContent = "Free discovery source: OpenStreetMap public business listings.";
      form.append(status);
    }
    const notice = $(".agent-notice"); if (notice) { const heading = $("b", notice); const copy = $("p", notice); const headingText = "Public lead discovery connected · outreach is draft-only"; const copyText = "ALPHA AI now searches OpenStreetMap public business listings, applies transparent heuristic scores, deduplicates records and saves prospects plus draft messages. Public map data may be incomplete; verify details before contact. No messages are sent automatically."; if (heading && heading.textContent !== headingText) heading.textContent = headingText; if (copy && copy.textContent !== copyText) copy.textContent = copyText; }
    const grid = $(".agent-grid");
    if (grid && !$("#alphaAiHistory")) {
      const panel = document.createElement("section");
      panel.className = "panel agent-history-panel";
      panel.id = "alphaAiHistory";
      panel.innerHTML = '<div class="panel-head"><div><h3>Agent activity & outreach drafts</h3><p>Saved server-side in your ALPHA CREATIVE CRM</p></div><button type="button" class="action-btn" id="alphaAiRefresh">REFRESH</button></div><div class="agent-history-columns"><div><b>Recent discovery runs</b><div id="alphaAiRuns" class="record-list"><p class="note">Loading activity…</p></div></div><div><b>Personalised drafts</b><div id="alphaAiDrafts" class="agent-drafts"><p class="note">Loading drafts…</p></div></div></div>';
      grid.insertAdjacentElement("afterend", panel);
      $("#alphaAiRefresh").addEventListener("click", () => loadHistory(true));
    }
    loadHistory();
  }
  async function loadHistory(force = false) {
    if (historyBusy || !$("#alphaAiHistory") || (historyLoaded && !force)) return;
    historyBusy = true;
    const runsNode = $("#alphaAiRuns"), draftsNode = $("#alphaAiDrafts");
    if (runsNode) runsNode.innerHTML = '<p class="note">Loading activity…</p>';
    if (draftsNode) draftsNode.innerHTML = '<p class="note">Loading drafts…</p>';
    const timed = (promise, label) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(label + " timed out. Check connection/Supabase access and press REFRESH.")), 12000))]);
    try {
      const [rr, dr] = await Promise.allSettled([
        timed(db.from("alpha_agent_runs").select("id,status,summary,inserted_count,started_at").order("started_at", {ascending:false}).limit(5), "Discovery history"),
        timed(db.from("alpha_agent_drafts").select("id,lead_id,subject,message,status,created_at").order("created_at", {ascending:false}).limit(5), "Outreach drafts")
      ]);
      if (rr.status === "fulfilled" && !rr.value.error) {
        const data = rr.value.data || [];
        if (runsNode) runsNode.innerHTML = data.length ? data.map(r => '<div class="record"><div><strong>'+esc(String(r.status || "unknown").toUpperCase())+'</strong><p>'+esc(r.summary || "Lead discovery run")+'</p><small>'+(r.started_at ? new Date(r.started_at).toLocaleString("en-IN") : "")+'</small></div><span>'+Number(r.inserted_count||0)+' saved</span></div>').join("") : '<p class="note">No runs yet. Start your first scan.</p>';
      } else if (runsNode) {
        const err = rr.status === "rejected" ? rr.reason : rr.value.error;
        runsNode.innerHTML = '<p class="note">Could not load discovery history: '+esc(err?.message || err || "Unknown error")+'</p>';
      }
      if (dr.status === "fulfilled" && !dr.value.error) {
        const data = dr.value.data || [];
        if (draftsNode) draftsNode.innerHTML = data.length ? data.map(d => '<article class="agent-draft"><b>'+esc(d.subject||"Outreach draft")+'</b><small>Prospect · '+esc(d.status||"draft")+'</small><p>'+esc(d.message)+'</p></article>').join("") : '<p class="note">Drafts will appear after discovery.</p>';
      } else if (draftsNode) {
        const err = dr.status === "rejected" ? dr.reason : dr.value.error;
        draftsNode.innerHTML = '<p class="note">Could not load drafts: '+esc(err?.message || err || "Unknown error")+'</p>';
      }
      historyLoaded = rr.status === "fulfilled" || dr.status === "fulfilled";
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
        await loadHistory(true);
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