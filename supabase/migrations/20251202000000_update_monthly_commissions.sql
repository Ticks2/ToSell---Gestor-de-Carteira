-- Add Unique Constraint to allow proper upserts
CREATE UNIQUE INDEX IF NOT EXISTS monthly_commissions_user_month_year_idx 
ON public.monthly_commissions (user_id, month, year);

-- Set default value for salary to 0
ALTER TABLE public.monthly_commissions 
ALTER COLUMN salary SET DEFAULT 0;

-- Optional: Update existing null salaries to 0?
-- UPDATE public.monthly_commissions SET salary = 0 WHERE salary IS NULL;
