# Produktidee: Teilnehmer Lokal

*Stand: 2026-03-11*
*Status: Idee / Bewertung*
*Umbenannt von: TeilnehmerSimple → Teilnehmer Lokal (Namenskonvention: "[Funktion] Lokal")*

---

## Kurzidee

Ein lokales Backoffice-Tool fuer Teilnehmer-, Helfer-, Gruppen- oder Kursverwaltung.

Es hilft kleinen Traegern, Vereinen oder Initiativen dabei, Personen internen
Ablaeufen zuzuordnen, Listen zu pflegen und Nachweise / Bescheinigungen / Exporte
sauber zu erzeugen.

**Kernbotschaft:** Teilnehmer, Gruppen und Einsaetze lokal verwalten —
Listen drucken, Bescheinigungen erzeugen, Historie nachvollziehen.

---

## Zielgruppe

Geeignet fuer kleine Organisationen mit einfachen Personen- und Gruppenzuordnungen:

- kleine Bildungstraeger
- Vereine (Kursprogramm, Helferkoordination)
- Initiativen
- Trainer / Kursanbieter
- Ehrenamtsorganisationen

Nicht fuer grosse, digitalisierte Kursplattformen, sondern fuer kleine Strukturen
mit pragmatischem Verwaltungsbedarf.

---

## Kernprozess

1. Personen erfassen oder importieren
2. Gruppen / Kurse / Einsaetze anlegen
3. Personen zuordnen
4. Status pflegen
5. Listen, Bescheinigungen oder Exporte erzeugen
6. Verlauf nachvollziehen

Nah an Mitgliederverwaltung, aber allgemeiner und ohne Beitrags-/Finanzfokus.

---

## Muss-Funktionen (Version 1)

- Personenverwaltung (CRUD)
- Gruppen-/Kurs-/Einsatzverwaltung
- Zuordnung von Personen zu Gruppen
- Statusfelder (aktiv, abgeschlossen, abgesagt)
- Listenansichten mit Filter
- PDF-Listen / Bescheinigungen
- CSV-Import / Export
- einfache Historie

---

## Bewusst nicht in Version 1

Abgrenzung besonders wichtig:

- Online-Anmeldung
- Teilnehmerportal
- E-Mail-Kommunikation
- Kalender-Synchronisation
- Rechnungs- oder Payment-Plattform
- digitale Lernplattform
- Rollen-/Rechtesysteme mit vielen Ebenen

**Teilnehmer Lokal ist internes Verwaltungs-Backoffice, keine Kursplattform.**

---

## Plattformanteil

**Hoch**

Teilnehmer Lokal kann viel aus Mitglieder Lokal uebernehmen:

- Personen-CRUD (person-Tabelle aus finanz-shared)
- Listen / Filter (DataTable, SearchBar)
- PDF-Ausgabe
- CSV-Import/Export
- Statuslogik
- Historie / Audit-Log
- Importpfade

---

## Monetarisierungschance

**Mittel**

- Zahlungsbereitschaft kann kleiner und heterogener sein als bei Finanztools
- Trotzdem interessant bei enger Produktgrenze: Organisationen die Listen brauchen,
  Bescheinigungen drucken, Zuordnungen verwalten, keine Cloud-Plattform wollen
- 39 EUR/Jahr Servicepaket

---

## Strategischer Wert fuer Code-Fabrik

**Mittel bis hoch**

Kein so starker horizontaler Verstaerker wie Nachweis Lokal, aber ein guter Test,
ob Personen-/Gruppen-/Statusmuster wirklich plattformfaehig sind.

Es staerkt:

- Personenmodelle (Wiederverwendung person-Tabelle)
- Zuordnungslogik (Person ↔ Gruppe)
- Listen-/Exportlogik
- PDF-/Bescheinigungsbausteine
- Anwesenheits-Erfassung

---

## Risiko

Hauptrisiko: Funktionsdrift.

Sehr schnell kommen Wuensche wie: Online-Buchung, Terminplanung, Mailversand,
Wartelisten, Zahlungsabwicklung, Self-Service.

---

## Empfehlung

Teilnehmer Lokal eher als zweite Ableitung aus der Vereins-/Personenlogik
priorisieren — nach Nachweis Lokal.

---

## Einordnung in die Produktfamilie

```
Bestehend:
  Rechnung Lokal       — Rechnungen + EUeR + ZUGFeRD (Nebenberufler)
  Mitglieder Lokal     — Vereinsverwaltung (Vereine 30-250 Mitglieder)
  FinanzRechner Lokal  — Versicherungsrechner (Makler)

Naechste Stufe:
  Nachweis Lokal       — Pruefprotokolle + Checklisten + Nachweise (Prioritaet 1)
  Teilnehmer Lokal     — Teilnehmer-/Gruppen-/Kursverwaltung (Prioritaet 2) ← DIESES PRODUKT
```
