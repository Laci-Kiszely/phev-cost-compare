-- Add RLS policy to allow public read access to Default_Parameters
CREATE POLICY "Allow public read access to default parameters" 
ON "Default_Parameters" 
FOR SELECT 
USING (true);