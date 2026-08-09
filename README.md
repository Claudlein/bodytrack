# BodyTrack 1.0 – iPhone Web-App

Die App ist als mobile Web-App/PWA aufgebaut und kann auf dem iPhone über Safari zum Home-Bildschirm hinzugefügt werden.

## Funktionen

- Gewicht
- Taille
- Bauch
- Hüfte
- Brust
- Oberarm links/rechts
- Oberschenkel links/rechts
- Datum
- Notiz
- Dashboard
- Historie
- Bearbeiten/Löschen
- Diagramme
- Zielgewicht
- Dark Mode
- lokale Speicherung via localStorage
- Offline-Nutzung nach dem ersten Laden, sofern die Dateien von einem geeigneten Webserver/PWA-Host bereitgestellt werden

## iPhone-Installation

Die Dateien müssen unter einer HTTPS-Adresse erreichbar sein. Auf dem iPhone in Safari öffnen:

Teilen → Zum Home-Bildschirm → Hinzufügen

Wichtig: Ein direkter `file://`-Aufruf aus der Dateien-App ist für eine vollständige PWA-Funktion nicht geeignet.

## Kostenloser einfacher Weg

Die Dateien können z.B. auf GitHub Pages oder einem anderen statischen HTTPS-Hosting veröffentlicht werden. Danach die URL in Safari öffnen und zum Home-Bildschirm hinzufügen.

Die Messdaten bleiben lokal im Browser des Geräts; die Hosting-Seite enthält nur die App-Dateien.
