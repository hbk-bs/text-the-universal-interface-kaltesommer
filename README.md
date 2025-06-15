Dieses Projekt ist eine Fashion Stylist Ki, wo Nutzer Kleidungsbilder hochladen können und ein ML-Modell (Teachable Machine) diese Kleidungsstücke klassifiziert, die API speichert dies im “Kleiderschrank”. Diese Ki hilft der user effizienter und zeitsparend, ihren/seinen Outfit zu wählen.

In der ML_Modell habe ich fünf Kategorien (sweater, t-shirt, jeans, hats and shoes) klassifiziert. Des Weiteren habe ich in valtown, zwei http endpoints erstellt die sozusagen die Verbindung zwischen lokal server zu backend verbindet. Einmal “Fashionwardrobe” wo man auf diesen Server Bilder hochladen kann, sie anschauen, speichern und löschen kann. Bei den zweiter api “fashionOutfitsuggester” , es gibt drei Kleidungsstücke wieder die dann als das fertige Outfit zusammengestellt werden.

Wie zu benutzen: Lade ein Bilder hoch von max. 500x500px, von den fünf Kleidungskategorien, nachdem du zwei/ drei mal das gemacht hast, klickt du auf “Outfit vorschlagen” und somit wird random einen Outfit für dich generiert. 

Wie mein Javascript funktioniert:
- Als 1. Initialisierung & Setup , globale variablen für das ML-Modell:  
let model; let maxPredictions;
- URLS zum ML-Modell und Backend-APIs:
const TM_MODEL_URL=‘…’;
const WARDROBE_API =‘…’;
const OUTFIT_API=‘…’;
- Gibt Startmeldung in die Konsole:
Console.log(‘Starting Fashion Stylist AI…’);

2.setup[] Funktion
- Function setup(){
noCanvas();}
- Wird beim Start ausgeführt.
* Bindet Event-Listener an:
* Upload-Formular
* "Outfit vorschlagen"-Button
* "Kleiderschrank leeren"-Button
* Lädt das ML-Modell (loadTeachableMachineModel)
* Lädt gespeicherte Kleidungsstücke (loadWardrobe)

3. Outfit-Vorschlag
Async function ShowOutfits(){…}
* Holt zufällige Kleidungsstücke (T-Shirt, Jeans, Schuhe) über WARDROBE_API.
* Wenn alle drei vorhanden → Anzeige eines Outfit-Vorschlags.
* Sonst Fehlermeldung.
* Stichpunkte:
* Outfit besteht aus drei Kategorien.
* API-Aufrufe pro Kategorie.
* Vorschlag dynamisch im HTML angezeigt.

4. Bild als DataURL lesen & prüfen
async function fileToDataURL(file)
async function checkImageSize(dataURL)
Wandelt ein hochgeladenes Bild in ein DataURL-Format um.
Überprüft, ob das Bild maximal 500x500px groß ist.

5. ML-Modell laden
async function loadTeachableMachineModel()
* Lädt das trainierte Modell von Teachable Machine (model.json & metadata.json).
* Speichert Anzahl der Klassen (maxPredictions).
* Statusmeldung im HTML.

6. Bildklassifikation
async function classifyImage(imgElement)
* Nutzt das Modell, um das Kleidungsstück im Bild zu erkennen.
* Gibt die wahrscheinlichste Klasse (z. B. "jeans", "t-shirt", "shoe") zurück.

7. Upload & Klassifikation verarbeiten
async function handleWardrobeUpload(e)
* Wird beim Upload-Formular ausgelöst.
* Schritte:
    1. Datei einlesen.
    2. Größe prüfen.
    3. Klassifizieren mit ML.
    4. Vorschau anzeigen.
    5. Bild + Beschreibung an Backend (WARDROBE_API) senden.
    6. Kleiderschrank aktualisieren.

8. Kleiderschrank laden

async function loadWardrobe()
* Holt alle gespeicherten Kleidungsstücke.
* Zeigt sie als kleine Vorschau mit Beschreibung an.

Die APIs (WARDROBE_API, OUTFIT_API) kommunizieren mit einem Backend.