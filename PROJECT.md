# 🚀 Nexo Match Bot 3.0

## Status projektu

### ✅ Sprint Foundation

- [x] Discord Bot
- [x] Render
- [x] MatchZy Webhook
- [x] Live Scoreboard
- [x] MatchStore
- [x] PostgreSQL
- [x] /ping
- [x] /live
- [x] /lastmatch

---

### 🚧 Sprint Architecture

- [x] commands/
- [x] events/
- [x] services/

#### Events

- [x] ready.js
- [x] interactionCreate.js

#### Services

- [x] discordService.js
- [x] databaseService.js
- [x] webhookService.js

---

## Następny krok

➡ Przenieść obsługę webhooka MatchZy z index.js do services/webhookService.js

---

## Zasady projektu

- Jedna zmiana = jeden commit
- Po każdej zmianie test
- Bot ma działać po każdym commicie
- Nie robimy dużych zmian naraz
- Kod ma być czytelny i łatwy do rozbudowy