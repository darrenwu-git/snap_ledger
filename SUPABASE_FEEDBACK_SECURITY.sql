-- Enforce message length limit for feedback
ALTER TABLE feedback 
ADD CONSTRAINT feedback_message_length_check 
CHECK (char_length(message) <= 500);

-- Optional: Add comment
COMMENT ON COLUMN feedback.message IS 'User feedback message, max 500 chars';
