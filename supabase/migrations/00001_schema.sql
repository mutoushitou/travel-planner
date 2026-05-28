-- ============================================================
-- ?????? Agent ?? ? ???????
-- ============================================================

-- 1. profiles?????????? Supabase Auth?
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  default_city TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. cities
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. attractions
CREATE TABLE IF NOT EXISTS public.attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  ticket_price NUMERIC(10,2),
  opening_hours TEXT,
  suggested_duration TEXT,
  image_url TEXT,
  rating_avg NUMERIC(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. trips
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  city_ids UUID[] DEFAULT '{}',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  budget_level TEXT DEFAULT 'comfort',
  preferences TEXT[] DEFAULT '{}',
  accommodation TEXT,
  transport TEXT[] DEFAULT '{}',
  special_requirements TEXT,
  status TEXT DEFAULT 'draft',
  budget_summary JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. trip_days
CREATE TABLE IF NOT EXISTS public.trip_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. day_attractions
CREATE TABLE IF NOT EXISTS public.day_attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  attraction_id UUID NOT NULL REFERENCES public.attractions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. day_meals
CREATE TABLE IF NOT EXISTS public.day_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  cuisine TEXT,
  price NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. day_transport
CREATE TABLE IF NOT EXISTS public.day_transport (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  transport_type TEXT NOT NULL,
  from_location TEXT,
  to_location TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. day_hotels
CREATE TABLE IF NOT EXISTS public.day_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  hotel_name TEXT NOT NULL,
  star_rating INTEGER,
  price_range TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. trip_versions
CREATE TABLE IF NOT EXISTS public.trip_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  full_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_price NUMERIC(10,2),
  paid_at TIMESTAMPTZ,
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attraction_id UUID NOT NULL REFERENCES public.attractions(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, attraction_id)
);

-- RLS ??
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- profiles: select own
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- cities: public read
CREATE POLICY cities_select_public ON public.cities FOR SELECT USING (true);

-- attractions: public read
CREATE POLICY attractions_select_public ON public.attractions FOR SELECT USING (true);

-- trips: owner only
CREATE POLICY trips_crud_own ON public.trips FOR ALL USING (auth.uid() = user_id);

-- trip_days: via trip owner
CREATE POLICY trip_days_crud_own ON public.trip_days FOR ALL
USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid()));

-- day_attractions
CREATE POLICY day_attractions_crud_own ON public.day_attractions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.trip_days
  JOIN public.trips ON trips.id = trip_days.trip_id
  WHERE trip_days.id = day_attractions.day_id AND trips.user_id = auth.uid()
));

-- day_meals
CREATE POLICY day_meals_crud_own ON public.day_meals FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.trip_days
  JOIN public.trips ON trips.id = trip_days.trip_id
  WHERE trip_days.id = day_meals.day_id AND trips.user_id = auth.uid()
));

-- day_transport
CREATE POLICY day_transport_crud_own ON public.day_transport FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.trip_days
  JOIN public.trips ON trips.id = trip_days.trip_id
  WHERE trip_days.id = day_transport.day_id AND trips.user_id = auth.uid()
));

-- day_hotels
CREATE POLICY day_hotels_crud_own ON public.day_hotels FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.trip_days
  JOIN public.trips ON trips.id = trip_days.trip_id
  WHERE trip_days.id = day_hotels.day_id AND trips.user_id = auth.uid()
));

-- trip_versions
CREATE POLICY trip_versions_crud_own ON public.trip_versions FOR ALL
USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_versions.trip_id AND trips.user_id = auth.uid()));

-- orders
CREATE POLICY orders_crud_own ON public.orders FOR ALL USING (auth.uid() = user_id);

-- reviews: select public, write own
CREATE POLICY reviews_select_public ON public.reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY reviews_update_own ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY reviews_delete_own ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- indexes
CREATE INDEX IF NOT EXISTS idx_attractions_city_id ON public.attractions(city_id);
CREATE INDEX IF NOT EXISTS idx_attractions_category ON public.attractions(category);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id ON public.trip_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_day_attractions_day_id ON public.day_attractions(day_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_attraction_id ON public.reviews(attraction_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
