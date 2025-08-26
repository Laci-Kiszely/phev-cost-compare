-- Remove the public INSERT policy (security risk)
DROP POLICY IF EXISTS "Allow feedback submissions (anon + authenticated)" ON public."Feedback_Collecting_DB";

-- Add length constraints to prevent spam and protect database
ALTER TABLE public."Feedback_Collecting_DB" 
ADD CONSTRAINT check_name_length CHECK (char_length(name_of_poster) <= 100);

ALTER TABLE public."Feedback_Collecting_DB" 
ADD CONSTRAINT check_email_length CHECK (char_length(email_of_poster) <= 255);

ALTER TABLE public."Feedback_Collecting_DB" 
ADD CONSTRAINT check_title_length CHECK (char_length(title_feedback) <= 200);

ALTER TABLE public."Feedback_Collecting_DB" 
ADD CONSTRAINT check_feedback_length CHECK (char_length(comment_feedback) <= 2000);

-- Add constraint to ensure email format (basic validation)
ALTER TABLE public."Feedback_Collecting_DB" 
ADD CONSTRAINT check_email_format CHECK (email_of_poster ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');