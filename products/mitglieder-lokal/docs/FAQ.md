# MitgliederSimple — FAQ

## Installation & Start

### Die App startet nicht (kurze Sanduhr, dann passiert nichts)

**Ursache:** Das Microsoft Edge WebView2 Runtime ist nicht installiert. Windows 11 bringt es mit, Windows 10 nicht.

**Loesung:**

1. Pruefe unter `Einstellungen → Apps → Apps & Features`, ob **Microsoft Edge WebView2 Runtime** aufgelistet ist.
2. Falls nicht: Nutze den **NSIS-Installer** (`MitgliederSimple_x.x.x_x64-setup.exe`), nicht die MSI-Datei. Der NSIS-Installer laedt WebView2 automatisch bei der Installation herunter.
3. Falls WebView2 trotzdem fehlt (z.B. wegen Netzwerkproblemen bei der Installation): Lade das WebView2 Runtime manuell von Microsoft herunter und installiere es. Danach die App erneut starten.

**Hinweis:** Die MSI-Datei (`*.msi`) bundelt WebView2 **nicht** automatisch. Fuer Windows 10 empfehlen wir immer die EXE-Datei (NSIS-Installer).
