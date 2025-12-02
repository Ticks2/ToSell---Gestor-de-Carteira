// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      client_alerts: {
        Row: {
          alert_date: string
          alert_type: string
          client_id: string
          created_at: string
          id: string
          is_dismissed: boolean | null
          is_email_notified: boolean | null
          message: string | null
          user_id: string
        }
        Insert: {
          alert_date: string
          alert_type: string
          client_id: string
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          is_email_notified?: boolean | null
          message?: string | null
          user_id: string
        }
        Update: {
          alert_date?: string
          alert_type?: string
          client_id?: string
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          is_email_notified?: boolean | null
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          client_id: string
          created_at: string
          id: string
          interaction_date: string
          interaction_type: string
          next_contact_date: string | null
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          interaction_date?: string
          interaction_type: string
          next_contact_date?: string | null
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          interaction_date?: string
          interaction_type?: string
          next_contact_date?: string | null
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clients: {
        Row: {
          birth_date: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          status: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          status?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      companies: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      deleted_clients_log: {
        Row: {
          birth_date: string | null
          city: string | null
          deleted_at: string
          email: string | null
          full_name: string | null
          log_id: string
          original_client_id: string | null
          original_created_at: string | null
          phone: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          deleted_at?: string
          email?: string | null
          full_name?: string | null
          log_id?: string
          original_client_id?: string | null
          original_created_at?: string | null
          phone?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          deleted_at?: string
          email?: string | null
          full_name?: string | null
          log_id?: string
          original_client_id?: string | null
          original_created_at?: string | null
          phone?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      import_history: {
        Row: {
          created_at: string
          error_details: Json | null
          failed_records: number
          id: string
          imported_records: number
          source_type: string
          status: string
          total_records: number
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          failed_records?: number
          id?: string
          imported_records?: number
          source_type: string
          status: string
          total_records?: number
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          failed_records?: number
          id?: string
          imported_records?: number
          source_type?: string
          status?: string
          total_records?: number
        }
        Relationships: []
      }
      monthly_commissions: {
        Row: {
          bonus: number | null
          created_at: string
          extras: number | null
          id: string
          month: number
          returns: number | null
          salary: number | null
          surplus: number | null
          transfers: number | null
          user_id: string
          year: number
        }
        Insert: {
          bonus?: number | null
          created_at?: string
          extras?: number | null
          id?: string
          month: number
          returns?: number | null
          salary?: number | null
          surplus?: number | null
          transfers?: number | null
          user_id: string
          year: number
        }
        Update: {
          bonus?: number | null
          created_at?: string
          extras?: number | null
          id?: string
          month?: number
          returns?: number | null
          salary?: number | null
          surplus?: number | null
          transfers?: number | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_id: string | null
          created_at: string
          full_name: string | null
          monthly_commission_target: number | null
          notification_settings: Json | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          monthly_commission_target?: number | null
          notification_settings?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          monthly_commission_target?: number | null
          notification_settings?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          ano_carro: number
          carro: string
          client_id: string | null
          created_at: string
          data_venda: string
          gestauto: string | null
          id: string
          nome_cliente: string
          placa: string | null
          retorno: string | null
          tipo_operacao: string
          user_id: string | null
          valor_comissao: number
          valor_financiado: number | null
          valor_venda: number | null
        }
        Insert: {
          ano_carro: number
          carro: string
          client_id?: string | null
          created_at?: string
          data_venda: string
          gestauto?: string | null
          id?: string
          nome_cliente: string
          placa?: string | null
          retorno?: string | null
          tipo_operacao?: string
          user_id?: string | null
          valor_comissao: number
          valor_financiado?: number | null
          valor_venda?: number | null
        }
        Update: {
          ano_carro?: number
          carro?: string
          client_id?: string | null
          created_at?: string
          data_venda?: string
          gestauto?: string | null
          id?: string
          nome_cliente?: string
          placa?: string | null
          retorno?: string | null
          tipo_operacao?: string
          user_id?: string | null
          valor_comissao?: number
          valor_financiado?: number | null
          valor_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      replace_vendas: { Args: { p_vendas: Json }; Returns: undefined }
    }
    Enums: {
      user_role: "individual" | "manager" | "seller"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["individual", "manager", "seller"],
    },
  },
} as const

