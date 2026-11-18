(() => {
  const root = document.getElementById("viewRoot");
  if (!root) return;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const statusKey = (business, phone) => "alphaWaStatus:" + phone + ":" + business.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const makeMessage = (business, category, area) => {
    const kind = String(category || "").toLowerCase();
    let offer = "websites, social media content and digital creatives";
    if (kind.includes("cafe") || kind.includes("restaurant")) offer = "food reels, promotional creatives and social media management";
    else if (kind.includes("gym") || kind.includes("fitness")) offer = "fitness reels, membership promotion creatives and lead-generating websites";
    else if (kind.includes("boutique") || kind.includes("fashion") || kind.includes("ethnic")) offer = "product catalogues, fashion creatives and Instagram content";
    else if (kind.includes("beauty") || kind.includes("cosmetic") || kind.includes("salon")) offer = "service menus, promotional creatives and appointment-focused websites";
    return "Hello! I’m reaching out from ALPHA CREATIVE. I came across " + business + " in " + (area || "your area") + ". We help businesses improve their online presence through " + offer + ". Would you be open to seeing 2–3 practical ideas for your business? No pressure. — ALPHA CREATIVE";
  };

  let modal = document.getElementById("alpha-wa-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "alpha-wa-modal";
    modal.innerHTML = `
      <div class="alpha-wa-backdrop" data-wa-close="1"></div>
      <section class="alpha-wa-dialog" role="dialog" aria-modal="true" aria-labelledby="alpha-wa-title">
        <div class="alpha-wa-top"><div><span class="alpha-wa-kicker">ALPHA CREATIVE · OUTREACH</span><h2 id="alpha-wa-title">Review WhatsApp message</h2><p id="alpha-wa-recipient"></p></div><button type="button" class="alpha-wa-x" data-wa-close="1" aria-label="Close">×</button></div>
        <label class="alpha-wa-label" for="alpha-wa-message">Personalised message · edit before approval</label>
        <textarea id="alpha-wa-message" rows="8"></textarea>
        <p class="alpha-wa-note">Nothing is sent automatically. Approve opens the WhatsApp chat with this message filled in; you must press Send in WhatsApp.</p>
        <div id="alpha-wa-status" class="alpha-wa-status" aria-live="polite"></div>
        <div class="alpha-wa-actions">
          <button type="button" class="alpha-wa-secondary" id="alpha-wa-copy">Copy draft</button>
          <button type="button" class="alpha-wa-secondary" id="alpha-wa-mark" hidden>Mark as sent</button>
          <button type="button" class="alpha-wa-primary" id="alpha-wa-approve">Approve &amp; open WhatsApp ↗</button>
        </div>
      </section>`;
    document.body.append(modal);
    const style = document.createElement("style");
    style.textContent = `
      #alpha-wa-modal{display:none;position:fixed;inset:0;z-index:99999;font-family:inherit}
      #alpha-wa-modal.is-open{display:block}.alpha-wa-backdrop{position:absolute;inset:0;background:rgba(3,7,12,.78);backdrop-filter:blur(7px)}
      .alpha-wa-dialog{position:relative;width:min(620px,calc(100% - 28px));margin:7vh auto 0;background:#111820;color:#f4f0e8;border:1px solid rgba(214,178,105,.35);border-radius:18px;padding:24px;box-shadow:0 24px 90px #0009}
      .alpha-wa-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.alpha-wa-kicker{font-size:10px;letter-spacing:2px;color:#d6b269}
      .alpha-wa-top h2{font-size:22px;margin:8px 0}.alpha-wa-top p{color:#aab3bd;margin:0 0 18px;font-size:13px}
      .alpha-wa-x{background:transparent;border:0;color:#fff;font-size:28px;cursor:pointer}.alpha-wa-label{display:block;color:#d6b269;font-size:12px;margin:10px 0}
      #alpha-wa-message{width:100%;box-sizing:border-box;resize:vertical;min-height:170px;background:#0b1118;color:#f5f2eb;border:1px solid #39434e;border-radius:10px;padding:14px;font:14px/1.6 inherit;outline:none}
      #alpha-wa-message:focus{border-color:#d6b269}.alpha-wa-note{font-size:12px;line-height:1.5;color:#aab3bd}
      .alpha-wa-status{font-size:12px;color:#d6b269;min-height:18px;margin:10px 0}.alpha-wa-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:9px}
      .alpha-wa-actions button{border-radius:9px;padding:11px 14px;font-weight:650;cursor:pointer;border:1px solid #59616b}
      .alpha-wa-secondary{background:#202a34;color:#f5f2eb}.alpha-wa-primary{background:#d6b269;color:#17130b;border-color:#d6b269!important}
      .alpha-wa-table-status{display:block;margin-top:6px;color:#d6b269;font-size:11px}.alpha-wa-open{white-space:nowrap}
      @media(max-width:560px){.alpha-wa-dialog{margin:3vh auto 0;padding:18px}.alpha-wa-actions{display:grid;grid-template-columns:1fr}.alpha-wa-actions button{width:100%}}
    `;
    document.head.append(style);
  }

  let active = null;
  const messageBox = modal.querySelector("#alpha-wa-message");
  const statusBox = modal.querySelector("#alpha-wa-status");
  const markButton = modal.querySelector("#alpha-wa-mark");
  const close = () => { modal.classList.remove("is-open"); active = null; };
  modal.addEventListener("click", e => { if (e.target.closest("[data-wa-close]")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });

  modal.querySelector("#alpha-wa-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(messageBox.value); statusBox.textContent = "Draft copied to clipboard."; }
    catch { messageBox.select(); statusBox.textContent = "Select and copy the message manually."; }
  });
  modal.querySelector("#alpha-wa-approve").addEventListener("click", () => {
    if (!active) return;
    const message = messageBox.value.trim();
    if (!message) { statusBox.textContent = "Write a message before opening WhatsApp."; return; }
    const url = "https://wa.me/" + active.phone + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener,noreferrer");
    try { localStorage.setItem(active.key, "WhatsApp opened · awaiting send confirmation"); } catch {}
    statusBox.textContent = "WhatsApp opened. Press Send there, then return here and mark it as sent.";
    markButton.hidden = false;
    updateRowStatus(active.row, active.key);
  });
  markButton.addEventListener("click", () => {
    if (!active) return;
    try { localStorage.setItem(active.key, "Marked sent manually"); } catch {}
    statusBox.textContent = "Marked as sent by you. ALPHA AI has not independently verified delivery.";
    markButton.hidden = true;
    updateRowStatus(active.row, active.key);
  });

  function updateRowStatus(row, key) {
    const el = row.querySelector(".alpha-wa-table-status");
    if (!el) return;
    try { el.textContent = localStorage.getItem(key) || ""; } catch { el.textContent = ""; }
  }

  function openDraft(data) {
    active = data;
    modal.querySelector("#alpha-wa-recipient").textContent = data.business + " · +" + data.phone;
    messageBox.value = data.message;
    let saved = "";
    try { saved = localStorage.getItem(data.key) || ""; } catch {}
    statusBox.textContent = saved || "Draft ready. Review and edit it before approving.";
    markButton.hidden = !saved.includes("awaiting send");
    if (saved.includes("Marked sent")) markButton.hidden = true;
    modal.classList.add("is-open");
    setTimeout(() => messageBox.focus(), 30);
  }

  function enhance() {
    const table = root.querySelector(".table-panel table");
    if (!table || !/BUSINESS \/ CATEGORY/i.test(table.querySelector("thead")?.textContent || "")) return;
    const head = table.querySelector("thead tr");
    if (head && !head.querySelector(".wa-action-heading")) {
      const th = document.createElement("th"); th.className = "wa-action-heading"; th.textContent = "WHATSAPP"; head.append(th);
    }
    table.querySelectorAll("tbody tr").forEach(row => {
      if (row.dataset.whatsappEnhanced) return;
      const cells = row.querySelectorAll("td");
      if (cells.length < 7) return;
      row.dataset.whatsappEnhanced = "1";
      const business = cells[0].querySelector("b")?.textContent?.trim() || "your business";
      const category = cells[0].querySelector("small")?.textContent?.trim() || "";
      const area = cells[1].textContent.trim();
      const rawPhone = cells[3].childNodes[0]?.textContent?.trim() || "";
      const digits = rawPhone.replace(/\D/g, "");
      const phone = digits.length === 10 ? "91" + digits : (digits.length === 12 && digits.startsWith("91") ? digits : "");
      const td = document.createElement("td");
      if (phone) {
        const key = statusKey(business, phone);
        const button = document.createElement("button");
        button.type = "button"; button.className = "action-btn gold-btn alpha-wa-open"; button.textContent = "Preview draft";
        button.addEventListener("click", () => openDraft({business, phone, row, key, message: makeMessage(business, category, area)}));
        td.append(button);
        const state = document.createElement("small"); state.className = "alpha-wa-table-status"; td.append(state);
        updateRowStatus({querySelector: selector => selector === ".alpha-wa-table-status" ? state : null}, key);
      } else td.textContent = "No valid number";
      row.append(td);
    });
  }

  const observer = new MutationObserver(enhance);
  observer.observe(root, {childList:true,subtree:true});
  enhance();
})();