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
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number;
  price: number;
  organizer_id: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  image_url?: string;
  category: string;
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
};

export type Budget = {
  id: string;
  event_id: string;
  item_name: string;
  category: 'venue' | 'catering' | 'marketing' | 'equipment' | 'staff' | 'other';
  estimated_cost: number;
  actual_cost?: number;
  status: 'planned' | 'approved' | 'spent' | 'cancelled';
  notes?: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
};
