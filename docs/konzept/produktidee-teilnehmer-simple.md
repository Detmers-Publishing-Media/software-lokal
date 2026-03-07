# Produktidee: TeilnehmerSimple

*Stand: 2026-03-06*
*Status: Idee / Bewertung*

---

## Kurzidee

Ein lokales Backoffice-Tool fuer Teilnehmer-, Helfer-, Gruppen- oder Kursverwaltung.

Es hilft kleinen Traegern, Vereinen oder Initiativen dabei, Personen internen
Ablaeufen zuzuordnen, Listen zu pflegen und Nachweise / Bescheinigungen / Exporte
sauber zu erzeugen.

---

## Zielgruppe

Geeignet fuer kleine Organisationen mit einfachen Personen- und Gruppenzuordnungen:

- kleine Bildungstraeger
- Vereine
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

Nah an Mitgliederverwaltung, aber etwas allgemeiner.

---

## Muss-Funktionen (Version 1)

- Personenverwaltung
- Gruppen-/Kurs-/Einsatzverwaltung
- Zuordnung von Personen
- Statusfelder
- Listenansichten
- PDF-Listen / Bescheinigungen
- CSV-Import / Export
- einfache Historie

Optional frueh, aber nur wenn wirklich noetig:

- Notizfeld
- einfache Terminzuordnung

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

Sonst driftet das Produkt sofort in eine andere Klasse.

---

## Plattformanteil

**Hoch**

TeilnehmerSimple kann viel aus MitgliederSimple uebernehmen:

- Personen-CRUD
- Listen
- Filter
- PDF-Ausgabe
- CSV
- Statuslogik
- Historie
- Importpfade

Gutes Ableitungsprodukt.

---

## Monetarisierungschance

**Mittel**

- Zahlungsbereitschaft kann kleiner und heterogener sein als bei Finanztools
- Trotzdem interessant bei enger Produktgrenze: Organisationen die Listen brauchen,
  Bescheinigungen drucken, Zuordnungen verwalten, keine Cloud-Plattform wollen

---

## Strategischer Wert fuer Code-Fabrik

**Mittel bis hoch**

Kein so starker horizontaler Verstaerker wie NachweisSimple, aber ein guter Test,
ob Personen-/Gruppen-/Statusmuster wirklich plattformfaehig sind.

Es staerkt:

- Personenmodelle
- Zuordnungslogik
- Listen-/Exportlogik
- PDF-/Bescheinigungsbausteine

---

## Risiko

Hauptrisiko: Funktionsdrift.

Sehr schnell kommen Wuensche wie:

- Online-Buchung
- Terminplanung
- Mailversand
- Wartelisten
- Zahlungsabwicklung
- Self-Service

Deshalb muss die Botschaft glasklar sein:

**TeilnehmerSimple ist internes Verwaltungs-Backoffice, keine Kursplattform.**

---

## Empfehlung (externer Review)

TeilnehmerSimple eher als zweite Ableitung aus der Vereins-/Personenlogik
priorisieren — nach NachweisSimple.
