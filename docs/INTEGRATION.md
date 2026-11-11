# Integrationsplan – vom Prototyp zum Echtbetrieb

Dieser Plan beschreibt, was für den produktiven Einsatz von „Werkstatt im Blick“ nötig ist.
Er nennt bewusst **keine** konkreten Tabellen- oder Feldnamen aus Dynamics 365, da das Datenmodell noch mit dem CRM-Team geklärt werden muss.

## 1. Zielarchitektur

```
Dynamics 365 / Dataverse  ──(Web API, nur lesen)──►  Backend-Dienst  ──►  Leitstand-Webseite  ──►  Mini-PC + TV
                                                     • Statuslogik
                                                     • Statuszuordnung
                                                     • Fehlerprotokoll
```

- **Datenquelle:** zunächst nur Dynamics 365. SAP wird erst angebunden, wenn das tatsächliche Warenausgangsdatum benötigt wird.
- **Zugriff:** Dataverse Web API über eine App-Registrierung in Microsoft Entra ID und einen Anwendungsbenutzer mit reinem Leserecht. Zugangsdaten liegen nicht im Code (z. B. Azure Key Vault).
- **Aktualisierung:** Abfrage alle 30–60 Sekunden. Ereignisbasierte Varianten (Power Automate, Service Bus) nur bei Bedarf.
- **Hosting:** firmeneigene Azure-Umgebung oder interner Server.
- **Anzeige:** Mini-PC mit Browser im Kiosk-Modus, per Netzwerkkabel im Firmennetz.

## 2. Was im Code bereits vorbereitet ist

| Bereich | Stand |
|---|---|
| Statuslogik inkl. Sonderfälle | fertig, getestet (`tests/statuslogik.test.js`) |
| Konfigurierbare Statuszuordnung | vorhanden, Werte sind Platzhalter |
| Getrennte Datumsfelder (Eingang, Beginn, Dispatch-Abschluss, Warenausgang) | vorhanden – Grundlage für spätere Kennzahlen |
| Warnung bei veralteten Daten | vorhanden |
| Datenquelle | **Demo** – muss durch eine Live-Datenquelle (Backend) ersetzt werden |

Die Live-Datenquelle muss dasselbe Format liefern wie `demoDaten()`:

```js
{
  servicemeldungen: [{ nr, geraet, modell, sn, sw, kunde, kontakt, fehler, wareneingang, status, warenausgang, notizen }],
  dispatches:       [{ nr, smNr, status, techniker, unterstatus, erstellt, abgeschlossen, abschlussgrund }]
}
```

Datumswerte im Format `JJJJ-MM-TT`. Die Zuordnung der CRM-Felder zu diesen Namen erfolgt im Backend.

## 3. Offene Punkte mit IT / CRM-Team

- [ ] Welche Tabellen bilden „Servicemeldung“ und „Dispatch“ ab? (Dynamics-365-App: Field Service, Customer Service oder Eigenentwicklung?)
- [ ] Welche Felder enthalten Wareneingangs-, Beginn- und Abschlussdatum?
- [ ] Welche Statuswerte bedeuten offen / geschlossen / storniert?
- [ ] Liegt das Wareneingangsdatum im CRM oder nur in SAP?
- [ ] Wer entwickelt und betreut die produktive Version?
- [ ] Lizenzfrage („Multiplexing“) mit dem Microsoft-Partner klären

## 4. Hardware

- Bildschirm 55–65 Zoll, Full-HD oder 4K, möglichst für Dauerbetrieb ausgelegt
- Mini-PC hinter dem Bildschirm (HDMI), von der IT verwaltet
- Netzwerkkabel, Wandhalterung, Stromanschluss

## 5. Freigaben

- **IT-Sicherheit:** CRM-Zugang, Gerät im Firmennetz
- **Datenschutz (DSGVO):** Kundennamen sind in der Werkstatt sichtbar
- **Betriebsrat:** Namen der Techniker und Bearbeitungszeiten sind sichtbar – Zustimmungspflicht intern prüfen

## 6. Vorgehen

1. Abstimmung mit dem CRM-Administrator
2. Lesezugang und Testumgebung einrichten
3. Backend + Live-Datenquelle entwickeln, Tests erweitern
4. Pilotbetrieb 2–4 Wochen
5. Umstellung auf Produktivsystem
