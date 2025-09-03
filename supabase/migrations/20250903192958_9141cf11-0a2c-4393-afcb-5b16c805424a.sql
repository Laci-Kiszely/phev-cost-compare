-- Enable public read access to Vehicle_Database
ALTER TABLE public."Vehicle_Database" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read vehicle data (since this is reference data)
CREATE POLICY "Allow public read access to vehicles" 
ON public."Vehicle_Database" 
FOR SELECT 
USING (true);