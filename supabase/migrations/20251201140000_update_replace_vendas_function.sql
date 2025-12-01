-- Update the import function to respect user isolation
CREATE OR REPLACE FUNCTION replace_vendas(p_vendas JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Delete only the current user's sales
    DELETE FROM public.vendas WHERE user_id = v_user_id;
    
    -- Insert new sales associated with the current user
    INSERT INTO public.vendas (
        data_venda, 
        carro, 
        ano_carro, 
        placa, 
        nome_cliente, 
        gestauto, 
        valor_financiado, 
        retorno, 
        tipo_operacao, 
        valor_comissao,
        user_id
    )
    SELECT 
        (x->>'data_venda')::DATE,
        x->>'carro',
        (x->>'ano_carro')::INTEGER,
        CASE WHEN x->>'placa' = '' THEN NULL ELSE x->>'placa' END,
        x->>'nome_cliente',
        CASE WHEN x->>'gestauto' = '' THEN NULL ELSE x->>'gestauto' END,
        (x->>'valor_financiado')::NUMERIC,
        CASE WHEN x->>'retorno' = '' THEN NULL ELSE x->>'retorno' END,
        COALESCE(x->>'tipo_operacao', 'Venda'),
        (x->>'valor_comissao')::NUMERIC,
        v_user_id
    FROM jsonb_array_elements(p_vendas) AS x;
END;
$$;
