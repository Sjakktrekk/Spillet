SELECT * FROM pg_proc WHERE proname LIKE 'increment_user_stat' OR proname LIKE 'add_to_user_stat_array';
