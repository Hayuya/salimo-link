-- ==========================================
-- SaloMo Link Database Schema
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
  website_url TEXT,
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
  flexible_schedule_text TEXT,
  is_fully_booked BOOLEAN NOT NULL DEFAULT false,
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
  is_chat_consultation BOOLEAN NOT NULL DEFAULT false,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reservations_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled_by_salon', 'cancelled_by_student'))
);

-- ==========================================
-- Recruitment booking state trigger
-- ==========================================
CREATE OR REPLACE FUNCTION refresh_recruitment_booking_state(p_recruitment_id UUID)
RETURNS void AS $$
DECLARE
  v_has_active BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM reservations
    WHERE recruitment_id = p_recruitment_id
      AND status IN ('pending', 'confirmed')
  ) INTO v_has_active;

  UPDATE recruitments
  SET is_fully_booked = v_has_active
  WHERE id = p_recruitment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_update_recruitment_booking_state()
RETURNS TRIGGER AS $$
DECLARE
  v_recruitment_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_recruitment_id := OLD.recruitment_id;
  ELSE
    v_recruitment_id := NEW.recruitment_id;
  END IF;

  PERFORM refresh_recruitment_booking_state(v_recruitment_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservation_update_booking_state ON reservations;
CREATE TRIGGER trg_reservation_update_booking_state
AFTER INSERT OR UPDATE OR DELETE ON reservations
FOR EACH ROW EXECUTE FUNCTION trg_update_recruitment_booking_state();

-- 初期データの整合性確保
DO $$
BEGIN
  UPDATE recruitments r
  SET is_fully_booked = EXISTS (
    SELECT 1 FROM reservations
    WHERE recruitment_id = r.id
      AND status IN ('pending', 'confirmed')
  );
END;
$$;

-- ==========================================
-- Reservation Messages Table
-- ==========================================
CREATE TABLE IF NOT EXISTS reservation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('student', 'salon')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservation_messages_reservation_id_created_at
  ON reservation_messages (reservation_id, created_at);

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
-- Delete User Data RPC
-- ==========================================
CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_salon_id UUID;
BEGIN
  -- 削除対象募集のチャットメッセージを削除
  DELETE FROM reservation_messages
  WHERE reservation_id IN (
    SELECT id FROM reservations
    WHERE student_id = p_user_id OR salon_id = p_user_id
  );

  -- 予約を削除
  DELETE FROM reservations
  WHERE student_id = p_user_id OR salon_id = p_user_id;

  -- サロンユーザーの場合は募集も削除
  DELETE FROM recruitments
  WHERE salon_id = p_user_id;

  -- プロフィールを削除（students / salons のどちらか）
  DELETE FROM students WHERE id = p_user_id;
  DELETE FROM salons WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    INSERT INTO students (id, email, name, school_name, instagram_url, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      NEW.raw_user_meta_data->>'school_name',
      NEW.raw_user_meta_data->>'instagram_url',
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      school_name = EXCLUDED.school_name,
      instagram_url = EXCLUDED.instagram_url,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW();
  ELSIF user_type = 'salon' THEN
    INSERT INTO salons (id, email, salon_name, description, address, phone_number, website_url, photo_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'salon_name', ''),
      NEW.raw_user_meta_data->>'description',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'phone_number',
      NEW.raw_user_meta_data->>'website_url',
      NEW.raw_user_meta_data->>'photo_url'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      salon_name = EXCLUDED.salon_name,
      description = EXCLUDED.description,
      address = EXCLUDED.address,
      phone_number = EXCLUDED.phone_number,
      website_url = EXCLUDED.website_url,
      photo_url = EXCLUDED.photo_url,
      updated_at = NOW();
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
  p_message TEXT DEFAULT NULL,
  p_is_chat_consultation BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_reservation_id UUID;
  v_available_dates JSONB;
  v_flexible_text TEXT;
  v_date_found BOOLEAN := FALSE;
  v_updated_dates JSONB := '[]'::jsonb;
  v_date_obj JSONB;
BEGIN
  -- Get current available_dates and chat setting
  SELECT available_dates, flexible_schedule_text
  INTO v_available_dates, v_flexible_text
  FROM recruitments
  WHERE id = p_recruitment_id AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recruitment not found or closed';
  END IF;

  IF p_is_chat_consultation AND (v_flexible_text IS NULL OR btrim(v_flexible_text) = '') THEN
    RAISE EXCEPTION 'Chat consultation not allowed for this recruitment';
  END IF;

  IF p_is_chat_consultation THEN
    v_updated_dates := COALESCE(v_available_dates, '[]'::jsonb);
  ELSE
    IF p_reservation_datetime - INTERVAL '48 hours' <= NOW() THEN
      RAISE EXCEPTION 'Reservation deadline has passed';
    END IF;

    -- Check if the datetime exists and is not booked
    FOR v_date_obj IN SELECT * FROM jsonb_array_elements(COALESCE(v_available_dates, '[]'::jsonb))
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
  END IF;

  -- Update recruitment's available_dates and close the recruitment
  UPDATE recruitments
  SET available_dates = v_updated_dates,
      status = 'closed'
  WHERE id = p_recruitment_id;
  
  -- Create reservation
  INSERT INTO reservations (
    recruitment_id,
    student_id,
    salon_id,
    reservation_datetime,
    status,
    message,
    is_chat_consultation
  ) VALUES (
    p_recruitment_id,
    p_student_id,
    p_salon_id,
    p_reservation_datetime,
    'pending',
    p_message,
    p_is_chat_consultation
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
  v_active_reservations INTEGER;
  v_has_open_slot BOOLEAN := FALSE;
  v_is_chat_consultation BOOLEAN := FALSE;
  v_flexible_text TEXT;
  v_has_flexible BOOLEAN := FALSE;
BEGIN
  -- Get reservation details
  SELECT recruitment_id, reservation_datetime, is_chat_consultation
  INTO v_recruitment_id, v_reservation_datetime, v_is_chat_consultation
  FROM reservations
  WHERE id = p_reservation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;
  
  -- Get current available_dates
  SELECT available_dates, flexible_schedule_text
  INTO v_available_dates, v_flexible_text
  FROM recruitments
  WHERE id = v_recruitment_id;
  
  v_has_flexible := v_flexible_text IS NOT NULL AND btrim(v_flexible_text) <> '';
  
  IF v_is_chat_consultation THEN
    v_updated_dates := COALESCE(v_available_dates, '[]'::jsonb);
  ELSE
    -- Unmark the datetime as booked
    FOR v_date_obj IN SELECT * FROM jsonb_array_elements(COALESCE(v_available_dates, '[]'::jsonb))
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
  END IF;

  -- Check for remaining pending/confirmed reservations
  SELECT COUNT(*) INTO v_active_reservations
  FROM reservations
  WHERE recruitment_id = v_recruitment_id
    AND status IN ('pending', 'confirmed');

  -- Determine if there is at least one open slot
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(v_updated_dates, '[]'::jsonb)) elem
    WHERE (elem->>'is_booked')::boolean = FALSE
  ) INTO v_has_open_slot;
  
  -- Update recruitment's available_dates and status
  UPDATE recruitments
  SET available_dates = v_updated_dates,
      status = CASE
        WHEN v_active_reservations = 0 AND (v_has_open_slot OR v_has_flexible) THEN 'active'
        WHEN v_active_reservations = 0 AND NOT (v_has_open_slot OR v_has_flexible) THEN 'closed'
        ELSE 'closed'
      END
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
