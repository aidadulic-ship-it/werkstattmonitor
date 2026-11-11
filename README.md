# Werkstatt im Blick

**Live-Leitstand für Reparaturaufträge auf dem Werkstatt-TV – Prototyp (DEMO)**

Ein großer Bildschirm in der Servicewerkstatt zeigt alle Reparaturaufträge automatisch in drei Spalten – passend zu den drei physischen Regalen:

| Spalte | Bedeutung | Regel |
|---|---|---|
| 🟥 **01 Wareneingang** | Gerät ist da, Bearbeitung noch nicht begonnen | Servicemeldung vorhanden, kein gültiger Dispatch |
| 🟧 **02 In Bearbeitung** | Techniker arbeitet daran | mindestens ein Dispatch offen – auch wenn die Servicemeldung schon geschlossen ist |
| 🟩 **03 Ausgang / Abgeschlossen** | Bearbeitung beendet (nicht zwingend repariert) | Dispatch geschlossen – repariert, KV abgelehnt oder nicht reparierbar |

> ⚠️ **Status:** Klickbarer Prototyp mit **synthetischen Testdaten**. Es besteht **keine Verbindung** zu SAP oder Microsoft Dynamics 365.

---

## Schnellstart

Keine Installation nötig.

1. `index.html` herunterladen und per Doppelklick im Browser öffnen (Chrome, Edge oder Firefox).
2. Auf **Vollbild** klicken oder **F11** drücken.

Optional als Webseite über **GitHub Pages**: *Settings → Pages → Branch `main` / Ordner `/ (root)`*.
Hinweis: GitHub Pages ist auch bei privaten Repositories je nach GitHub-Plan öffentlich erreichbar – vorher prüfen.

## Funktionen im Prototyp

- Drei Spalten mit je 18 Testaufträgen
- Seitenwechsel alle 15 Sekunden, gleichzeitig in allen Spalten (Rot/Orange 8, Grün 12 Aufträge pro Seite), mit Seitenanzeige „1/3“ und Fortschrittsbalken
- **Kurznummer** (letzte 4 Ziffern der Servicemeldung) in Rot und Orange – bleibt vom Eingang bis zum Ausgang gleich
- Rot: SM-Nummer groß, Gerät, Seriennummer, Kunde, Eingangsdatum
- Orange: Dispatch-Nummer groß, Techniker, Bearbeitungsstatus, SM, Gerät, Seriennummer, Beginn
- Grün: Dispatch-Nummer, SM, Abschlussdatum, Tage gesamt, Abschlussgrund
- Detailansicht per Klick (schließen mit **Esc**)
- Warnbanner bei veralteten Daten
- Für Full-HD- und 4K-Bildschirme (55–65 Zoll) ausgelegt

## Projektstruktur

```
werkstatt-im-blick/
├── index.html                  Lauffähiger Prototyp (eine Datei, keine Abhängigkeiten)
├── tests/
│   └── statuslogik.test.js     32 automatische Tests der Statuslogik
├── docs/
│   ├── Projektvorschlag.pdf    Entscheidungsvorlage (Deutsch)
│   └── INTEGRATION.md          Plan für den Echtbetrieb
├── package.json
└── README.md
```

## Tests

Benötigt [Node.js](https://nodejs.org) ab Version 18.

```bash
npm test
```

Die Tests lesen die Statuslogik direkt aus `index.html` und prüfen u. a.:

- Szenarien A–F (neue Servicemeldung → Rot, Dispatch erstellt → Orange, Servicemeldung zu / Dispatch offen → bleibt Orange, Dispatch zu → Grün, KV abgelehnt → Grün, Dispatch wiedereröffnet → zurück zu Orange)
- mehrere Dispatches pro Servicemeldung, stornierte Aufträge, fehlende Daten, unbekannte Statuswerte, nicht zuordenbare Datensätze, doppelte Nummern
- Standzeitberechnung und Zählerkonsistenz (kein Auftrag erscheint in zwei Spalten)

## Statuslogik in Kürze

- Eine Karte = eine Servicemeldung. Die Spalte wird bei jeder Aktualisierung **vollständig neu berechnet** – nichts wird zwischengespeichert.
- Stornierte Dispatches werden ignoriert.
- Unklare Datensätze werden als **Klärungsfall** markiert und **nicht** auf dem TV angezeigt.
- Welche CRM-Statuswerte „offen“, „geschlossen“ oder „storniert“ bedeuten, steht in einer **Statuszuordnung** (`statusZuordnung()` in `index.html`). Die Werte im Prototyp sind **Platzhalter** und müssen durch die echten Werte aus Dynamics 365 ersetzt werden.

## Weg in den Echtbetrieb

Kurzfassung – Details in [`docs/INTEGRATION.md`](docs/INTEGRATION.md):

1. Mit dem CRM-Administrator Tabellen, Felder und Statuswerte klären
2. Technischen **Lesezugang** (Entra-ID-App-Registrierung + Anwendungsbenutzer in Dynamics 365) und Testumgebung einrichten
3. Produktive Version mit kleinem Backend entwickeln (Daten werden nur gelesen)
4. Pilotbetrieb 2–4 Wochen auf dem Werkstatt-TV
5. Umstellung auf das Produktivsystem

## Hinweise

- Alle Kunden, Geräte, Seriennummern und Personen im Prototyp sind **frei erfunden**.
- Firmenname und Farben dienen der internen Präsentation. Vor einer Veröffentlichung bitte mit der Kommunikations- bzw. Markenabteilung klären. **Empfehlung: privates Repository.**
- Das Logo ist ein Platzhalter.
