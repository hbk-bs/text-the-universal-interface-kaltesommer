
const OPENAI_PROXY = 'https://kaltesommer--a21d26f2a5284eb1b8d7dbce66382982.web.val.run';
const WARDROBE_API = 'https://kaltesommer--9c6bb56c49ea11f0ad8b76b3cceeab13.web.val.run';

document.addEventListener('DOMContentLoaded', () => {
  const uploadForm       = /** @type {HTMLFormElement} */ (document.getElementById('wardrobe-upload-form'));
  const statusEl         = document.getElementById('wardrobe-upload-status');
  const previewEl        = document.getElementById('wardrobe-preview');
  const clearBtn         = document.getElementById('clear-wardrobe-btn');
  const suggestBtn       = document.getElementById('suggest-outfit-btn');
  const outfitEl         = document.getElementById('outfit-suggestion');
  const wardrobeList     = document.getElementById('wardrobe-list');

  if (!uploadForm || !statusEl || !previewEl || !clearBtn || !suggestBtn || !outfitEl || !wardrobeList) {
    console.error("❌ Missing required DOM elements. Check your HTML IDs.");
    return;
  }

  // Upload handler
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = uploadForm.querySelector('input[name="image"]');
    if (!(fileInput instanceof HTMLInputElement) || !fileInput.files?.[0]) {
      statusEl.textContent = "⚠️ Bitte ein Bild auswählen.";
      return;
    }
    const file = fileInput.files[0];

    try {
      const dataURL = await fileToDataURL(file);
      previewEl.innerHTML = `<img src="${dataURL}" alt="Preview" style="max-width:100px;max-height:100px;">`;

      // classify clothing
      const classification = await classifyClothing(dataURL);
      const items = Array.isArray(classification?.items) ? classification.items : [];
      if (!items.length) {
        statusEl.textContent = "❌ Keine Kleidung erkannt.";
        return;
      }

      const desc = items.map(it => toReadableLine(it, false)).join(", ");
      statusEl.textContent = `✅ Erkannt: ${desc}`;

      // save in wardrobe API
      await fetch(WARDROBE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: dataURL, description: desc })
      });

      await loadWardrobe();
      uploadForm.reset();
    } catch (err) {
      console.error(err);
      statusEl.textContent = `❌ Fehler: ${err.message || err}`;
    }
  });

  // Clear wardrobe
  clearBtn.addEventListener('click', async () => {
    if (!confirm("Möchtest du wirklich den Kleiderschrank löschen?")) return;
    try {
      await fetch(WARDROBE_API, { method: 'DELETE' });
      statusEl.textContent = "✅ Kleiderschrank geleert.";
      await loadWardrobe();
    } catch (err) {
      statusEl.textContent = `❌ Fehler: ${err.message}`;
    }
  });

  // Suggest outfit
  suggestBtn.addEventListener('click', async () => {
    outfitEl.textContent = "⏳ Lade Outfit...";
    try {
      const [shirt, jeans, shoes] = await Promise.all([
        getRandomWardrobeItem("t-shirt"),
        getRandomWardrobeItem("jeans"),
        getRandomWardrobeItem("shoe")
      ]);
      const picks = [shirt, jeans, shoes].filter(Boolean);
      if (!picks.length) {
        outfitEl.textContent = "❌ Kein Outfit gefunden.";
        return;
      }
      outfitEl.innerHTML = `
        <h3>🧥 Outfit Vorschlag</h3>
        ${picks.map(renderCard).join("")}
      `;
    } catch (err) {
      outfitEl.textContent = `❌ Fehler: ${err.message}`;
    }
  });

  // Load wardrobe at start
  loadWardrobe();

  async function loadWardrobe() {
    wardrobeList.textContent = "⏳ Lade Kleiderschrank...";
    try {
      const res = await fetch(WARDROBE_API);
      const items = await res.json();
      if (!Array.isArray(items) || !items.length) {
        wardrobeList.textContent = "👕 Dein Kleiderschrank ist leer.";
        return;
      }
      wardrobeList.innerHTML = items.map(renderRow).join("");
    } catch (err) {
      wardrobeList.textContent = `❌ Fehler beim Laden: ${err.message}`;
    }
  }

  async function getRandomWardrobeItem(type) {
    const res = await fetch(`${WARDROBE_API}?type=${encodeURIComponent(type)}`);
    const items = await res.json();
    if (!Array.isArray(items) || !items.length) return null;
    return items[Math.floor(Math.random() * items.length)];
  }
});

// --- helpers ---
async function classifyClothing(dataURL) {
  const body = {
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Identify clothing items in the image. The only categories you can use are t-shirt, jeans, shoe. Return JSON: {items:[{category}]}" },
      { role: "user", content: "Analyze this clothing image and return only JSON." },
      { role: "user", content: [{ type: "image_url", image_url: { url: dataURL } }] }
    ]
  };
  const res = await fetch(OPENAI_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const out = await res.json();
  const text = out?.completion?.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return { items: [] };
  }
}

function renderRow(item) {
  return `
    <div style="display:flex;align-items:center;gap:10px;margin:6px 0;border:1px solid #ccc;padding:6px;border-radius:6px;">
      <img src="${item.imageUrl}" alt="${item.description}" style="width:60px;height:60px;object-fit:contain;border-radius:4px;" />
      <span>${item.description}</span>
    </div>
  `;
}

function renderCard(item) {
  return `
    <div style="display:inline-block;text-align:center;margin:6px;">
      <img src="${item.imageUrl}" alt="${item.description}" style="width:100px;height:100px;object-fit:contain;border-radius:6px;" />
      <p>${item.description}</p>
    </div>
  `;
}

function toReadableLine(it, plain = true) {
  const parts = [it.category, it.color, it.pattern, it.material].filter(Boolean);
  const txt = parts.join(", ");
  return plain ? txt : escapeHtml(txt);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
