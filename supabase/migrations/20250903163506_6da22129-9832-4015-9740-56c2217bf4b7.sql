-- Add database constraints and improve security
-- Add length constraints to Feedback_Collecting_DB table
ALTER TABLE public."Feedback_Collecting_DB" 
ADD CONSTRAINT name_length_check CHECK (length(name_of_poster) <= 100),
ADD CONSTRAINT email_length_check CHECK (length(email_of_poster) <= 255),
ADD CONSTRAINT title_length_check CHECK (title_feedback IS NULL OR length(title_feedback) <= 200),
ADD CONSTRAINT feedback_length_check CHECK (length(comment_feedback) <= 2000);

-- Ensure proper not null constraints for required fields
ALTER TABLE public."Feedback_Collecting_DB" 
ALTER COLUMN name_of_poster SET NOT NULL,
ALTER COLUMN email_of_poster SET NOT NULL,
ALTER COLUMN comment_feedback SET NOT NULL;

-- Update defaults to empty strings for required fields
ALTER TABLE public."Feedback_Collecting_DB" 
ALTER COLUMN name_of_poster SET DEFAULT '',
ALTER COLUMN email_of_poster SET DEFAULT '',
ALTER COLUMN comment_feedback SET DEFAULT '';

-- Add email format validation using a proper regex pattern
ALTER TABLE public."Feedback_Collecting_DB" 
ADD CONSTRAINT email_format_check CHECK (email_of_poster ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');