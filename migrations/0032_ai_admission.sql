-- Fixed-window, per-user admission counters shared by all Worker instances.
CREATE TABLE ai_user_admission (
    user_id INTEGER NOT NULL,
    window_start INTEGER NOT NULL,
    request_count INTEGER NOT NULL CHECK (request_count > 0),
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
