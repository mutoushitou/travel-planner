export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          avatar_url: string | null;
          default_city: string | null;
          preferences: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          avatar_url?: string | null;
          default_city?: string | null;
          preferences?: Record<string, unknown>;
        };
        Update: {
          nickname?: string | null;
          avatar_url?: string | null;
          default_city?: string | null;
          preferences?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      cities: {
        Row: {
          id: string;
          name: string;
          province: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          province: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          province?: string;
          slug?: string;
        };
      };
      attractions: {
        Row: {
          id: string;
          name: string;
          city_id: string;
          category: string;
          description: string | null;
          ticket_price: number | null;
          opening_hours: string | null;
          suggested_duration: string | null;
          image_url: string | null;
          rating_avg: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city_id: string;
          category?: string;
          description?: string | null;
          ticket_price?: number | null;
          opening_hours?: string | null;
          suggested_duration?: string | null;
          image_url?: string | null;
          rating_avg?: number;
        };
        Update: {
          name?: string;
          city_id?: string;
          category?: string;
          description?: string | null;
          ticket_price?: number | null;
          opening_hours?: string | null;
          suggested_duration?: string | null;
          image_url?: string | null;
          rating_avg?: number;
        };
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination: string;
          city_ids: string[];
          start_date: string;
          end_date: string;
          adults: number;
          children: number;
          budget_level: string;
          preferences: string[];
          accommodation: string | null;
          transport: string[];
          special_requirements: string | null;
          status: string;
          budget_summary: Record<string, unknown> | null;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          destination: string;
          city_ids: string[];
          start_date: string;
          end_date: string;
          adults?: number;
          children?: number;
          budget_level?: string;
          preferences?: string[];
          accommodation?: string | null;
          transport?: string[];
          special_requirements?: string | null;
          status?: string;
          budget_summary?: Record<string, unknown> | null;
        };
        Update: {
          title?: string;
          destination?: string;
          start_date?: string;
          end_date?: string;
          adults?: number;
          children?: number;
          budget_level?: string;
          preferences?: string[];
          accommodation?: string | null;
          transport?: string[];
          special_requirements?: string | null;
          status?: string;
          budget_summary?: Record<string, unknown> | null;
          is_deleted?: boolean;
          updated_at?: string;
        };
      };
      trip_days: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_number: number;
          date: string;
        };
        Update: {
          day_number?: number;
          date?: string;
        };
      };
      day_attractions: {
        Row: {
          id: string;
          day_id: string;
          attraction_id: string;
          order_index: number;
          duration: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          attraction_id: string;
          order_index: number;
          duration?: string | null;
          notes?: string | null;
        };
        Update: {
          order_index?: number;
          duration?: string | null;
          notes?: string | null;
        };
      };
      day_meals: {
        Row: {
          id: string;
          day_id: string;
          meal_type: string;
          restaurant_name: string;
          cuisine: string | null;
          price: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          meal_type: string;
          restaurant_name: string;
          cuisine?: string | null;
          price?: number | null;
          notes?: string | null;
        };
        Update: {
          meal_type?: string;
          restaurant_name?: string;
          cuisine?: string | null;
          price?: number | null;
          notes?: string | null;
        };
      };
      day_transport: {
        Row: {
          id: string;
          day_id: string;
          transport_type: string;
          from_location: string | null;
          to_location: string | null;
          detail: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          transport_type: string;
          from_location?: string | null;
          to_location?: string | null;
          detail?: string | null;
        };
        Update: {
          transport_type?: string;
          from_location?: string | null;
          to_location?: string | null;
          detail?: string | null;
        };
      };
      day_hotels: {
        Row: {
          id: string;
          day_id: string;
          hotel_name: string;
          star_rating: number | null;
          price_range: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          hotel_name: string;
          star_rating?: number | null;
          price_range?: string | null;
          notes?: string | null;
        };
        Update: {
          hotel_name?: string;
          star_rating?: number | null;
          price_range?: string | null;
          notes?: string | null;
        };
      };
      trip_versions: {
        Row: {
          id: string;
          trip_id: string;
          version_number: number;
          full_content: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          version_number: number;
          full_content: Record<string, unknown>;
        };
        Update: {
          version_number?: number;
          full_content?: Record<string, unknown>;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          trip_id: string;
          order_type: string;
          status: string;
          total_price: number | null;
          paid_at: string | null;
          detail: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_id: string;
          order_type: string;
          status?: string;
          total_price?: number | null;
          detail?: Record<string, unknown>;
        };
        Update: {
          status?: string;
          total_price?: number | null;
          paid_at?: string | null;
          detail?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          attraction_id: string;
          trip_id: string | null;
          rating: number;
          content: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          attraction_id: string;
          trip_id?: string | null;
          rating: number;
          content?: string | null;
        };
        Update: {
          rating?: number;
          content?: string | null;
        };
      };
    };
  };
}
