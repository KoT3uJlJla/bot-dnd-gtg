# Gatto D&D Telegram Bot

MVP Telegram-бота для группового realtime RPG/D&D-события по лору Gatto.

Главная идея: общий Telegram-чат работает как публичная игровая сцена, а личка с ботом — как приватный кабинет игрока для персонажа, класса, питомцев, экипировки, инвентаря и расходников.

## Что реализовано

- Node.js + TypeScript strict mode.
- grammY bot bootstrap с long polling.
- Prisma ORM + PostgreSQL.
- Docker Compose для локальной PostgreSQL.
- Zod-валидация env.
- Whitelist-доступ через таблицу `allowed_users`.
- Админ-команды:
  - `/admin_add <telegram_id>`
  - `/admin_remove <telegram_id>`
  - `/admin_list`
  - `/admin_user <telegram_id>`
  - `/admin_ban <telegram_id>`
  - `/admin_unban <telegram_id>`
- Личка:
  - `/start`
  - `/create <имя>`
  - выбор класса inline-кнопками
  - `/profile`
  - `/class`
  - бесплатная смена класса и платная смена через `rebirth_scroll`
  - `/inventory`
  - `/equipment`
  - `/pet`
  - `/use <item_key>`
- Общий чат:
  - `/event_start`
  - `/event_status`
  - `/event_join`
  - `/event_leave`
  - `/event_stop`
  - `/death_save`
  - inline-кнопки для вступления, solo, звеньев, действий, атаки, расходника, death save.
- Telegram d6 через `sendDice`, с записью бросков в `dice_rolls`.
- Шкала d6:
  - 1: критический провал
  - 2: провал
  - 3: частичный успех с осложнением
  - 4: успех
  - 5: сильный успех
  - 6: критический успех
- Advantage/disadvantage через два Telegram d6.
- 6 классов: Страж, Воин, Разбойник, Следопыт, Маг, Жрец.
- RPS-домены: Сила, Точность, Магия.
- Акт 1 события `Штурм ледяной пустоши`:
  - Выход на ледяную равнину
  - Буран
  - Ледяные трещины
  - Стая ледяных существ
  - Мини-босс `Оледеневший Бугай`
- Скелеты конфигов для Акта 2 и Акта 3.
- Минимальные враги, питомцы, предметы, расходники, экипировка.
- Награды с защитой от повторной выдачи.
- Death saves на d6.
- Логирование ошибок и админ-действий.

## Быстрый запуск

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run db:seed
npm run dev
```

На Windows вместо `cp` можно выполнить:

```powershell
Copy-Item .env.example .env
```

## Env

```env
BOT_TOKEN=
DATABASE_URL=postgresql://gatto:gatto@localhost:5432/gatto_dnd
ADMIN_TELEGRAM_IDS=
NODE_ENV=development
LOG_LEVEL=debug
```

- `BOT_TOKEN` — токен от BotFather.
- `DATABASE_URL` — строка подключения к PostgreSQL.
- `ADMIN_TELEGRAM_IDS` — Telegram ID админов через запятую, например `123,456`.
- `NODE_ENV` — `development`, `test` или `production`.
- `LOG_LEVEL` — уровень логов pino.

## Как создать бота через BotFather

1. Открой `@BotFather`.
2. Выполни `/newbot`.
3. Задай имя и username.
4. Скопируй токен в `.env` как `BOT_TOKEN`.
5. Добавь бота в общий чат.
6. Если нужны inline-кнопки и команды в группах, не отключай обычный режим сообщений, а при необходимости настрой privacy mode в BotFather.

## Как добавить админа

Добавь Telegram ID админа в `.env`:

```env
ADMIN_TELEGRAM_IDS=123456789
```

После перезапуска бот будет считать этого пользователя админом.

## Как добавить игрока в whitelist

Админ пишет боту:

```text
/admin_add 123456789
```

После этого игрок должен открыть личку с ботом и выполнить:

```text
/start
/create Имя
```

## Как запустить событие

1. Добавь бота в общий Telegram-чат.
2. Убедись, что игроки добавлены в whitelist.
3. Игроки открывают личку с ботом, выполняют `/start` и создают аватара.
4. Админ в общем чате выполняет:

```text
/event_start
```

5. Игроки вступают через кнопку или команду:

```text
/event_join
```

6. Дальше используются кнопки `Действие`, `Атаковать`, `Расходник`, `Death Save`.

## Ключевые файлы

- `src/index.ts` — входная точка приложения.
- `src/bot/index.ts` — сборка grammY-бота.
- `src/bot/middleware/access.ts` — whitelist, admin check, разделение лички и общего чата.
- `src/bot/commands/admin.ts` — админ-команды.
- `src/bot/commands/private.ts` — личные команды игрока.
- `src/bot/commands/events.ts` — команды общего чата.
- `src/bot/callbacks/index.ts` — inline callback handlers.
- `src/game/events/eventService.ts` — основной state machine события, бой, death saves.
- `src/game/dice/d6.ts` — Telegram d6 через `sendDice`.
- `src/game/classes/catalog.ts` — классы.
- `src/game/events/iceWasteland.ts` — сюжетный модуль.
- `src/game/combat/enemies.ts` — враги и босс-скелет.
- `src/game/rewards/rewardService.ts` — расчет и выдача наград.
- `prisma/schema.prisma` — схема БД.

## TODO после MVP

- Полноценные Акты 2 и 3 с отдельными сценами, ловушками и босс-фазами.
- Более глубокая система умений классов и затрат Mana/Stamina.
- Полная экипировка через inline UI.
- Магазин/платежи для платной смены класса и покупок.
- Персистентные private conversation states вместо in-memory pending name.
- Более строгие кулдауны и rate limits для inline-кнопок.
- Webhook-режим для Render/VPS.
- Интеграционные тесты с тестовой PostgreSQL.

## Ограничения MVP

- Бот работает через long polling.
- Имя создаваемого персонажа временно хранится в памяти до выбора класса.
- Полностью реализован Акт 1; Акты 2 и 3 представлены расширяемыми конфигами.
- Расходник в общем чате пока использует первое доступное малое зелье лечения.
- Система питомцев дает автоматический бонус, без отдельной глубокой механики команд питомца.
