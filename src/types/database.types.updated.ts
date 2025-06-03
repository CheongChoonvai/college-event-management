// Database types for the Event Management System
export type User = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  user_role: 'admin' | 'organizer' | 'participant' | 'sponsor';
  created_at: string;
};

export type Event = {
  id: string;
  organizer_id: string;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  capacity: number;
  category: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  image_url: string | null;
};

export type Registration = {
  id: string;
  user_id: string;
  event_id: string;
  registration_date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'refunded';
  ticket_type: string;
  amount_paid: number;
  special_requirements?: string;
  check_in_status: boolean;
  check_in_time?: string;
};

export type Sponsor = {
  id: string;
  user_id: string;
  company_name: string;
  logo_url?: string;
  website?: string;
  contact_email: string;
  contact_phone?: string;
};

export type Sponsorship = {
  id: string;
  sponsor_id: string;
  event_id: string;
  package_name: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type Venue = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  facilities: string[];
  contact_info: string;
  cost_per_hour: number;
  availability_schedule?: any;
  images?: string[];
  rating?: number;
  created_at: string;
  updated_at: string;
};

export type VenueBooking = {
  id: string;
  venue_id: string;
  event_id: string;
  booking_start: string;
  booking_end: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_cost: number;
  payment_status: 'pending' | 'partial' | 'completed' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type BudgetItem = {
  id: string;
  event_id: string;
  item_name: string;
  category: 'venue' | 'catering' | 'marketing' | 'equipment' | 'staff' | 'other';
  estimated_cost: number;
  actual_cost?: number;
  status: 'planned' | 'approved' | 'spent' | 'cancelled';
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
};

export type ScheduleItem = {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  speaker?: string;
  category?: string;
  priority?: number;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
  event_id?: string;
  is_announcement: boolean;
  target_audience?: 'all' | 'participants' | 'organizers' | 'sponsors' | 'staff';
  expiry_date?: string;
};

export type Volunteer = {
  id: string;
  user_id: string;
  event_id: string;
  role: string;
  responsibilities: string[];
  shift_start?: string;
  shift_end?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  hours_worked: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type ReportTemplate = {
  id: string;
  name: string;
  description?: string;
  template_fields: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type GeneratedReport = {
  id: string;
  event_id: string;
  template_id?: string;
  report_name: string;
  report_data: any;
  format: 'pdf' | 'csv' | 'excel' | 'json';
  created_by?: string;
  created_at: string;
  file_url?: string;
};
