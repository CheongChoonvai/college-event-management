import { z } from 'zod';

// User Schema
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  user_role: z.enum(['admin', 'organizer', 'participant', 'sponsor']),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Event Schema
export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(3, 'Location is required'),
  start_date: z.string().refine(date => new Date(date) > new Date(), {
    message: 'Start date must be in the future'
  }),
  end_date: z.string().refine(date => new Date(date) > new Date(), {
    message: 'End date must be in the future'
  }),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  price: z.number().nonnegative('Price cannot be negative'),
  category: z.string().min(1, 'Category is required'),
});

// Registration Schema
export const registrationSchema = z.object({
  event_id: z.string().uuid(),
  ticket_type: z.string().min(1, 'Ticket type is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  special_requirements: z.string().optional(),
});

// Sponsor Schema
export const sponsorSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  website: z.string().url('Invalid URL').optional(),
  contact_email: z.string().email('Invalid email address'),
  contact_phone: z.string().optional(),
});

// Sponsorship Schema
export const sponsorshipSchema = z.object({
  event_id: z.string().uuid(),
  package_name: z.string().min(1, 'Package name is required'),
  amount: z.number().positive('Amount must be positive'),
});

// Venue Schema
export const venueSchema = z.object({
  name: z.string().min(2, 'Venue name is required'),
  address: z.string().min(5, 'Address is required'),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  facilities: z.array(z.string()),
  contact_info: z.string().min(5, 'Contact information is required'),
  cost_per_hour: z.number().nonnegative('Cost cannot be negative'),
});

// Venue Booking Schema
export const venueBookingSchema = z.object({
  venue_id: z.string().uuid('Invalid venue ID'),
  event_id: z.string().uuid('Invalid event ID'),
  booking_start: z.string().refine(date => new Date(date) > new Date(), {
    message: 'Booking start time must be in the future'
  }),
  booking_end: z.string().refine(date => new Date(date) > new Date(), {
    message: 'Booking end time must be in the future'
  }),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  payment_status: z.enum(['pending', 'partial', 'completed', 'refunded']),
  notes: z.string().optional(),
});

// Budget Item Schema
export const budgetItemSchema = z.object({
  event_id: z.string().uuid('Invalid event ID format'),
  item_name: z.string().min(3, 'Item name must be at least 3 characters'),
  category: z.enum(['venue', 'catering', 'marketing', 'equipment', 'staff', 'other']),
  estimated_cost: z.number().nonnegative('Estimated cost cannot be negative'),
  actual_cost: z.number().nonnegative('Actual cost cannot be negative').optional(),
  status: z.enum(['planned', 'approved', 'spent', 'cancelled']),
  notes: z.string().optional(),
  receipt_url: z.string().url('Invalid receipt URL').optional(),
});

// Schedule Item Schema
export const scheduleItemSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  start_time: z.string(),
  end_time: z.string(),
  location: z.string().optional(),
  speaker: z.string().optional(),
  category: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']),
});

// Notification Schema
export const notificationSchema = z.object({
  user_id: z.string().uuid('Invalid user ID').optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  message: z.string().min(5, 'Message is required'),
  type: z.enum(['info', 'warning', 'success', 'error']),
  event_id: z.string().uuid('Invalid event ID').optional(),
  target_audience: z.enum(['all', 'participants', 'organizers', 'sponsors', 'staff']).optional(),
  expiry_date: z.string().optional(),
});

// Volunteer Schema
export const volunteerSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  event_id: z.string().uuid('Invalid event ID'),
  role: z.string().min(2, 'Role must be at least 2 characters'),
  responsibilities: z.array(z.string()),
  shift_start: z.string().optional(),
  shift_end: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  notes: z.string().optional(),
});

// Report Template Schema
export const reportTemplateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  template_fields: z.record(z.any()),
  created_by: z.string().uuid('Invalid user ID').optional(),
});

// Generated Report Schema
export const generatedReportSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  template_id: z.string().uuid('Invalid template ID').optional(),
  report_name: z.string().min(3, 'Report name must be at least 3 characters'),
  report_data: z.record(z.any()),
  format: z.enum(['pdf', 'csv', 'excel', 'json']),
  created_by: z.string().uuid('Invalid user ID').optional(),
});
