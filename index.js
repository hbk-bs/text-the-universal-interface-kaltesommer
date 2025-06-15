let model;
let maxPredictions;
const TM_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/BtupqLuvE/';
const WARDROBE_API = 'https://kaltesommer--9c6bb56c49ea11f0ad8b76b3cceeab13.web.val.run';
const OUTFIT_API = 'https://kaltesommer--3f8cd864489411f0badb76b3cceeab13.web.val.run';
console.log('Starting Fashion Stylist AI...');
function setup() {
	console.log('Setup called');
  noCanvas();
  document.getElementById('wardrobe-upload-form').addEventListener('submit', handleWardrobeUpload);
  document.getElementById('suggest-outfit-btn').addEventListener('click', showOutfits);
  document.getElementById('clear-wardrobe-btn').addEventListener('click', async () => {
  if (!confirm('Möchtest du wirklich den Kleiderschrank löschen?')) return;

  try {
    const res = await fetch(WARDROBE_API, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());

    alert('✅ Kleiderschrank wurde geleert.');
    loadWardrobe(); // Refresh the UI
  } catch (err) {
    alert('❌ Fehler beim Leeren: ' + err.message);
  }
});

  loadTeachableMachineModel();
  loadWardrobe();
}

async function showOutfits() {
  console.log('Show outfits called');

  const suggestionOutput = document.getElementById('outfit-suggestion');
  suggestionOutput.innerHTML = '⏳ Lade Outfit...';

  try {
    // Helper to fetch a random item by type
    async function getRandomItem(type) {
      const res = await fetch(`${WARDROBE_API}?type=${type}`);
      if (!res.ok) throw new Error(`Fehler beim Laden von ${type}`);
      const items = await res.json();
      if (!items.length) return null;
      return items[Math.floor(Math.random() * items.length)];
    }

    const [shirt, jeans, shoes] = await Promise.all([
      getRandomItem("t-shirt"),
      getRandomItem("jeans"),
      getRandomItem("shoe"),
    ]);

    const outfitItems = [shirt, jeans, shoes].filter(Boolean);

    if (!outfitItems.length) {
      suggestionOutput.innerHTML = "❌ Keine vollständige Outfit-Kombination gefunden.";
      return;
    }

    suggestionOutput.innerHTML = `
      <h3>🧥 Dein Outfit-Vorschlag</h3>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${outfitItems.map(item => `
          <div style="text-align:center;">
            <img src="${item.imageUrl}" alt="${item.description}" style="max-width:120px; border-radius:8px;" />
            <p>${item.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    suggestionOutput.innerHTML = `❌ Fehler: ${err.message}`;
  }
}




async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function checkImageSize(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width > 500 || img.height > 500) {
        reject('Bild ist zu groß (max. 500x500px)');
      } else {
        resolve();
      }
    };
    img.onerror = () => reject('Bild konnte nicht geladen werden.');
    img.src = dataURL;
  });
}

async function loadTeachableMachineModel() {
  try {
    model = await tmImage.load(TM_MODEL_URL + 'model.json', TM_MODEL_URL + 'metadata.json');
    maxPredictions = model.getTotalClasses();
    document.getElementById('classification-result').innerText = '✅ Modell geladen';
  } catch (err) {
    document.getElementById('classification-result').innerText = '❌ Fehler beim Modell-Laden';
    console.error(err);
  }
}

async function classifyImage(imgElement) {
  const predictions = await model.predict(imgElement);
  return predictions.reduce((a, b) => (a.probability > b.probability ? a : b));
}

async function handleWardrobeUpload(e) {
  e.preventDefault();
  const form = e.target;
  const file = form.image.files[0];
  //const customDesc = form.description.value.trim();
  const status = document.getElementById('wardrobe-upload-status');
  const preview = document.getElementById('wardrobe-preview');
  const suggestionOutput = document.getElementById('outfit-suggestion');

  if (!file) {
    status.innerText = '⚠️ Bitte ein Bild auswählen.';
    return;
  }

  try {
    const dataURL = await fileToDataURL(file);
    await checkImageSize(dataURL);

    const img = new Image();
    img.src = dataURL;

    // wachten tot foto geladen is, voor klassificatie
    await new Promise(res => (img.onload = res));
    const prediction = await classifyImage(img);
    const label = prediction.className;
    const fullDesc = label//`${customDesc || 'Kleidungsstück'} (${label})`;

    // foto laten zien
    preview.innerHTML = `<img src="${dataURL}" alt="${fullDesc}" style="max-width:100px;max-height:100px;">`;

    // upload naar kast
    const uploadRes = await fetch(WARDROBE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: dataURL, description: fullDesc }),
    });

    if (!uploadRes.ok) throw new Error('Upload fehlgeschlagen.');

    status.innerText = `✅ Hochgeladen & erkannt als "${label}"`;
    form.reset();

    // kast opnieuw ladem
    loadWardrobe();

  } catch (err) {
    status.innerText = `❌ Fehler: ${err.message || err}`;
  }
}

async function loadWardrobe() {
  const container = document.getElementById('wardrobe-list');
  if (!container) return;

  container.innerHTML = '⏳ Lade Kleiderschrank...';

  try {
    const res = await fetch(WARDROBE_API);
	console.log(res);
    const wardrobe = await res.json();

    if (!Array.isArray(wardrobe) || wardrobe.length === 0) {
      container.innerHTML = '👕 Dein Kleiderschrank ist leer.';
      return;
    }

    container.innerHTML = wardrobe.map(item => `
      <div class="wardrobe-item" style="margin:10px;border:1px solid #ccc;padding:8px;border-radius:8px;">
        <img src="${item.imageUrl}" alt="${item.description}" style="width:80px;height:80px;object-fit:contain;" />
        <p>${item.description}</p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `❌ Fehler beim Laden: ${err.message}`;
  }
  //console.log("Handling "+req.method+" request");

}
