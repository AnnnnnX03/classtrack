-- ============================================================
-- ClassTrack — Full Database Schema (with Auth & Roles)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. STUDENTS
create table students (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  parent_name       text,
  email             text,
  total_credits     int not null default 0,
  remaining_credits int not null default 0,
  created_at        timestamp with time zone default now()
);

-- 2. PAYMENTS
create table payments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  credits_added int not null,
  payment_date  date not null default current_date,
  created_at    timestamp with time zone default now()
);

-- 3. ATTENDANCE
create table attendance (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  date         date not null default current_date,
  class_name   text default 'Class',
  credits_used int not null default 1,
  created_at   timestamp with time zone default now()
);

-- 4. USER ROLES  (links Supabase Auth users to a role)
create table user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'teacher', 'parent')),
  created_at timestamp with time zone default now(),
  unique(user_id)
);

-- 5. PARENT → STUDENT links
create table parent_students (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  unique(user_id, student_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_payments_student      on payments(student_id);
create index idx_attendance_student    on attendance(student_id);
create index idx_attendance_date       on attendance(date);
create index idx_user_roles_user       on user_roles(user_id);
create index idx_parent_students_user  on parent_students(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table students       enable row level security;
alter table payments       enable row level security;
alter table attendance     enable row level security;
alter table user_roles     enable row level security;
alter table parent_students enable row level security;

-- Helper function: get current user's role
create or replace function get_my_role()
returns text language sql security definer as $$
  select role from user_roles where user_id = auth.uid() limit 1;
$$;

-- STUDENTS policies
create policy "Teachers/admins see all students" on students for select
  using (get_my_role() in ('teacher', 'admin'));

create policy "Parents see their linked student" on students for select
  using (exists (
    select 1 from parent_students
    where user_id = auth.uid() and student_id = students.id
  ));

create policy "Admins insert students" on students for insert
  with check (get_my_role() = 'admin');

create policy "Admins update students" on students for update
  using (get_my_role() = 'admin');

-- ATTENDANCE policies
create policy "Teachers/admins see all attendance" on attendance for select
  using (get_my_role() in ('teacher', 'admin'));

create policy "Parents see their child attendance" on attendance for select
  using (exists (
    select 1 from parent_students ps
    where ps.user_id = auth.uid() and ps.student_id = attendance.student_id
  ));

create policy "Teachers/admins insert attendance" on attendance for insert
  with check (get_my_role() in ('teacher', 'admin'));

create policy "Teachers/admins delete attendance" on attendance for delete
  using (get_my_role() in ('teacher', 'admin'));

-- PAYMENTS policies
create policy "Teachers/admins see all payments" on payments for select
  using (get_my_role() in ('teacher', 'admin'));

create policy "Parents see their child payments" on payments for select
  using (exists (
    select 1 from parent_students ps
    where ps.user_id = auth.uid() and ps.student_id = payments.student_id
  ));

create policy "Admins insert payments" on payments for insert
  with check (get_my_role() = 'admin');

-- USER_ROLES policies (users can only see their own role)
create policy "Users see own role" on user_roles for select
  using (user_id = auth.uid());

-- PARENT_STUDENTS policies
create policy "Users see own links" on parent_students for select
  using (user_id = auth.uid());

create policy "Admins manage links" on parent_students for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ============================================================
-- HOW TO ASSIGN ROLES (run after users sign up)
-- ============================================================
-- Find user UUID in Supabase → Authentication → Users
-- Then run:
--
-- Make someone an admin:
--   insert into user_roles (user_id, role) values ('USER-UUID-HERE', 'admin');
--
-- Make someone a teacher:
--   insert into user_roles (user_id, role) values ('USER-UUID-HERE', 'teacher');
--
-- Link a parent to their child:
--   insert into parent_students (user_id, student_id)
--   values ('PARENT-UUID', 'STUDENT-UUID');
--   (get student UUID from the students table)
