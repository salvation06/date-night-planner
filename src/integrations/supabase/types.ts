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
      activity_options: {
        Row: {
          address: string | null
          category: string | null
          created_at: string | null
          icon: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          photo_url: string | null
          rating: number | null
          session_id: string | null
          time_window: string | null
          walking_minutes: number | null
          why_this_works: string | null
          yelp_id: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          photo_url?: string | null
          rating?: number | null
          session_id?: string | null
          time_window?: string | null
          walking_minutes?: number | null
          why_this_works?: string | null
          yelp_id: string
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          photo_url?: string | null
          rating?: number | null
          session_id?: string | null
          time_window?: string | null
          walking_minutes?: number | null
          why_this_works?: string | null
          yelp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_options_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "planning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      date_memory_nfts: {
        Row: {
          collection_id: number | null
          created_at: string
          id: string
          ipfs_cid: string
          item_id: number | null
          itinerary_id: string
          status: string
          subscan_url: string | null
          transaction_hash: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          collection_id?: number | null
          created_at?: string
          id?: string
          ipfs_cid: string
          item_id?: number | null
          itinerary_id: string
          status?: string
          subscan_url?: string | null
          transaction_hash?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          collection_id?: number | null
          created_at?: string
          id?: string
          ipfs_cid?: string
          item_id?: number | null
          itinerary_id?: string
          status?: string
          subscan_url?: string | null
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "date_memory_nfts_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          activities: Json | null
          cost_estimate: string | null
          created_at: string | null
          date_label: string
          feedback_comment: string | null
          feedback_rating: string | null
          headline: string
          id: string
          restaurant: Json
          share_url: string | null
          status: string | null
          timeline_blocks: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activities?: Json | null
          cost_estimate?: string | null
          created_at?: string | null
          date_label: string
          feedback_comment?: string | null
          feedback_rating?: string | null
          headline: string
          id?: string
          restaurant: Json
          share_url?: string | null
          status?: string | null
          timeline_blocks?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activities?: Json | null
          cost_estimate?: string | null
          created_at?: string | null
          date_label?: string
          feedback_comment?: string | null
          feedback_rating?: string | null
          headline?: string
          id?: string
          restaurant?: Json
          share_url?: string | null
          status?: string | null
          timeline_blocks?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      planning_sessions: {
        Row: {
          created_at: string | null
          id: string
          parsed_intent: Json | null
          selected_activities: Json | null
          selected_restaurant: Json | null
          selected_time: string | null
          stage: string | null
          updated_at: string | null
          user_id: string | null
          user_prompt: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          parsed_intent?: Json | null
          selected_activities?: Json | null
          selected_restaurant?: Json | null
          selected_time?: string | null
          stage?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_prompt: string
        }
        Update: {
          created_at?: string | null
          id?: string
          parsed_intent?: Json | null
          selected_activities?: Json | null
          selected_restaurant?: Json | null
          selected_time?: string | null
          stage?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_prompt?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          budget: string | null
          created_at: string | null
          dietary: string[] | null
          id: string
          location: string | null
          updated_at: string | null
          user_id: string | null
          vibe_tags: string[] | null
        }
        Insert: {
          budget?: string | null
          created_at?: string | null
          dietary?: string[] | null
          id?: string
          location?: string | null
          updated_at?: string | null
          user_id?: string | null
          vibe_tags?: string[] | null
        }
        Update: {
          budget?: string | null
          created_at?: string | null
          dietary?: string[] | null
          id?: string
          location?: string | null
          updated_at?: string | null
          user_id?: string | null
          vibe_tags?: string[] | null
        }
        Relationships: []
      }
      restaurant_options: {
        Row: {
          address: string | null
          available_times: string[] | null
          created_at: string | null
          cuisine: string | null
          distance: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          photo_url: string | null
          price: string | null
          rating: number | null
          session_id: string | null
          tags: string[] | null
          why_this_works: string | null
          yelp_id: string
        }
        Insert: {
          address?: string | null
          available_times?: string[] | null
          created_at?: string | null
          cuisine?: string | null
          distance?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          photo_url?: string | null
          price?: string | null
          rating?: number | null
          session_id?: string | null
          tags?: string[] | null
          why_this_works?: string | null
          yelp_id: string
        }
        Update: {
          address?: string | null
          available_times?: string[] | null
          created_at?: string | null
          cuisine?: string | null
          distance?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          photo_url?: string | null
          price?: string | null
          rating?: number | null
          session_id?: string | null
          tags?: string[] | null
          why_this_works?: string | null
          yelp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_options_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "planning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
