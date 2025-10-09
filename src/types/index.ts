// ==========================================
// Database Types
// ==========================================

export type UserType = 'student' | 'salon';

export type RecruitmentStatus = 'active' | 'closed' | 'confirmed';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type SenderType = 'student' | 'salon';

// ==========================================
// Student
// ==========================================

export interface Student {
  id: string;
  email: string;
  name: string;
  school_name?: string;
  instagram_url?: string;
  avatar_url?: string;
  is_verified: boolean;
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

// ==========================================
// Salon
// ==========================================

export interface Salon {
  id: string;
  email: string;
  salon_name: string;
  description?: string;
  address?: string;
  phone_number?: string;
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
  photo_url?: string;
}

export interface SalonUpdate {
  salon_name?: string;
  description?: string;
  address?: string;
  phone_number?: string;
  photo_url?: string;
}

// ==========================================
// Recruitment Slot
// ==========================================

export interface RecruitmentSlot {
  id: string;
  salon_id: string;
  title: string;
  description?: string;
  requirements?: string;
  deadline_date: string;
  status: RecruitmentStatus;
  max_applicants: number;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentSlotWithSalon extends RecruitmentSlot {
  salon: Salon;
}

export interface RecruitmentSlotInsert {
  salon_id: string;
  title: string;
  description?: string;
  requirements?: string;
  deadline_date: string;
  status: RecruitmentStatus;
  max_applicants?: number;
}

export interface RecruitmentSlotUpdate {
  title?: string;
  description?: string;
  requirements?: string;
  deadline_date?: string;
  status?: RecruitmentStatus;
  max_applicants?: number;
}

// ==========================================
// Application
// ==========================================

export interface Application {
  id: string;
  recruitment_slot_id: string;
  student_id: string;
  instagram_url: string;
  message?: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithDetails extends Application {
  student: Student;
  recruitment_slot: RecruitmentSlotWithSalon;
}

export interface ApplicationInsert {
  recruitment_slot_id: string;
  student_id: string;
  instagram_url: string;
  message?: string;
  status: ApplicationStatus;
}

export interface ApplicationUpdate {
  instagram_url?: string;
  message?: string;
  status?: ApplicationStatus;
}

// ==========================================
// Chat Message
// ==========================================

export interface ChatMessage {
  id: string;
  application_id: string;
  sender_id: string;
  sender_type: SenderType;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessageInsert {
  application_id: string;
  sender_id: string;
  sender_type: SenderType;
  message: string;
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
  signUp: (email: string, password: string, userType: UserType, profileData: StudentInsert | SalonInsert) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: StudentUpdate | SalonUpdate) => Promise<void>;
}