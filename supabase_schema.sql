-- ==============================================================================
-- SimpleLabel MVP - Supabase SQL Schema (Name-based Authentication)
-- Project: https://oqigkuywngvhzrisjkuo.supabase.co
-- ==============================================================================

-- 1. Create table: members
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for name
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members(name);

-- 2. Create table: assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id TEXT NOT NULL UNIQUE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    member_name TEXT,
    text TEXT NOT NULL,
    manual_label TEXT CHECK (manual_label IN ('POSITIVE', 'NEGATIVE') OR manual_label IS NULL),
    labeled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for assignments
CREATE INDEX IF NOT EXISTS idx_assignments_member_id ON public.assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_assignments_member_name ON public.assignments(member_name);
CREATE INDEX IF NOT EXISTS idx_assignments_record_id ON public.assignments(record_id);
CREATE INDEX IF NOT EXISTS idx_assignments_manual_label ON public.assignments(manual_label);

-- 3. Create table: llm_results
CREATE TABLE IF NOT EXISTS public.llm_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id TEXT NOT NULL UNIQUE,
    llm_label TEXT NOT NULL CHECK (llm_label IN ('POSITIVE', 'NEGATIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for llm_results
CREATE INDEX IF NOT EXISTS idx_llm_results_record_id ON public.llm_results(record_id);

-- ==============================================================================
-- Row Level Security (RLS) & Policies
-- ==============================================================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_results ENABLE ROW LEVEL SECURITY;

-- Anonymous (Public) access policies for the SimpleLabel MVP
-- Members policies
DROP POLICY IF EXISTS "Public select members" ON public.members;
CREATE POLICY "Public select members" ON public.members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert members" ON public.members;
CREATE POLICY "Public insert members" ON public.members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete members" ON public.members;
CREATE POLICY "Public delete members" ON public.members FOR DELETE USING (true);

-- Assignments policies
DROP POLICY IF EXISTS "Public select assignments" ON public.assignments;
CREATE POLICY "Public select assignments" ON public.assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert assignments" ON public.assignments;
CREATE POLICY "Public insert assignments" ON public.assignments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update assignments" ON public.assignments;
CREATE POLICY "Public update assignments" ON public.assignments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete assignments" ON public.assignments;
CREATE POLICY "Public delete assignments" ON public.assignments FOR DELETE USING (true);

-- LLM results policies
DROP POLICY IF EXISTS "Public select llm_results" ON public.llm_results;
CREATE POLICY "Public select llm_results" ON public.llm_results FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert llm_results" ON public.llm_results;
CREATE POLICY "Public insert llm_results" ON public.llm_results FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete llm_results" ON public.llm_results;
CREATE POLICY "Public delete llm_results" ON public.llm_results FOR DELETE USING (true);
