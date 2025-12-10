-- User Profiles table for preferences
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT,
  budget TEXT CHECK (budget IN ('$', '$$', '$$$', '$$$$')),
  dietary TEXT[] DEFAULT '{}',
  vibe_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Planning Sessions for tracking current date planning flow
CREATE TABLE public.planning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_prompt TEXT NOT NULL,
  parsed_intent JSONB DEFAULT '{}',
  stage TEXT DEFAULT 'input' CHECK (stage IN ('input', 'loading', 'restaurants', 'activities', 'summary')),
  selected_restaurant JSONB,
  selected_time TEXT,
  selected_activities JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Restaurant Options (cached from Yelp)
CREATE TABLE public.restaurant_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.planning_sessions(id) ON DELETE CASCADE,
  yelp_id TEXT NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  rating DECIMAL(2,1),
  price TEXT,
  cuisine TEXT,
  tags TEXT[] DEFAULT '{}',
  why_this_works TEXT,
  available_times TEXT[] DEFAULT '{}',
  address TEXT,
  distance TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activity Options (cached from Yelp)
CREATE TABLE public.activity_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.planning_sessions(id) ON DELETE CASCADE,
  yelp_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  photo_url TEXT,
  rating DECIMAL(2,1),
  category TEXT,
  walking_minutes INTEGER,
  why_this_works TEXT,
  address TEXT,
  time_window TEXT CHECK (time_window IN ('before', 'after')),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Itineraries (saved date plans)
CREATE TABLE public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date_label TEXT NOT NULL,
  headline TEXT NOT NULL,
  restaurant JSONB NOT NULL,
  activities JSONB DEFAULT '[]',
  timeline_blocks JSONB DEFAULT '[]',
  cost_estimate TEXT,
  share_url TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'past')),
  feedback_rating TEXT CHECK (feedback_rating IN ('great', 'meh', 'disaster')),
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for planning_sessions
CREATE POLICY "Users can view own sessions" ON public.planning_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.planning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.planning_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.planning_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for restaurant_options (via session ownership)
CREATE POLICY "Users can view restaurant options for own sessions" ON public.restaurant_options
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.planning_sessions WHERE id = session_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert restaurant options for own sessions" ON public.restaurant_options
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.planning_sessions WHERE id = session_id AND user_id = auth.uid())
  );

-- RLS Policies for activity_options (via session ownership)
CREATE POLICY "Users can view activity options for own sessions" ON public.activity_options
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.planning_sessions WHERE id = session_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert activity options for own sessions" ON public.activity_options
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.planning_sessions WHERE id = session_id AND user_id = auth.uid())
  );

-- RLS Policies for itineraries
CREATE POLICY "Users can view own itineraries" ON public.itineraries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own itineraries" ON public.itineraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own itineraries" ON public.itineraries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own itineraries" ON public.itineraries
  FOR DELETE USING (auth.uid() = user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_sessions_updated_at
  BEFORE UPDATE ON public.planning_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();