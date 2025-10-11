// ==========================================
// Database Types
// ==========================================

export type UserType = 'student' | 'salon';

export type RecruitmentStatus = 'active' | 'closed';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled_by_salon' | 'cancelled_by_student';

// ==========================================
// Student / Salon
// ==========================================
export interface Student {
  id: string;
  email: string;
  name: string;
  school_name?: string;
  instagram_url?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentInsert {
  id: string;
  email: string;
  name: string;
  school_name?: string;
  instagram_url?: string;
  avatar_url?: string;
}

export interface StudentUpdate {
  name?: string;
  school_name?: string;
  instagram_url?: string;
  avatar_url?: string;
}

export interface Salon {
  id: string;
  email: string;
  salon_name: string;
  description?: string;
  address?: string;
  phone_number?: string;
  website_url?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SalonInsert {
  id: string;
  email: string;
  salon_name: string;
  description?: string;
  address?: string;
  phone_number?: string;
  website_url?: string;
  photo_url?: string;
}

export interface SalonUpdate {
  salon_name?: string;
  description?: string;
  address?: string;
  phone_number?: string;
  website_url?: string;
  photo_url?: string;
}

// ==========================================
// Recruitment Types
// ==========================================
export type GenderRequirement = 'male' | 'female' | 'any';
export type HairLengthRequirement = 'short' | 'bob' | 'medium' | 'long' | 'any';
export type MenuType = 
  | 'cut' 
  | 'color' 
  | 'perm' 
  | 'treatment' 
  | 'straight' 
  | 'hair_set' 
  | 'head_spa' 
  | 'hair_straightening' 
  | 'extensions' 
  | 'other';
export type PhotoShootRequirement = 'required' | 'optional' | 'none';
export type ModelExperienceRequirement = 'any' | 'experienced' | 'beginner';

// ==========================================
// Available Date Type (JSONB内の構造)
// ==========================================
export interface AvailableDate {
  datetime: string;
  is_booked: boolean;
}

// ==========================================
// Recruitment (テーブル名変更: recruitment_slots → recruitments)
// ==========================================
export interface Recruitment {
  id: string;
  salon_id: string;
  title: string;
  description?: string;
  menus: MenuType[];
  gender_requirement: GenderRequirement;
  hair_length_requirement: HairLengthRequirement;
  treatment_duration?: string;
  status: RecruitmentStatus;
  photo_shoot_requirement: PhotoShootRequirement;
  model_experience_requirement: ModelExperienceRequirement;
  has_reward: boolean;
  reward_details?: string;
  
  // ★ 変更: JSONB配列で管理
  available_dates: AvailableDate[];
  flexible_schedule_text?: string;
  is_fully_booked: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface RecruitmentWithDetails extends Recruitment {
  salon: Salon;
}

export interface RecruitmentInsert {
  salon_id: string;
  title: string;
  description?: string;
  menus: MenuType[];
  gender_requirement: GenderRequirement;
  hair_length_requirement: HairLengthRequirement;
  treatment_duration?: string;
  status: RecruitmentStatus;
  photo_shoot_requirement: PhotoShootRequirement;
  model_experience_requirement: ModelExperienceRequirement;
  has_reward: boolean;
  reward_details?: string;
  
  // ★ 変更: JSONB配列で管理
  available_dates: AvailableDate[];
  flexible_schedule_text?: string;
  is_fully_booked: boolean;
}

export interface RecruitmentUpdate {
  title?: string;
  description?: string;
  menus?: MenuType[];
  gender_requirement?: GenderRequirement;
  hair_length_requirement?: HairLengthRequirement;
  treatment_duration?: string;
  status?: RecruitmentStatus;
  photo_shoot_requirement?: PhotoShootRequirement;
  model_experience_requirement?: ModelExperienceRequirement;
  has_reward?: boolean;
  reward_details?: string;
  available_dates?: AvailableDate[];
  flexible_schedule_text?: string;
  is_fully_booked?: boolean;
}

// ==========================================
// Reservation (Application → Reservation, 構造変更)
// ==========================================
export interface Reservation {
  id: string;
  recruitment_id: string;
  student_id: string;
  salon_id: string;
  
  // ★ 変更: slot_id削除、reservation_datetimeを追加
  reservation_datetime: string;
  
  status: ReservationStatus;
  message?: string;
  is_chat_consultation: boolean;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationWithDetails extends Reservation {
  student: Student;
  recruitment: RecruitmentWithDetails;
}

export interface ReservationMessage {
  id: string;
  reservation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_type: UserType;
}

export interface ReservationInsert {
  recruitment_id: string;
  student_id: string;
  salon_id: string;
  reservation_datetime: string;
  message?: string;
  status: ReservationStatus;
  is_chat_consultation?: boolean;
}

export interface ReservationUpdate {
  status?: ReservationStatus;
  cancellation_reason?: string | null;
}

// ==========================================
// Auth Context Types
// ==========================================
export interface AuthUser {
  id: string;
  email: string;
  userType: UserType;
  profile: Student | Salon;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userType: UserType,
    profileData: StudentInsert | SalonInsert
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: StudentUpdate | SalonUpdate) => Promise<void>;
  deleteAccount: () => Promise<void>;
}
