// Tests der zentralen Statuslogik – testen exakt den Code, der in index.html läuft.
// Aufruf: node tests/statuslogik.test.js   (oder: npm test)
const fs = require('fs');
const path = require('path');
const datei = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(datei, 'utf8');
const start = html.indexOf('// ===== Statuslogik und Demo-Daten');
const ende = html.indexOf('\n// ===== Darstellung =====\nconst app', start);
if (start < 0 || ende < 0) { console.error('Statuslogik-Block in index.html nicht gefunden'); process.exit(1); }
const code = html.slice(start, ende);
class DCLogic { constructor(props) { this.props = props || {}; this.state = {}; } setState() {} }
const Component = new Function('DCLogic', code + '\nreturn Component;')(DCLogic);
const c = new Component({});
const HEUTE = '2026-11-10';
const cfg = Object.assign(c.cfg(), { heute: HEUTE });
const neu = () => c.demoDaten(HEUTE);
const bew = q => c.bewerte(q, cfg);
const find = (q, nr) => bew(q).eintraege.find(e => e.key === nr);

let ok = 0, fail = 0;
const t = (name, cond, info) => { if (cond) { ok++; console.log('  ✔ ' + name); } else { fail++; console.log('  ✘ ' + name + (info ? '  → ' + JSON.stringify(info) : '')); } };

console.log('Ausgangslage');
let q = neu(); let z = bew(q).zaehler;
t('Zähler: je Spalte 18 Aufträge, Gesamt 54', z.rot === 18 && z.orange === 18 && z.gruen === 18 && z.gesamt === 54, z);
t('2 Klärungsfälle, 1 archiviert', z.klaerung === 2 && z.archiv === 1, z);
t('Mindestens 15 Aufträge auf dem TV', z.gesamt >= 15);
const keys = bew(q).eintraege.filter(e => e.typ === 'sm').map(e => e.key);
t('Jede Servicemeldung genau einmal (keine Doppelanzeige)', keys.length === q.servicemeldungen.length && new Set(keys).size === keys.length);
t('Gesamt = Summe der drei Spalten', z.gesamt === z.rot + z.orange + z.gruen);

console.log('Standzeit');
t('02.11.2026 → 10.11.2026 = 8 Tage', c.tageZwischen('2026-11-02', '2026-11-10') === 8);
t('SM-104178 (Eingang 02.11.) zeigt 8 Tage', find(q, 'SM-104178').standzeit === 8);
t('Monatswechsel: 28.10. → 03.11. = 6 Tage', c.tageZwischen('2026-10-28', '2026-11-03') === 6);
t('Standzeit bis Warenausgang ohne Ausgang = nicht berechenbar (null)', find(q, 'SM-104178').standzeitAusgang === null);

console.log('Szenarien A–F');
q = neu();
let r = c.szenario(q, 'A', cfg, 'M. Huber');
t('A: Neue Servicemeldung → ROT', find(q, r.key).spalte === 'rot' && bew(q).zaehler.rot === 19, r);
r = c.szenario(q, 'B', cfg, 'S. Novak'); let e = find(q, r.key);
t('B: Dispatch erstellt → ORANGE, Techniker sichtbar', e.spalte === 'orange' && e.techniker === 'S. Novak', e.spalte);
r = c.szenario(q, 'C', cfg, ''); e = find(q, r.key);
t('C: SM geschlossen, Dispatch offen → bleibt ORANGE mit Hinweis', e.spalte === 'orange' && e.smKat === 'geschlossen' && e.hinweise.join().includes('SM geschlossen'), e.hinweise);
const cKey = r.key;
r = c.szenario(q, 'D', cfg, ''); e = find(q, r.key);
t('D: Dispatch geschlossen → GRÜN (setzt Fall aus C fort)', e.spalte === 'gruen' && r.key === cKey, r);
r = c.szenario(q, 'E', cfg, ''); e = find(q, r.key);
t('E: KV abgelehnt + Dispatch geschlossen → GRÜN, Grund + Notiz', e.spalte === 'gruen' && e.abschlussgrund === 'KV abgelehnt' && e.notizen.some(n => n.includes('abgelehnt')), e);
r = c.szenario(q, 'F', cfg, ''); e = find(q, r.key);
t('F: Dispatch wiedereröffnet → zurück in ORANGE', e.spalte === 'orange', e.spalte);

console.log('Sonderfälle');
q = neu();
t('Stornierter + aktiver Dispatch → ORANGE (Storno ignoriert)', find(q, 'SM-104195').spalte === 'orange' && find(q, 'SM-104195').dispatchNr === 'DS-55112');
c.mDispatchErstellen(q, 'SM-104195', 'J. Berger', HEUTE); e = find(q, 'SM-104195');
t('Zwei offene Dispatches → eine Karte, Hinweis „2 Dispatches offen“', e.spalte === 'orange' && e.hinweise.join().includes('2 Dispatches') && bew(q).eintraege.filter(x => x.key === 'SM-104195').length === 1);
c.mDispatchSchliessen(q, 'SM-104195', 'Repariert', cfg);
t('Einer von zwei geschlossen → bleibt ORANGE', find(q, 'SM-104195').spalte === 'orange');
c.mDispatchSchliessen(q, 'SM-104195', 'Repariert', cfg);
t('Beide geschlossen → GRÜN', find(q, 'SM-104195').spalte === 'gruen');

q = neu(); c.mStorno(q, 'SM-104201');
t('Stornierte SM ohne Dispatch → storniert, nicht auf dem TV', find(q, 'SM-104201').spalte === 'storniert' && bew(q).zaehler.gesamt === 53);
q = neu(); c.mStorno(q, 'SM-104188');
t('Stornierte SM mit offenem Dispatch → Klärungsfall', find(q, 'SM-104188').spalte === 'klaerung');
q = neu();
t('Unbekannter SM-Status → Klärungsfall', find(q, 'SM-104199').spalte === 'klaerung');
q.dispatches[0].status = 'Pausiert';
t('Unbekannter Dispatch-Status → Klärungsfall', find(q, 'SM-104188').spalte === 'klaerung' && find(q, 'SM-104188').grund.includes('Pausiert'));
q = neu(); q.servicemeldungen[0].wareneingang = null;
t('Fehlendes Wareneingangsdatum → Klärungsfall', bew(q).eintraege.find(x => x.smNr === 'SM-104201').spalte === 'klaerung');
q = neu();
t('Dispatch ohne zuordenbare SM → Klärungsfall', bew(q).eintraege.find(x => x.key === 'DS:DS-55115').spalte === 'klaerung');
q = neu(); q.servicemeldungen.push(Object.assign({}, q.servicemeldungen[0]));
const dup = bew(q).eintraege.filter(x => x.smNr === 'SM-104201');
t('Doppelte SM-Nummer → beide Klärungsfall, nie zweimal auf dem TV', dup.length === 2 && dup.every(x => x.spalte === 'klaerung'));
q = neu(); q.dispatches.find(d => d.nr === 'DS-55090').abgeschlossen = null;
t('Geschlossener Dispatch ohne Abschlussdatum → Klärungsfall', find(q, 'SM-104170').spalte === 'klaerung');
q = neu(); c.mSmSchliessen(q, 'SM-104201');
t('SM geschlossen ohne Dispatch → Klärungsfall (nicht GRÜN)', find(q, 'SM-104201').spalte === 'klaerung');

console.log('GRÜN-Ausstieg und Konfiguration');
q = neu();
t('Warenausgang gebucht → archiviert', find(q, 'SM-104160').spalte === 'archiv');
const cfg2 = Object.assign({}, cfg, { gruenAnzeigeTage: 1 });
t('Schwelle 1 Tag → Abschluss vor 2 Tagen archiviert', c.bewerte(q, cfg2).eintraege.find(x => x.key === 'SM-104170').spalte === 'archiv');
const cfg3 = Object.assign({}, cfg, { statusZuordnung: c.klon(cfg.statusZuordnung) });
cfg3.statusZuordnung.servicemeldung['In Klärung'] = 'offen';
t('Statuszuordnung konfigurierbar: „In Klärung“ = offen → ROT', c.bewerte(q, cfg3).eintraege.find(x => x.key === 'SM-104199').spalte === 'rot');

console.log('Zählerkonsistenz nach 200 zufälligen Aktionen');
q = neu(); let konsistent = true;
const aktionen = ['A', 'B', 'C', 'D', 'E', 'F'];
for (let i = 0; i < 200; i++) {
  c.szenario(q, aktionen[(i * 7 + 3) % 6], cfg, 'T. Wagner');
  const b = bew(q); const zz = b.zaehler;
  const summe = zz.rot + zz.orange + zz.gruen + zz.klaerung + zz.archiv + zz.storniert;
  const smKeys = b.eintraege.filter(x => x.typ === 'sm').map(x => x.key);
  if (summe !== b.eintraege.length || new Set(smKeys).size !== smKeys.length || smKeys.length !== q.servicemeldungen.length) konsistent = false;
}
t('Jede SM in genau einer Kategorie, Zähler stimmen', konsistent);

console.log('\n' + ok + ' bestanden, ' + fail + ' fehlgeschlagen');
process.exit(fail ? 1 : 0);
