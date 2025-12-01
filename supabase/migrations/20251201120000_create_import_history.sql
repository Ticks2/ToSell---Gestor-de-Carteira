CREATE TABLE IF NOT EXISTS public.import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('Arquivo CSV', 'Texto Colado')),
    status TEXT NOT NULL CHECK (status IN ('Sucesso', 'Sucesso Parcial', 'Falha')),
    total_records INTEGER NOT NULL DEFAULT 0,
    imported_records INTEGER NOT NULL DEFAULT 0,
    failed_records INTEGER NOT NULL DEFAULT 0,
    error_details JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for authenticated users" ON public.import_history
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
