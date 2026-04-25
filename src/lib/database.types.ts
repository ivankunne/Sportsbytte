export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_name: string | null
          body: string
          club_id: number
          created_at: string
          id: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          body: string
          club_id: number
          created_at?: string
          id?: never
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          body?: string
          club_id?: number
          created_at?: string
          id?: never
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_registrations: {
        Row: {
          id: number
          created_at: string
          status: string
          club_name: string
          sport: string | null
          location: string | null
          member_count: string | null
          org_number: string | null
          first_name: string
          last_name: string
          email: string
          phone: string | null
          role: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          description: string | null
        }
        Insert: {
          id?: never
          created_at?: string
          status?: string
          club_name: string
          sport?: string | null
          location?: string | null
          member_count?: string | null
          org_number?: string | null
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          role?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          description?: string | null
        }
        Update: {
          id?: never
          created_at?: string
          status?: string
          club_name?: string
          sport?: string | null
          location?: string | null
          member_count?: string | null
          org_number?: string | null
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          role?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          description?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          emoji: string
          id: number
          name: string
          slug: string
        }
        Insert: {
          emoji: string
          id?: never
          name: string
          slug: string
        }
        Update: {
          emoji?: string
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          active_listings: number
          color: string
          created_at: string
          description: string | null
          id: number
          initials: string
          invite_token: string | null
          is_membership_gated: boolean
          is_pro: boolean
          logo_url: string | null
          member_email_domain: string | null
          members: number
          name: string
          rating: number
          secondary_color: string | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          total_sold: number
          updated_at: string
        }
        Insert: {
          active_listings?: number
          color?: string
          created_at?: string
          description?: string | null
          id?: never
          initials: string
          invite_token?: string | null
          is_membership_gated?: boolean
          is_pro?: boolean
          logo_url?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          member_email_domain?: string | null
          members?: number
          name: string
          rating?: number
          secondary_color?: string | null
          slug: string
          total_sold?: number
          updated_at?: string
        }
        Update: {
          active_listings?: number
          color?: string
          created_at?: string
          description?: string | null
          id?: never
          initials?: string
          invite_token?: string | null
          is_membership_gated?: boolean
          is_pro?: boolean
          logo_url?: string | null
          member_email_domain?: string | null
          members?: number
          name?: string
          rating?: number
          secondary_color?: string | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          total_sold?: number
          updated_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          category: string
          club_id: number
          condition: string
          created_at: string
          description: string | null
          boosted_until: string | null
          id: number
          images: string[]
          is_boosted: boolean
          is_sold: boolean
          listing_type: string
          members_only: boolean
          price: number
          quantity: number | null
          seller_id: number
          size_range: string | null
          specs: Json | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          boosted_until?: string | null
          category: string
          club_id: number
          condition: string
          created_at?: string
          description?: string | null
          id?: never
          images?: string[]
          is_boosted?: boolean
          is_sold?: boolean
          listing_type?: string
          members_only?: boolean
          price: number
          quantity?: number | null
          seller_id: number
          size_range?: string | null
          specs?: Json | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          boosted_until?: string | null
          category?: string
          club_id?: number
          condition?: string
          created_at?: string
          description?: string | null
          id?: never
          images?: string[]
          is_boosted?: boolean
          is_sold?: boolean
          listing_type?: string
          members_only?: boolean
          price?: number
          quantity?: number | null
          seller_id?: number
          size_range?: string | null
          specs?: Json | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          club_id: number
          created_at: string
          id: number
          message: string | null
          profile_id: number
          status: string
          updated_at: string
        }
        Insert: {
          club_id: number
          created_at?: string
          id?: never
          message?: string | null
          profile_id: number
          status?: string
          updated_at?: string
        }
        Update: {
          club_id?: number
          created_at?: string
          id?: never
          message?: string | null
          profile_id?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar: string
          avatar_url: string | null
          bio: string
          club_id: number | null
          created_at: string
          id: number
          member_since: string
          name: string
          rating: number
          slug: string
          is_pro: boolean
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          stripe_subscription_id: string | null
          total_sold: number
          updated_at: string
          vipps_phone: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar?: string
          avatar_url?: string | null
          bio?: string
          club_id?: number | null
          created_at?: string
          id?: never
          is_pro?: boolean
          member_since?: string
          name: string
          rating?: number
          slug: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          stripe_subscription_id?: string | null
          total_sold?: number
          updated_at?: string
          vipps_phone?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar?: string
          avatar_url?: string | null
          bio?: string
          club_id?: number | null
          created_at?: string
          id?: never
          is_pro?: boolean
          member_since?: string
          name?: string
          rating?: number
          slug?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          stripe_subscription_id?: string | null
          total_sold?: number
          updated_at?: string
          vipps_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          created_at: string
          id: number
          profile_id: number
          rating: number
          text: string
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: never
          profile_id: number
          rating: number
          text: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: never
          profile_id?: number
          rating?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          buyer_email: string
          buyer_name: string
          created_at: string
          id: number
          listing_id: number
          message: string
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          created_at?: string
          id?: never
          listing_id: number
          message: string
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          created_at?: string
          id?: never
          listing_id?: number
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          listing_id: number
          seller_id: number
          buyer_name: string
          buyer_email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: number
          seller_id: number
          buyer_name: string
          buyer_email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: number
          seller_id?: number
          buyer_name?: string
          buyer_email?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          is_from_seller: boolean
          type: string
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          is_from_seller?: boolean
          type?: string
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          is_from_seller?: boolean
          type?: string
          content?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          category: string | null
          club_id: number | null
          created_at: string
          id: number
          keywords: string | null
          max_price: number | null
          notify_email: string
          size_hint: string | null
        }
        Insert: {
          category?: string | null
          club_id?: number | null
          created_at?: string
          id?: never
          keywords?: string | null
          max_price?: number | null
          notify_email: string
          size_hint?: string | null
        }
        Update: {
          category?: string | null
          club_id?: number | null
          created_at?: string
          id?: never
          keywords?: string | null
          max_price?: number | null
          notify_email?: string
          size_hint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
