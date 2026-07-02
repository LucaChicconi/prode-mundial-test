CREATE OR REPLACE FUNCTION lock_expired_matches()
RETURNS void AS $$
BEGIN
  UPDATE matches
  SET locked = true
  WHERE match_time <= NOW() AND locked = false;

  UPDATE knockout_matches
  SET locked = true
  WHERE match_time <= NOW() AND locked = false;
END;
$$ LANGUAGE plpgsql;