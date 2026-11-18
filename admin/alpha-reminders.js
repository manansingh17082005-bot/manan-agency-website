(() => {
  const root = document.getElementById("viewRoot");
  if (!root) return;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let mounted = false, ownerId = null, loading = false;
  const styleId = "alpha-reminders-style";
  function addStyles() {
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style"); s.id = styleId;
    s.textContent = `
      .alpha-reminder-wrap{margin-top:22px;display:grid;gap:16px}
      .alpha-reminder-card{background:#111820;border:1px solid rgba(214,178,105,.25);border-radius:16px;padding:20px;color:#f4f0e8}
      .alpha-reminder-card h3{margin:0 0 6px;font-size:18px}.alpha-reminder-muted{color:#aab3bd;font-size:13px;line-height:1.6}
      .alpha-reminder-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}
      .alpha-reminder-card label{display:grid;gap:6px;color:#d6b269;font-size:11px;letter-spacing:.7px}
      .alpha-reminder-card input,.alpha-reminder-card select,.alpha-reminder-card textarea{width:100%;box-sizing:border-box;background:#0b1117;color:#f4f0e8;border:1px solid #35404b;border-radius:9px;padding:11px;font:inherit;letter-spacing:0}
      .alpha-reminder-card button{border:1px solid rgba(214,178,105,.4);border-radius:9px;padding:10px 14px;background:#d6b269;color:#16130d;font-weight:700;cursor:pointer}
      .alpha-reminder-card button.secondary{background:transparent;color:#e9d4a6}.alpha-reminder-card button:disabled{opacity:.5;cursor:not-allowed}
      .alpha-reminder-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}.alpha-task-row{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid #29333d;align-items:center}
      .alpha-task-row strong{display:block;font-size:14px}.alpha-task-row small{color:#9eabb7}.alpha-reminder-status{margin-top:10px;font-size:12px;color:#e9d4a6}
      .alpha-reminder-warning{border:1px solid rgba(214,178,105,.35);background:rgba(214,178,105,.07);padding:12px;border-radius:10px;margin-top:12px}
      @media(max-width:680px){.alpha-reminder-grid{grid-template-columns:1fr}.alpha-task-row{align-items:flex-start;flex-direction:column}}
    `;
    document.head.append(s);
  }
  function mount() {
    if (mounted || !document.getElementById("alphaAiConfigForm")) return;
    mounted = true; addStyles();
    const panel = document.createElement("section");
    panel.className = "alpha-reminder-wrap";
    panel.id = "alphaDailyReminderPanel";
    panel.innerHTML = `
      <section class="alpha-reminder-card">
        <h3>Daily AI phone reminder</h3>
        <p class="alpha-reminder-muted">Set your daily call preference and manage the tasks ALPHA AI should read out each morning.</p>
        <div class="alpha-reminder-warning"><b>Calls are not active yet.</b><div class="alpha-reminder-muted">Your preferences and tasks can be saved now. A calling provider, phone verification and your explicit approval of any charges are still required. No call will be placed by this setup.</div></div>
        <form id="alphaReminderSettingsForm">
          <div class="alpha-reminder-grid">
            <label>DAILY CALL TIME<input name="call_time" type="time" value="09:00" required></label>
            <label>LANGUAGE<select name="language"><option>English</option><option>Hindi</option><option>Hinglish</option></select></label>
            <label>PHONE NUMBER FOR VERIFICATION<input name="phone_number" type="tel" autocomplete="tel" placeholder="Enter the number to verify" required></label>
            <label>TIME ZONE<input value="Asia/Kolkata (India)" disabled></label>
          </div>
          <div class="alpha-reminder-actions"><button type="submit">Save reminder preferences</button></div>
          <div id="alphaReminderSettingsStatus" class="alpha-reminder-status" aria-live="polite">Not saved yet.</div>
        </form>
      </section>
      <section class="alpha-reminder-card">
        <h3>My task list</h3><p class="alpha-reminder-muted">Add deadlines and priorities. ALPHA AI will use pending tasks for the morning briefing once phone calls are activated.</p>
        <form id="alphaTaskForm">
          <div class="alpha-reminder-grid">
            <label>TASK<input name="title" maxlength="240" placeholder="e.g. Contact 5 new prospects" required></label>
            <label>DEADLINE<input name="due_at" type="datetime-local"></label>
            <label>PRIORITY<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option></select></label>
            <label>NOTES<input name="description" placeholder="Optional details"></label>
          </div>
          <div class="alpha-reminder-actions"><button type="submit">Add task</button><button type="button" class="secondary" id="alphaTaskRefresh">Refresh tasks</button></div>
          <div id="alphaTaskStatus" class="alpha-reminder-status" aria-live="polite"></div>
        </form>
        <div id="alphaTaskList" style="margin-top:14px"><p class="alpha-reminder-muted">Loading tasks…</p></div>
      </section>
      <section class="alpha-reminder-card">
        <h3>Phone call status</h3><p class="alpha-reminder-muted" id="alphaCallStatus">Provider not connected · phone verification pending · calls disabled.</p>
        <div id="alphaCallHistory" class="alpha-reminder-muted">No call history yet.</div>
      </section>`;
    const anchor = document.getElementById("alphaAiHistory") || document.getElementById("alphaAiConfigForm");
    anchor.insertAdjacentElement("afterend", panel);
    initialise().catch(showError);
    panel.addEventListener("submit", async e => {
      if (e.target.id === "alphaReminderSettingsForm") { e.preventDefault(); await saveSettings(e.target); }
      if (e.target.id === "alphaTaskForm") { e.preventDefault(); await addTask(e.target); }
    });
    panel.addEventListener("click", async e => {
      const done = e.target.closest("[data-task-done]");
      if (done) await completeTask(done.dataset.taskDone);
      if (e.target.id === "alphaTaskRefresh") await loadTasks();
    });
  }
  function client() { return window.ALPHA_SUPABASE_CLIENT || window.supabase?.createClient(window.ALPHA_SUPABASE_URL,window.ALPHA_SUPABASE_ANON_KEY); }
  async function initialise() {
    const db = client(); if (!db) throw new Error("Supabase connection is not available.");
    const {data,error}=await db.auth.getUser(); if(error) throw error;
    if(!data.user || data.user.app_metadata?.role!=="owner") throw new Error("Sign in with the ALPHA CREATIVE owner account to use reminders.");
    ownerId=data.user.id;
    const {data:settings,error:settingsError}=await db.from("alpha_reminder_settings").select("*").eq("owner_id",ownerId).maybeSingle();
    if(settingsError) throw settingsError;
    if(settings){
      const f=document.getElementById("alphaReminderSettingsForm");
      f.elements.call_time.value=String(settings.call_time||"09:00").slice(0,5);
      f.elements.language.value=settings.language||"English";
      f.elements.phone_number.value=settings.phone_number||"";
      document.getElementById("alphaReminderSettingsStatus").textContent=settings.phone_verified_at?"Preferences saved · phone verification recorded, provider setup still pending.":"Preferences loaded · phone verification pending.";
    }
    await loadTasks(); await loadCallHistory();
  }
  async function saveSettings(form) {
    const status=document.getElementById("alphaReminderSettingsStatus"); status.textContent="Saving…";
    const f=new FormData(form), phone=String(f.get("phone_number")||"").trim();
    if(!/^\+?[0-9 ()-]{8,20}$/.test(phone)){status.textContent="Enter a valid phone number, including country code.";return;}
    const db=client();
    const payload={owner_id:ownerId,call_time:f.get("call_time"),language:f.get("language"),phone_number:phone,timezone:"Asia/Kolkata",enabled:false,phone_verified_at:null,provider:null,updated_at:new Date().toISOString()};
    const {error}=await db.from("alpha_reminder_settings").upsert(payload,{onConflict:"owner_id"});
    if(error){status.textContent=error.message;return;}
    status.textContent="Saved. Phone verification and provider connection are still required; calls remain OFF.";
  }
  async function addTask(form) {
    const status=document.getElementById("alphaTaskStatus"); status.textContent="Saving task…";
    const f=new FormData(form), due=String(f.get("due_at")||"");
    const payload={owner_id:ownerId,title:String(f.get("title")||"").trim(),description:String(f.get("description")||"").trim()||null,priority:f.get("priority"),due_at:due?new Date(due).toISOString():null};
    const {error}=await client().from("alpha_tasks").insert(payload);
    if(error){status.textContent=error.message;return;}
    form.reset(); status.textContent="Task saved."; await loadTasks();
  }
  async function loadTasks() {
    const node=document.getElementById("alphaTaskList"); if(!node||!ownerId)return;
    node.innerHTML='<p class="alpha-reminder-muted">Loading tasks…</p>';
    const {data,error}=await client().from("alpha_tasks").select("id,title,due_at,priority,status,description").eq("owner_id",ownerId).in("status",["pending","in_progress"]).order("due_at",{ascending:true,nullsFirst:false}).limit(100);
    if(error){node.textContent=error.message;return;}
    if(!data?.length){node.innerHTML='<p class="alpha-reminder-muted">No pending tasks. Add your first task above.</p>';return;}
    node.innerHTML=data.map(t=>'<div class="alpha-task-row"><div><strong>'+esc(t.title)+'</strong><small>'+esc(t.priority.toUpperCase())+' · '+(t.due_at?esc(new Date(t.due_at).toLocaleString("en-IN")):"No deadline")+'</small></div><button type="button" class="secondary" data-task-done="'+esc(t.id)+'">Mark complete</button></div>').join("");
  }
  async function completeTask(id) {
    const {error}=await client().from("alpha_tasks").update({status:"completed",updated_at:new Date().toISOString()}).eq("id",id).eq("owner_id",ownerId);
    if(error){document.getElementById("alphaTaskStatus").textContent=error.message;return;}
    document.getElementById("alphaTaskStatus").textContent="Task marked complete."; await loadTasks();
  }
  async function loadCallHistory() {
    const node=document.getElementById("alphaCallHistory"); if(!node||!ownerId)return;
    const {data,error}=await client().from("alpha_call_logs").select("created_at,status,summary,error_text").eq("owner_id",ownerId).order("created_at",{ascending:false}).limit(5);
    if(error){node.textContent=error.message;return;}
    if(!data?.length){node.textContent="No call history yet.";return;}
    node.innerHTML=data.map(x=>'<div style="padding:8px 0;border-top:1px solid #29333d">'+esc(x.status)+' · '+esc(new Date(x.created_at).toLocaleString("en-IN"))+(x.summary?' — '+esc(x.summary):"")+'</div>').join("");
  }
  function showError(e) { const s=document.getElementById("alphaReminderSettingsStatus"); if(s)s.textContent=e?.message||String(e); }
  const observer=new MutationObserver(()=>{ if(!mounted) mount(); });
  observer.observe(root,{childList:true,subtree:true});
  mount();
})();