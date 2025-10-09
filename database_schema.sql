-- ==========================================
-- cutmo Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Students Table
-- ==========================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  school_name TEXT,
  instagram_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Salons Table
-- ==========================================
CREATE TABLE IF NOT EXISTS salons (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  salon_name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone_number TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Recruitments Table
-- ==========================================
CREATE TABLE IF NOT EXISTS recruitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  menus TEXT[] NOT NULL DEFAULT '{}',
  gender_requirement TEXT NOT NULL DEFAULT 'any',
  hair_length_requirement TEXT NOT NULL DEFAULT 'any',
  treatment_duration TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  photo_shoot_requirement TEXT NOT NULL DEFAULT 'none',
  model_experience_requirement TEXT NOT NULL DEFAULT 'any',
  has_reward BOOLEAN NOT NULL DEFAULT false,
  reward_details TEXT,
  available_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT recruitments_status_check CHECK (status IN ('active', 'closed')),
  CONSTRAINT recruitments_gender_check CHECK (gender_requirement IN ('male', 'female', 'any')),
  CONSTRAINT recruitments_hair_length_check CHECK (hair_length_requirement IN ('short', 'bob', 'medium', 'long', 'any')),
  CONSTRAINT recruitments_photo_shoot_check CHECK (photo_shoot_requirement IN ('required', 'optional', 'none')),
  CONSTRAINT recruitments_experience_check CHECK (model_experience_requirement IN ('any', 'experienced', 'beginner'))
);

-- ==========================================
-- Reservations Table
-- ==========================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruitment_id UUID NOT NULL REFERENCES recruitments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  reservation_datetime TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT reservations_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled_by_salon', 'cancelled_by_student'))
);

-- ==========================================
-- Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_recruitments_salon_id ON recruitments(salon_id);
CREATE INDEX IF NOT EXISTS idx_recruitments_status ON recruitments(status);
CREATE INDEX IF NOT EXISTS idx_recruitments_created_at ON recruitments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_student_id ON reservations(student_id);
CREATE INDEX IF NOT EXISTS idx_reservations_salon_id ON reservations(salon_id);
CREATE INDEX IF NOT EXISTS idx_reservations_recruitment_id ON reservations(recruitment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);

-- ==========================================
-- Updated_at Trigger Function
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recruitments_updated_at BEFORE UPDATE ON recruitments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Auth Trigger Function (Profile Creation)
-- ==========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type TEXT;
BEGIN
  -- Get user_type from metadata
  user_type := NEW.raw_user_meta_data->>'user_type';
  
  IF user_type = 'student' THEN
    -- Create student profile
    INSERT INTO students (id, email, name, school_name, instagram_url, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      NEW.raw_user_meta_data->>'school_name',
      NEW.raw_user_meta_data->>'instagram_url',
      NEW.raw_user_meta_data->>'avatar_url'
    );
  ELSIF user_type = 'salon' THEN
    -- Create salon profile
    INSERT INTO salons (id, email, salon_name, description, address, phone_number, photo_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'salon_name', ''),
      NEW.raw_user_meta_data->>'description',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'phone_number',
      NEW.raw_user_meta_data->>'photo_url'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- Make Reservation Function
-- ==========================================
CREATE OR REPLACE FUNCTION make_reservation(
  p_recruitment_id UUID,
  p_student_id UUID,
  p_salon_id UUID,
  p_reservation_datetime TIMESTAMPTZ,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_reservation_id UUID;
  v_available_dates JSONB;
  v_date_found BOOLEAN := FALSE;
  v_updated_dates JSONB := '[]'::jsonb;
  v_date_obj JSONB;
BEGIN
  -- Get current available_dates
  SELECT available_dates INTO v_available_dates
  FROM recruitments
  WHERE id = p_recruitment_id AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recruitment not found or closed';
  END IF;
  
  -- Check if the datetime exists and is not booked
  FOR v_date_obj IN SELECT * FROM jsonb_array_elements(v_available_dates)
  LOOP
    IF (v_date_obj->>'datetime')::timestamptz = p_reservation_datetime THEN
      v_date_found := TRUE;
      IF (v_date_obj->>'is_booked')::boolean = TRUE THEN
        RAISE EXCEPTION 'This time slot is already booked';
      END IF;
      -- Mark as booked
      v_updated_dates := v_updated_dates || jsonb_build_object(
        'datetime', v_date_obj->>'datetime',
        'is_booked', true
      );
    ELSE
      v_updated_dates := v_updated_dates || v_date_obj;
    END IF;
  END LOOP;
  
  IF NOT v_date_found THEN
    RAISE EXCEPTION 'Invalid reservation datetime';
  END IF;
  
  -- Update recruitment's available_dates
  UPDATE recruitments
  SET available_dates = v_updated_dates
  WHERE id = p_recruitment_id;
  
  -- Create reservation
  INSERT INTO reservations (
    recruitment_id,
    student_id,
    salon_id,
    reservation_datetime,
    status,
    message
  ) VALUES (
    p_recruitment_id,
    p_student_id,
    p_salon_id,
    p_reservation_datetime,
    'pending',
    p_message
  ) RETURNING id INTO v_reservation_id;
  
  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Cancel Reservation Function
-- ==========================================
CREATE OR REPLACE FUNCTION cancel_reservation(
  p_reservation_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_recruitment_id UUID;
  v_reservation_datetime TIMESTAMPTZ;
  v_available_dates JSONB;
  v_updated_dates JSONB := '[]'::jsonb;
  v_date_obj JSONB;
BEGIN
  -- Get reservation details
  SELECT recruitment_id, reservation_datetime
  INTO v_recruitment_id, v_reservation_datetime
  FROM reservations
  WHERE id = p_reservation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;
  
  -- Get current available_dates
  SELECT available_dates INTO v_available_dates
  FROM recruitments
  WHERE id = v_recruitment_id;
  
  -- Unmark the datetime as booked
  FOR v_date_obj IN SELECT * FROM jsonb_array_elements(v_available_dates)
  LOOP
    IF (v_date_obj->>'datetime')::timestamptz = v_reservation_datetime THEN
      v_updated_dates := v_updated_dates || jsonb_build_object(
        'datetime', v_date_obj->>'datetime',
        'is_booked', false
      );
    ELSE
      v_updated_dates := v_updated_dates || v_date_obj;
    END IF;
  END LOOP;
  
  -- Update recruitment's available_dates
  UPDATE recruitments
  SET available_dates = v_updated_dates
  WHERE id = v_recruitment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Students Policies
CREATE POLICY "Students can view their own profile"
  ON students FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Students can update their own profile"
  ON students FOR UPDATE
  USING (auth.uid() = id);

-- Salons Policies
CREATE POLICY "Anyone can view active salon profiles"
  ON salons FOR SELECT
  USING (true);

CREATE POLICY "Salons can update their own profile"
  ON salons FOR UPDATE
  USING (auth.uid() = id);

-- Recruitments Policies
CREATE POLICY "Anyone can view active recruitments"
  ON recruitments FOR SELECT
  USING (status = 'active' OR salon_id = auth.uid());

CREATE POLICY "Salons can create recruitments"
  ON recruitments FOR INSERT
  WITH CHECK (auth.uid() = salon_id);

CREATE POLICY "Salons can update their own recruitments"
  ON recruitments FOR UPDATE
  USING (auth.uid() = salon_id);

CREATE POLICY "Salons can delete their own recruitments"
  ON recruitments FOR DELETE
  USING (auth.uid() = salon_id);

-- Reservations Policies
CREATE POLICY "Students can view their own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Salons can view reservations for their recruitments"
  ON reservations FOR SELECT
  USING (auth.uid() = salon_id);

CREATE POLICY "Students can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own reservation status"
  ON reservations FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Salons can update reservation status for their recruitments"
  ON reservations FOR UPDATE
  USING (auth.uid() = salon_id);

-- ==========================================
-- Sample Data (Optional - Comment out for production)
-- ==========================================

-- You can add sample data here for testing purposes
-- Remember to comment this section out in production!