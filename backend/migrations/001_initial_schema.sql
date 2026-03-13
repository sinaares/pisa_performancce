-- ============================================================================
-- 001_initial_schema.sql
-- Supabase / PostgreSQL migration for the PISA Performance app
-- ============================================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- or via the Supabase CLI:  supabase db push
-- ============================================================================

-- Enable the uuid-ossp extension (usually already enabled in Supabase)
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. teachers
-- ============================================================================
create table public.teachers (
    id           uuid primary key references auth.users (id) on delete cascade,
    email        text not null unique,
    display_name text,
    created_at   timestamptz not null default now()
);

comment on table public.teachers is
    'Teacher profiles, linked 1-to-1 with Supabase auth.users.';

-- ============================================================================
-- 2. students
-- ============================================================================
create table public.students (
    id           uuid primary key default uuid_generate_v4(),
    teacher_id   uuid not null references public.teachers (id) on delete cascade,
    first_name   text not null,
    last_name    text not null,
    student_code text,                          -- optional school-issued code
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    archived     boolean not null default false
);

create index idx_students_teacher on public.students (teacher_id);

comment on table public.students is
    'Students managed by a teacher. Soft-deleted via the archived flag.';

-- ============================================================================
-- 3. student_profiles
-- ============================================================================
create table public.student_profiles (
    id           uuid primary key default uuid_generate_v4(),
    student_id   uuid not null references public.students (id) on delete cascade,
    profile_data jsonb not null default '{}'::jsonb,   -- PISA indicator values
    updated_at   timestamptz not null default now(),
    updated_by   uuid not null references public.teachers (id) on delete set null
);

create index idx_student_profiles_student on public.student_profiles (student_id);

comment on table public.student_profiles is
    'JSONB store for the ~40 PISA indicators that feed the ML model.';
comment on column public.student_profiles.profile_data is
    'Keys are PISA variable names (ESCS, AGE, MATHEFF …), values are floats.';

-- ============================================================================
-- 4. predictions
-- ============================================================================
create table public.predictions (
    id                uuid primary key default uuid_generate_v4(),
    student_id        uuid not null references public.students (id) on delete cascade,
    prediction_result jsonb not null default '{}'::jsonb,   -- {ridge_score, xgb_score, …}
    model_version     text not null default 'v1',
    status            text not null default 'completed'
                          check (status in ('pending', 'completed', 'failed')),
    created_at        timestamptz not null default now(),
    created_by        uuid not null references public.teachers (id) on delete set null
);

create index idx_predictions_student on public.predictions (student_id);
create index idx_predictions_created on public.predictions (created_at desc);

comment on table public.predictions is
    'Each row is one prediction run (Ridge + XGBoost scores stored in JSONB).';

-- ============================================================================
-- 5. explanations
-- ============================================================================
create table public.explanations (
    id                   uuid primary key default uuid_generate_v4(),
    prediction_id        uuid not null references public.predictions (id) on delete cascade,
    explanation_data     jsonb not null default '{}'::jsonb,   -- full SHAP output
    top_positive_factors jsonb not null default '[]'::jsonb,   -- [{name, impact}, …]
    top_negative_factors jsonb not null default '[]'::jsonb,   -- [{name, impact}, …]
    created_at           timestamptz not null default now()
);

create index idx_explanations_prediction on public.explanations (prediction_id);

comment on table public.explanations is
    'SHAP-based explanations linked to a specific prediction.';
comment on column public.explanations.top_positive_factors is
    'Pre-computed top-N factors that push the score UP (for quick UI display).';
comment on column public.explanations.top_negative_factors is
    'Pre-computed top-N factors that push the score DOWN.';

-- ============================================================================
-- 6. chat_sessions
-- ============================================================================
create table public.chat_sessions (
    id          uuid primary key default uuid_generate_v4(),
    student_id  uuid not null references public.students (id) on delete cascade,
    teacher_id  uuid not null references public.teachers (id) on delete cascade,
    title       text not null default 'New conversation',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index idx_chat_sessions_student on public.chat_sessions (student_id);
create index idx_chat_sessions_teacher on public.chat_sessions (teacher_id);

comment on table public.chat_sessions is
    'A conversation thread between a teacher and the AI about a specific student.';

-- ============================================================================
-- 7. chat_messages
-- ============================================================================
create table public.chat_messages (
    id               uuid primary key default uuid_generate_v4(),
    session_id       uuid not null references public.chat_sessions (id) on delete cascade,
    role             text not null check (role in ('user', 'assistant')),
    content          text not null,
    context_snapshot jsonb,   -- nullable; snapshot of student data at message time
    created_at       timestamptz not null default now()
);

create index idx_chat_messages_session on public.chat_messages (session_id, created_at);

comment on table public.chat_messages is
    'Individual messages within a chat session.';
comment on column public.chat_messages.context_snapshot is
    'Optional snapshot of the student profile + prediction at the time of this message, '
    'so past conversations remain interpretable even if the student data changes.';

-- ============================================================================
-- 8. teacher_notes
-- ============================================================================
create table public.teacher_notes (
    id          uuid primary key default uuid_generate_v4(),
    student_id  uuid not null references public.students (id) on delete cascade,
    teacher_id  uuid not null references public.teachers (id) on delete cascade,
    content     text not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index idx_teacher_notes_student on public.teacher_notes (student_id);

comment on table public.teacher_notes is
    'Free-form notes a teacher writes about a student.';

-- ============================================================================
-- 9. student_summaries
-- ============================================================================
create table public.student_summaries (
    id             uuid primary key default uuid_generate_v4(),
    student_id     uuid not null references public.students (id) on delete cascade,
    summary_text   text not null,
    generated_from text not null default 'prediction',   -- e.g. 'prediction', 'chat', 'manual'
    created_at     timestamptz not null default now()
);

create index idx_student_summaries_student on public.student_summaries (student_id);

comment on table public.student_summaries is
    'AI-generated or manual summaries of a student''s performance profile.';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
-- Enable RLS on every table so Supabase enforces access control.

alter table public.teachers          enable row level security;
alter table public.students          enable row level security;
alter table public.student_profiles  enable row level security;
alter table public.predictions       enable row level security;
alter table public.explanations      enable row level security;
alter table public.chat_sessions     enable row level security;
alter table public.chat_messages     enable row level security;
alter table public.teacher_notes     enable row level security;
alter table public.student_summaries enable row level security;

-- Teachers can only see/modify their own row
create policy teachers_own on public.teachers
    for all using (id = auth.uid());

-- Teachers can only see/modify students they created
create policy students_own on public.students
    for all using (teacher_id = auth.uid());

-- Profiles: teacher must own the student
create policy profiles_own on public.student_profiles
    for all using (
        student_id in (select id from public.students where teacher_id = auth.uid())
    );

-- Predictions: teacher must own the student
create policy predictions_own on public.predictions
    for all using (created_by = auth.uid());

-- Explanations: teacher must own the prediction
create policy explanations_own on public.explanations
    for all using (
        prediction_id in (select id from public.predictions where created_by = auth.uid())
    );

-- Chat sessions: teacher must own the session
create policy chat_sessions_own on public.chat_sessions
    for all using (teacher_id = auth.uid());

-- Chat messages: teacher must own the session
create policy chat_messages_own on public.chat_messages
    for all using (
        session_id in (select id from public.chat_sessions where teacher_id = auth.uid())
    );

-- Teacher notes: teacher must own the note
create policy teacher_notes_own on public.teacher_notes
    for all using (teacher_id = auth.uid());

-- Student summaries: teacher must own the student
create policy student_summaries_own on public.student_summaries
    for all using (
        student_id in (select id from public.students where teacher_id = auth.uid())
    );

-- ============================================================================
-- Auto-update updated_at triggers
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_students_updated_at
    before update on public.students
    for each row execute function public.set_updated_at();

create trigger trg_student_profiles_updated_at
    before update on public.student_profiles
    for each row execute function public.set_updated_at();

create trigger trg_chat_sessions_updated_at
    before update on public.chat_sessions
    for each row execute function public.set_updated_at();

create trigger trg_teacher_notes_updated_at
    before update on public.teacher_notes
    for each row execute function public.set_updated_at();
