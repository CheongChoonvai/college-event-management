-- Event Management System - Database Schema

-- Events Table (This might already exist, included for completeness)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    price DECIMAL NOT NULL CHECK (price >= 0),
    organizer_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    image_url TEXT,
    category TEXT NOT NULL
);

-- Event Registration Table
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'refunded')),
    ticket_type TEXT NOT NULL,
    amount_paid DECIMAL NOT NULL CHECK (amount_paid >= 0),
    special_requirements TEXT,
    check_in_status BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP WITH TIME ZONE
);

-- Venue Table
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    facilities TEXT[] NOT NULL,
    contact_info TEXT NOT NULL,
    cost_per_hour DECIMAL NOT NULL CHECK (cost_per_hour >= 0),
    availability_schedule JSONB,
    images TEXT[],
    rating DECIMAL CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Venue Booking Table
CREATE TABLE IF NOT EXISTS venue_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    event_id UUID NOT NULL REFERENCES events(id),
    booking_start TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    total_cost DECIMAL NOT NULL CHECK (total_cost >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Budget Management Table
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('venue', 'catering', 'marketing', 'equipment', 'staff', 'other')),
    estimated_cost DECIMAL NOT NULL CHECK (estimated_cost >= 0),
    actual_cost DECIMAL CHECK (actual_cost >= 0),
    status TEXT NOT NULL CHECK (status IN ('planned', 'approved', 'spent', 'cancelled')),
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Schedule Planner Table
CREATE TABLE IF NOT EXISTS schedule_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    speaker TEXT,
    category TEXT,
    priority INTEGER CHECK (priority >= 1 AND priority <= 5),
    status TEXT NOT NULL CHECK (status IN ('planned', 'in-progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Notifications & Announcements Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())),
    event_id UUID REFERENCES events(id),
    is_announcement BOOLEAN DEFAULT FALSE,
    target_audience TEXT CHECK (target_audience IN ('all', 'participants', 'organizers', 'sponsors', 'staff')),
    expiry_date TIMESTAMP WITH TIME ZONE
);

-- Volunteer Allocation Table
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    role TEXT NOT NULL,
    responsibilities TEXT[],
    shift_start TIMESTAMP WITH TIME ZONE,
    shift_end TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    hours_worked DECIMAL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Report Generation Templates Table
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    template_fields JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Generated Reports Table
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    template_id UUID REFERENCES report_templates(id),
    report_name TEXT NOT NULL,
    report_data JSONB NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'csv', 'excel', 'json')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    file_url TEXT
);

-- Enable Row Level Security for all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for each table (example for events table)
CREATE POLICY "Events are visible to all authenticated users" ON events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Organizers can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events" ON events
    FOR UPDATE USING (auth.uid() = organizer_id);

-- Add more security policies as needed for other tables

-- Functions for common operations
CREATE OR REPLACE FUNCTION register_for_event(
    p_user_id UUID,
    p_event_id UUID,
    p_ticket_type TEXT,
    p_amount_paid DECIMAL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_event_capacity INTEGER;
    v_current_registrations INTEGER;
BEGIN
    -- Check if event exists and has capacity
    SELECT capacity INTO v_event_capacity FROM events WHERE id = p_event_id;
    SELECT COUNT(*) INTO v_current_registrations FROM registrations 
    WHERE event_id = p_event_id AND status != 'cancelled';
    
    IF v_current_registrations >= v_event_capacity THEN
        RAISE EXCEPTION 'Event is at full capacity';
    END IF;
    
    -- Create registration
    INSERT INTO registrations (
        user_id, event_id, status, payment_status, 
        ticket_type, amount_paid
    ) VALUES (
        p_user_id, p_event_id, 'confirmed', 
        CASE WHEN p_amount_paid > 0 THEN 'completed' ELSE 'pending' END,
        p_ticket_type, p_amount_paid
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION book_venue(
    p_venue_id UUID,
    p_event_id UUID,
    p_booking_start TIMESTAMP WITH TIME ZONE,
    p_booking_end TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_venue_cost DECIMAL;
    v_hours DECIMAL;
    v_total_cost DECIMAL;
    v_conflict_count INTEGER;
BEGIN
    -- Check for booking conflicts
    SELECT COUNT(*) INTO v_conflict_count FROM venue_bookings
    WHERE venue_id = p_venue_id
    AND status = 'confirmed'
    AND (
        (booking_start <= p_booking_start AND booking_end > p_booking_start)
        OR (booking_start < p_booking_end AND booking_end >= p_booking_end)
        OR (booking_start >= p_booking_start AND booking_end <= p_booking_end)
    );
    
    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Venue already booked for this time period';
    END IF;
    
    -- Calculate total cost
    SELECT cost_per_hour INTO v_venue_cost FROM venues WHERE id = p_venue_id;
    v_hours := EXTRACT(EPOCH FROM (p_booking_end - p_booking_start)) / 3600;
    v_total_cost := v_venue_cost * v_hours;
    
    -- Create booking
    INSERT INTO venue_bookings (
        venue_id, event_id, booking_start, booking_end,
        status, total_cost, payment_status
    ) VALUES (
        p_venue_id, p_event_id, p_booking_start, p_booking_end,
        'confirmed', v_total_cost, 'pending'
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Additional indices for improved performance
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_venue_bookings_venue_id ON venue_bookings(venue_id);
CREATE INDEX idx_venue_bookings_event_id ON venue_bookings(event_id);
CREATE INDEX idx_budget_items_event_id ON budget_items(event_id);
CREATE INDEX idx_schedule_items_event_id ON schedule_items(event_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_event_id ON notifications(event_id);
CREATE INDEX idx_volunteers_event_id ON volunteers(event_id);
CREATE INDEX idx_generated_reports_event_id ON generated_reports(event_id);
