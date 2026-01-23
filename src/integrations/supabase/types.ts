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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          id: string
          list_name: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_name?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_name?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      restaurant_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          restaurant_id: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          restaurant_id: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          restaurant_id?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_images_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          submission_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          submission_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          submission_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          ad_expiry_date: string | null
          address: string
          approved_by: string | null
          created_at: string
          created_by: string | null
          cuisine_type: string
          description: string | null
          google_data_fetched_at: string | null
          google_place_id: string | null
          halal_attributes: Json | null
          halal_status: Database["public"]["Enums"]["halal_status"]
          id: string
          is_sponsored: boolean
          lat: number
          lng: number
          name: string
          opening_hours: Json | null
          partial_halal_meats: Json | null
          phone: string | null
          price_range: Database["public"]["Enums"]["price_range"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          ad_expiry_date?: string | null
          address: string
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          cuisine_type: string
          description?: string | null
          google_data_fetched_at?: string | null
          google_place_id?: string | null
          halal_attributes?: Json | null
          halal_status?: Database["public"]["Enums"]["halal_status"]
          id?: string
          is_sponsored?: boolean
          lat: number
          lng: number
          name: string
          opening_hours?: Json | null
          partial_halal_meats?: Json | null
          phone?: string | null
          price_range?: Database["public"]["Enums"]["price_range"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          ad_expiry_date?: string | null
          address?: string
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          cuisine_type?: string
          description?: string | null
          google_data_fetched_at?: string | null
          google_place_id?: string | null
          halal_attributes?: Json | null
          halal_status?: Database["public"]["Enums"]["halal_status"]
          id?: string
          is_sponsored?: boolean
          lat?: number
          lng?: number
          name?: string
          opening_hours?: Json | null
          partial_halal_meats?: Json | null
          phone?: string | null
          price_range?: Database["public"]["Enums"]["price_range"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          review_id: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      halal_status: "Full Halal" | "Partial Halal"
      price_range: "$" | "$$" | "$$$" | "$$$$"
      request_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      halal_status: ["Full Halal", "Partial Halal"],
      price_range: ["$", "$$", "$$$", "$$$$"],
      request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
