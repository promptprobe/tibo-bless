UPDATE monitor_sync_state
SET last_attempt_at = NULL,
    last_error = NULL
WHERE id = 'latest';
