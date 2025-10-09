// ==========================================
// Database Types
// ==========================================

export type UserType = 'student' | 'salon';

export type RecruitmentStatus = 'active' | 'closed' | 'confirmed';

// application -> reservation に変更
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled_by_salon' | 'cancelled_by_student';

export type SenderType = 'student' | 'salon';

// ==========================================
// Student / Salon (変更なし)
// ==========================================
export interface Student {
  id: string; email: string; name: string; school_name?: string; instagram_url?: string; avatar_url?: string; is_verified: boolean; created_at: string; updated_at: string;
}
export interface StudentInsert {
  id: string; email: string; name: string; school_name?: string; instagram_url?: string; avatar_url?: string;
}
export interface StudentUpdate {
  name?: string; school_name?: string; instagram_url?: string; avatar_url?: string;
}
export interface Salon {
  id: string; email: string; salon_name: string; description?: string; address?: string; phone_number?: string; photo_url?: string; created_at: string; updated_at: string;
}
export interface SalonInsert {
  id: string; email: string; salon_name: string; description?: string; address?: string; phone_number?: string; photo_url?: string;
}
export interface SalonUpdate {
  salon_name?: string; description?: string; address?: string; phone_number?: string; photo_url?: string;
}

// ==========================================
// Recruitment Types (変更なし)
// ==========================================
export type GenderRequirement = 'male' | 'female' | 'any';
export type HairLengthRequirement = 'short' | 'bob' | 'medium' | 'long' | 'any';
export type MenuType = | 'cut' | 'color' | 'perm' | 'treatment' | 'straight' | 'hair_set' | 'head_spa' | 'hair_straightening' | 'extensions' | 'other';
export type PhotoShootRequirement = 'required' | 'optional' | 'none';
export type ModelExperienceRequirement = 'any' | 'experienced' | 'beginner';


// ==========================================
// Available Slot (新規)
// ==========================================
export interface AvailableSlot {
  id: string;
  recruitment_slot_id: string;
  slot_time: string;
  is_booked: boolean;
}

// ==========================================
// Recruitment Slot (大幅に変更)
// ==========================================
export interface RecruitmentSlot {
  id: string;
  salon_id: string;
  title: string;
  description?: string;
  menus: MenuType[];
  gender_requirement: GenderRequirement;
  hair_length_requirement: HairLengthRequirement;
  treatment_duration?: string;
  status: RecruitmentStatus;
  created_at: string;
  updated_at: string;
  photo_shoot_requirement: PhotoShootRequirement;
  model_experience_requirement: ModelExperienceRequirement;
  has_reward: boolean;
  reward_details?: string;
}

export interface RecruitmentSlotWithDetails extends RecruitmentSlot {
  salon: Salon;
  available_slots: AvailableSlot[];
}

export interface RecruitmentSlotInsert {
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
  // 施術日時を複数受け取る
  available_slots: string[];
}

export interface RecruitmentSlotUpdate {
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
}

// ==========================================
// Reservation (Applicationから変更)
// ==========================================
export interface Reservation {
  id: string;
  slot_id: string;
  student_id: string;
  salon_id: string;
  recruitment_slot_id: string;
  status: ReservationStatus;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface ReservationWithDetails extends Reservation {
  student: Student;
  recruitment_slot: RecruitmentSlotWithDetails;
  available_slot: AvailableSlot;
}

export interface ReservationInsert {
  slot_id: string;
  student_id: string;
  salon_id: string;
  recruitment_slot_id: string;
  message?: string;
  status: ReservationStatus;
}

export interface ReservationUpdate {
  status?: ReservationStatus;
}


// ==========================================
// Chat Message (変更なし)
// ==========================================
export interface ChatMessage {
  id: string; application_id: string; sender_id: string; sender_type: SenderType; message: string; is_read: boolean; created_at: string;
}
export interface ChatMessageInsert {
  application_id: string; sender_id: string; sender_type: SenderType; message: string;
}

// ==========================================
// Auth Context Types (変更なし)
// ==========================================
export interface AuthUser {
  id: string; email: string; userType: UserType; profile: Student | Salon;
}
export interface AuthContextType {
  user: AuthUser | null; loading: boolean; signIn: (email: string, password: string) => Promise<void>; signUp: (email: string, password: string, userType: UserType, profileData: StudentInsert | SalonInsert) => Promise<void>; signOut: () => Promise<void>; updateProfile: (data: StudentUpdate | SalonUpdate) => Promise<void>;
}