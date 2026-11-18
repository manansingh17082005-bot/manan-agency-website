(() => {
  "use strict";
  const root = document.getElementById("viewRoot");
  if (!root) return;
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm = v => String(v || "").toLowerCase();
  const services = [
    ["Best fit for this business","auto"],
    ["Website development","website"],
    ["Social media management","social"],
    ["Promotional video / reels","video"],
    ["Graphic design / creatives","design"],
    ["Excel / Google Sheets automation","sheets"],
    ["Complete digital presence","bundle"]
  ];
  const tones = [["Professional","professional"],["Friendly","friendly"],["Conversational","casual"],["Persuasive","persuasive"],["Short & direct","short"]];
  const stages = [["First contact","first"],["Follow-up","followup"],["They showed interest","interested"],["Asked for pricing","pricing"],["Meeting / call request","meeting"],["Re-engagement","reengage"]];
  const channels = [["WhatsApp","whatsapp"],["Instagram DM","instagram"],["Email","email"],["SMS","sms"]];
  const inferService = category => {
    const c = norm(category);
    if (/cafe|restaurant|food|bakery/.test(c)) return "video";
    if (/gym|fitness|yoga/.test(c)) return "social";
    if (/boutique|fashion|clothing|ethnic/.test(c)) return "design";
    if (/beauty|salon|makeup|cosmetic/.test(c)) return "social";
    return "website";
  };
  const offerText = key => ({
    website:"a clean, mobile-friendly website that showcases your services and makes it easier for customers to enquire",
    social:"consistent social media content and creative posts that help your business stay visible locally",
    video:"short promotional videos and reels designed to showcase your products and offers",
    design:"professional promotional creatives, offer posters and branded designs",
    sheets:"Excel and Google Sheets reports or workflow automation to reduce repetitive work",
    bundle:"a practical combination of website, social media and promotional creative services"
  }[key] || "digital services that fit your business");
  const makeCopy = (p, opts, variant) => {
    const biz = p.business || "your business", area = p.area || "your area";
    const service = opts.service === "auto" ? inferService(p.category) : opts.service;
    const offer = offerText(service);
    const name = p.contact || "";
    const greeting = name ? "Hi " + name + "," : "Hello!";
    const cta = {
      first:["Would you be open to seeing 2–3 ideas tailored to " + biz + "?","May I share a couple of ideas that could suit " + biz + "?","Would it be useful if I sent a few examples?"],
      followup:["Just following up on my earlier message. Would you like me to share a few relevant examples?","I wanted to check whether improving your online presence is something you're considering right now.","No rush—would you like me to send a short sample relevant to your business?"],
      interested:["Thanks for your interest. I can put together a few options based on your goals. What would you most like to improve first?","Great! To suggest the right approach, could you tell me your main goal and preferred timeline?","Happy to help. Would you prefer to start with a small sample or discuss the full requirement?"],
      pricing:["Pricing depends on the scope and deliverables. If you share what you need, I can prepare a clear quote with no hidden assumptions.","I can share an accurate estimate once I understand the pages/content/features and timeline. What do you have in mind?","Rather than guess a price, I'd like to understand the exact requirement and then send you a transparent quote."],
      meeting:["Would a quick 10–15 minute discussion work for you? I can understand your requirements and suggest a practical next step.","Would you be available for a short call this week to discuss what would work best for your business?","If convenient, we can arrange a brief discussion and I can walk you through a few ideas."],
      reengage:["Checking in once more in case this is relevant to your plans. Would you like me to close the loop for now or share a few ideas?","I didn't want to keep messaging if the timing isn't right. Is this something you'd like to revisit later?","Just checking whether you'd like to explore this now or at a later time."]
    }[opts.stage] || [];
    const ending = cta[variant % cta.length] || cta[0];
    let body;
    if (opts.stage === "first") {
      const intros = [
        "I came across " + biz + " in " + area + " and wanted to introduce ALPHA CREATIVE.",
        "I'm reaching out from ALPHA CREATIVE after finding " + biz + " in " + area + ".",
        "I noticed " + biz + " while looking at local businesses in " + area + " and thought this might be relevant."
      ];
      const value = [
        "We help businesses with " + offer + ".",
        "At ALPHA CREATIVE, we create " + offer + " for growing businesses.",
        "One area worth exploring for " + biz + " could be " + offer + "."
      ];
      body = intros[variant % 3] + " " + value[(variant + 1) % 3] + " " + ending;
    } else if (opts.stage === "followup" || opts.stage === "reengage") {
      body = "I'm following up from ALPHA CREATIVE about " + offer + " for " + biz + ". " + ending;
    } else if (opts.stage === "interested") {
      body = "Thanks for considering ALPHA CREATIVE for " + biz + ". We can help with " + offer + ". " + ending;
    } else if (opts.stage === "pricing") {
      body = "Thanks for asking about ALPHA CREATIVE's " + (service === "website" ? "website development" : service === "social" ? "social media management" : service === "video" ? "promotional video" : service === "design" ? "creative design" : "digital") + " service. " + ending;
    } else {
      body = "I'd be glad to discuss how ALPHA CREATIVE could support " + biz + " with " + offer + ". " + ending;
    }
    if (opts.tone === "professional") body = greeting + "\n\n" + body + "\n\nRegards,\nALPHA CREATIVE";
    else if (opts.tone === "friendly") body = greeting + "\n\nHope you're doing well! " + body + "\n\nThanks,\nALPHA CREATIVE";
    else if (opts.tone === "casual") body = greeting + " " + body + " — ALPHA CREATIVE";
    else if (opts.tone === "persuasive") body = greeting + "\n\n" + body + " We can keep the first step simple and focused on your priorities.\n\nALPHA CREATIVE";
    else body = greeting + " " + body + " — ALPHA CREATIVE";
    if (opts.channel === "email") return "Subject: " + (opts.stage === "first" ? "A few ideas for " + biz : "Following up — ALPHA CREATIVE") + "\n\n" + body;
    if (opts.channel === "sms") return body.replace(/\n+/g, " ").slice(0, 300);
    return body;
  };
  let modal;
  function ensureModal() {
    if (modal) return;
    modal = document.createElement("div");
    modal.id = "alpha-message-studio";
    modal.innerHTML = `
      <div class="ams-backdrop" data-ams-close></div>
      <section class="ams-dialog" role="dialog" aria-modal="true" aria-labelledby="ams-title">
        <header class="ams-head"><div><span>ALPHA CREATIVE · MESSAGE STUDIO</span><h2 id="ams-title">Create personalised outreach</h2><p id="ams-prospect"></p></div><button type="button" class="ams-close" data-ams-close aria-label="Close">×</button></header>
        <div class="ams-controls">
          <label>Service to pitch<select id="ams-service"></select></label>
          <label>Message tone<select id="ams-tone"></select></label>
          <label>Conversation stage<select id="ams-stage"></select></label>
          <label>Channel<select id="ams-channel"></select></label>
        </div>
        <div class="ams-toolbar"><b>Three message options</b><button type="button" id="ams-generate">GENERATE OPTIONS</button></div>
        <div id="ams-options"></div>
        <p class="ams-foot">Drafts are generated from editable templates using the prospect details shown. Review all claims and personalisation before contact. Nothing is sent automatically.</p>
        <div class="ams-actions"><button type="button" class="ams-secondary" id="ams-copy-all">Copy all options</button><button type="button" class="ams-primary" id="ams-open-wa">Open WhatsApp with selected draft ↗</button></div>
        <p id="ams-status" aria-live="polite"></p>
      </section>`;
    document.body.append(modal);
    const style = document.createElement("style");
    style.textContent = `
      #alpha-message-studio{display:none;position:fixed;inset:0;z-index:100000;font-family:inherit;color:#f5f1e8}
      #alpha-message-studio.open{display:block}.ams-backdrop{position:absolute;inset:0;background:#05080bd9;backdrop-filter:blur(7px)}
      .ams-dialog{position:relative;margin:3vh auto;width:min(900px,calc(100% - 24px));max-height:94vh;overflow:auto;background:#121a21;border:1px solid #806b45;border-radius:18px;padding:23px;box-shadow:0 25px 100px #000b}
      .ams-head{display:flex;justify-content:space-between;gap:15px}.ams-head span{font-size:10px;letter-spacing:2px;color:#d6b269}.ams-head h2{font-size:22px;margin:7px 0}.ams-head p{font-size:12px;color:#abb3bc;margin:0 0 16px}.ams-close{border:0;background:none;color:#fff;font-size:28px;cursor:pointer}
      .ams-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.ams-controls label{font-size:10px;color:#d6b269;display:grid;gap:7px}.ams-controls select{width:100%;min-width:0;background:#0b1117;color:#eee;border:1px solid #39434e;border-radius:8px;padding:10px;font-size:12px}
      .ams-toolbar{display:flex;justify-content:space-between;align-items:center;margin:20px 0 10px;font-size:12px}.ams-toolbar button,.ams-primary{background:#d6b269;color:#17130b;border:1px solid #d6b269;border-radius:8px;padding:10px 13px;font-weight:800;font-size:10px;cursor:pointer}
      .ams-option{border:1px solid #34404a;background:#0d141b;border-radius:10px;margin:9px 0;padding:12px}.ams-option.selected{border-color:#d6b269}.ams-option-head{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:11px;color:#d6b269;margin-bottom:8px}.ams-option-head label{display:flex;align-items:center;gap:7px}.ams-option textarea{width:100%;box-sizing:border-box;min-height:105px;resize:vertical;background:#111b24;color:#f3f1eb;border:1px solid #3b4650;border-radius:8px;padding:11px;font:13px/1.55 inherit}.ams-option-actions{display:flex;justify-content:flex-end;margin-top:7px}.ams-option-actions button,.ams-secondary{background:#202b35;color:#eee;border:1px solid #4b5964;border-radius:7px;padding:8px 11px;font-size:10px;cursor:pointer}
      .ams-foot{font-size:11px;color:#aab3bc;line-height:1.55}.ams-actions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap}.ams-actions button{cursor:pointer;border-radius:8px;padding:11px 14px;font-size:10px;font-weight:800}.ams-actions .ams-primary{background:#d6b269;color:#17130b;border:1px solid #d6b269}.ams-actions .ams-secondary{background:#202b35;color:#eee;border:1px solid #4b5964}#ams-status{font-size:11px;color:#d6b269;min-height:17px}
      @media(max-width:700px){.ams-dialog{margin:1vh auto;max-height:98vh;padding:15px}.ams-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.ams-actions{display:grid}.ams-actions button{width:100%}}
    `;
    document.head.append(style);
    document.body.append(modal);
    services.forEach(x => modal.querySelector("#ams-service").add(new Option(x[0],x[1])));
    tones.forEach(x => modal.querySelector("#ams-tone").add(new Option(x[0],x[1])));
    stages.forEach(x => modal.querySelector("#ams-stage").add(new Option(x[0],x[1])));
    channels.forEach(x => modal.querySelector("#ams-channel").add(new Option(x[0],x[1])));
    modal.addEventListener("click", e => { if (e.target.closest("[data-ams-close]")) modal.classList.remove("open"); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") modal?.classList.remove("open"); });
    modal.querySelector("#ams-generate").addEventListener("click", generate);
    modal.querySelector("#ams-copy-all").addEventListener("click", async () => {
      const all = Array.from(modal.querySelectorAll(".ams-option textarea")).map((x,i) => "OPTION " + (i+1) + "\n" + x.value).join("\n\n---\n\n");
      try { await navigator.clipboard.writeText(all); status("All three options copied."); } catch { status("Clipboard access was blocked. Copy the drafts manually."); }
    });
    modal.querySelector("#ams-open-wa").addEventListener("click", () => {
      const selected = modal.querySelector('input[name="ams-choice"]:checked');
      const textarea = selected?.closest(".ams-option")?.querySelector("textarea");
      if (!textarea) return status("Select a draft first.");
      if (current.phone.length < 10) return status("No valid phone number is available for this prospect. Copy the draft instead.");
      if (modal.querySelector("#ams-channel").value !== "whatsapp") return status("Change the channel to WhatsApp to open a pre-filled chat.");
      window.open("https://wa.me/" + current.phone + "?text=" + encodeURIComponent(textarea.value), "_blank", "noopener,noreferrer");
      status("WhatsApp opened with the selected draft. Review it and press Send yourself.");
    });
  }
  let current = {business:"",category:"",area:"",phone:"",contact:""};
  function status(s) { modal.querySelector("#ams-status").textContent = s; }
  function options() {
    return {service:modal.querySelector("#ams-service").value,tone:modal.querySelector("#ams-tone").value,stage:modal.querySelector("#ams-stage").value,channel:modal.querySelector("#ams-channel").value};
  }
  function generate() {
    const opts = options();
    const container = modal.querySelector("#ams-options");
    container.innerHTML = [0,1,2].map(i => {
      const value = makeCopy(current, opts, i);
      return '<article class="ams-option '+(i===0?"selected":"")+'"><div class="ams-option-head"><label><input type="radio" name="ams-choice" value="'+i+'" '+(i===0?"checked":"")+'> OPTION '+(i+1)+'</label><span>'+esc(tones.find(x=>x[1]===opts.tone)?.[0] || "")+'</span></div><textarea aria-label="Edit message option '+(i+1)+'">'+esc(value)+'</textarea><div class="ams-option-actions"><button type="button" data-ams-copy="'+i+'">COPY THIS DRAFT</button></div></article>';
    }).join("");
    container.querySelectorAll(".ams-option").forEach(card => {
      card.querySelector('input[type="radio"]').addEventListener("change", () => {
        container.querySelectorAll(".ams-option").forEach(x=>x.classList.remove("selected"));
        card.classList.add("selected");
      });
      card.querySelector("textarea").addEventListener("input", () => { card.querySelector('input[type="radio"]').checked = true; container.querySelectorAll(".ams-option").forEach(x=>x.classList.toggle("selected",x===card)); });
      card.querySelector("button").addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(card.querySelector("textarea").value); status("Selected draft copied."); } catch { status("Clipboard blocked. Select and copy the text manually."); }
      });
    });
    status("Generated 3 editable options. Choose one and review before sending.");
  }
  function openFor(p) {
    ensureModal();
    current = p;
    modal.querySelector("#ams-prospect").textContent = [p.business,p.category,p.area].filter(Boolean).join(" · ");
    modal.querySelector("#ams-service").value = "auto";
    modal.querySelector("#ams-tone").value = "friendly";
    modal.querySelector("#ams-stage").value = "first";
    modal.querySelector("#ams-channel").value = "whatsapp";
    generate();
    modal.classList.add("open");
  }
  function enhance() {
    if (!root.isConnected) return;
    const table = root.querySelector(".table-panel table");
    if (!table || !/BUSINESS \/ CATEGORY/i.test(table.querySelector("thead")?.textContent || "")) return;
    const head = table.querySelector("thead tr");
    if (head && !head.querySelector(".ams-heading")) {
      const th = document.createElement("th"); th.className="ams-heading"; th.textContent="MESSAGE STUDIO"; head.append(th);
    }
    table.querySelectorAll("tbody tr").forEach(row => {
      if (row.dataset.amsReady) return;
      const cells = row.querySelectorAll("td");
      if (cells.length < 7) return;
      row.dataset.amsReady = "1";
      const business = cells[0].querySelector("b")?.textContent?.trim() || cells[0].textContent.trim();
      const category = cells[0].querySelector("small")?.textContent?.trim() || "";
      const area = cells[1].textContent.trim();
      const rawPhone = cells[3].childNodes[0]?.textContent?.trim() || "";
      const digits = rawPhone.replace(/\D/g,"");
      const phone = digits.length===10 ? "91"+digits : digits.length===12 && digits.startsWith("91") ? digits : "";
      const button = document.createElement("button");
      button.type="button"; button.className="action-btn gold-btn"; button.textContent="Create messages";
      button.addEventListener("click", () => openFor({business,category,area,phone,contact:""}));
      const td=document.createElement("td");td.append(button);row.append(td);
    });
  }
  const observer = new MutationObserver(enhance);
  observer.observe(root,{childList:true,subtree:true});
  enhance();
})();