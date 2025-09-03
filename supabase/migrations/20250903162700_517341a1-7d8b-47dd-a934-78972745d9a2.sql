-- Enable Row Level Security on Feedback_Collecting_DB table (correct case)
ALTER TABLE public."Feedback_Collecting_DB" ENABLE ROW LEVEL SECURITY;

-- Create policy to prevent public access to feedback data
-- Only service role can access (edge function will continue to work)
CREATE POLICY "Restrict feedback access" 
ON public."Feedback_Collecting_DB" 
FOR ALL 
USING (false);