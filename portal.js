(() => {
  const isAdmin = document.body.dataset.portal === "admin";
  const $ = (id) => document.getElementById(id);
  const status = (message, bad=false) => { $("status").textContent=message; $("status").className=bad?"error":"status"; };
  const configured = window.ALPHA_SUPABASE_URL?.startsWith("https://") && !window.ALPHA_SUPABASE_URL.includes("YOUR_") && window.ALPHA_SUPABASE_ANON_KEY && !window.ALPHA_SUPABASE_ANON_KEY.includes("YOUR_");
  if (!configured) { status("Portal is published, but secure login is waiting for the agency Supabase URL and publishable/anon key. Follow SETUP.md in the repository.", true); $("loginBtn").disabled=true; return; }
  const client = window.supabase.createClient(window.ALPHA_SUPABASE_URL, window.ALPHA_SUPABASE_ANON_KEY);
  const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  async function showApp(user) {
    const {data:profile,error}=await client.from("profiles").select("full_name,role,client_id").eq("id",user.id).single();
    if(error || !profile || (isAdmin ? profile.role!=="admin" : profile.role!=="client")) {
      await client.auth.signOut(); status("This account is not authorised for this portal. Ask an agency admin to configure your access.",true); return;
    }
    $("loginPanel").hidden=true; $("appPanel").hidden=false;
    $("welcome").textContent="Welcome, "+(profile.full_name||user.email);
    $("role").textContent=profile.role.toUpperCase();
    if(isAdmin) await loadAdmin(); else await loadClient(profile.client_id);
  }
  async function loadAdmin(){
    const targets=[["clients","Clients"],["projects","Projects"],["portfolio_items","Portfolio items"],["reviews","Reviews"]];
    let html="";
    for(const [table,label] of targets){
      const {data,error}=await client.from(table).select("*").order("created_at",{ascending:false}).limit(30);
      html+=`<section class="panel"><h2>${label}</h2>${error?"<p>Unable to load "+label.toLowerCase()+". Check the setup guide and database policies.</p>":data.length?data.map(row=>"<article><strong>"+esc(row.name||row.title||row.status||row.id)+"</strong><small>"+esc(row.email||row.description||row.status||"")+"</small></article>").join(""):"<p>No records yet.</p>"}</section>`;
    }
    $("dataArea").innerHTML=html;
  }
  async function loadClient(clientId){
    if(!clientId){$("dataArea").innerHTML="<p>Your account is not linked to a client workspace yet. Contact an admin.</p>";return;}
    const {data:projects,error}=await client.from("projects").select("id,name,status,description,updated_at").eq("client_id",clientId).order("updated_at",{ascending:false});
    const {data:docs}=await client.from("documents").select("id,title,storage_path,created_at").eq("client_id",clientId).order("created_at",{ascending:false});
    $("dataArea").innerHTML="<section class='panel'><h2>Your projects</h2>"+(error?"<p>Unable to load projects.</p>":projects?.length?projects.map(p=>"<article><strong>"+esc(p.name)+"</strong><small>"+esc(p.status)+" · "+esc(p.description||"")+"</small></article>").join(""):"<p>No projects have been added yet.</p>")+"</section><section class='panel'><h2>Your documents</h2>"+(docs?.length?docs.map(d=>"<article><strong>"+esc(d.title)+"</strong><small>Shared by Alpha Creative</small></article>").join(""):"<p>No documents shared yet.</p>")+"</section>";
  }
  $("loginForm").addEventListener("submit",async e=>{e.preventDefault();$("loginBtn").disabled=true;status("Signing in…");const {data,error}=await client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});$("loginBtn").disabled=false;if(error){status(error.message,true);return;}await showApp(data.user);});
  $("logoutBtn").addEventListener("click",async()=>{await client.auth.signOut();location.reload();});
  client.auth.getSession().then(({data})=>{if(data.session)showApp(data.session.user);});
})();