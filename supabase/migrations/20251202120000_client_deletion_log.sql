CREATE TABLE IF NOT EXISTS public.deleted_clients_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_client_id UUID,
    user_id UUID,
    full_name TEXT,
    birth_date DATE,
    city TEXT,
    phone TEXT,
    email TEXT,
    status TEXT,
    original_created_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.deleted_clients_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deleted clients logs" ON public.deleted_clients_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION log_deleted_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.deleted_clients_log (
        original_client_id,
        user_id,
        full_name,
        birth_date,
        city,
        phone,
        email,
        status,
        original_created_at
    ) VALUES (
        OLD.id,
        OLD.user_id,
        OLD.full_name,
        OLD.birth_date,
        OLD.city,
        OLD.phone,
        OLD.email,
        OLD.status,
        OLD.created_at
    );
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_client_delete ON public.clients;
CREATE TRIGGER on_client_delete
    BEFORE DELETE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION log_deleted_client();
