(() => {
  const root = document.getElementById("viewRoot");
  if (!root) return;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const makeMessage = (business, category, area) => {
    const kind = String(category || "").toLowerCase();
    let offer = "websites, social media content and digital creatives";
    if (kind.includes("cafe") || kind.includes("restaurant")) offer = "food reels, promotional creatives and social media management";
    else if (kind.includes("gym") || kind.includes("fitness")) offer = "fitness reels, membership promotion creatives and lead-generating websites";
    else if (kind.includes("boutique") || kind.includes("fashion") || kind.includes("ethnic")) offer = "product catalogues, fashion creatives and Instagram content";
    else if (kind.includes("beauty") || kind.includes("cosmetic") || kind.includes("salon")) offer = "service menus, promotional creatives and appointment-focused websites";
    return "Hello! I’m reaching out from ALPHA CREATIVE. I came across " + business + " in " + (area || "your area") + ". We help businesses improve their online presence through " + offer + ". Would you be open to seeing 2–3 practical ideas for your business? No pressure. — ALPHA CREATIVE";
  };
  function enhance() {
    const table = root.querySelector(".table-panel table");
    if (!table || !/BUSINESS \/ CATEGORY/i.test(table.querySelector("thead")?.textContent || "")) return;
    const head = table.querySelector("thead tr");
    if (head && !head.querySelector(".wa-action-heading")) {
      const th = document.createElement("th");
      th.className = "wa-action-heading";
      th.textContent = "WHATSAPP";
      head.append(th);
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
        const message = makeMessage(business, category, area);
        const href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
        td.innerHTML = '<a class="action-btn gold-btn" target="_blank" rel="noopener noreferrer" href="' + esc(href) + '">Prepare message ↗</a><small style="display:block;margin-top:6px;max-width:150px">Review in WhatsApp; you choose whether to send.</small>';
      } else {
        td.textContent = "No valid number";
      }
      row.append(td);
    });
  }
  const observer = new MutationObserver(enhance);
  observer.observe(root, { childList: true, subtree: true });
  enhance();
})();