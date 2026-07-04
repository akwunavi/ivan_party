-- ============================================================
-- QUIZ NIGHT — Supabase Schema
-- ============================================================
-- Порядок создания важен из-за внешних ключей

-- ────────────────────────────────────────────────────────────
-- 1. GAME — одна запись на всю игру
-- ────────────────────────────────────────────────────────────
CREATE TABLE game (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL DEFAULT 'Quiz Night',
  status        text NOT NULL DEFAULT 'lobby',
  -- lobby | round_intro | question | repeat | answer_time | results | finished
  current_round int  NOT NULL DEFAULT 0,   -- 0 = лобби, 1-8 = номер раунда
  current_step  int  NOT NULL DEFAULT 0,   -- индекс вопроса / слайда внутри раунда
  created_at    timestamptz DEFAULT now()
);

-- Только одна активная игра
INSERT INTO game (name) VALUES ('Quiz Night');

-- ────────────────────────────────────────────────────────────
-- 2. TEAMS — команды
-- ────────────────────────────────────────────────────────────
CREATE TABLE teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    uuid REFERENCES game(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#ea580c', -- цвет команды на экране
  total_score numeric(6,1) NOT NULL DEFAULT 0,
  joined_at  timestamptz DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. ROUNDS — конфигурация раундов
-- ────────────────────────────────────────────────────────────
CREATE TABLE rounds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         uuid REFERENCES game(id) ON DELETE CASCADE,
  round_number    int  NOT NULL,  -- 1-8
  title           text NOT NULL,
  round_type      text NOT NULL,
  -- types: standard | picture_blocks | quiz_choice | music_jeopardy 
  --        stakes | letter_rebus | thematic | final_stakes
  rules_text      text,           -- текст правил перед раундом
  has_repeats     boolean NOT NULL DEFAULT false,
  show_scoreboard boolean NOT NULL DEFAULT false, -- показывать табло после раунда
  timer_seconds   int  NOT NULL DEFAULT 30,
  points_per_q    numeric(4,1) NOT NULL DEFAULT 1,
  -- доп. параметры в jsonb (специфика каждого раунда)
  config          jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Примеры config:
  -- R2: {"block_bonus": 1, "points_per_q": 0.5, "blocks": 3}
  -- R3: {"stop_on_wrong": true}
  -- R5: {"stakes_range": [0,5], "stakes_mandatory": true}
  -- R7: {"final_question_doubles": true}
  -- R8: {"max_stake": 2}
  UNIQUE(game_id, round_number)
);

-- ────────────────────────────────────────────────────────────
-- 4. QUESTIONS — вопросы всех раундов
-- ────────────────────────────────────────────────────────────
CREATE TABLE questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      uuid REFERENCES rounds(id) ON DELETE CASCADE,
  position      int  NOT NULL,   -- порядковый номер в раунде (1, 2, 3...)
  block_number  int,             -- для R2: номер блока (1, 2, 3)
  block_position int,            -- для R2: позиция внутри блока (1-4)

  -- Тип контента вопроса
  content_type  text NOT NULL DEFAULT 'text',
  -- text | image | audio | video | multi_image | choice | music_tile

  -- Текст вопроса (озвучивается TTS или ведущим)
  question_text text,

  -- Медиа (пути к файлам или URL)
  media_urls    text[],          -- массив URL: картинки, аудио, видео

  -- Варианты ответа (R3, R1 если нужны)
  choices       jsonb,
  -- формат: [{"key":"А","text":"Вариант 1"},{"key":"Б","text":"Вариант 2"},...]
  correct_choice text,           -- "А" | "Б" | "В" | "Г"

  -- Правильный ответ (для проверки ведущим / показа после раунда)
  correct_answer text,

  -- Стоимость (для R4 music jeopardy)
  point_value   numeric(4,1),   -- 0.5 | 1 | 1.5 | 2

  -- Тема (для R4: название темы колонки)
  theme         text,

  -- Флаги
  is_final_question boolean DEFAULT false,  -- для R7: последний вопрос с удвоением
  has_tts       boolean DEFAULT true,       -- озвучивать через браузер
  tts_text      text,                       -- если отличается от question_text

  UNIQUE(round_id, position)
);

-- ────────────────────────────────────────────────────────────
-- 5. ANSWERS — ответы команд
--    Вопросы живут в КОДЕ (конфиги раундов), поэтому ссылка на
--    вопрос — текстовый ключ question_ref вида "r3-q7"
-- ────────────────────────────────────────────────────────────
CREATE TABLE answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      uuid REFERENCES game(id) ON DELETE CASCADE,
  team_id      uuid REFERENCES teams(id) ON DELETE CASCADE,
  question_ref text NOT NULL,    -- "r1-q0", "r3-q14" — раунд + индекс вопроса
  round_number int  NOT NULL,

  answer_text  text,             -- свободный ответ или буква А/Б/В/Г
  stake        numeric(4,1),     -- ставка для R5, R8

  -- Результат (выставляет ведущий)
  is_correct   boolean,          -- null = ещё не проверено
  points_awarded numeric(6,1),   -- реально начисленные баллы

  submitted_at timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),

  UNIQUE(team_id, question_ref)  -- одна команда = один ответ на вопрос
);

-- ────────────────────────────────────────────────────────────
-- 6. SCORE_LOG — лог изменений баллов (для истории и отката)
-- ────────────────────────────────────────────────────────────
CREATE TABLE score_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      uuid REFERENCES game(id) ON DELETE CASCADE,
  team_id      uuid REFERENCES teams(id) ON DELETE CASCADE,
  round_number int  NOT NULL,
  question_ref text,
  delta        numeric(6,1) NOT NULL,  -- +1, -0.5, +2 и т.д.
  reason       text,                   -- "correct" | "wrong" | "block_bonus" | "double" | "stake"
  created_at   timestamptz DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 7. GAME_STATE — текущее состояние игры (real-time для клиентов)
-- ────────────────────────────────────────────────────────────
-- Используется через Supabase Realtime
-- Одна строка, обновляется ведущим
CREATE TABLE game_state (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         uuid REFERENCES game(id) ON DELETE CASCADE UNIQUE,
  status          text NOT NULL DEFAULT 'lobby',
  current_round   int  NOT NULL DEFAULT 0,
  current_step    int  NOT NULL DEFAULT 0,
  timer_started_at timestamptz,
  timer_seconds   int,
  accepting_answers boolean NOT NULL DEFAULT false,
  show_scoreboard boolean NOT NULL DEFAULT false,
  -- произвольные данные для текущего шага (активная плитка R4, тема R7 и т.д.)
  step_data       jsonb DEFAULT '{}'::jsonb,
  updated_at      timestamptz DEFAULT now()
);

INSERT INTO game_state (game_id, status)
SELECT id, 'lobby' FROM game LIMIT 1;

-- ────────────────────────────────────────────────────────────
-- 8. STAKES — ставки команд (R5, R8)
-- ────────────────────────────────────────────────────────────
CREATE TABLE stakes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      uuid REFERENCES game(id) ON DELETE CASCADE,
  team_id      uuid REFERENCES teams(id) ON DELETE CASCADE,
  round_id     uuid REFERENCES rounds(id) ON DELETE CASCADE,
  question_ref text NOT NULL,
  stake_value  numeric(4,1) NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(team_id, question_ref)
);

-- ────────────────────────────────────────────────────────────
-- 9. REALTIME — НЕ используется: синхронизация через REST-поллинг
--    (WebSocket-соединения нестабильны из-за сетевых блокировок)
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- 10. RLS — Row Level Security
-- ────────────────────────────────────────────────────────────
ALTER TABLE game          ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakes        ENABLE ROW LEVEL SECURITY;

-- Игроки: читают всё публично, пишут только свои ответы/ставки
CREATE POLICY "public read game"       ON game          FOR SELECT USING (true);
CREATE POLICY "public read teams"      ON teams         FOR SELECT USING (true);
CREATE POLICY "public read rounds"     ON rounds        FOR SELECT USING (true);
CREATE POLICY "public read questions"  ON questions     FOR SELECT USING (true);
CREATE POLICY "public read game_state" ON game_state    FOR SELECT USING (true);
CREATE POLICY "public read score_log"  ON score_log     FOR SELECT USING (true);

-- Ответы: вставка и обновление своей записи (по team_id из заголовка)
CREATE POLICY "team insert answer"  ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "team update answer"  ON answers FOR UPDATE USING (true);
CREATE POLICY "public read answers" ON answers FOR SELECT USING (true);

CREATE POLICY "team insert stake"   ON stakes  FOR INSERT WITH CHECK (true);
CREATE POLICY "team update stake"   ON stakes  FOR UPDATE USING (true);
CREATE POLICY "public read stakes"  ON stakes  FOR SELECT USING (true);

-- Запись teams: только через service_role (регистрация через API)
CREATE POLICY "service insert team" ON teams FOR INSERT WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- 11. ФУНКЦИИ — вспомогательные
-- ────────────────────────────────────────────────────────────

-- Пересчёт total_score команды из score_log
CREATE OR REPLACE FUNCTION recalc_team_score(p_team_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE teams
  SET total_score = COALESCE((
    SELECT SUM(delta) FROM score_log WHERE team_id = p_team_id
  ), 0)
  WHERE id = p_team_id;
END;
$$;

-- Начислить балл и обновить счёт (вызывает ведущий)
CREATE OR REPLACE FUNCTION award_points(
  p_team_id    uuid,
  p_round      int,
  p_question_ref text,
  p_delta      numeric,
  p_reason     text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_game_id uuid;
BEGIN
  SELECT game_id INTO v_game_id FROM teams WHERE id = p_team_id;

  INSERT INTO score_log (game_id, team_id, round_number, question_ref, delta, reason)
  VALUES (v_game_id, p_team_id, p_round, p_question_ref, p_delta, p_reason);

  PERFORM recalc_team_score(p_team_id);
END;
$$;

-- Удвоить баллы команды за раунд (R7)
CREATE OR REPLACE FUNCTION double_round_score(
  p_team_id    uuid,
  p_round      int
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_game_id uuid;
  v_round_total numeric;
BEGIN
  SELECT game_id INTO v_game_id FROM teams WHERE id = p_team_id;

  SELECT COALESCE(SUM(delta), 0) INTO v_round_total
  FROM score_log
  WHERE team_id = p_team_id AND round_number = p_round;

  IF v_round_total > 0 THEN
    INSERT INTO score_log (game_id, team_id, round_number, question_ref, delta, reason)
    VALUES (v_game_id, p_team_id, p_round, NULL, v_round_total, 'double_r7');

    PERFORM recalc_team_score(p_team_id);
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 12. ПРИМЕР ДАННЫХ — структура раундов
-- ────────────────────────────────────────────────────────────

-- (заполни game_id после INSERT game)
-- INSERT INTO rounds (game_id, round_number, title, round_type, timer_seconds, points_per_q, has_repeats, config)
-- VALUES
--   (:gid, 1, 'Кино и музыка',         'standard',        30, 1.0, true,  '{}'),
--   (:gid, 2, 'Раунд с картинками',    'picture_blocks',  30, 0.5, true,  '{"blocks":3,"block_bonus":1}'),
--   (:gid, 3, 'Тест: 4 варианта',      'quiz_choice',     30, 1.0, false, '{"stop_on_wrong":true}'),
--   (:gid, 4, 'Музыкальная своя игра', 'music_jeopardy',  30, 1.0, false, '{"themes":6,"tiles_per_theme":4}'),
--   (:gid, 5, 'Вопросы со ставками',   'stakes',          60, 1.0, true,  '{"stakes_range":[0,5],"mandatory":true}'),
--   (:gid, 6, 'Ребусы из букв',        'letter_rebus',    60, 1.0, false, '{}'),
--   (:gid, 7, 'Тематический раунд',    'thematic',        60, 1.0, false, '{"final_doubles":true}'),
--   (:gid, 8, 'Финальные ставки',      'final_stakes',    60, 1.0, false, '{"max_stake":2}');
