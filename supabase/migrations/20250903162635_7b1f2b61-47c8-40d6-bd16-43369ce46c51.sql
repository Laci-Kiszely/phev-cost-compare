-- Enable Row Level Security on Feedback_Collecting_DB table
ALTER TABLE public.Feedback_Collecting_DB ENABLE ROW LEVEL SECURITY;

-- Create policy to prevent public access to feedback data
-- Only authenticated users with admin role would be able to read feedback
-- (For now, we'll create a restrictive policy that blocks all public access)
-- The edge function will still work because it uses service role key which bypasses RLS

CREATE POLICY "Restrict feedback access to authenticated users only" 
ON public.Feedback_Collecting_DB 
FOR ALL 
USING (false);

-- Note: This creates a very restrictive policy that blocks all access except via service role
-- If you need admins to access feedback, you would need to:
-- 1. Create a user roles system
-- 2. Create a policy that allows users with admin role to read feedback
-- For now, this secures the data and feedback submission still works via edge function