# HTTPS Setup für Netzwerkzugriff (PWA)

## Schritt 1: Entwicklungszertifikat erstellen und vertrauen

Führe diese Befehle in PowerShell als **Administrator** aus:

```powershell
# Entwicklungszertifikat erstellen
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

Bestätige die Sicherheitswarnung mit "Ja", um das Zertifikat zu installieren.

## Schritt 2: Firewall-Regel erstellen

Erstelle eine Firewall-Regel, damit dein Handy auf das Backend zugreifen kann.

### Methode 1: Automatisch mit erhöhten Rechten (Empfohlen)

Führe diesen Befehl in einer **normalen** PowerShell aus:

```powershell
Start-Process powershell -Verb RunAs -ArgumentList "-Command", "New-NetFirewallRule -DisplayName 'ASP.NET Core HTTPS Dev' -Direction Inbound -LocalPort 7296 -Protocol TCP -Action Allow; New-NetFirewallRule -DisplayName 'ASP.NET Core HTTP Dev' -Direction Inbound -LocalPort 5057 -Protocol TCP -Action Allow; Write-Host 'Firewall-Regeln erfolgreich erstellt!'; pause"
```

Es öffnet sich ein neues PowerShell-Fenster mit Administrator-Rechten. Bestätige die UAC-Abfrage mit "Ja".

### Methode 2: Manuell über die GUI

Falls die automatische Methode nicht funktioniert:

1. Drücke `Win + R`, tippe `wf.msc` und drücke Enter
2. Klicke links auf "Eingehende Regeln"
3. Klicke rechts auf "Neue Regel..."
4. Wähle "Port" ? Weiter
5. Wähle "TCP" und gib Port `7296` ein ? Weiter
6. Wähle "Verbindung zulassen" ? Weiter
7. Alle Profile aktiviert lassen ? Weiter
8. Name: `ASP.NET Core HTTPS Dev` ? Fertig stellen
9. Wiederhole für Port `5057` mit Name `ASP.NET Core HTTP Dev`

### Überprüfen, ob die Regeln aktiv sind:

```powershell
Get-NetFirewallRule -DisplayName "*ASP.NET Core*" | Select-Object DisplayName, Enabled
```

## Schritt 3: Deine lokale IP-Adresse herausfinden

```powershell
ipconfig
```

Suche nach "IPv4-Adresse" in deinem WLAN-Adapter (z.B. `192.168.1.100`)

## Schritt 4: Backend starten

```powershell
dotnet run --launch-profile https
```

## Schritt 5: Zertifikat auf dem Handy installieren (für iOS/Android)

### Option A: Zertifikat exportieren und manuell installieren

1. **Zertifikat exportieren:**
   - Drücke `Win + R`, tippe `certmgr.msc` und drücke Enter
   - Navigiere zu: `Eigene Zertifikate` ? `Zertifikate`
   - Finde "localhost" (Aussteller: localhost)
   - Rechtsklick ? `Alle Aufgaben` ? `Exportieren...`
   - Exportiere als `.cer` Datei (ohne privaten Schlüssel)
   - Speichere z.B. als `localhost.cer`

2. **Zertifikat auf Handy übertragen:**
   - Per E-Mail, Cloud-Speicher oder USB an dein Handy senden
   
3. **Auf Android installieren:**
   - Öffne die `.cer` Datei
   - Gehe zu `Einstellungen` ? `Sicherheit` ? `Verschlüsselung & Anmeldedaten` ? `Zertifikat installieren`
   - Wähle "CA-Zertifikat" und installiere es

4. **Auf iOS installieren:**
   - Öffne die `.cer` Datei in Safari
   - Gehe zu `Einstellungen` ? `Profil geladen`
   - Installiere das Profil
   - Gehe zu `Einstellungen` ? `Allgemein` ? `Info` ? `Vertrauenswürdige Zertifikate`
   - Aktiviere das localhost-Zertifikat

### Option B: Selbst-signiertes Zertifikat akzeptieren (einfacher für Entwicklung)

Bei der ersten Verbindung wird dein Browser/App eine Warnung anzeigen. Du kannst diese ignorieren und "Trotzdem fortfahren" wählen.

**Hinweis:** Für eine Produktionsumgebung solltest du ein echtes SSL-Zertifikat verwenden (z.B. Let's Encrypt).

## Schritt 6: Von deinem Handy aus zugreifen

Öffne in deinem Handy-Browser:
```
https://DEINE_IP:7296
```

Ersetze `DEINE_IP` mit der IP-Adresse aus Schritt 3 (z.B. `https://192.168.1.100:7296`)

## Troubleshooting

### Verbindung schlägt fehl
- Stelle sicher, dass Firewall-Regeln aktiv sind
- Prüfe, ob beide Geräte im selben WLAN sind
- Prüfe, ob das Backend läuft: `netstat -ano | findstr :7296`

### Zertifikatsfehler
- Installiere das Zertifikat auf dem Handy (siehe Schritt 5)
- Oder akzeptiere die Warnung beim ersten Zugriff

### CORS-Fehler
- Die CORS-Policy ist bereits auf "Allow everything" konfiguriert (nur für Development!)
- In Production solltest du die erlaubten Origins einschränken
