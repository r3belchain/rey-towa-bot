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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: string | null
          id: string
          target_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          target_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      guild_settings: {
        Row: {
          allowed_channel_id: string | null
          guild_id: string
          log_channel_id: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_channel_id?: string | null
          guild_id: string
          log_channel_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_channel_id?: string | null
          guild_id?: string
          log_channel_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      item_transfers: {
        Row: {
          created_at: string | null
          id: number
          item_id: string
          quantity: number
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          item_id: string
          quantity: number
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          item_id?: string
          quantity?: number
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      market_listings: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          price_per_unit: number
          quantity: number
          seller_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          price_per_unit: number
          quantity: number
          seller_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          price_per_unit?: number
          quantity?: number
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "master_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      master_items: {
        Row: {
          buy_price: number | null
          category: string
          description: string | null
          id: string
          is_tradeable: boolean | null
          max_stack: number | null
          name: string
          rarity: string
          requirements: Json | null
          sell_price: number | null
        }
        Insert: {
          buy_price?: number | null
          category: string
          description?: string | null
          id: string
          is_tradeable?: boolean | null
          max_stack?: number | null
          name: string
          rarity: string
          requirements?: Json | null
          sell_price?: number | null
        }
        Update: {
          buy_price?: number | null
          category?: string
          description?: string | null
          id?: string
          is_tradeable?: boolean | null
          max_stack?: number | null
          name?: string
          rarity?: string
          requirements?: Json | null
          sell_price?: number | null
        }
        Relationships: []
      }
      master_rosters: {
        Row: {
          base_pwr: number | null
          description: string | null
          id: string
          name: string
          tier: string
        }
        Insert: {
          base_pwr?: number | null
          description?: string | null
          id: string
          name: string
          tier: string
        }
        Update: {
          base_pwr?: number | null
          description?: string | null
          id?: string
          name?: string
          tier?: string
        }
        Relationships: []
      }
      user_fishdex: {
        Row: {
          caught_count: number | null
          first_caught_at: string | null
          fish_id: string
          id: string
          max_weight: number | null
          user_id: string
        }
        Insert: {
          caught_count?: number | null
          first_caught_at?: string | null
          fish_id: string
          id?: string
          max_weight?: number | null
          user_id: string
        }
        Update: {
          caught_count?: number | null
          first_caught_at?: string | null
          fish_id?: string
          id?: string
          max_weight?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_fishdex_fish_id_fkey"
            columns: ["fish_id"]
            isOneToOne: false
            referencedRelation: "master_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_fishdex_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          created_at: string | null
          discord_id: string
          durability: number | null
          id: string
          item_id: string
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discord_id: string
          durability?: number | null
          id?: string
          item_id: string
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discord_id?: string
          durability?: number | null
          id?: string
          item_id?: string
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "master_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_user_id_fkey"
            columns: ["discord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      user_quests: {
        Row: {
          id: string
          progress: number | null
          quest_key: string
          status: string | null
          target: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          progress?: number | null
          quest_key: string
          status?: string | null
          target: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          progress?: number | null
          quest_key?: string
          status?: string | null
          target?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      user_roster: {
        Row: {
          id: string
          obtained_at: string | null
          resonance_level: number | null
          roster_id: string
          user_id: string
        }
        Insert: {
          id?: string
          obtained_at?: string | null
          resonance_level?: number | null
          roster_id: string
          user_id: string
        }
        Update: {
          id?: string
          obtained_at?: string | null
          resonance_level?: number | null
          roster_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roster_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "master_rosters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roster_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      users: {
        Row: {
          badges: string[] | null
          bensin: number | null
          bg_url: string | null
          buff_kopi_expires: string | null
          buff_rokok_charges: number | null
          created_at: string | null
          discord_id: string
          exp: number | null
          job: string | null
          last_jukir: string | null
          last_mancing: string | null
          last_ngojek: string | null
          pity_count: number | null
          stamina: number | null
          t_coin: number | null
          total_jukir_count: number | null
          total_mancing_count: number | null
          total_ojek_count: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          badges?: string[] | null
          bensin?: number | null
          bg_url?: string | null
          buff_kopi_expires?: string | null
          buff_rokok_charges?: number | null
          created_at?: string | null
          discord_id: string
          exp?: number | null
          job?: string | null
          last_jukir?: string | null
          last_mancing?: string | null
          last_ngojek?: string | null
          pity_count?: number | null
          stamina?: number | null
          t_coin?: number | null
          total_jukir_count?: number | null
          total_mancing_count?: number | null
          total_ojek_count?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          badges?: string[] | null
          bensin?: number | null
          bg_url?: string | null
          buff_kopi_expires?: string | null
          buff_rokok_charges?: number | null
          created_at?: string | null
          discord_id?: string
          exp?: number | null
          job?: string | null
          last_jukir?: string | null
          last_mancing?: string | null
          last_ngojek?: string | null
          pity_count?: number | null
          stamina?: number | null
          t_coin?: number | null
          total_jukir_count?: number | null
          total_mancing_count?: number | null
          total_ojek_count?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      transfer_item: {
        Args: {
          p_item_id: string
          p_quantity: number
          p_receiver_id: string
          p_sender_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
