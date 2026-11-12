# Tuneboxd

Letterboxd для музыки: оценки релизов по 90-балльной шкале, рецензии, любимые треки, топ-10 всех времён, подписки и лента.

## Шкала оценок

Пять критериев от 1 до 10:

1. Рифмы / образы
2. Структура / ритмика
3. Реализация стиля
4. Индивидуальность / харизма
5. Атмосфера / вайб

**Итог = (К1 + К2 + К3 + К4) × 1,4 × множитель вайба**, где множитель растёт линейно от ×1,0000 (вайб 1) до ×1,6072 (вайб 10). Максимум 90, итог округляется до целого. Формула продублирована в `src/lib/score.ts` (покрыта тестами) и в генерируемой колонке `ratings.score` в миграции.

## Стек

- Next.js 16 (App Router, Server Actions), Tailwind CSS 4
- Supabase: Postgres с RLS, авторизация (email, Google, Spotify)
- Каталог релизов из [MusicBrainz](https://musicbrainz.org), обложки из Cover Art Archive. Релиз сохраняется в базу при первом открытии его страницы.

## Локальный запуск

Нужны Node 20+, pnpm и Docker.

```bash
pnpm install
pnpm supabase start            # поднимет Postgres/Auth и применит миграции
cp .env.example .env.local     # вставьте ключи из вывода `pnpm supabase status`
pnpm dev
```

Тесты: `pnpm test`. Проверка: `pnpm lint && pnpm build`.

## Вход через Google и Spotify

1. Создайте OAuth-приложения в [Google Cloud Console](https://console.cloud.google.com/apis/credentials) и [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Redirect URI в обоих: `https://<project>.supabase.co/auth/v1/callback` (локально `http://127.0.0.1:54321/auth/v1/callback`).
3. В продакшене включите провайдеров в Supabase Dashboard → Authentication → Providers. Локально поставьте `enabled = true` в `supabase/config.toml` и задайте переменные `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, `SUPABASE_AUTH_EXTERNAL_SPOTIFY_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_SPOTIFY_SECRET`.
4. Добавьте `https://<ваш-домен>/auth/callback` в Supabase → Authentication → URL Configuration → Redirect URLs.

## Деплой

1. Создайте проект в Supabase и примените миграции: `pnpm supabase link --project-ref <ref> && pnpm supabase db push`.
2. Импортируйте репозиторий в Vercel и задайте переменные из `.env.example` (`SUPABASE_SECRET_KEY` — только на сервере).
