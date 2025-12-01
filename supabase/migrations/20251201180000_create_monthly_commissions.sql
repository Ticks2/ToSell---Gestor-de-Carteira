CREATE TABLE IF NOT EXISTS monthly_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    bonus NUMERIC DEFAULT 0,
    returns NUMERIC DEFAULT 0,
    transfers NUMERIC DEFAULT 0,
    surplus NUMERIC DEFAULT 0,
    extras NUMERIC DEFAULT 0,
    salary NUMERIC DEFAULT 1991,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, month, year)
);

ALTER TABLE monthly_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commissions" ON monthly_commissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commissions" ON monthly_commissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commissions" ON monthly_commissions
    FOR UPDATE USING (auth.uid() = user_id);
