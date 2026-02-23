-- PME Challenge - Row Level Security Policies

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get user's team id
CREATE OR REPLACE FUNCTION public.get_user_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ========================
-- PROFILES
-- ========================
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (public.is_admin());

-- ========================
-- TEAMS
-- ========================
CREATE POLICY "teams_select_all" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_insert_admin" ON public.teams FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "teams_update_admin" ON public.teams FOR UPDATE USING (public.is_admin());
CREATE POLICY "teams_delete_admin" ON public.teams FOR DELETE USING (public.is_admin());

-- ========================
-- TEAM MEMBERS
-- ========================
CREATE POLICY "team_members_select_own_team" ON public.team_members FOR SELECT USING (
  team_id = public.get_user_team_id() OR public.is_admin()
);
CREATE POLICY "team_members_insert_admin" ON public.team_members FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "team_members_update_admin" ON public.team_members FOR UPDATE USING (public.is_admin());
CREATE POLICY "team_members_delete_admin" ON public.team_members FOR DELETE USING (public.is_admin());

-- ========================
-- EVENTS (public read, admin write)
-- ========================
CREATE POLICY "events_select_all" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert_admin" ON public.events FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "events_update_admin" ON public.events FOR UPDATE USING (public.is_admin());
CREATE POLICY "events_delete_admin" ON public.events FOR DELETE USING (public.is_admin());

-- ========================
-- EVENT OPTIONS (public read, admin write)
-- ========================
CREATE POLICY "event_options_select_all" ON public.event_options FOR SELECT USING (true);
CREATE POLICY "event_options_insert_admin" ON public.event_options FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "event_options_update_admin" ON public.event_options FOR UPDATE USING (public.is_admin());
CREATE POLICY "event_options_delete_admin" ON public.event_options FOR DELETE USING (public.is_admin());

-- ========================
-- GAME SESSIONS
-- ========================
CREATE POLICY "game_sessions_select_all" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "game_sessions_insert_admin" ON public.game_sessions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "game_sessions_update_admin" ON public.game_sessions FOR UPDATE USING (public.is_admin());
CREATE POLICY "game_sessions_delete_admin" ON public.game_sessions FOR DELETE USING (public.is_admin());

-- ========================
-- SESSION EVENTS
-- ========================
CREATE POLICY "session_events_select_all" ON public.session_events FOR SELECT USING (true);
CREATE POLICY "session_events_insert_admin" ON public.session_events FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "session_events_update_admin" ON public.session_events FOR UPDATE USING (public.is_admin());
CREATE POLICY "session_events_delete_admin" ON public.session_events FOR DELETE USING (public.is_admin());

-- ========================
-- DECISIONS
-- ========================
CREATE POLICY "decisions_select_own_team" ON public.decisions FOR SELECT USING (
  team_id = public.get_user_team_id() OR public.is_admin()
);
CREATE POLICY "decisions_insert_own_team" ON public.decisions FOR INSERT WITH CHECK (
  team_id = public.get_user_team_id() OR public.is_admin()
);
CREATE POLICY "decisions_update_own_team" ON public.decisions FOR UPDATE USING (
  team_id = public.get_user_team_id() OR public.is_admin()
);

-- ========================
-- VOTES
-- ========================
CREATE POLICY "votes_select_own_team" ON public.votes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.decisions d
    WHERE d.id = decision_id AND (d.team_id = public.get_user_team_id() OR public.is_admin())
  )
);
CREATE POLICY "votes_insert_own" ON public.votes FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "votes_update_own" ON public.votes FOR UPDATE USING (
  auth.uid() = user_id
);

-- ========================
-- TEAM SCORES
-- ========================
CREATE POLICY "team_scores_select_all" ON public.team_scores FOR SELECT USING (true);
CREATE POLICY "team_scores_insert_admin" ON public.team_scores FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "team_scores_update_admin" ON public.team_scores FOR UPDATE USING (public.is_admin());
CREATE POLICY "team_scores_insert_system" ON public.team_scores FOR INSERT WITH CHECK (
  team_id = public.get_user_team_id()
);
