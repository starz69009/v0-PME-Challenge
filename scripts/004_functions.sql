-- PME Challenge - Database Functions & Triggers

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'team_member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate and insert team scores after a decision is validated
CREATE OR REPLACE FUNCTION public.calculate_team_scores(
  p_decision_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_team_id UUID;
  v_session_id UUID;
  v_session_event_id UUID;
  v_option_id UUID;
  v_prev_social INT DEFAULT 0;
  v_prev_commercial INT DEFAULT 0;
  v_prev_tresorerie INT DEFAULT 0;
  v_prev_production INT DEFAULT 0;
  v_prev_reglementaire INT DEFAULT 0;
  v_new_social INT;
  v_new_commercial INT;
  v_new_tresorerie INT;
  v_new_production INT;
  v_new_reglementaire INT;
  v_new_moyenne NUMERIC(6,2);
  v_count INT;
  v_sum INT;
BEGIN
  -- Get decision details
  SELECT d.team_id, se.session_id, d.session_event_id, d.proposed_option_id
  INTO v_team_id, v_session_id, v_session_event_id, v_option_id
  FROM public.decisions d
  JOIN public.session_events se ON se.id = d.session_event_id
  WHERE d.id = p_decision_id AND d.status = 'validated';

  IF v_team_id IS NULL THEN
    RETURN;
  END IF;

  -- Get previous cumulative scores
  SELECT COALESCE(ts.points_social, 0), COALESCE(ts.points_commercial, 0),
         COALESCE(ts.points_tresorerie, 0), COALESCE(ts.points_production, 0),
         COALESCE(ts.points_reglementaire, 0)
  INTO v_prev_social, v_prev_commercial, v_prev_tresorerie, v_prev_production, v_prev_reglementaire
  FROM public.team_scores ts
  WHERE ts.team_id = v_team_id AND ts.session_id = v_session_id
  ORDER BY ts.created_at DESC
  LIMIT 1;

  -- Add the option's points
  SELECT
    v_prev_social + eo.points_social,
    v_prev_commercial + eo.points_commercial,
    v_prev_tresorerie + eo.points_tresorerie,
    v_prev_production + eo.points_production,
    v_prev_reglementaire + eo.points_reglementaire
  INTO v_new_social, v_new_commercial, v_new_tresorerie, v_new_production, v_new_reglementaire
  FROM public.event_options eo
  WHERE eo.id = v_option_id;

  -- Calculate moyenne (average of all 5 categories)
  v_sum := v_new_social + v_new_commercial + v_new_tresorerie + v_new_production + v_new_reglementaire;
  v_new_moyenne := v_sum / 5.0;

  -- Insert new score snapshot
  INSERT INTO public.team_scores (team_id, session_id, session_event_id, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne)
  VALUES (v_team_id, v_session_id, v_session_event_id, v_new_social, v_new_commercial, v_new_tresorerie, v_new_production, v_new_reglementaire, v_new_moyenne);
END;
$$;
