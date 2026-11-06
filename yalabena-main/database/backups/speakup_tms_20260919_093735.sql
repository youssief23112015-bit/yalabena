--
-- PostgreSQL database dump
--

\restrict JCLUd03cxeEBJOXhVadQt0zs6TclLAvxWfnxia1wj66OmzSw2HkV1spwq3oggAV

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: activity_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_event_type AS ENUM (
    'movie_night',
    'conversation_club',
    'trip',
    'contest',
    'workshop',
    'other'
);


--
-- Name: activity_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_status AS ENUM (
    'upcoming',
    'open',
    'full',
    'completed',
    'cancelled'
);


--
-- Name: activity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_type AS ENUM (
    'call',
    'note',
    'follow_up',
    'status_change',
    'email',
    'visit'
);


--
-- Name: actor_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.actor_type AS ENUM (
    'user',
    'system',
    'api'
);


--
-- Name: assignment_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assignment_type AS ENUM (
    'text',
    'file_upload',
    'mixed'
);


--
-- Name: attempt_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attempt_status AS ENUM (
    'in_progress',
    'submitted',
    'graded',
    'abandoned'
);


--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'excused'
);


--
-- Name: cert_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cert_status AS ENUM (
    'active',
    'revoked',
    'expired'
);


--
-- Name: chat_message_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.chat_message_type AS ENUM (
    'text',
    'emoji',
    'image',
    'file',
    'system'
);


--
-- Name: chat_room_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.chat_room_type AS ENUM (
    'one_on_one',
    'group',
    'announcement'
);


--
-- Name: check_in_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.check_in_method AS ENUM (
    'manual',
    'qr_code',
    'self_portal',
    'auto'
);


--
-- Name: course_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_status AS ENUM (
    'active',
    'inactive',
    'archived'
);


--
-- Name: document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_type AS ENUM (
    'contract',
    'id',
    'certificate',
    'visa',
    'other'
);


--
-- Name: employee_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employee_status AS ENUM (
    'active',
    'on_leave',
    'terminated',
    'suspended'
);


--
-- Name: employee_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employee_type AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'hourly'
);


--
-- Name: enrollment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enrollment_status AS ENUM (
    'pending',
    'active',
    'completed',
    'dropped',
    'transferred'
);


--
-- Name: financial_transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.financial_transaction_type AS ENUM (
    'payment',
    'refund',
    'expense',
    'adjustment'
);


--
-- Name: follow_up_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.follow_up_status AS ENUM (
    'pending',
    'completed',
    'overdue',
    'cancelled'
);


--
-- Name: group_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.group_mode AS ENUM (
    'in_person',
    'online',
    'hybrid'
);


--
-- Name: group_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.group_status AS ENUM (
    'upcoming',
    'active',
    'completed',
    'cancelled'
);


--
-- Name: installment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.installment_status AS ENUM (
    'pending',
    'paid',
    'overdue',
    'partial'
);


--
-- Name: inventory_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inventory_category AS ENUM (
    'book',
    'workbook',
    'merchandise',
    'stationery',
    'equipment',
    'other'
);


--
-- Name: inventory_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inventory_status AS ENUM (
    'active',
    'discontinued',
    'archived'
);


--
-- Name: invoice_item_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_item_type AS ENUM (
    'course',
    'registration_fee',
    'book',
    'exam',
    'certificate',
    'other'
);


--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'unpaid',
    'partial',
    'paid',
    'overdue',
    'cancelled',
    'refunded'
);


--
-- Name: item_condition; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.item_condition AS ENUM (
    'good',
    'damaged',
    'lost'
);


--
-- Name: kb_visibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.kb_visibility AS ENUM (
    'staff',
    'manager',
    'admin',
    'teacher',
    'public'
);


--
-- Name: lead_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_source AS ENUM (
    'walk_in',
    'website',
    'referral',
    'other'
);


--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_status AS ENUM (
    'new',
    'contacted',
    'interested',
    'test_scheduled',
    'enrolled',
    'lost'
);


--
-- Name: leave_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leave_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


--
-- Name: leave_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leave_type AS ENUM (
    'annual',
    'sick',
    'emergency',
    'unpaid',
    'other'
);


--
-- Name: lesson_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lesson_type AS ENUM (
    'content',
    'video',
    'audio',
    'interactive'
);


--
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_channel AS ENUM (
    'in_app',
    'email'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'bank_transfer',
    'easykash',
    'other'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


--
-- Name: payroll_entry_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payroll_entry_status AS ENUM (
    'draft',
    'approved',
    'paid',
    'disputed'
);


--
-- Name: payroll_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payroll_status AS ENUM (
    'open',
    'processing',
    'closed',
    'exported'
);


--
-- Name: post_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_status AS ENUM (
    'draft',
    'published',
    'archived'
);


--
-- Name: promo_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.promo_type AS ENUM (
    'percentage',
    'fixed_amount'
);


--
-- Name: question_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.question_type AS ENUM (
    'mcq',
    'fill_blank',
    'matching',
    'true_false',
    'ordering',
    'short_answer'
);


--
-- Name: refund_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.refund_reason AS ENUM (
    'course_cancellation',
    'student_withdrawal',
    'duplicate_payment',
    'error',
    'other'
);


--
-- Name: refund_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.refund_status AS ENUM (
    'pending',
    'approved',
    'processed',
    'rejected'
);


--
-- Name: registration_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.registration_status AS ENUM (
    'registered',
    'attended',
    'no_show',
    'cancelled'
);


--
-- Name: release_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.release_type AS ENUM (
    'instant',
    'after_review',
    'scheduled'
);


--
-- Name: resource_access; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.resource_access AS ENUM (
    'enrolled',
    'public',
    'restricted'
);


--
-- Name: resource_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.resource_type AS ENUM (
    'file',
    'video',
    'audio',
    'link',
    'pdf'
);


--
-- Name: slot_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.slot_status AS ENUM (
    'open',
    'full',
    'cancelled',
    'completed'
);


--
-- Name: stock_move_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stock_move_type AS ENUM (
    'in',
    'out',
    'adjustment',
    'return',
    'transfer_in',
    'transfer_out'
);


--
-- Name: strike_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.strike_action AS ENUM (
    'warning',
    'mute_24h',
    'ban_permanent'
);


--
-- Name: student_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.student_status AS ENUM (
    'active',
    'inactive',
    'graduated',
    'dropped',
    'suspended'
);


--
-- Name: submission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.submission_status AS ENUM (
    'submitted',
    'graded',
    'returned',
    'resubmitted'
);


--
-- Name: test_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'no_show',
    'cancelled'
);


--
-- Name: testimonial_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.testimonial_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: transaction_direction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_direction AS ENUM (
    'in',
    'out'
);


--
-- Name: user_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);


--
-- Name: violation_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.violation_action AS ENUM (
    'blocked',
    'warned',
    'flagged_only'
);


--
-- Name: check_classroom_conflict(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_classroom_conflict() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_conflict_count INT;
BEGIN
    IF NEW.classroom_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_conflict_count
    FROM sessions
    WHERE classroom_id = NEW.classroom_id
      AND date = NEW.date
      AND id IS DISTINCT FROM NEW.id
      AND (
          (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
      );

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Classroom double-booking detected for date % time %-%', NEW.date, NEW.start_time, NEW.end_time;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION check_classroom_conflict(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_classroom_conflict() IS 'Prevent classroom from being double-booked';


--
-- Name: check_group_capacity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_group_capacity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_capacity INT;
    v_enrolled INT;
BEGIN
    SELECT capacity INTO v_capacity FROM groups WHERE id = NEW.group_id;
    SELECT COUNT(*) INTO v_enrolled FROM group_students 
    WHERE group_id = NEW.group_id AND status = 'active';

    IF v_enrolled >= v_capacity THEN
        RAISE EXCEPTION 'Group capacity exceeded: %/%', v_enrolled, v_capacity;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION check_group_capacity(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_group_capacity() IS 'Hard stop on over-enrollment (SRS 4.4)';


--
-- Name: check_refund_amount_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_refund_amount_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_payment_amount DECIMAL(12,2);
    v_existing_refunds DECIMAL(12,2);
BEGIN
    -- 1. ?????? ???????? ???????????? ??????????????
    SELECT amount INTO v_payment_amount FROM payments WHERE id = NEW.payment_id;

    -- 2. ???????? ?????????????? ???????????????? ????????????????/???????????????? ???????????? ???????? ????????????
    SELECT COALESCE(SUM(amount), 0) INTO v_existing_refunds 
    FROM refunds 
    WHERE payment_id = NEW.payment_id 
      AND id IS DISTINCT FROM NEW.id
      AND status IN ('pending', 'approved', 'processed');

    -- 3. ???????????? ???? ????????????????
    IF (v_existing_refunds + NEW.amount) > v_payment_amount THEN
        RAISE EXCEPTION 'Cumulative refund amount (%) exceeds original payment amount (%) for payment_id %', 
            (v_existing_refunds + NEW.amount), v_payment_amount, NEW.payment_id;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: check_teacher_conflict(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_teacher_conflict() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_teacher_id UUID;
    v_sub_teacher_id UUID;
    v_conflict_count INT;
BEGIN
    SELECT teacher_id, substitute_teacher_id 
    INTO v_teacher_id, v_sub_teacher_id 
    FROM groups WHERE id = NEW.group_id;

    SELECT COUNT(*) INTO v_conflict_count
    FROM sessions s
    JOIN groups g ON s.group_id = g.id
    WHERE (g.teacher_id IN (v_teacher_id, COALESCE(v_sub_teacher_id, v_teacher_id))
           OR g.substitute_teacher_id IN (v_teacher_id, COALESCE(v_sub_teacher_id, v_teacher_id)))
      AND s.date = NEW.date
      AND s.id IS DISTINCT FROM NEW.id
      AND ((NEW.start_time, NEW.end_time) OVERLAPS (s.start_time, s.end_time));

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Teacher double-booking detected for date % time %-%', NEW.date, NEW.start_time, NEW.end_time;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION check_teacher_conflict(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_teacher_conflict() IS 'Prevent teacher from being scheduled in two sessions simultaneously';


--
-- Name: decrease_test_slot_booked_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrease_test_slot_booked_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.slot_id IS NOT NULL THEN
        UPDATE test_slots 
        SET booked_count = GREATEST(booked_count - 1, 0),
            status = CASE 
                WHEN GREATEST(booked_count - 1, 0) < capacity THEN 'open'::slot_status 
                ELSE status 
            END
        WHERE id = OLD.slot_id;
    END IF;
    RETURN OLD;
END;
$$;


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$;


--
-- Name: generate_receipt_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_receipt_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('receipt_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$;


--
-- Name: generate_student_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_student_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.student_number := 'SU-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('student_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$;


--
-- Name: log_lead_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_lead_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lead_activities (lead_id, type, old_status, new_status, created_by, created_at)
        VALUES (NEW.id, 'status_change', OLD.status, NEW.status, NULL, NOW());
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION log_lead_status_change(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.log_lead_status_change() IS 'Auto-log status changes in lead activity history';


--
-- Name: log_payment_transaction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_payment_transaction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_branch UUID;
BEGIN
    SELECT branch_id INTO v_branch FROM invoices WHERE id = NEW.invoice_id;

    INSERT INTO financial_transactions (
        branch_id, invoice_id, payment_id,
        transaction_type, direction, amount,
        transaction_date, description, created_by
    )
    VALUES (
        v_branch, NEW.invoice_id, NEW.id,
        'payment', 'in', NEW.amount,
        NEW.paid_at, CONCAT('Payment ', COALESCE(NEW.receipt_number, '')), NEW.recorded_by
    );

    RETURN NEW;
END;
$$;


--
-- Name: log_refund_transaction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_refund_transaction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_branch UUID;
BEGIN
    SELECT branch_id INTO v_branch FROM invoices WHERE id = NEW.invoice_id;

    INSERT INTO financial_transactions (
        branch_id, invoice_id, refund_id,
        transaction_type, direction, amount,
        transaction_date, description, created_by
    )
    VALUES (
        v_branch, NEW.invoice_id, NEW.id,
        'refund', 'out', NEW.amount,
        COALESCE(NEW.processed_at, NOW()), CONCAT('Refund ', NEW.reason_code), NEW.processed_by
    );

    RETURN NEW;
END;
$$;


--
-- Name: protect_invoice_total_amount(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_invoice_total_amount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
        IF OLD.paid_amount > 0 THEN
            RAISE EXCEPTION 'Cannot modify total_amount on invoice % because payments are already recorded (paid: %). Use discount/credit notes instead.', 
                OLD.invoice_number, OLD.paid_amount;
        END IF;

        -- ?????????? ???????? ?????????????? ???????????????? ???????????????? ?????? ????????????????
        NEW.balance_due := NEW.total_amount - NEW.paid_amount;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION protect_invoice_total_amount(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.protect_invoice_total_amount() IS 'Enforces invoice immutability on total_amount once payments have started';


--
-- Name: sync_invoice_financials(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_invoice_financials() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    r_invoice_id UUID;
    v_total_paid DECIMAL(12,2);
    v_total_refunded DECIMAL(12,2);
    v_net_paid DECIMAL(12,2);
    v_invoice_total DECIMAL(12,2);
BEGIN
    -- ?????? ???????????????? ?????????????? ???????????????? ?????????? ?????????? ?????????????? ???? ???????? ?????? ????????????/??????????????????
    FOR r_invoice_id IN
        SELECT DISTINCT inv_id FROM (
            SELECT CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.invoice_id END AS inv_id
            UNION
            SELECT CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.invoice_id END AS inv_id
        ) t WHERE inv_id IS NOT NULL
    LOOP
        -- 1. ???????????? ?????????????????? ???????????????? ???????? ????????????????
        SELECT COALESCE(SUM(amount), 0) INTO v_total_paid 
        FROM payments 
        WHERE invoice_id = r_invoice_id AND status = 'completed';

        -- 2. ???????????? ?????????????? ???????????????? ???????? ????????????????
        SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded 
        FROM refunds 
        WHERE invoice_id = r_invoice_id AND status = 'processed';

        v_net_paid := v_total_paid - v_total_refunded;

        -- 3. ?????????? ???????????????? ??????????????????
        SELECT total_amount INTO v_invoice_total FROM invoices WHERE id = r_invoice_id;

        IF FOUND THEN
            UPDATE invoices 
            SET paid_amount = v_net_paid,
                balance_due = v_invoice_total - v_net_paid,
                status = CASE 
                    WHEN (v_invoice_total - v_net_paid) <= 0 THEN 'paid'::invoice_status
                    WHEN v_net_paid > 0 THEN 'partial'::invoice_status
                    ELSE 'unpaid'::invoice_status
                END,
                updated_at = NOW()
            WHERE id = r_invoice_id;
        END IF;
    END LOOP;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION sync_invoice_financials(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sync_invoice_financials() IS 'Auto-recalculate invoice net paid amount and status on any payment or refund change';


--
-- Name: update_test_slot_booked_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_test_slot_booked_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE test_slots 
    SET booked_count = booked_count + 1,
        status = CASE WHEN booked_count + 1 >= capacity THEN 'full'::slot_status ELSE status END
    WHERE id = NEW.slot_id;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: verify_group_teacher_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_group_teacher_role() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = NEW.teacher_id AND r.slug = 'teacher'
    ) THEN
        RAISE EXCEPTION 'Assigned user_id (%) does not have the "teacher" role', NEW.teacher_id;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION verify_group_teacher_role(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verify_group_teacher_role() IS 'Enforce that only users with teacher role can be assigned to groups';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    type public.activity_event_type NOT NULL,
    date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    location character varying(255),
    branch_id uuid NOT NULL,
    capacity integer NOT NULL,
    fee numeric(10,2) DEFAULT 0,
    target_levels jsonb,
    target_groups jsonb,
    is_open_to_all boolean DEFAULT false,
    status public.activity_status DEFAULT 'upcoming'::public.activity_status,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT activities_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT activities_fee_check CHECK ((fee >= (0)::numeric)),
    CONSTRAINT chk_act_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT chk_act_time CHECK (((end_time IS NULL) OR (start_time IS NULL) OR (end_time > start_time)))
);


--
-- Name: TABLE activities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.activities IS 'Extracurricular events (movie nights, clubs, trips, contests)';


--
-- Name: activity_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_photos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    activity_id uuid NOT NULL,
    file_url character varying(500) NOT NULL,
    caption character varying(255),
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE activity_photos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.activity_photos IS 'Photo gallery per activity';


--
-- Name: activity_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_registrations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    activity_id uuid NOT NULL,
    student_id uuid NOT NULL,
    registered_at timestamp with time zone DEFAULT now(),
    status public.registration_status DEFAULT 'registered'::public.registration_status,
    paid_amount numeric(10,2) DEFAULT 0,
    payment_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT activity_registrations_paid_amount_check CHECK ((paid_amount >= (0)::numeric))
);


--
-- Name: TABLE activity_registrations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.activity_registrations IS 'Student sign-ups for events';


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type public.assignment_type DEFAULT 'file_upload'::public.assignment_type,
    due_at timestamp with time zone NOT NULL,
    max_grade numeric(5,2) DEFAULT 100,
    allow_late_submission boolean DEFAULT false,
    late_penalty_percent integer DEFAULT 0,
    is_published boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT assignments_late_penalty_percent_check CHECK (((late_penalty_percent >= 0) AND (late_penalty_percent <= 100))),
    CONSTRAINT assignments_max_grade_check CHECK ((max_grade > (0)::numeric)),
    CONSTRAINT chk_asgn_title_not_empty CHECK ((TRIM(BOTH FROM title) <> ''::text))
);


--
-- Name: TABLE assignments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.assignments IS 'Homework or tasks for a group';


--
-- Name: attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status public.attendance_status NOT NULL,
    check_in_method public.check_in_method DEFAULT 'manual'::public.check_in_method,
    check_in_time timestamp with time zone,
    minutes_late integer DEFAULT 0,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT attendances_minutes_late_check CHECK ((minutes_late >= 0))
);


--
-- Name: TABLE attendances; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.attendances IS 'Student presence record per session';


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    actor_id uuid,
    actor_type public.actor_type DEFAULT 'user'::public.actor_type,
    action character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id uuid NOT NULL,
    before_state jsonb,
    after_state jsonb,
    description text,
    ip_address character varying(45),
    user_agent text,
    session_id character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audit_logs IS 'IMMUTABLE record of all sensitive actions (NFR 7.2)';


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255),
    content text NOT NULL,
    excerpt character varying(500),
    featured_image character varying(500),
    meta_title character varying(255),
    meta_description character varying(500),
    status public.post_status DEFAULT 'draft'::public.post_status,
    published_at timestamp with time zone,
    author_id uuid,
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT blog_posts_view_count_check CHECK ((view_count >= 0)),
    CONSTRAINT chk_bp_title_not_empty CHECK ((TRIM(BOTH FROM title) <> ''::text))
);


--
-- Name: TABLE blog_posts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.blog_posts IS 'Public blog (optional, if budget allows - Section 4.14)';


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    address text NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    manager_id uuid,
    classroom_count integer DEFAULT 0,
    logo_url character varying(500),
    status public.user_status DEFAULT 'active'::public.user_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT branches_classroom_count_check CHECK ((classroom_count >= 0)),
    CONSTRAINT chk_branch_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text))
);


--
-- Name: TABLE branches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.branches IS 'Physical academy locations with isolated data scopes';


--
-- Name: certificate_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    course_id uuid,
    html_template text NOT NULL,
    placeholders jsonb NOT NULL,
    background_url character varying(500),
    is_default boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT certificate_templates_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[]))),
    CONSTRAINT chk_ct_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text))
);


--
-- Name: TABLE certificate_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.certificate_templates IS 'Drag-drop designs for certificates with placeholders';


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    group_id uuid NOT NULL,
    template_id uuid,
    code character varying(100) NOT NULL,
    pdf_url character varying(500),
    issue_date date NOT NULL,
    expiry_date date,
    status public.cert_status DEFAULT 'active'::public.cert_status,
    revoked_at timestamp with time zone,
    revoke_reason text,
    issued_by uuid,
    is_auto_issued boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_cert_code_not_empty CHECK ((TRIM(BOTH FROM code) <> ''::text)),
    CONSTRAINT chk_cert_dates CHECK (((expiry_date IS NULL) OR (expiry_date >= issue_date)))
);


--
-- Name: TABLE certificates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.certificates IS 'Issued certificates with unique verification codes';


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    room_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    body text,
    type public.chat_message_type DEFAULT 'text'::public.chat_message_type,
    file_url character varying(500),
    file_size bigint,
    file_name character varying(255),
    reply_to_id uuid,
    edited_at timestamp with time zone,
    edited_count integer DEFAULT 0,
    deleted_at timestamp with time zone,
    is_flagged boolean DEFAULT false,
    flag_reason character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_edited_count_check CHECK ((edited_count >= 0)),
    CONSTRAINT chat_messages_file_size_check CHECK ((file_size >= 0)),
    CONSTRAINT chk_cm_content_not_empty CHECK (((body IS NOT NULL) OR (file_url IS NOT NULL)))
);


--
-- Name: TABLE chat_messages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chat_messages IS 'Individual messages with soft-delete and edit support';


--
-- Name: chat_room_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_room_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    joined_at timestamp with time zone DEFAULT now(),
    last_read_at timestamp with time zone,
    is_muted boolean DEFAULT false,
    muted_until timestamp with time zone,
    is_banned boolean DEFAULT false,
    banned_until timestamp with time zone,
    ban_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_room_members_role_check CHECK (((role)::text = ANY ((ARRAY['member'::character varying, 'admin'::character varying, 'moderator'::character varying, 'teacher'::character varying, 'student'::character varying])::text[])))
);


--
-- Name: TABLE chat_room_members; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chat_room_members IS 'Room membership with mute/ban preferences';


--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type public.chat_room_type NOT NULL,
    group_id uuid,
    name character varying(150),
    topic character varying(255),
    is_archived boolean DEFAULT false,
    archived_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE chat_rooms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chat_rooms IS 'Conversation containers: 1-on-1, group, announcement';


--
-- Name: chat_strikes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_strikes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    violation_id uuid NOT NULL,
    strike_number integer NOT NULL,
    action public.strike_action NOT NULL,
    expires_at timestamp with time zone,
    applied_by uuid,
    applied_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    CONSTRAINT chat_strikes_strike_number_check CHECK ((strike_number > 0))
);


--
-- Name: TABLE chat_strikes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chat_strikes IS 'Strike counter: 1st=warning, 2nd=24h mute, 3rd=permanent ban';


--
-- Name: chat_violations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_violations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    message_id uuid NOT NULL,
    room_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    rule_matched character varying(100) NOT NULL,
    original_message text NOT NULL,
    action_taken public.violation_action NOT NULL,
    moderator_id uuid,
    moderator_note text,
    resolved_at timestamp with time zone,
    is_false_positive boolean DEFAULT false,
    detection_method character varying(50) DEFAULT 'text_regex'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE chat_violations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.chat_violations IS 'IMMUTABLE log of contact-sharing attempts (Section 6 compliance)';


--
-- Name: classrooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classrooms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    capacity integer DEFAULT 20,
    type character varying(20) DEFAULT 'standard'::character varying,
    status public.user_status DEFAULT 'active'::public.user_status,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_classroom_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT classrooms_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT classrooms_type_check CHECK (((type)::text = ANY ((ARRAY['standard'::character varying, 'lab'::character varying, 'conference'::character varying, 'online'::character varying])::text[])))
);


--
-- Name: TABLE classrooms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.classrooms IS 'Physical rooms within a branch';


--
-- Name: course_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_materials (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid NOT NULL,
    inventory_item_id uuid NOT NULL,
    is_required boolean DEFAULT true,
    quantity_per_student integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT course_materials_quantity_per_student_check CHECK ((quantity_per_student > 0))
);


--
-- Name: TABLE course_materials; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.course_materials IS 'Links courses to inventory items (books, workbooks)';


--
-- Name: course_prerequisites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_prerequisites (
    course_id uuid NOT NULL,
    prerequisite_course_id uuid NOT NULL,
    is_strict boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_cp_no_self_ref CHECK ((course_id <> prerequisite_course_id))
);


--
-- Name: TABLE course_prerequisites; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.course_prerequisites IS 'Many-to-many course dependency chain';


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50),
    level character varying(10) NOT NULL,
    duration_hours integer NOT NULL,
    syllabus text,
    description text,
    default_price numeric(10,2) NOT NULL,
    min_age integer,
    max_age integer,
    status public.course_status DEFAULT 'active'::public.course_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_course_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT courses_check CHECK ((max_age >= min_age)),
    CONSTRAINT courses_default_price_check CHECK ((default_price >= (0)::numeric)),
    CONSTRAINT courses_duration_hours_check CHECK ((duration_hours > 0)),
    CONSTRAINT courses_level_check CHECK (((level)::text = ANY ((ARRAY['A1'::character varying, 'A2'::character varying, 'B1'::character varying, 'B2'::character varying, 'C1'::character varying, 'C2'::character varying])::text[]))),
    CONSTRAINT courses_min_age_check CHECK ((min_age >= 0))
);


--
-- Name: TABLE courses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.courses IS 'Master course definitions';


--
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    file_url character varying(500) NOT NULL,
    document_type public.document_type NOT NULL,
    expiry_date date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_ed_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text))
);


--
-- Name: TABLE employee_documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.employee_documents IS 'Contract, ID, certificate attachments';


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    employee_number character varying(50),
    employee_type public.employee_type NOT NULL,
    department character varying(100),
    job_title character varying(100) NOT NULL,
    contract_start date NOT NULL,
    contract_end date,
    salary numeric(12,2),
    hourly_rate numeric(10,2),
    currency character varying(3) DEFAULT 'EGP'::character varying,
    bank_account character varying(100),
    bank_name character varying(100),
    status public.employee_status DEFAULT 'active'::public.employee_status,
    termination_date date,
    termination_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_emp_contract_dates CHECK (((contract_end IS NULL) OR (contract_end >= contract_start))),
    CONSTRAINT chk_emp_job_title_not_empty CHECK ((TRIM(BOTH FROM job_title) <> ''::text)),
    CONSTRAINT employees_hourly_rate_check CHECK (((hourly_rate IS NULL) OR (hourly_rate >= (0)::numeric))),
    CONSTRAINT employees_salary_check CHECK (((salary IS NULL) OR (salary >= (0)::numeric)))
);


--
-- Name: TABLE employees; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.employees IS 'Staff and teacher employment records';


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    group_id uuid NOT NULL,
    status public.enrollment_status DEFAULT 'pending'::public.enrollment_status,
    total_fee numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0,
    final_amount numeric(12,2) NOT NULL,
    promo_code_id uuid,
    enrolled_at timestamp with time zone DEFAULT now(),
    enrolled_by uuid,
    dropped_at timestamp with time zone,
    drop_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_enr_discount_bounds CHECK ((discount_amount <= total_fee)),
    CONSTRAINT chk_enr_final_amount CHECK ((final_amount = (total_fee - discount_amount))),
    CONSTRAINT enrollments_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT enrollments_final_amount_check CHECK ((final_amount >= (0)::numeric)),
    CONSTRAINT enrollments_total_fee_check CHECK ((total_fee >= (0)::numeric))
);


--
-- Name: TABLE enrollments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.enrollments IS 'Formal enrollment linking student to group with financial terms';


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid,
    invoice_id uuid,
    payment_id uuid,
    refund_id uuid,
    transaction_type public.financial_transaction_type NOT NULL,
    direction public.transaction_direction NOT NULL,
    amount numeric(12,2) NOT NULL,
    transaction_date timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT financial_transactions_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: TABLE financial_transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.financial_transactions IS 'Central ledger for all incoming and outgoing financial movements';


--
-- Name: follow_ups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follow_ups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    assigned_to uuid NOT NULL,
    due_date timestamp with time zone NOT NULL,
    status public.follow_up_status DEFAULT 'pending'::public.follow_up_status,
    note text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE follow_ups; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.follow_ups IS 'Dedicated follow-up reminder system';


--
-- Name: gradebook_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gradebook_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    weight numeric(5,2) NOT NULL,
    "order" integer NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_gc_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT gradebook_categories_order_check CHECK (("order" > 0)),
    CONSTRAINT gradebook_categories_weight_check CHECK (((weight > (0)::numeric) AND (weight <= (100)::numeric)))
);


--
-- Name: TABLE gradebook_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.gradebook_categories IS 'Weighted grading components (attendance, assignments, midterm, final)';


--
-- Name: gradebook_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gradebook_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    student_id uuid NOT NULL,
    category_id uuid NOT NULL,
    score numeric(5,2) NOT NULL,
    max_score numeric(5,2) NOT NULL,
    percentage numeric(5,2) NOT NULL,
    weighted_score numeric(5,2) NOT NULL,
    reference_type character varying(50),
    reference_id uuid,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gradebook_entries_max_score_check CHECK ((max_score > (0)::numeric)),
    CONSTRAINT gradebook_entries_percentage_check CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric))),
    CONSTRAINT gradebook_entries_reference_type_check CHECK (((reference_type)::text = ANY ((ARRAY['quiz'::character varying, 'assignment'::character varying, 'attendance'::character varying, 'manual'::character varying])::text[]))),
    CONSTRAINT gradebook_entries_score_check CHECK ((score >= (0)::numeric))
);


--
-- Name: TABLE gradebook_entries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.gradebook_entries IS 'Individual scores per student per category';


--
-- Name: group_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_schedules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    classroom_id uuid,
    is_recurring boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_gs_time CHECK ((end_time > start_time)),
    CONSTRAINT group_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: TABLE group_schedules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.group_schedules IS 'Recurring weekly schedule for a group';


--
-- Name: group_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    student_id uuid NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now(),
    enrolled_by uuid,
    status character varying(20) DEFAULT 'active'::character varying,
    dropped_at timestamp with time zone,
    drop_reason text,
    CONSTRAINT group_students_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'dropped'::character varying, 'transferred'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: TABLE group_students; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.group_students IS 'Many-to-many enrollment with metadata';


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    course_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    substitute_teacher_id uuid,
    branch_id uuid NOT NULL,
    capacity integer NOT NULL,
    mode public.group_mode DEFAULT 'in_person'::public.group_mode,
    zoom_meeting_id character varying(100),
    zoom_link character varying(500),
    onmeet_link character varying(500),
    onmeet_meeting_id character varying(100),
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.group_status DEFAULT 'upcoming'::public.group_status,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_group_dates CHECK ((end_date >= start_date)),
    CONSTRAINT chk_group_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT groups_capacity_check CHECK ((capacity > 0))
);


--
-- Name: TABLE groups; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.groups IS 'Scheduled cohort of students (a class)';


--
-- Name: installments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.installments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid NOT NULL,
    installment_number integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    due_date date NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0,
    paid_at timestamp with time zone,
    status public.installment_status DEFAULT 'pending'::public.installment_status,
    reminder_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT installments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT installments_installment_number_check CHECK ((installment_number > 0)),
    CONSTRAINT installments_paid_amount_check CHECK ((paid_amount >= (0)::numeric))
);


--
-- Name: TABLE installments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.installments IS 'Payment plan breakdown';


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sku character varying(50),
    name character varying(200) NOT NULL,
    description text,
    category public.inventory_category NOT NULL,
    unit_cost numeric(10,2) DEFAULT 0,
    sale_price numeric(10,2) DEFAULT 0,
    unit_of_measure character varying(20) DEFAULT 'piece'::character varying,
    reorder_level integer DEFAULT 10,
    status public.inventory_status DEFAULT 'active'::public.inventory_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_item_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT inventory_items_reorder_level_check CHECK ((reorder_level >= 0)),
    CONSTRAINT inventory_items_sale_price_check CHECK ((sale_price >= (0)::numeric)),
    CONSTRAINT inventory_items_unit_cost_check CHECK ((unit_cost >= (0)::numeric))
);


--
-- Name: TABLE inventory_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.inventory_items IS 'Master catalog of training materials';


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid NOT NULL,
    item_type public.invoice_item_type NOT NULL,
    course_id uuid,
    inventory_item_id uuid,
    description character varying(255) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_invoice_item_discount CHECK ((discount_amount <= ((quantity)::numeric * unit_price))),
    CONSTRAINT chk_invoice_item_prices CHECK (((unit_price >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (tax_amount >= (0)::numeric) AND (total_amount >= (0)::numeric))),
    CONSTRAINT chk_invoice_item_quantity CHECK ((quantity > 0)),
    CONSTRAINT chk_invoice_item_total CHECK ((total_amount = ((((quantity)::numeric * unit_price) - discount_amount) + tax_amount)))
);


--
-- Name: invoice_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_number character varying(50) NOT NULL,
    enrollment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0,
    balance_due numeric(12,2) NOT NULL,
    status public.invoice_status DEFAULT 'unpaid'::public.invoice_status,
    due_date date NOT NULL,
    notes text,
    is_e_invoice boolean DEFAULT false,
    e_invoice_reference character varying(100),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_inv_balance CHECK ((balance_due = (total_amount - paid_amount))),
    CONSTRAINT chk_inv_paid_bounds CHECK ((paid_amount <= total_amount)),
    CONSTRAINT chk_inv_total CHECK ((total_amount = ((subtotal - discount_amount) + tax_amount))),
    CONSTRAINT invoices_discount_amount_check CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT invoices_paid_amount_check CHECK ((paid_amount >= (0)::numeric)),
    CONSTRAINT invoices_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT invoices_tax_amount_check CHECK ((tax_amount >= (0)::numeric)),
    CONSTRAINT invoices_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: TABLE invoices; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.invoices IS 'Billing document per enrollment';


--
-- Name: kb_article_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_article_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    article_id uuid NOT NULL,
    body text NOT NULL,
    version_number integer NOT NULL,
    change_note character varying(255),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kb_article_versions_version_number_check CHECK ((version_number > 0))
);


--
-- Name: TABLE kb_article_versions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kb_article_versions IS 'Version history for audit and rollback';


--
-- Name: kb_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_articles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255),
    body text NOT NULL,
    excerpt character varying(500),
    tags jsonb,
    version integer DEFAULT 1,
    visibility public.kb_visibility DEFAULT 'staff'::public.kb_visibility,
    is_pinned boolean DEFAULT false,
    view_count integer DEFAULT 0,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_ka_title_not_empty CHECK ((TRIM(BOTH FROM title) <> ''::text)),
    CONSTRAINT kb_articles_version_check CHECK ((version > 0)),
    CONSTRAINT kb_articles_view_count_check CHECK ((view_count >= 0))
);


--
-- Name: TABLE kb_articles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kb_articles IS 'Internal wiki articles for staff policies and SOPs';


--
-- Name: kb_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(150),
    description text,
    parent_id uuid,
    visibility public.kb_visibility DEFAULT 'staff'::public.kb_visibility,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_kbc_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text))
);


--
-- Name: TABLE kb_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kb_categories IS 'Wiki organization with hierarchical categories';


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    type public.activity_type NOT NULL,
    note text,
    old_status character varying(50),
    new_status character varying(50),
    scheduled_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE lead_activities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lead_activities IS 'Activity log per lead (calls, notes, follow-ups, status changes)';


--
-- Name: lead_tag_pivot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_tag_pivot (
    lead_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE lead_tag_pivot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lead_tag_pivot IS 'Many-to-many lead-tag junction';


--
-- Name: lead_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    color character varying(7) DEFAULT '#000000'::character varying,
    branch_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lead_tags_color_check CHECK (((color)::text ~* '^#[0-9A-Fa-f]{6}$'::text))
);


--
-- Name: TABLE lead_tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lead_tags IS 'Segmentation tags for leads';


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    national_id character varying(50),
    source public.lead_source NOT NULL,
    status public.lead_status DEFAULT 'new'::public.lead_status,
    level_interest character varying(10),
    notes text,
    assigned_to uuid,
    branch_id uuid,
    converted_to_student_id uuid,
    converted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_lead_name_not_empty CHECK (((TRIM(BOTH FROM first_name) <> ''::text) AND (TRIM(BOTH FROM last_name) <> ''::text))),
    CONSTRAINT chk_lead_phone_not_empty CHECK ((TRIM(BOTH FROM phone) <> ''::text)),
    CONSTRAINT leads_level_interest_check CHECK (((level_interest)::text = ANY ((ARRAY['A1'::character varying, 'A2'::character varying, 'B1'::character varying, 'B2'::character varying, 'C1'::character varying, 'C2'::character varying, 'Beginner'::character varying, 'Intermediate'::character varying, 'Advanced'::character varying])::text[])))
);


--
-- Name: TABLE leads; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.leads IS 'Prospective students before enrollment. Core CRM entity';


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days_count integer NOT NULL,
    reason text,
    attachment_url character varying(500),
    status public.leave_status DEFAULT 'pending'::public.leave_status,
    approved_by uuid,
    approved_at timestamp with time zone,
    approval_note text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_lr_dates CHECK ((end_date >= start_date)),
    CONSTRAINT leave_requests_days_count_check CHECK ((days_count > 0))
);


--
-- Name: TABLE leave_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.leave_requests IS 'Absence management with approval workflow';


--
-- Name: lms_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lms_lessons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    content text,
    type public.lesson_type DEFAULT 'content'::public.lesson_type,
    duration_minutes integer,
    "order" integer NOT NULL,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_ll_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT lms_lessons_duration_minutes_check CHECK ((duration_minutes > 0)),
    CONSTRAINT lms_lessons_order_check CHECK (("order" > 0))
);


--
-- Name: TABLE lms_lessons; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lms_lessons IS 'Individual lesson within a module';


--
-- Name: lms_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lms_modules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    "order" integer NOT NULL,
    is_published boolean DEFAULT false,
    published_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_lm_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT lms_modules_order_check CHECK (("order" > 0))
);


--
-- Name: TABLE lms_modules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lms_modules IS 'Top-level content container within a group';


--
-- Name: lms_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lms_resources (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lesson_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type public.resource_type NOT NULL,
    file_url character varying(500),
    file_size bigint,
    mime_type character varying(100),
    external_url character varying(500),
    access_control public.resource_access DEFAULT 'enrolled'::public.resource_access,
    download_count integer DEFAULT 0,
    watermark_text character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_lr_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT lms_resources_download_count_check CHECK ((download_count >= 0)),
    CONSTRAINT lms_resources_file_size_check CHECK ((file_size >= 0))
);


--
-- Name: TABLE lms_resources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lms_resources IS 'Files, links, videos attached to lessons';


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    channel public.notification_channel NOT NULL,
    module character varying(50) NOT NULL,
    event character varying(50) NOT NULL,
    is_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE notification_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notification_preferences IS 'Per-user notification settings (in-app + email only)';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    data jsonb,
    action_url character varying(500),
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notifications IS 'In-app notification center (bell icon with unread count)';


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    page_path character varying(500) NOT NULL,
    referrer character varying(500),
    user_agent text,
    ip_address character varying(45),
    session_id character varying(100),
    viewed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_pv_path_not_empty CHECK ((TRIM(BOTH FROM page_path) <> ''::text))
);


--
-- Name: TABLE page_views; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.page_views IS 'Server-side page view counter (Section 4.14 - no external analytics)';


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    method public.payment_method NOT NULL,
    reference character varying(255),
    easykash_transaction_id character varying(100),
    easykash_payload jsonb,
    paid_at timestamp with time zone NOT NULL,
    recorded_by uuid,
    status public.payment_status DEFAULT 'completed'::public.payment_status,
    receipt_number character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: TABLE payments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payments IS 'Actual money received';


--
-- Name: payroll_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payroll_period_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    base_amount numeric(12,2) NOT NULL,
    hours_worked numeric(5,2) DEFAULT 0,
    classes_taught integer DEFAULT 0,
    bonus numeric(12,2) DEFAULT 0,
    deductions numeric(12,2) DEFAULT 0,
    hourly_rate numeric(10,2),
    total_amount numeric(12,2) NOT NULL,
    status public.payroll_entry_status DEFAULT 'draft'::public.payroll_entry_status,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_pe_total_formula CHECK (
CASE
    WHEN (base_amount > (0)::numeric) THEN (total_amount = ((base_amount + bonus) - deductions))
    WHEN (hourly_rate > (0)::numeric) THEN (total_amount = (((hours_worked * hourly_rate) + bonus) - deductions))
    ELSE (total_amount = (bonus - deductions))
END),
    CONSTRAINT payroll_entries_base_amount_check CHECK ((base_amount >= (0)::numeric)),
    CONSTRAINT payroll_entries_bonus_check CHECK ((bonus >= (0)::numeric)),
    CONSTRAINT payroll_entries_classes_taught_check CHECK ((classes_taught >= 0)),
    CONSTRAINT payroll_entries_deductions_check CHECK ((deductions >= (0)::numeric)),
    CONSTRAINT payroll_entries_hourly_rate_check CHECK (((hourly_rate IS NULL) OR (hourly_rate >= (0)::numeric))),
    CONSTRAINT payroll_entries_hours_worked_check CHECK ((hours_worked >= (0)::numeric))
);


--
-- Name: TABLE payroll_entries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payroll_entries IS 'Individual pay calculations per period';


--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_periods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.payroll_status DEFAULT 'open'::public.payroll_status,
    closed_at timestamp with time zone,
    closed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_pp_dates CHECK ((end_date >= start_date))
);


--
-- Name: TABLE payroll_periods; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payroll_periods IS 'Monthly payroll cycles';


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.permissions IS 'Granular permission matrix (module x action)';


--
-- Name: placement_test_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.placement_test_answers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    test_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer jsonb NOT NULL,
    score numeric(5,2) DEFAULT 0,
    is_correct boolean,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT placement_test_answers_score_check CHECK ((score >= (0)::numeric))
);


--
-- Name: TABLE placement_test_answers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.placement_test_answers IS 'Student responses to written test questions';


--
-- Name: placement_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.placement_tests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid,
    student_id uuid,
    slot_id uuid NOT NULL,
    examiner_id uuid NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    written_score numeric(5,2),
    written_max numeric(5,2) DEFAULT 100,
    oral_score numeric(5,2),
    oral_max numeric(5,2) DEFAULT 100,
    suggested_level character varying(10),
    final_level character varying(10),
    override_reason text,
    examiner_notes text,
    status public.test_status DEFAULT 'scheduled'::public.test_status,
    result_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_pt_oral_score CHECK (((oral_score IS NULL) OR (oral_score <= oral_max))),
    CONSTRAINT chk_pt_target CHECK ((((lead_id IS NOT NULL) AND (student_id IS NULL)) OR ((lead_id IS NULL) AND (student_id IS NOT NULL)))),
    CONSTRAINT chk_pt_written_score CHECK (((written_score IS NULL) OR (written_score <= written_max))),
    CONSTRAINT placement_tests_final_level_check CHECK (((final_level)::text = ANY ((ARRAY['A1'::character varying, 'A2'::character varying, 'B1'::character varying, 'B2'::character varying, 'C1'::character varying, 'C2'::character varying])::text[]))),
    CONSTRAINT placement_tests_oral_max_check CHECK ((oral_max > (0)::numeric)),
    CONSTRAINT placement_tests_oral_score_check CHECK ((oral_score >= (0)::numeric)),
    CONSTRAINT placement_tests_suggested_level_check CHECK (((suggested_level)::text = ANY ((ARRAY['A1'::character varying, 'A2'::character varying, 'B1'::character varying, 'B2'::character varying, 'C1'::character varying, 'C2'::character varying])::text[]))),
    CONSTRAINT placement_tests_written_max_check CHECK ((written_max > (0)::numeric)),
    CONSTRAINT placement_tests_written_score_check CHECK ((written_score >= (0)::numeric))
);


--
-- Name: TABLE placement_tests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.placement_tests IS 'Actual test instance for a lead/student';


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    type public.promo_type NOT NULL,
    value numeric(10,2) NOT NULL,
    max_discount numeric(10,2),
    expiry_date date NOT NULL,
    usage_limit integer,
    used_count integer DEFAULT 0,
    applicable_courses jsonb,
    applicable_branches jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_pc_code_not_empty CHECK ((TRIM(BOTH FROM code) <> ''::text)),
    CONSTRAINT promo_codes_max_discount_check CHECK (((max_discount IS NULL) OR (max_discount >= (0)::numeric))),
    CONSTRAINT promo_codes_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'expired'::character varying, 'disabled'::character varying])::text[]))),
    CONSTRAINT promo_codes_usage_limit_check CHECK (((usage_limit IS NULL) OR (usage_limit > 0))),
    CONSTRAINT promo_codes_used_count_check CHECK ((used_count >= 0)),
    CONSTRAINT promo_codes_value_check CHECK ((value >= (0)::numeric))
);


--
-- Name: TABLE promo_codes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.promo_codes IS 'Discount codes for marketing/sales';


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quiz_id uuid NOT NULL,
    student_id uuid NOT NULL,
    attempt_number integer NOT NULL,
    answers jsonb NOT NULL,
    score numeric(5,2),
    percentage numeric(5,2),
    is_passed boolean,
    started_at timestamp with time zone NOT NULL,
    submitted_at timestamp with time zone,
    time_spent_seconds integer,
    status public.attempt_status DEFAULT 'in_progress'::public.attempt_status,
    graded_by uuid,
    graded_at timestamp with time zone,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT quiz_attempts_attempt_number_check CHECK ((attempt_number > 0)),
    CONSTRAINT quiz_attempts_percentage_check CHECK (((percentage IS NULL) OR ((percentage >= (0)::numeric) AND (percentage <= (100)::numeric)))),
    CONSTRAINT quiz_attempts_score_check CHECK (((score IS NULL) OR (score >= (0)::numeric))),
    CONSTRAINT quiz_attempts_time_spent_seconds_check CHECK (((time_spent_seconds IS NULL) OR (time_spent_seconds >= 0)))
);


--
-- Name: TABLE quiz_attempts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.quiz_attempts IS 'Student quiz session with proctoring info';


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quiz_id uuid NOT NULL,
    bank_question_id uuid,
    question_text text NOT NULL,
    type public.question_type NOT NULL,
    options jsonb,
    correct_answer jsonb NOT NULL,
    points integer DEFAULT 1,
    "order" integer NOT NULL,
    media_url character varying(500),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT quiz_questions_order_check CHECK (("order" > 0)),
    CONSTRAINT quiz_questions_points_check CHECK ((points > 0))
);


--
-- Name: TABLE quiz_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.quiz_questions IS 'Questions within a quiz (can reuse from bank or be quiz-specific)';


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    time_limit_minutes integer,
    max_attempts integer DEFAULT 1,
    shuffle_questions boolean DEFAULT false,
    shuffle_options boolean DEFAULT false,
    release_type public.release_type DEFAULT 'instant'::public.release_type,
    release_at timestamp with time zone,
    passing_score numeric(5,2) DEFAULT 60,
    is_published boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_quiz_title_not_empty CHECK ((TRIM(BOTH FROM title) <> ''::text)),
    CONSTRAINT quizzes_max_attempts_check CHECK ((max_attempts > 0)),
    CONSTRAINT quizzes_passing_score_check CHECK (((passing_score >= (0)::numeric) AND (passing_score <= (100)::numeric))),
    CONSTRAINT quizzes_time_limit_minutes_check CHECK (((time_limit_minutes IS NULL) OR (time_limit_minutes > 0)))
);


--
-- Name: TABLE quizzes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.quizzes IS 'Tests and quizzes for a group';


--
-- Name: receipt_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    referrer_student_id uuid NOT NULL,
    referred_lead_id uuid,
    referred_student_id uuid,
    credit_amount numeric(10,2) DEFAULT 0,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_ref_target CHECK (((referred_lead_id IS NOT NULL) OR (referred_student_id IS NOT NULL))),
    CONSTRAINT referrals_credit_amount_check CHECK ((credit_amount >= (0)::numeric)),
    CONSTRAINT referrals_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'credited'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: TABLE referrals; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.referrals IS 'Student-refers-student tracking with credits';


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refunds (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason_code public.refund_reason NOT NULL,
    reason_note text,
    status public.refund_status DEFAULT 'pending'::public.refund_status,
    approved_by uuid,
    approved_at timestamp with time zone,
    processed_by uuid,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT refunds_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: TABLE refunds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.refunds IS 'Refund tracking with reason codes';


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.role_permissions IS 'Many-to-many junction between roles and permissions';


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    is_custom boolean DEFAULT false,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.roles IS 'RBAC role definitions (templates + custom)';


--
-- Name: sales_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_targets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    agent_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    target_amount numeric(12,2) NOT NULL,
    target_conversions integer DEFAULT 0,
    achieved_amount numeric(12,2) DEFAULT 0,
    achieved_conversions integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_targets_achieved_amount_check CHECK ((achieved_amount >= (0)::numeric)),
    CONSTRAINT sales_targets_achieved_conversions_check CHECK ((achieved_conversions >= 0)),
    CONSTRAINT sales_targets_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT sales_targets_target_amount_check CHECK ((target_amount >= (0)::numeric)),
    CONSTRAINT sales_targets_target_conversions_check CHECK ((target_conversions >= 0)),
    CONSTRAINT sales_targets_year_check CHECK ((year >= 2020))
);


--
-- Name: TABLE sales_targets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sales_targets IS 'Monthly sales goals per agent';


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    classroom_id uuid,
    mode public.group_mode NOT NULL,
    zoom_meeting_id character varying(100),
    zoom_join_url character varying(500),
    onmeet_meeting_id character varying(100),
    recording_url character varying(500),
    topic character varying(255),
    notes text,
    attendance_locked boolean DEFAULT false,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_session_time CHECK ((end_time > start_time))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sessions IS 'Individual class occurrence (instance of a group schedule)';


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying(100) NOT NULL,
    value text,
    "group" character varying(50) DEFAULT 'general'::character varying,
    is_encrypted boolean DEFAULT false,
    description character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_settings_key_not_empty CHECK ((TRIM(BOTH FROM key) <> ''::text))
);


--
-- Name: TABLE settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.settings IS 'System configuration key-value store';


--
-- Name: stock_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_levels (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    item_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    quantity integer DEFAULT 0,
    reserved_quantity integer DEFAULT 0,
    last_counted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_sl_quantity CHECK ((quantity >= 0)),
    CONSTRAINT stock_levels_reserved_quantity_check CHECK ((reserved_quantity >= 0))
);


--
-- Name: TABLE stock_levels; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.stock_levels IS 'Per-branch quantity tracking';


--
-- Name: stock_moves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_moves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    item_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    type public.stock_move_type NOT NULL,
    quantity integer NOT NULL,
    unit_cost numeric(10,2),
    reason character varying(255) NOT NULL,
    reference_type character varying(50),
    reference_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT stock_moves_reference_type_check CHECK (((reference_type)::text = ANY ((ARRAY['enrollment'::character varying, 'activity'::character varying, 'manual'::character varying, 'purchase'::character varying, 'return'::character varying, 'adjustment'::character varying])::text[]))),
    CONSTRAINT stock_moves_unit_cost_check CHECK (((unit_cost IS NULL) OR (unit_cost >= (0)::numeric)))
);


--
-- Name: TABLE stock_moves; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.stock_moves IS 'All inventory transactions (in, out, adjustment, transfer)';


--
-- Name: student_item_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_item_issues (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    item_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    quantity integer DEFAULT 1,
    cost numeric(10,2) DEFAULT 0,
    issued_at timestamp with time zone DEFAULT now(),
    returned_at timestamp with time zone,
    condition_on_return public.item_condition,
    created_by uuid,
    CONSTRAINT student_item_issues_cost_check CHECK ((cost >= (0)::numeric)),
    CONSTRAINT student_item_issues_quantity_check CHECK ((quantity > 0))
);


--
-- Name: TABLE student_item_issues; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.student_item_issues IS 'Items given to students (books, materials) with optional cost';


--
-- Name: student_level_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_level_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    old_level character varying(10) NOT NULL,
    new_level character varying(10) NOT NULL,
    reason character varying(50) NOT NULL,
    reference_id uuid,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_level_history_reason_check CHECK (((reason)::text = ANY ((ARRAY['placement_test'::character varying, 'course_completion'::character varying, 'manual_override'::character varying])::text[])))
);


--
-- Name: TABLE student_level_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.student_level_history IS 'Track level progression over time';


--
-- Name: student_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    photo_url character varying(500),
    date_of_birth date,
    gender character varying(10),
    address text,
    national_id character varying(50),
    education_level character varying(100),
    emergency_contact_name character varying(150),
    emergency_contact_phone character varying(20),
    emergency_contact_relation character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_profiles_gender_check CHECK (((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: TABLE student_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.student_profiles IS 'Extended PII and demographic data (encrypted at rest per NFR 7.3)';


--
-- Name: student_surveys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_surveys (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    term character varying(50) NOT NULL,
    responses jsonb NOT NULL,
    overall_rating integer,
    comment text,
    is_anonymous boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_surveys_overall_rating_check CHECK (((overall_rating IS NULL) OR ((overall_rating >= 1) AND (overall_rating <= 5))))
);


--
-- Name: TABLE student_surveys; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.student_surveys IS 'Student ??? teacher/course evaluation survey per term';


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    student_number character varying(50) NOT NULL,
    current_level character varying(10),
    status public.student_status DEFAULT 'active'::public.student_status,
    enrollment_date date,
    branch_id uuid,
    placement_test_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT students_current_level_check CHECK (((current_level)::text = ANY ((ARRAY['A1'::character varying, 'A2'::character varying, 'B1'::character varying, 'B2'::character varying, 'C1'::character varying, 'C2'::character varying, 'Beginner'::character varying, 'Intermediate'::character varying, 'Advanced'::character varying])::text[])))
);


--
-- Name: TABLE students; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.students IS 'Enrolled learner profile. Extends users with academic data';


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    content text,
    file_url character varying(500),
    file_name character varying(255),
    submitted_at timestamp with time zone DEFAULT now(),
    is_late boolean DEFAULT false,
    grade numeric(5,2),
    feedback text,
    graded_by uuid,
    graded_at timestamp with time zone,
    status public.submission_status DEFAULT 'submitted'::public.submission_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT submissions_grade_check CHECK (((grade IS NULL) OR (grade >= (0)::numeric)))
);


--
-- Name: TABLE submissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.submissions IS 'Student assignment uploads';


--
-- Name: teacher_availabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_availabilities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    note character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_ta_time CHECK ((end_time > start_time)),
    CONSTRAINT teacher_availabilities_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: TABLE teacher_availabilities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.teacher_availabilities IS 'When teachers can be scheduled';


--
-- Name: teacher_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_evaluations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    term character varying(50) NOT NULL,
    form_data jsonb NOT NULL,
    overall_comment text,
    is_shared_with_student boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE teacher_evaluations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.teacher_evaluations IS 'Teacher ??? student feedback per term';


--
-- Name: test_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question_text text NOT NULL,
    type public.question_type NOT NULL,
    options jsonb,
    correct_answer jsonb NOT NULL,
    explanation text,
    level character varying(10) NOT NULL,
    category character varying(50),
    points integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT test_questions_category_check CHECK (((category)::text = ANY ((ARRAY['grammar'::character varying, 'vocab'::character varying, 'reading'::character varying, 'listening'::character varying, 'writing'::character varying, 'speaking'::character varying])::text[]))),
    CONSTRAINT test_questions_level_check CHECK (((level)::text = ANY ((ARRAY['A1'::character varying, 'A2'::character varying, 'B1'::character varying, 'B2'::character varying, 'C1'::character varying, 'C2'::character varying])::text[]))),
    CONSTRAINT test_questions_points_check CHECK ((points > 0))
);


--
-- Name: TABLE test_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.test_questions IS 'Question bank for written tests (reusable across quizzes)';


--
-- Name: test_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_slots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    examiner_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    mode public.group_mode DEFAULT 'in_person'::public.group_mode,
    capacity integer DEFAULT 1,
    booked_count integer DEFAULT 0,
    status public.slot_status DEFAULT 'open'::public.slot_status,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_ts_capacity CHECK ((booked_count <= capacity)),
    CONSTRAINT chk_ts_time CHECK ((end_time > start_time)),
    CONSTRAINT test_slots_booked_count_check CHECK ((booked_count >= 0)),
    CONSTRAINT test_slots_capacity_check CHECK ((capacity > 0))
);


--
-- Name: TABLE test_slots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.test_slots IS 'Available appointment slots for placement tests';


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid,
    name character varying(150) NOT NULL,
    content text NOT NULL,
    photo_url character varying(500),
    rating integer DEFAULT 5,
    course_name character varying(100),
    is_featured boolean DEFAULT false,
    status public.testimonial_status DEFAULT 'pending'::public.testimonial_status,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_test_content_not_empty CHECK ((TRIM(BOTH FROM content) <> ''::text)),
    CONSTRAINT chk_test_name_not_empty CHECK ((TRIM(BOTH FROM name) <> ''::text)),
    CONSTRAINT testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: TABLE testimonials; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.testimonials IS 'Student reviews for marketing landing page';


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_roles IS 'Assigns one or more roles to a user';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    avatar_url character varying(500),
    language character varying(5) DEFAULT 'ar'::character varying,
    branch_id uuid,
    status public.user_status DEFAULT 'active'::public.user_status,
    email_verified_at timestamp with time zone,
    phone_verified_at timestamp with time zone,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying(255),
    last_login_at timestamp with time zone,
    last_login_ip character varying(45),
    chat_policy_accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_user_email_format CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT chk_user_name_not_empty CHECK (((TRIM(BOTH FROM first_name) <> ''::text) AND (TRIM(BOTH FROM last_name) <> ''::text))),
    CONSTRAINT users_language_check CHECK (((language)::text = ANY ((ARRAY['ar'::character varying, 'en'::character varying])::text[])))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'Central identity table for all system users';


--
-- Name: v_chat_violation_feed; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_chat_violation_feed AS
 SELECT cv.id AS violation_id,
    cv.created_at AS detected_at,
    cv.rule_matched,
    cv.action_taken,
    cv.original_message,
    cv.is_false_positive,
    cv.resolved_at,
    (((sender.first_name)::text || ' '::text) || (sender.last_name)::text) AS sender_name,
    sender_u.email AS sender_email,
    room.name AS room_name,
    room.type AS room_type,
    (((mod.first_name)::text || ' '::text) || (mod.last_name)::text) AS moderator_name,
    cs.strike_number,
    cs.action AS strike_action,
    cs.is_active AS strike_active
   FROM (((((public.chat_violations cv
     JOIN public.users sender_u ON ((cv.sender_id = sender_u.id)))
     LEFT JOIN public.users sender ON ((cv.sender_id = sender.id)))
     LEFT JOIN public.chat_rooms room ON ((cv.room_id = room.id)))
     LEFT JOIN public.users mod ON ((cv.moderator_id = mod.id)))
     LEFT JOIN public.chat_strikes cs ON ((cv.id = cs.violation_id)))
  ORDER BY cv.created_at DESC;


--
-- Name: VIEW v_chat_violation_feed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_chat_violation_feed IS 'Live moderator dashboard feed of flagged messages';


--
-- Name: v_group_enrollment_count; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_group_enrollment_count AS
 SELECT g.id AS group_id,
    g.capacity,
    count(gs.id) AS enrolled_count,
    (g.capacity - count(gs.id)) AS remaining_slots
   FROM (public.groups g
     LEFT JOIN public.group_students gs ON (((g.id = gs.group_id) AND ((gs.status)::text = 'active'::text))))
  GROUP BY g.id, g.capacity;


--
-- Name: VIEW v_group_enrollment_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_group_enrollment_count IS 'Real-time enrollment count per group for capacity validation';


--
-- Name: v_outstanding_payments; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_outstanding_payments AS
 SELECT i.id AS invoice_id,
    i.invoice_number,
    s.student_number,
    (((u.first_name)::text || ' '::text) || (u.last_name)::text) AS student_name,
    i.total_amount,
    i.paid_amount,
    i.balance_due,
    i.due_date,
    i.status,
    b.name AS branch_name,
        CASE
            WHEN ((i.due_date < CURRENT_DATE) AND (i.status = ANY (ARRAY['unpaid'::public.invoice_status, 'partial'::public.invoice_status]))) THEN 'overdue'::text
            WHEN ((i.due_date <= (CURRENT_DATE + '7 days'::interval)) AND (i.status = ANY (ARRAY['unpaid'::public.invoice_status, 'partial'::public.invoice_status]))) THEN 'due_soon'::text
            ELSE 'ok'::text
        END AS urgency
   FROM (((public.invoices i
     JOIN public.students s ON ((i.student_id = s.id)))
     JOIN public.users u ON ((s.user_id = u.id)))
     JOIN public.branches b ON ((i.branch_id = b.id)))
  WHERE (i.status = ANY (ARRAY['unpaid'::public.invoice_status, 'partial'::public.invoice_status, 'overdue'::public.invoice_status]))
  ORDER BY i.due_date;


--
-- Name: VIEW v_outstanding_payments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_outstanding_payments IS 'All unpaid/partial invoices with urgency flag';


--
-- Name: v_sales_agent_performance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_sales_agent_performance AS
 SELECT u.id AS agent_id,
    (((u.first_name)::text || ' '::text) || (u.last_name)::text) AS agent_name,
    b.name AS branch_name,
    count(DISTINCT l.id) AS total_leads,
    count(DISTINCT
        CASE
            WHEN (l.status = 'enrolled'::public.lead_status) THEN l.id
            ELSE NULL::uuid
        END) AS conversions,
    round((((count(DISTINCT
        CASE
            WHEN (l.status = 'enrolled'::public.lead_status) THEN l.id
            ELSE NULL::uuid
        END))::numeric * 100.0) / (NULLIF(count(DISTINCT l.id), 0))::numeric), 2) AS conversion_rate,
    COALESCE(sum(e.final_amount), (0)::numeric) AS total_revenue
   FROM (((public.users u
     JOIN public.branches b ON ((u.branch_id = b.id)))
     LEFT JOIN public.leads l ON ((u.id = l.assigned_to)))
     LEFT JOIN public.enrollments e ON (((l.converted_to_student_id = e.student_id) AND (e.status = 'active'::public.enrollment_status))))
  WHERE (EXISTS ( SELECT 1
           FROM (public.user_roles ur
             JOIN public.roles r ON ((ur.role_id = r.id)))
          WHERE ((ur.user_id = u.id) AND ((r.slug)::text = 'sales'::text))))
  GROUP BY u.id, u.first_name, u.last_name, b.name;


--
-- Name: VIEW v_sales_agent_performance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_sales_agent_performance IS 'Sales funnel metrics per agent';


--
-- Name: v_student_attendance_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_student_attendance_summary AS
 SELECT s.id AS student_id,
    s.student_number,
    (((u.first_name)::text || ' '::text) || (u.last_name)::text) AS student_name,
    g.id AS group_id,
    g.name AS group_name,
    count(
        CASE
            WHEN (a.status = 'present'::public.attendance_status) THEN 1
            ELSE NULL::integer
        END) AS present_count,
    count(
        CASE
            WHEN (a.status = 'absent'::public.attendance_status) THEN 1
            ELSE NULL::integer
        END) AS absent_count,
    count(
        CASE
            WHEN (a.status = 'late'::public.attendance_status) THEN 1
            ELSE NULL::integer
        END) AS late_count,
    count(
        CASE
            WHEN (a.status = 'excused'::public.attendance_status) THEN 1
            ELSE NULL::integer
        END) AS excused_count,
    count(a.id) AS total_sessions,
    round((((count(
        CASE
            WHEN (a.status = 'present'::public.attendance_status) THEN 1
            ELSE NULL::integer
        END))::numeric * 100.0) / (NULLIF(count(a.id), 0))::numeric), 2) AS attendance_rate
   FROM (((((public.students s
     JOIN public.users u ON ((s.user_id = u.id)))
     LEFT JOIN public.group_students gs ON (((s.id = gs.student_id) AND ((gs.status)::text = 'active'::text))))
     LEFT JOIN public.groups g ON ((gs.group_id = g.id)))
     LEFT JOIN public.sessions ses ON ((g.id = ses.group_id)))
     LEFT JOIN public.attendances a ON (((ses.id = a.session_id) AND (a.student_id = s.id))))
  GROUP BY s.id, s.student_number, u.first_name, u.last_name, g.id, g.name;


--
-- Name: VIEW v_student_attendance_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_student_attendance_summary IS 'Attendance statistics per student per group';


--
-- Name: v_teacher_utilization; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_teacher_utilization AS
 SELECT u.id AS teacher_id,
    (((u.first_name)::text || ' '::text) || (u.last_name)::text) AS teacher_name,
    count(DISTINCT g.id) AS active_groups,
    count(DISTINCT ses.id) AS sessions_this_month,
    count(DISTINCT gs.student_id) AS total_students,
    COALESCE(sum((EXTRACT(epoch FROM (ses.end_time - ses.start_time)) / (3600)::numeric)), (0)::numeric) AS hours_taught
   FROM (((public.users u
     LEFT JOIN public.groups g ON (((u.id = g.teacher_id) AND (g.status = 'active'::public.group_status))))
     LEFT JOIN public.sessions ses ON (((g.id = ses.group_id) AND (ses.date >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)))))
     LEFT JOIN public.group_students gs ON (((g.id = gs.group_id) AND ((gs.status)::text = 'active'::text))))
  WHERE (EXISTS ( SELECT 1
           FROM (public.user_roles ur
             JOIN public.roles r ON ((ur.role_id = r.id)))
          WHERE ((ur.user_id = u.id) AND ((r.slug)::text = 'teacher'::text))))
  GROUP BY u.id, u.first_name, u.last_name;


--
-- Name: VIEW v_teacher_utilization; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_teacher_utilization IS 'Teacher workload and utilization metrics';


--
-- Name: view_student_active_groups; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_student_active_groups AS
 SELECT gs.student_id,
    gs.group_id,
    g.name AS group_name,
    g.course_id,
    gs.enrolled_at
   FROM (public.group_students gs
     JOIN public.groups g ON ((g.id = gs.group_id)))
  WHERE ((gs.status)::text = 'active'::text);


--
-- Name: waitlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waitlists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    level character varying(10) NOT NULL,
    branch_id uuid,
    priority integer DEFAULT 0,
    status character varying(20) DEFAULT 'waiting'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    enrolled_at timestamp with time zone,
    CONSTRAINT waitlists_status_check CHECK (((status)::text = ANY ((ARRAY['waiting'::character varying, 'notified'::character varying, 'enrolled'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: TABLE waitlists; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.waitlists IS 'Queue for students waiting for a group slot';


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activities (id, name, description, type, date, start_time, end_time, location, branch_id, capacity, fee, target_levels, target_groups, is_open_to_all, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: activity_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_photos (id, activity_id, file_url, caption, uploaded_by, created_at) FROM stdin;
\.


--
-- Data for Name: activity_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_registrations (id, activity_id, student_id, registered_at, status, paid_amount, payment_id, created_at) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, group_id, title, description, type, due_at, max_grade, allow_late_submission, late_penalty_percent, is_published, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendances (id, session_id, student_id, status, check_in_method, check_in_time, minutes_late, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, actor_id, actor_type, action, module, target_type, target_id, before_state, after_state, description, ip_address, user_agent, session_id, created_at) FROM stdin;
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_posts (id, title, slug, content, excerpt, featured_image, meta_title, meta_description, status, published_at, author_id, view_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (id, name, address, phone, email, manager_id, classroom_count, logo_url, status, created_at, updated_at) FROM stdin;
8e3e46d7-1a6a-441e-874d-f6aa5f9166e3	Main Branch	TBD - Update Address	TBD	\N	\N	0	\N	active	2026-09-19 06:30:27.243013+00	2026-09-19 06:30:27.243013+00
\.


--
-- Data for Name: certificate_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificate_templates (id, name, course_id, html_template, placeholders, background_url, is_default, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificates (id, student_id, course_id, group_id, template_id, code, pdf_url, issue_date, expiry_date, status, revoked_at, revoke_reason, issued_by, is_auto_issued, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, room_id, sender_id, body, type, file_url, file_size, file_name, reply_to_id, edited_at, edited_count, deleted_at, is_flagged, flag_reason, created_at) FROM stdin;
\.


--
-- Data for Name: chat_room_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_room_members (id, room_id, user_id, role, joined_at, last_read_at, is_muted, muted_until, is_banned, banned_until, ban_reason, created_at) FROM stdin;
\.


--
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_rooms (id, type, group_id, name, topic, is_archived, archived_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_strikes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_strikes (id, user_id, violation_id, strike_number, action, expires_at, applied_by, applied_at, is_active) FROM stdin;
\.


--
-- Data for Name: chat_violations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_violations (id, message_id, room_id, sender_id, rule_matched, original_message, action_taken, moderator_id, moderator_note, resolved_at, is_false_positive, detection_method, created_at) FROM stdin;
\.


--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.classrooms (id, branch_id, name, capacity, type, status, created_at) FROM stdin;
\.


--
-- Data for Name: course_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_materials (id, course_id, inventory_item_id, is_required, quantity_per_student, created_at) FROM stdin;
\.


--
-- Data for Name: course_prerequisites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_prerequisites (course_id, prerequisite_course_id, is_strict, created_at) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, name, code, level, duration_hours, syllabus, description, default_price, min_age, max_age, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_documents (id, employee_id, name, file_url, document_type, expiry_date, created_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, user_id, employee_number, employee_type, department, job_title, contract_start, contract_end, salary, hourly_rate, currency, bank_account, bank_name, status, termination_date, termination_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enrollments (id, student_id, group_id, status, total_fee, discount_amount, final_amount, promo_code_id, enrolled_at, enrolled_by, dropped_at, drop_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.financial_transactions (id, branch_id, invoice_id, payment_id, refund_id, transaction_type, direction, amount, transaction_date, description, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: follow_ups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.follow_ups (id, lead_id, assigned_to, due_date, status, note, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: gradebook_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gradebook_categories (id, group_id, name, weight, "order", created_by, created_at) FROM stdin;
\.


--
-- Data for Name: gradebook_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gradebook_entries (id, group_id, student_id, category_id, score, max_score, percentage, weighted_score, reference_type, reference_id, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: group_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_schedules (id, group_id, day_of_week, start_time, end_time, classroom_id, is_recurring, created_at) FROM stdin;
\.


--
-- Data for Name: group_students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_students (id, group_id, student_id, enrolled_at, enrolled_by, status, dropped_at, drop_reason) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groups (id, name, course_id, teacher_id, substitute_teacher_id, branch_id, capacity, mode, zoom_meeting_id, zoom_link, onmeet_link, onmeet_meeting_id, start_date, end_date, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: installments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.installments (id, invoice_id, installment_number, amount, due_date, paid_amount, paid_at, status, reminder_sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_items (id, sku, name, description, category, unit_cost, sale_price, unit_of_measure, reorder_level, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_items (id, invoice_id, item_type, course_id, inventory_item_id, description, quantity, unit_price, discount_amount, tax_amount, total_amount, created_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, enrollment_id, student_id, branch_id, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_due, status, due_date, notes, is_e_invoice, e_invoice_reference, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kb_article_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kb_article_versions (id, article_id, body, version_number, change_note, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: kb_articles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kb_articles (id, category_id, title, slug, body, excerpt, tags, version, visibility, is_pinned, view_count, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kb_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kb_categories (id, name, slug, description, parent_id, visibility, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lead_activities (id, lead_id, type, note, old_status, new_status, scheduled_at, completed_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: lead_tag_pivot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lead_tag_pivot (lead_id, tag_id, created_at) FROM stdin;
\.


--
-- Data for Name: lead_tags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lead_tags (id, name, color, branch_id, created_at) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, first_name, last_name, phone, email, national_id, source, status, level_interest, notes, assigned_to, branch_id, converted_to_student_id, converted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_requests (id, employee_id, type, start_date, end_date, days_count, reason, attachment_url, status, approved_by, approved_at, approval_note, created_at) FROM stdin;
\.


--
-- Data for Name: lms_lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lms_lessons (id, module_id, name, content, type, duration_minutes, "order", is_published, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lms_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lms_modules (id, group_id, name, description, "order", is_published, published_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lms_resources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lms_resources (id, lesson_id, name, type, file_url, file_size, mime_type, external_url, access_control, download_count, watermark_text, created_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (id, user_id, channel, module, event, is_enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, body, data, action_url, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: page_views; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.page_views (id, page_path, referrer, user_agent, ip_address, session_id, viewed_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, invoice_id, amount, method, reference, easykash_transaction_id, easykash_payload, paid_at, recorded_by, status, receipt_number, notes, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_entries (id, payroll_period_id, employee_id, base_amount, hours_worked, classes_taught, bonus, deductions, hourly_rate, total_amount, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_periods (id, name, start_date, end_date, status, closed_at, closed_by, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, module, action, description, created_at) FROM stdin;
a954657b-7ce6-4432-832d-2bbc0c1f100c	crm	view	View leads and students	2026-09-19 06:30:27.234053+00
3052ba76-1674-4164-9704-49e12d36e835	crm	create	Create leads and students	2026-09-19 06:30:27.234053+00
c3f81a0c-b2df-476e-b761-b0081a7a20a4	crm	edit	Edit leads and students	2026-09-19 06:30:27.234053+00
4c141b40-2415-4d21-b1cc-51079141397f	crm	delete	Delete/archive leads	2026-09-19 06:30:27.234053+00
1aa6c718-4a05-4bb6-804a-ee37d68f10f1	crm	assign	Assign leads to agents	2026-09-19 06:30:27.234053+00
1c285b5d-54a3-4ad1-87ac-d5a2f1ab10fc	sales	view	View sales dashboards	2026-09-19 06:30:27.234053+00
f37f8771-9d8e-4e06-a448-9e24aa4645e1	sales	create	Create promotions and targets	2026-09-19 06:30:27.234053+00
15c073ec-5e5d-4fc1-9770-d6541be6cfb6	sales	edit	Edit sales data	2026-09-19 06:30:27.234053+00
851b2bdb-9be4-4714-ac44-c91fc35fefbf	sales	approve	Approve discounts	2026-09-19 06:30:27.234053+00
5b6dca3c-b3b5-4294-86d1-246196745b26	placement	view	View test results	2026-09-19 06:30:27.234053+00
832d2851-b091-444c-8e95-31a9672390cf	placement	create	Schedule tests	2026-09-19 06:30:27.234053+00
6006f37c-328a-42e5-88cf-d434f138a329	placement	edit	Score and override levels	2026-09-19 06:30:27.234053+00
1e94c17f-3305-49a1-85fb-2e63e7b4cd8b	placement	delete	Cancel test appointments	2026-09-19 06:30:27.234053+00
e70302b4-73c0-4615-b02d-3f4de00529ac	groups	view	View groups and schedules	2026-09-19 06:30:27.234053+00
fad5491f-7680-45dc-beed-556ff425725e	groups	create	Create groups	2026-09-19 06:30:27.234053+00
3db5fc69-f72d-4f18-ac13-847f9cb0ea41	groups	edit	Edit groups and schedules	2026-09-19 06:30:27.234053+00
1262033b-72c3-4ed0-b699-36ed69453de9	groups	delete	Cancel groups	2026-09-19 06:30:27.234053+00
91581040-a6a7-4cef-891d-027e4bb432e9	attendance	view	View attendance reports	2026-09-19 06:30:27.234053+00
3aadfe41-c851-4ea4-94ac-b9cd0432551e	attendance	create	Record attendance	2026-09-19 06:30:27.234053+00
e2dd1d7a-5b45-410c-b580-dc5b0929651d	attendance	edit	Edit attendance records	2026-09-19 06:30:27.234053+00
2aa3ce7a-b79c-4e19-bb01-384388b59642	attendance	lock	Lock attendance after deadline	2026-09-19 06:30:27.234053+00
de11ae40-83c1-4b59-8c7f-43ef8b4254a0	lms	view	View content and grades	2026-09-19 06:30:27.234053+00
3c6eff30-61e9-4e25-84e0-ac35346732b1	lms	create	Create modules, lessons, assignments	2026-09-19 06:30:27.234053+00
43e7d0a6-0d86-4f32-a2a5-8dc6c1ffda7c	lms	edit	Edit LMS content	2026-09-19 06:30:27.234053+00
e8e7f5d6-8d85-43e8-a4e5-ee6e3a334c6e	lms	delete	Delete LMS content	2026-09-19 06:30:27.234053+00
4fb84ce3-4c4a-42f3-b39c-3761eda4e4a6	lms	grade	Grade submissions and quizzes	2026-09-19 06:30:27.234053+00
73eb74eb-d5ec-4e77-a879-847d6361da8b	chat	view	View chat messages	2026-09-19 06:30:27.234053+00
4205e15b-fda2-4586-a173-734cc12e2f0f	chat	send	Send messages	2026-09-19 06:30:27.234053+00
78a7fb3c-8998-4666-ae49-7fd95eab7055	chat	moderate	Moderate and review violations	2026-09-19 06:30:27.234053+00
a0a4026e-64db-499c-baad-e33946fc34d2	chat	ban	Ban users from chat	2026-09-19 06:30:27.234053+00
9e2c0ee2-844c-4847-ac09-8b3783633732	finance	view	View invoices and payments	2026-09-19 06:30:27.234053+00
89420ba9-e1f7-495a-936f-8efd864c8f30	finance	create	Create invoices and record payments	2026-09-19 06:30:27.234053+00
3ac2951e-cf06-433b-803b-9779c07b2e2b	finance	edit	Edit financial records	2026-09-19 06:30:27.234053+00
5059936e-ad65-4571-93fe-edacf46e0776	finance	approve	Approve refunds	2026-09-19 06:30:27.234053+00
1b41646d-b3be-475e-bc08-7820d4d8d1fb	finance	export	Export financial reports	2026-09-19 06:30:27.234053+00
5602cc7e-c898-4bb7-97e8-8c977f7783c3	certificates	view	View certificates	2026-09-19 06:30:27.234053+00
ef854779-bc30-435f-98c9-5b454a30c066	certificates	create	Issue certificates	2026-09-19 06:30:27.234053+00
55b2d983-7755-4f32-a64f-e24ff59e7d49	certificates	edit	Edit certificate templates	2026-09-19 06:30:27.234053+00
c3bdd623-726d-4c8c-a980-0cea7e04e948	certificates	revoke	Revoke certificates	2026-09-19 06:30:27.234053+00
1cfac923-22c9-443b-8a87-04f3c6718370	hr	view	View employee records	2026-09-19 06:30:27.234053+00
af80220b-ecab-4440-b2d1-aca612a9f847	hr	create	Create employee records	2026-09-19 06:30:27.234053+00
d855de9d-bf56-4ebf-9700-b395eca317ae	hr	edit	Edit employee records	2026-09-19 06:30:27.234053+00
86ab7cc0-85ba-44a7-901f-05cd81d9270b	hr	approve	Approve leave requests	2026-09-19 06:30:27.234053+00
fb680fd2-e084-42a9-a2d6-bee4076b512a	hr	process_payroll	Process payroll	2026-09-19 06:30:27.234053+00
c316ed44-d6c1-4ce3-9a70-8515112568a5	activities	view	View activities	2026-09-19 06:30:27.234053+00
64827e27-7ccc-4660-bef1-6d6a67c204ca	activities	create	Create activities	2026-09-19 06:30:27.234053+00
baba8250-21fe-41da-b433-74ca2d27fe90	activities	edit	Edit activities	2026-09-19 06:30:27.234053+00
c0d83d3b-1af9-490e-bfa4-42e51ca80c99	activities	delete	Cancel activities	2026-09-19 06:30:27.234053+00
c2614ca8-2ae2-4bf3-8940-662a72f7fba1	inventory	view	View stock levels	2026-09-19 06:30:27.234053+00
a7278531-335f-4366-a054-57bd13a56e39	inventory	create	Add inventory items	2026-09-19 06:30:27.234053+00
e4796005-fe4e-4afb-b727-84ee036572a1	inventory	edit	Adjust stock	2026-09-19 06:30:27.234053+00
897a7237-9b37-4506-bb71-0076770ea852	inventory	issue	Issue items to students	2026-09-19 06:30:27.234053+00
91cf1a77-6e91-4bc2-a6a0-799f9c3a2b17	kb	view	View articles	2026-09-19 06:30:27.234053+00
172cb9d1-e199-458a-948e-7d013df4c922	kb	create	Create articles	2026-09-19 06:30:27.234053+00
4cd283f2-a53c-4f31-8bdb-115d136d8f70	kb	edit	Edit articles	2026-09-19 06:30:27.234053+00
41a3a269-9a3c-4d90-bd7b-01523a4140fc	kb	delete	Delete articles	2026-09-19 06:30:27.234053+00
0e883956-7d8a-48f0-b755-707e45d4aeed	reports	view	View reports and analytics	2026-09-19 06:30:27.234053+00
28484d61-1bfa-4f5e-a501-cc4983f42b2c	reports	export	Export reports	2026-09-19 06:30:27.234053+00
ed848bc0-5daa-48b8-9512-f0ec3709969b	branches	view	View branch data	2026-09-19 06:30:27.234053+00
66e86c54-dd69-4bac-a2b9-34607c3050f6	branches	create	Create branches	2026-09-19 06:30:27.234053+00
6ddd4493-25ec-4526-ac2c-18bd4a5113d7	branches	edit	Edit branches	2026-09-19 06:30:27.234053+00
4656edc3-8195-44ae-8437-d7dba22d29ba	branches	delete	Close branches	2026-09-19 06:30:27.234053+00
2dd15232-40ab-4d6a-ae85-845638bda2d6	system	view	View system settings	2026-09-19 06:30:27.234053+00
dd3c9ed1-c8cd-4254-99d0-4e1b85300b7e	system	edit	Edit system settings	2026-09-19 06:30:27.234053+00
f49161a1-a725-43fd-860e-9f0b6eba1d25	system	manage_roles	Manage roles and permissions	2026-09-19 06:30:27.234053+00
aada9dc0-5f15-4f55-94a0-0f90b8b05671	system	audit	View audit logs	2026-09-19 06:30:27.234053+00
\.


--
-- Data for Name: placement_test_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.placement_test_answers (id, test_id, question_id, answer, score, is_correct, created_at) FROM stdin;
\.


--
-- Data for Name: placement_tests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.placement_tests (id, lead_id, student_id, slot_id, examiner_id, scheduled_at, written_score, written_max, oral_score, oral_max, suggested_level, final_level, override_reason, examiner_notes, status, result_sent_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_codes (id, code, type, value, max_discount, expiry_date, usage_limit, used_count, applicable_courses, applicable_branches, status, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_attempts (id, quiz_id, student_id, attempt_number, answers, score, percentage, is_passed, started_at, submitted_at, time_spent_seconds, status, graded_by, graded_at, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_questions (id, quiz_id, bank_question_id, question_text, type, options, correct_answer, points, "order", media_url, created_at) FROM stdin;
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quizzes (id, group_id, title, description, time_limit_minutes, max_attempts, shuffle_questions, shuffle_options, release_type, release_at, passing_score, is_published, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referrals (id, referrer_student_id, referred_lead_id, referred_student_id, credit_amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refunds (id, payment_id, invoice_id, amount, reason_code, reason_note, status, approved_by, approved_at, processed_by, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id, created_at) FROM stdin;
a6201fca-daa9-42b5-bd97-a6aee1c286ce	a954657b-7ce6-4432-832d-2bbc0c1f100c	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	3052ba76-1674-4164-9704-49e12d36e835	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	c3f81a0c-b2df-476e-b761-b0081a7a20a4	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	4c141b40-2415-4d21-b1cc-51079141397f	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	1aa6c718-4a05-4bb6-804a-ee37d68f10f1	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	1c285b5d-54a3-4ad1-87ac-d5a2f1ab10fc	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	f37f8771-9d8e-4e06-a448-9e24aa4645e1	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	15c073ec-5e5d-4fc1-9770-d6541be6cfb6	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	851b2bdb-9be4-4714-ac44-c91fc35fefbf	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	5b6dca3c-b3b5-4294-86d1-246196745b26	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	832d2851-b091-444c-8e95-31a9672390cf	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	6006f37c-328a-42e5-88cf-d434f138a329	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	1e94c17f-3305-49a1-85fb-2e63e7b4cd8b	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	e70302b4-73c0-4615-b02d-3f4de00529ac	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	fad5491f-7680-45dc-beed-556ff425725e	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	3db5fc69-f72d-4f18-ac13-847f9cb0ea41	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	1262033b-72c3-4ed0-b699-36ed69453de9	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	91581040-a6a7-4cef-891d-027e4bb432e9	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	3aadfe41-c851-4ea4-94ac-b9cd0432551e	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	e2dd1d7a-5b45-410c-b580-dc5b0929651d	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	2aa3ce7a-b79c-4e19-bb01-384388b59642	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	de11ae40-83c1-4b59-8c7f-43ef8b4254a0	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	3c6eff30-61e9-4e25-84e0-ac35346732b1	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	43e7d0a6-0d86-4f32-a2a5-8dc6c1ffda7c	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	e8e7f5d6-8d85-43e8-a4e5-ee6e3a334c6e	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	4fb84ce3-4c4a-42f3-b39c-3761eda4e4a6	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	73eb74eb-d5ec-4e77-a879-847d6361da8b	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	4205e15b-fda2-4586-a173-734cc12e2f0f	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	78a7fb3c-8998-4666-ae49-7fd95eab7055	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	a0a4026e-64db-499c-baad-e33946fc34d2	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	9e2c0ee2-844c-4847-ac09-8b3783633732	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	89420ba9-e1f7-495a-936f-8efd864c8f30	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	3ac2951e-cf06-433b-803b-9779c07b2e2b	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	5059936e-ad65-4571-93fe-edacf46e0776	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	1b41646d-b3be-475e-bc08-7820d4d8d1fb	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	5602cc7e-c898-4bb7-97e8-8c977f7783c3	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	ef854779-bc30-435f-98c9-5b454a30c066	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	55b2d983-7755-4f32-a64f-e24ff59e7d49	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	c3bdd623-726d-4c8c-a980-0cea7e04e948	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	1cfac923-22c9-443b-8a87-04f3c6718370	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	af80220b-ecab-4440-b2d1-aca612a9f847	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	d855de9d-bf56-4ebf-9700-b395eca317ae	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	86ab7cc0-85ba-44a7-901f-05cd81d9270b	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	fb680fd2-e084-42a9-a2d6-bee4076b512a	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	c316ed44-d6c1-4ce3-9a70-8515112568a5	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	64827e27-7ccc-4660-bef1-6d6a67c204ca	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	baba8250-21fe-41da-b433-74ca2d27fe90	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	c0d83d3b-1af9-490e-bfa4-42e51ca80c99	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	c2614ca8-2ae2-4bf3-8940-662a72f7fba1	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	a7278531-335f-4366-a054-57bd13a56e39	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	e4796005-fe4e-4afb-b727-84ee036572a1	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	897a7237-9b37-4506-bb71-0076770ea852	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	91cf1a77-6e91-4bc2-a6a0-799f9c3a2b17	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	172cb9d1-e199-458a-948e-7d013df4c922	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	4cd283f2-a53c-4f31-8bdb-115d136d8f70	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	41a3a269-9a3c-4d90-bd7b-01523a4140fc	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	0e883956-7d8a-48f0-b755-707e45d4aeed	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	28484d61-1bfa-4f5e-a501-cc4983f42b2c	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	ed848bc0-5daa-48b8-9512-f0ec3709969b	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	66e86c54-dd69-4bac-a2b9-34607c3050f6	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	6ddd4493-25ec-4526-ac2c-18bd4a5113d7	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	4656edc3-8195-44ae-8437-d7dba22d29ba	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	2dd15232-40ab-4d6a-ae85-845638bda2d6	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	dd3c9ed1-c8cd-4254-99d0-4e1b85300b7e	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	f49161a1-a725-43fd-860e-9f0b6eba1d25	2026-09-19 06:30:27.237044+00
a6201fca-daa9-42b5-bd97-a6aee1c286ce	aada9dc0-5f15-4f55-94a0-0f90b8b05671	2026-09-19 06:30:27.237044+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, slug, description, is_custom, is_system, created_at) FROM stdin;
a6201fca-daa9-42b5-bd97-a6aee1c286ce	Super Admin	super_admin	Full system control	f	t	2026-09-19 06:30:27.232563+00
66692066-0745-4476-9e1c-bf0a802bd054	Branch Manager	branch_manager	Day-to-day branch oversight	f	t	2026-09-19 06:30:27.232563+00
6df86e15-98db-4b40-9ca1-635f26a68f86	Sales Agent	sales	CRM, registration, payments	f	t	2026-09-19 06:30:27.232563+00
732e9dd4-9a25-433f-8849-2d9fea4acbf7	Finance Officer	finance	Invoicing, installments, reconciliation	f	t	2026-09-19 06:30:27.232563+00
8df08331-a7a6-44e6-824e-8d1610eeacea	Academic Coordinator	academic	Course and group management	f	t	2026-09-19 06:30:27.232563+00
f64dd773-5d69-4847-a13d-55bf6660d560	Teacher	teacher	LMS, attendance, grading, chat	f	t	2026-09-19 06:30:27.232563+00
f73e07f4-7bcc-470d-9e1f-7ce9f70f97c9	Student	student	Self-service portal, classes, payments, chat	f	t	2026-09-19 06:30:27.232563+00
b0735b43-bce4-4a85-bd41-b1beb989c83e	Moderator	moderator	Live chat oversight & flag review	f	t	2026-09-19 06:30:27.232563+00
86e9c5d7-9fa3-48ba-af4f-1be84381d629	HR Officer	hr	Employee records and payroll	f	t	2026-09-19 06:30:27.232563+00
4de48cc1-005b-400c-ba52-daa95024ecd4	Read-only Auditor	auditor	View-only access for compliance	f	t	2026-09-19 06:30:27.232563+00
\.


--
-- Data for Name: sales_targets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_targets (id, agent_id, month, year, target_amount, target_conversions, achieved_amount, achieved_conversions, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, group_id, date, start_time, end_time, classroom_id, mode, zoom_meeting_id, zoom_join_url, onmeet_meeting_id, recording_url, topic, notes, attendance_locked, cancelled_at, cancellation_reason, created_at) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, key, value, "group", is_encrypted, description, created_at, updated_at) FROM stdin;
e29b2132-7123-4467-aca5-6de452a94d3f	academy_name	Speak Up English Academy	general	f	Academy display name	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
be5c45db-9666-4d37-8307-27fadecd88ee	default_language	ar	general	f	Default UI language	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
d0ad1a27-3354-4049-b972-1b009461f2ec	date_format	dd/mm/yyyy	general	f	Date display format	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
0a0a0707-ee45-4239-873d-1fe1a2641f8a	currency	EGP	finance	f	Default currency	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
7721078d-fffa-46f2-b225-9538de0cc38c	chat_retention_months	24	chat	f	Chat message retention period	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
0c487c75-762c-4380-be3f-515057320c1e	max_file_upload_mb	10	system	f	Maximum file upload size in MB	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
ea405f6c-53fc-45bc-9070-6dc0ebc8bd7f	attendance_lock_hours	48	attendance	f	Hours after session before attendance is locked	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
d803d6ee-c965-40ae-841b-2b4e9d3db9c9	passing_score_default	60	lms	f	Default passing score percentage	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
6895a8ec-cfa9-4551-9b41-0ec8336936c2	max_chat_file_mb	5	chat	f	Maximum chat file attachment size	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
25d39eec-c681-43e3-a63b-a1eea260a5ee	enable_email_notifications	true	notifications	f	Master switch for email notifications	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
7a1530e5-5ed5-49a4-9d8f-6eef0e077c0c	easykash_sandbox_mode	true	integrations	f	EasyKash sandbox mode for testing	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
07196f5c-958b-4787-b2e6-41e27d169ece	zoom_auto_create	true	integrations	f	Auto-create Zoom meetings for online sessions	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
c3c05dd5-89ca-43a5-ac14-9d64c2af3ddb	onmeet_auto_create	true	integrations	f	Auto-create OnMeet meetings for online sessions	2026-09-19 06:30:27.241353+00	2026-09-19 06:30:27.241353+00
\.


--
-- Data for Name: stock_levels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_levels (id, item_id, branch_id, quantity, reserved_quantity, last_counted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stock_moves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_moves (id, item_id, branch_id, type, quantity, unit_cost, reason, reference_type, reference_id, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: student_item_issues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_item_issues (id, student_id, item_id, branch_id, quantity, cost, issued_at, returned_at, condition_on_return, created_by) FROM stdin;
\.


--
-- Data for Name: student_level_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_level_history (id, student_id, old_level, new_level, reason, reference_id, changed_by, changed_at) FROM stdin;
\.


--
-- Data for Name: student_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_profiles (id, student_id, photo_url, date_of_birth, gender, address, national_id, education_level, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_surveys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_surveys (id, group_id, student_id, teacher_id, term, responses, overall_rating, comment, is_anonymous, created_at) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, user_id, student_number, current_level, status, enrollment_date, branch_id, placement_test_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.submissions (id, assignment_id, student_id, content, file_url, file_name, submitted_at, is_late, grade, feedback, graded_by, graded_at, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teacher_availabilities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teacher_availabilities (id, employee_id, day_of_week, start_time, end_time, is_available, note, created_at) FROM stdin;
\.


--
-- Data for Name: teacher_evaluations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teacher_evaluations (id, group_id, student_id, teacher_id, term, form_data, overall_comment, is_shared_with_student, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: test_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_questions (id, question_text, type, options, correct_answer, explanation, level, category, points, is_active, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: test_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_slots (id, branch_id, examiner_id, date, start_time, end_time, mode, capacity, booked_count, status, created_at) FROM stdin;
\.


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.testimonials (id, student_id, name, content, photo_url, rating, course_name, is_featured, status, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, assigned_by, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, phone, password_hash, first_name, last_name, avatar_url, language, branch_id, status, email_verified_at, phone_verified_at, two_factor_enabled, two_factor_secret, last_login_at, last_login_ip, chat_policy_accepted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: waitlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.waitlists (id, student_id, course_id, level, branch_id, priority, status, notes, created_at, enrolled_at) FROM stdin;
\.


--
-- Name: invoice_number_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_number_seq', 1, false);


--
-- Name: receipt_number_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.receipt_number_seq', 1, false);


--
-- Name: student_number_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_number_seq', 2, true);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activity_photos activity_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_photos
    ADD CONSTRAINT activity_photos_pkey PRIMARY KEY (id);


--
-- Name: activity_registrations activity_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT activity_registrations_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: certificate_templates certificate_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT certificate_templates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_code_key UNIQUE (code);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_room_members chat_room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT chat_room_members_pkey PRIMARY KEY (id);


--
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: chat_strikes chat_strikes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_strikes
    ADD CONSTRAINT chat_strikes_pkey PRIMARY KEY (id);


--
-- Name: chat_violations chat_violations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT chat_violations_pkey PRIMARY KEY (id);


--
-- Name: classrooms classrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_pkey PRIMARY KEY (id);


--
-- Name: course_materials course_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_pkey PRIMARY KEY (id);


--
-- Name: course_prerequisites course_prerequisites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_pkey PRIMARY KEY (course_id, prerequisite_course_id);


--
-- Name: courses courses_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_code_key UNIQUE (code);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: employee_documents employee_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_number_key UNIQUE (employee_number);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_key UNIQUE (user_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: follow_ups follow_ups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_pkey PRIMARY KEY (id);


--
-- Name: gradebook_categories gradebook_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_categories
    ADD CONSTRAINT gradebook_categories_pkey PRIMARY KEY (id);


--
-- Name: gradebook_entries gradebook_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT gradebook_entries_pkey PRIMARY KEY (id);


--
-- Name: group_schedules group_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_schedules
    ADD CONSTRAINT group_schedules_pkey PRIMARY KEY (id);


--
-- Name: group_students group_students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT group_students_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: installments installments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installments
    ADD CONSTRAINT installments_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_sku_key UNIQUE (sku);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: kb_article_versions kb_article_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_article_versions
    ADD CONSTRAINT kb_article_versions_pkey PRIMARY KEY (id);


--
-- Name: kb_articles kb_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_pkey PRIMARY KEY (id);


--
-- Name: kb_articles kb_articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_slug_key UNIQUE (slug);


--
-- Name: kb_categories kb_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_categories
    ADD CONSTRAINT kb_categories_pkey PRIMARY KEY (id);


--
-- Name: kb_categories kb_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_categories
    ADD CONSTRAINT kb_categories_slug_key UNIQUE (slug);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: lead_tag_pivot lead_tag_pivot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tag_pivot
    ADD CONSTRAINT lead_tag_pivot_pkey PRIMARY KEY (lead_id, tag_id);


--
-- Name: lead_tags lead_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT lead_tags_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: lms_lessons lms_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_lessons
    ADD CONSTRAINT lms_lessons_pkey PRIMARY KEY (id);


--
-- Name: lms_modules lms_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_modules
    ADD CONSTRAINT lms_modules_pkey PRIMARY KEY (id);


--
-- Name: lms_resources lms_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_resources
    ADD CONSTRAINT lms_resources_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_receipt_number_key UNIQUE (receipt_number);


--
-- Name: payroll_entries payroll_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT payroll_entries_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: placement_test_answers placement_test_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_answers
    ADD CONSTRAINT placement_test_answers_pkey PRIMARY KEY (id);


--
-- Name: placement_tests placement_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT placement_tests_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_code_key UNIQUE (code);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_slug_key UNIQUE (slug);


--
-- Name: sales_targets sales_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT sales_targets_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: settings settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: stock_levels stock_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT stock_levels_pkey PRIMARY KEY (id);


--
-- Name: stock_moves stock_moves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_moves
    ADD CONSTRAINT stock_moves_pkey PRIMARY KEY (id);


--
-- Name: student_item_issues student_item_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT student_item_issues_pkey PRIMARY KEY (id);


--
-- Name: student_level_history student_level_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_level_history
    ADD CONSTRAINT student_level_history_pkey PRIMARY KEY (id);


--
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (id);


--
-- Name: student_profiles student_profiles_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_student_id_key UNIQUE (student_id);


--
-- Name: student_surveys student_surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_surveys
    ADD CONSTRAINT student_surveys_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_student_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_number_key UNIQUE (student_number);


--
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: teacher_availabilities teacher_availabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_availabilities
    ADD CONSTRAINT teacher_availabilities_pkey PRIMARY KEY (id);


--
-- Name: teacher_evaluations teacher_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_evaluations
    ADD CONSTRAINT teacher_evaluations_pkey PRIMARY KEY (id);


--
-- Name: test_questions test_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (id);


--
-- Name: test_slots test_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_slots
    ADD CONSTRAINT test_slots_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: activity_registrations uq_act_reg; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT uq_act_reg UNIQUE (activity_id, student_id);


--
-- Name: attendances uq_attendance; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT uq_attendance UNIQUE (session_id, student_id);


--
-- Name: chat_room_members uq_crm_room_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT uq_crm_room_user UNIQUE (room_id, user_id);


--
-- Name: gradebook_entries uq_gradebook_entry; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT uq_gradebook_entry UNIQUE (group_id, student_id, category_id, reference_type, reference_id);


--
-- Name: group_students uq_group_students; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT uq_group_students UNIQUE (group_id, student_id);


--
-- Name: installments uq_installment; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installments
    ADD CONSTRAINT uq_installment UNIQUE (invoice_id, installment_number);


--
-- Name: notification_preferences uq_notif_pref; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT uq_notif_pref UNIQUE (user_id, channel, module, event);


--
-- Name: payroll_entries uq_payroll_entry; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT uq_payroll_entry UNIQUE (payroll_period_id, employee_id);


--
-- Name: permissions uq_permissions_module_action; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT uq_permissions_module_action UNIQUE (module, action);


--
-- Name: placement_test_answers uq_pta_test_question; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_answers
    ADD CONSTRAINT uq_pta_test_question UNIQUE (test_id, question_id);


--
-- Name: quiz_attempts uq_quiz_attempt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT uq_quiz_attempt UNIQUE (quiz_id, student_id, attempt_number);


--
-- Name: sales_targets uq_sales_targets_agent_month_year; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT uq_sales_targets_agent_month_year UNIQUE (agent_id, month, year);


--
-- Name: stock_levels uq_stock_level; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT uq_stock_level UNIQUE (item_id, branch_id);


--
-- Name: submissions uq_submission; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT uq_submission UNIQUE (assignment_id, student_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: waitlists waitlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_pkey PRIMARY KEY (id);


--
-- Name: idx_act_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_act_branch ON public.activities USING btree (branch_id);


--
-- Name: idx_act_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_act_date ON public.activities USING btree (date);


--
-- Name: idx_act_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_act_status ON public.activities USING btree (status);


--
-- Name: idx_act_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_act_type ON public.activities USING btree (type);


--
-- Name: idx_activities_target_groups; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_target_groups ON public.activities USING gin (target_groups);


--
-- Name: idx_activities_target_levels; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_target_levels ON public.activities USING gin (target_levels);


--
-- Name: idx_al_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_al_action ON public.audit_logs USING btree (action);


--
-- Name: idx_al_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_al_actor ON public.audit_logs USING btree (actor_id);


--
-- Name: idx_al_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_al_created ON public.audit_logs USING btree (created_at);


--
-- Name: idx_al_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_al_module ON public.audit_logs USING btree (module);


--
-- Name: idx_al_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_al_session ON public.audit_logs USING btree (session_id);


--
-- Name: idx_al_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_al_target ON public.audit_logs USING btree (target_type, target_id);


--
-- Name: idx_ap_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_activity ON public.activity_photos USING btree (activity_id);


--
-- Name: idx_ar_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ar_activity ON public.activity_registrations USING btree (activity_id);


--
-- Name: idx_ar_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ar_status ON public.activity_registrations USING btree (status);


--
-- Name: idx_ar_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ar_student ON public.activity_registrations USING btree (student_id);


--
-- Name: idx_asgn_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asgn_due ON public.assignments USING btree (due_at);


--
-- Name: idx_asgn_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asgn_group ON public.assignments USING btree (group_id);


--
-- Name: idx_asgn_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asgn_published ON public.assignments USING btree (is_published);


--
-- Name: idx_att_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_att_created ON public.attendances USING btree (created_at);


--
-- Name: idx_att_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_att_session ON public.attendances USING btree (session_id);


--
-- Name: idx_att_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_att_status ON public.attendances USING btree (status);


--
-- Name: idx_att_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_att_student ON public.attendances USING btree (student_id);


--
-- Name: idx_blog_posts_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_search ON public.blog_posts USING gin (to_tsvector('arabic'::regconfig, (((title)::text || ' '::text) || content)));


--
-- Name: idx_bp_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bp_author ON public.blog_posts USING btree (author_id);


--
-- Name: idx_bp_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bp_published ON public.blog_posts USING btree (published_at);


--
-- Name: idx_bp_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bp_slug ON public.blog_posts USING btree (slug);


--
-- Name: idx_bp_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bp_status ON public.blog_posts USING btree (status);


--
-- Name: idx_branches_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branches_manager ON public.branches USING btree (manager_id);


--
-- Name: idx_branches_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branches_status ON public.branches USING btree (status);


--
-- Name: idx_cert_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cert_code ON public.certificates USING btree (code);


--
-- Name: idx_cert_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cert_course ON public.certificates USING btree (course_id);


--
-- Name: idx_cert_issue_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cert_issue_date ON public.certificates USING btree (issue_date);


--
-- Name: idx_cert_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cert_status ON public.certificates USING btree (status);


--
-- Name: idx_cert_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cert_student ON public.certificates USING btree (student_id);


--
-- Name: idx_classrooms_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classrooms_branch ON public.classrooms USING btree (branch_id);


--
-- Name: idx_classrooms_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classrooms_status ON public.classrooms USING btree (status);


--
-- Name: idx_cm_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cm_active ON public.chat_messages USING btree (room_id, created_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_cm_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cm_course ON public.course_materials USING btree (course_id);


--
-- Name: idx_cm_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cm_created ON public.chat_messages USING btree (created_at);


--
-- Name: idx_cm_flagged; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cm_flagged ON public.chat_messages USING btree (is_flagged);


--
-- Name: idx_cm_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cm_item ON public.course_materials USING btree (inventory_item_id);


--
-- Name: idx_cm_reply; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cm_reply ON public.chat_messages USING btree (reply_to_id);


--
-- Name: idx_cm_room; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cm_room ON public.chat_messages USING btree (room_id);


--
-- Name: idx_cm_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cm_sender ON public.chat_messages USING btree (sender_id);


--
-- Name: idx_courses_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_code ON public.courses USING btree (code);


--
-- Name: idx_courses_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_level ON public.courses USING btree (level);


--
-- Name: idx_courses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_status ON public.courses USING btree (status);


--
-- Name: idx_cr_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cr_archived ON public.chat_rooms USING btree (is_archived);


--
-- Name: idx_cr_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cr_group ON public.chat_rooms USING btree (group_id);


--
-- Name: idx_cr_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cr_type ON public.chat_rooms USING btree (type);


--
-- Name: idx_crm_active_ban; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_active_ban ON public.chat_room_members USING btree (is_banned, banned_until) WHERE (is_banned = true);


--
-- Name: idx_crm_banned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_banned ON public.chat_room_members USING btree (is_banned);


--
-- Name: idx_crm_room; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_room ON public.chat_room_members USING btree (room_id);


--
-- Name: idx_crm_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_user ON public.chat_room_members USING btree (user_id);


--
-- Name: idx_cs_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cs_active ON public.chat_strikes USING btree (is_active);


--
-- Name: idx_cs_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cs_current ON public.chat_strikes USING btree (is_active, expires_at) WHERE (is_active = true);


--
-- Name: idx_cs_strike_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cs_strike_number ON public.chat_strikes USING btree (strike_number);


--
-- Name: idx_cs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cs_user ON public.chat_strikes USING btree (user_id);


--
-- Name: idx_ct_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ct_course ON public.certificate_templates USING btree (course_id);


--
-- Name: idx_ct_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ct_default ON public.certificate_templates USING btree (is_default) WHERE (is_default = true);


--
-- Name: idx_ct_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ct_status ON public.certificate_templates USING btree (status);


--
-- Name: idx_cv_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_created ON public.chat_violations USING btree (created_at);


--
-- Name: idx_cv_false_positive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_false_positive ON public.chat_violations USING btree (is_false_positive);


--
-- Name: idx_cv_room; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_room ON public.chat_violations USING btree (room_id);


--
-- Name: idx_cv_rule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_rule ON public.chat_violations USING btree (rule_matched);


--
-- Name: idx_cv_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_sender ON public.chat_violations USING btree (sender_id);


--
-- Name: idx_cv_unresolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_unresolved ON public.chat_violations USING btree (resolved_at) WHERE (resolved_at IS NULL);


--
-- Name: idx_ed_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ed_employee ON public.employee_documents USING btree (employee_id);


--
-- Name: idx_ed_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ed_type ON public.employee_documents USING btree (document_type);


--
-- Name: idx_emp_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emp_department ON public.employees USING btree (department);


--
-- Name: idx_emp_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emp_number ON public.employees USING btree (employee_number);


--
-- Name: idx_emp_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emp_status ON public.employees USING btree (status);


--
-- Name: idx_emp_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emp_user ON public.employees USING btree (user_id);


--
-- Name: idx_enr_enrolled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enr_enrolled_at ON public.enrollments USING btree (enrolled_at);


--
-- Name: idx_enr_enrolled_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enr_enrolled_by ON public.enrollments USING btree (enrolled_by);


--
-- Name: idx_enr_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enr_group ON public.enrollments USING btree (group_id);


--
-- Name: idx_enr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enr_status ON public.enrollments USING btree (status);


--
-- Name: idx_enr_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enr_student ON public.enrollments USING btree (student_id);


--
-- Name: idx_ft_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_branch ON public.financial_transactions USING btree (branch_id);


--
-- Name: idx_ft_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_date ON public.financial_transactions USING btree (transaction_date);


--
-- Name: idx_ft_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ft_invoice ON public.financial_transactions USING btree (invoice_id);


--
-- Name: idx_fu_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_active ON public.follow_ups USING btree (status) WHERE (status = 'pending'::public.follow_up_status);


--
-- Name: idx_fu_assigned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_assigned ON public.follow_ups USING btree (assigned_to);


--
-- Name: idx_fu_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_due_date ON public.follow_ups USING btree (due_date);


--
-- Name: idx_fu_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_lead ON public.follow_ups USING btree (lead_id);


--
-- Name: idx_fu_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fu_status ON public.follow_ups USING btree (status);


--
-- Name: idx_gc_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gc_group ON public.gradebook_categories USING btree (group_id);


--
-- Name: idx_gc_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gc_order ON public.gradebook_categories USING btree ("order");


--
-- Name: idx_ge_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ge_category ON public.gradebook_entries USING btree (category_id);


--
-- Name: idx_ge_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ge_group ON public.gradebook_entries USING btree (group_id);


--
-- Name: idx_ge_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ge_student ON public.gradebook_entries USING btree (student_id);


--
-- Name: idx_groups_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_branch ON public.groups USING btree (branch_id);


--
-- Name: idx_groups_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_course ON public.groups USING btree (course_id);


--
-- Name: idx_groups_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_dates ON public.groups USING btree (start_date, end_date);


--
-- Name: idx_groups_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_mode ON public.groups USING btree (mode);


--
-- Name: idx_groups_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_status ON public.groups USING btree (status);


--
-- Name: idx_groups_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_teacher ON public.groups USING btree (teacher_id);


--
-- Name: idx_gs_classroom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gs_classroom ON public.group_schedules USING btree (classroom_id);


--
-- Name: idx_gs_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gs_day ON public.group_schedules USING btree (day_of_week);


--
-- Name: idx_gs_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gs_group ON public.group_schedules USING btree (group_id);


--
-- Name: idx_gs_group_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gs_group_ref ON public.group_students USING btree (group_id);


--
-- Name: idx_gs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gs_status ON public.group_students USING btree (status);


--
-- Name: idx_gs_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gs_student ON public.group_students USING btree (student_id);


--
-- Name: idx_inst_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inst_due_date ON public.installments USING btree (due_date);


--
-- Name: idx_inst_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inst_invoice ON public.installments USING btree (invoice_id);


--
-- Name: idx_inst_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inst_pending ON public.installments USING btree (status) WHERE (status = ANY (ARRAY['pending'::public.installment_status, 'overdue'::public.installment_status, 'partial'::public.installment_status]));


--
-- Name: idx_inst_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inst_status ON public.installments USING btree (status);


--
-- Name: idx_inv_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_branch ON public.invoices USING btree (branch_id);


--
-- Name: idx_inv_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_due_date ON public.invoices USING btree (due_date);


--
-- Name: idx_inv_enrollment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_enrollment ON public.invoices USING btree (enrollment_id);


--
-- Name: idx_inv_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_number ON public.invoices USING btree (invoice_number);


--
-- Name: idx_inv_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_status ON public.invoices USING btree (status);


--
-- Name: idx_inv_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_student ON public.invoices USING btree (student_id);


--
-- Name: idx_inv_unpaid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_unpaid ON public.invoices USING btree (status) WHERE (status = ANY (ARRAY['unpaid'::public.invoice_status, 'partial'::public.invoice_status, 'overdue'::public.invoice_status]));


--
-- Name: idx_invoice_items_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_course ON public.invoice_items USING btree (course_id);


--
-- Name: idx_invoice_items_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items USING btree (invoice_id);


--
-- Name: idx_invoice_items_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_type ON public.invoice_items USING btree (item_type);


--
-- Name: idx_items_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_category ON public.inventory_items USING btree (category);


--
-- Name: idx_items_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_sku ON public.inventory_items USING btree (sku);


--
-- Name: idx_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_status ON public.inventory_items USING btree (status);


--
-- Name: idx_ka_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ka_category ON public.kb_articles USING btree (category_id);


--
-- Name: idx_ka_pinned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ka_pinned ON public.kb_articles USING btree (is_pinned) WHERE (is_pinned = true);


--
-- Name: idx_ka_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ka_slug ON public.kb_articles USING btree (slug);


--
-- Name: idx_ka_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ka_tags ON public.kb_articles USING gin (tags);


--
-- Name: idx_ka_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ka_visibility ON public.kb_articles USING btree (visibility);


--
-- Name: idx_kav_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kav_article ON public.kb_article_versions USING btree (article_id);


--
-- Name: idx_kav_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kav_version ON public.kb_article_versions USING btree (article_id, version_number);


--
-- Name: idx_kb_articles_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kb_articles_search ON public.kb_articles USING gin (to_tsvector('arabic'::regconfig, (((title)::text || ' '::text) || body)));


--
-- Name: idx_kbc_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kbc_parent ON public.kb_categories USING btree (parent_id);


--
-- Name: idx_kbc_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kbc_slug ON public.kb_categories USING btree (slug);


--
-- Name: idx_kbc_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kbc_visibility ON public.kb_categories USING btree (visibility);


--
-- Name: idx_la_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_la_created_by ON public.lead_activities USING btree (created_by);


--
-- Name: idx_la_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_la_lead ON public.lead_activities USING btree (lead_id);


--
-- Name: idx_la_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_la_scheduled ON public.lead_activities USING btree (scheduled_at) WHERE (scheduled_at IS NOT NULL);


--
-- Name: idx_la_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_la_type ON public.lead_activities USING btree (type);


--
-- Name: idx_leads_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_active ON public.leads USING btree (status) WHERE (status <> ALL (ARRAY['enrolled'::public.lead_status, 'lost'::public.lead_status]));


--
-- Name: idx_leads_assigned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_assigned ON public.leads USING btree (assigned_to);


--
-- Name: idx_leads_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_branch ON public.leads USING btree (branch_id);


--
-- Name: idx_leads_converted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_converted ON public.leads USING btree (converted_to_student_id);


--
-- Name: idx_leads_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_created ON public.leads USING btree (created_at);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);


--
-- Name: idx_leads_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_phone ON public.leads USING btree (phone);


--
-- Name: idx_leads_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_source ON public.leads USING btree (source);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- Name: idx_ll_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ll_module ON public.lms_lessons USING btree (module_id);


--
-- Name: idx_ll_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ll_order ON public.lms_lessons USING btree ("order");


--
-- Name: idx_ll_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ll_published ON public.lms_lessons USING btree (is_published);


--
-- Name: idx_lm_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lm_group ON public.lms_modules USING btree (group_id);


--
-- Name: idx_lm_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lm_order ON public.lms_modules USING btree ("order");


--
-- Name: idx_lm_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lm_published ON public.lms_modules USING btree (is_published);


--
-- Name: idx_lr_access; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lr_access ON public.lms_resources USING btree (access_control);


--
-- Name: idx_lr_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lr_employee ON public.leave_requests USING btree (employee_id);


--
-- Name: idx_lr_lesson; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lr_lesson ON public.lms_resources USING btree (lesson_id);


--
-- Name: idx_lr_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lr_start_date ON public.leave_requests USING btree (start_date);


--
-- Name: idx_lr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lr_status ON public.leave_requests USING btree (status);


--
-- Name: idx_lr_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lr_type ON public.lms_resources USING btree (type);


--
-- Name: idx_lt_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lt_branch ON public.lead_tags USING btree (branch_id);


--
-- Name: idx_notif_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_created ON public.notifications USING btree (created_at);


--
-- Name: idx_notif_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_read ON public.notifications USING btree (read_at);


--
-- Name: idx_notif_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_type ON public.notifications USING btree (type);


--
-- Name: idx_notif_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_unread ON public.notifications USING btree (user_id, created_at) WHERE (read_at IS NULL);


--
-- Name: idx_notif_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_user ON public.notifications USING btree (user_id);


--
-- Name: idx_np_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_np_user ON public.notification_preferences USING btree (user_id);


--
-- Name: idx_pay_easykash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pay_easykash ON public.payments USING btree (easykash_transaction_id);


--
-- Name: idx_pay_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pay_invoice ON public.payments USING btree (invoice_id);


--
-- Name: idx_pay_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pay_method ON public.payments USING btree (method);


--
-- Name: idx_pay_paid_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pay_paid_at ON public.payments USING btree (paid_at);


--
-- Name: idx_pay_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pay_status ON public.payments USING btree (status);


--
-- Name: idx_pc_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pc_code ON public.promo_codes USING btree (code);


--
-- Name: idx_pc_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pc_expiry ON public.promo_codes USING btree (expiry_date);


--
-- Name: idx_pc_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pc_status ON public.promo_codes USING btree (status);


--
-- Name: idx_pe_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pe_employee ON public.payroll_entries USING btree (employee_id);


--
-- Name: idx_pe_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pe_period ON public.payroll_entries USING btree (payroll_period_id);


--
-- Name: idx_pe_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pe_status ON public.payroll_entries USING btree (status);


--
-- Name: idx_permissions_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_module ON public.permissions USING btree (module);


--
-- Name: idx_pp_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pp_dates ON public.payroll_periods USING btree (start_date, end_date);


--
-- Name: idx_pp_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pp_status ON public.payroll_periods USING btree (status);


--
-- Name: idx_promo_branches; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_branches ON public.promo_codes USING gin (applicable_branches);


--
-- Name: idx_promo_courses; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_courses ON public.promo_codes USING gin (applicable_courses);


--
-- Name: idx_pt_examiner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pt_examiner ON public.placement_tests USING btree (examiner_id);


--
-- Name: idx_pt_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pt_lead ON public.placement_tests USING btree (lead_id);


--
-- Name: idx_pt_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pt_slot ON public.placement_tests USING btree (slot_id);


--
-- Name: idx_pt_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pt_status ON public.placement_tests USING btree (status);


--
-- Name: idx_pt_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pt_student ON public.placement_tests USING btree (student_id);


--
-- Name: idx_pta_question; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pta_question ON public.placement_test_answers USING btree (question_id);


--
-- Name: idx_pta_test; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pta_test ON public.placement_test_answers USING btree (test_id);


--
-- Name: idx_pv_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pv_path ON public.page_views USING btree (page_path);


--
-- Name: idx_pv_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pv_session ON public.page_views USING btree (session_id);


--
-- Name: idx_pv_viewed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pv_viewed ON public.page_views USING btree (viewed_at);


--
-- Name: idx_qa_quiz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_quiz ON public.quiz_attempts USING btree (quiz_id);


--
-- Name: idx_qa_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_score ON public.quiz_attempts USING btree (score);


--
-- Name: idx_qa_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_status ON public.quiz_attempts USING btree (status);


--
-- Name: idx_qa_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_student ON public.quiz_attempts USING btree (student_id);


--
-- Name: idx_qq_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qq_order ON public.quiz_questions USING btree ("order");


--
-- Name: idx_qq_quiz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qq_quiz ON public.quiz_questions USING btree (quiz_id);


--
-- Name: idx_qq_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qq_type ON public.quiz_questions USING btree (type);


--
-- Name: idx_quiz_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_group ON public.quizzes USING btree (group_id);


--
-- Name: idx_quiz_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_published ON public.quizzes USING btree (is_published);


--
-- Name: idx_quiz_release; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_release ON public.quizzes USING btree (release_type);


--
-- Name: idx_ref_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ref_invoice ON public.refunds USING btree (invoice_id);


--
-- Name: idx_ref_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ref_lead ON public.referrals USING btree (referred_lead_id);


--
-- Name: idx_ref_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ref_payment ON public.refunds USING btree (payment_id);


--
-- Name: idx_ref_referred_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ref_referred_student ON public.referrals USING btree (referred_student_id);


--
-- Name: idx_ref_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ref_referrer ON public.referrals USING btree (referrer_student_id);


--
-- Name: idx_ref_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ref_status ON public.refunds USING btree (status);


--
-- Name: idx_sessions_classroom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_classroom ON public.sessions USING btree (classroom_id);


--
-- Name: idx_sessions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_date ON public.sessions USING btree (date);


--
-- Name: idx_sessions_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_group ON public.sessions USING btree (group_id);


--
-- Name: idx_sessions_group_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_group_date ON public.sessions USING btree (group_id, date);


--
-- Name: idx_sessions_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_mode ON public.sessions USING btree (mode);


--
-- Name: idx_settings_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settings_group ON public.settings USING btree ("group");


--
-- Name: idx_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settings_key ON public.settings USING btree (key);


--
-- Name: idx_sii_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sii_branch ON public.student_item_issues USING btree (branch_id);


--
-- Name: idx_sii_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sii_item ON public.student_item_issues USING btree (item_id);


--
-- Name: idx_sii_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sii_student ON public.student_item_issues USING btree (student_id);


--
-- Name: idx_sl_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sl_branch ON public.stock_levels USING btree (branch_id);


--
-- Name: idx_sl_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sl_item ON public.stock_levels USING btree (item_id);


--
-- Name: idx_sl_quantity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sl_quantity ON public.stock_levels USING btree (quantity);


--
-- Name: idx_slh_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_slh_changed_at ON public.student_level_history USING btree (changed_at);


--
-- Name: idx_slh_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_slh_student ON public.student_level_history USING btree (student_id);


--
-- Name: idx_sm_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sm_branch ON public.stock_moves USING btree (branch_id);


--
-- Name: idx_sm_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sm_created ON public.stock_moves USING btree (created_at);


--
-- Name: idx_sm_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sm_item ON public.stock_moves USING btree (item_id);


--
-- Name: idx_sm_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sm_type ON public.stock_moves USING btree (type);


--
-- Name: idx_sp_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sp_student ON public.student_profiles USING btree (student_id);


--
-- Name: idx_ss_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ss_group ON public.student_surveys USING btree (group_id);


--
-- Name: idx_ss_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ss_student ON public.student_surveys USING btree (student_id);


--
-- Name: idx_ss_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ss_teacher ON public.student_surveys USING btree (teacher_id);


--
-- Name: idx_st_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_st_agent ON public.sales_targets USING btree (agent_id);


--
-- Name: idx_st_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_st_period ON public.sales_targets USING btree (year, month);


--
-- Name: idx_students_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_branch ON public.students USING btree (branch_id);


--
-- Name: idx_students_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_number ON public.students USING btree (student_number);


--
-- Name: idx_students_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_status ON public.students USING btree (status);


--
-- Name: idx_students_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_user ON public.students USING btree (user_id);


--
-- Name: idx_sub_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sub_assignment ON public.submissions USING btree (assignment_id);


--
-- Name: idx_sub_graded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sub_graded_by ON public.submissions USING btree (graded_by);


--
-- Name: idx_sub_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sub_status ON public.submissions USING btree (status);


--
-- Name: idx_sub_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sub_student ON public.submissions USING btree (student_id);


--
-- Name: idx_ta_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ta_available ON public.teacher_availabilities USING btree (is_available);


--
-- Name: idx_ta_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ta_day ON public.teacher_availabilities USING btree (day_of_week);


--
-- Name: idx_ta_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ta_employee ON public.teacher_availabilities USING btree (employee_id);


--
-- Name: idx_te_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_te_group ON public.teacher_evaluations USING btree (group_id);


--
-- Name: idx_te_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_te_student ON public.teacher_evaluations USING btree (student_id);


--
-- Name: idx_te_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_te_teacher ON public.teacher_evaluations USING btree (teacher_id);


--
-- Name: idx_test_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_featured ON public.testimonials USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_test_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_rating ON public.testimonials USING btree (rating);


--
-- Name: idx_test_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_status ON public.testimonials USING btree (status);


--
-- Name: idx_tq_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tq_active ON public.test_questions USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_tq_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tq_category ON public.test_questions USING btree (category);


--
-- Name: idx_tq_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tq_created_by ON public.test_questions USING btree (created_by);


--
-- Name: idx_tq_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tq_level ON public.test_questions USING btree (level);


--
-- Name: idx_tq_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tq_type ON public.test_questions USING btree (type);


--
-- Name: idx_ts_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ts_branch ON public.test_slots USING btree (branch_id);


--
-- Name: idx_ts_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ts_date ON public.test_slots USING btree (date);


--
-- Name: idx_ts_examiner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ts_examiner ON public.test_slots USING btree (examiner_id);


--
-- Name: idx_ts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ts_status ON public.test_slots USING btree (status);


--
-- Name: idx_users_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_branch ON public.users USING btree (branch_id);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_wl_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wl_active ON public.waitlists USING btree (status) WHERE ((status)::text = ANY ((ARRAY['waiting'::character varying, 'notified'::character varying])::text[]));


--
-- Name: idx_wl_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wl_branch ON public.waitlists USING btree (branch_id);


--
-- Name: idx_wl_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wl_course ON public.waitlists USING btree (course_id);


--
-- Name: idx_wl_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wl_priority ON public.waitlists USING btree (priority DESC);


--
-- Name: idx_wl_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wl_status ON public.waitlists USING btree (status);


--
-- Name: idx_wl_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wl_student ON public.waitlists USING btree (student_id);


--
-- Name: activities trg_activities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assignments trg_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: attendances trg_attendances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_attendances_updated_at BEFORE UPDATE ON public.attendances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blog_posts trg_blog_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: branches trg_branches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: certificate_templates trg_certificate_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_certificate_templates_updated_at BEFORE UPDATE ON public.certificate_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: certificates trg_certificates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_rooms trg_chat_rooms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions trg_check_classroom_conflict; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_classroom_conflict BEFORE INSERT OR UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.check_classroom_conflict();


--
-- Name: group_students trg_check_group_capacity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_group_capacity BEFORE INSERT ON public.group_students FOR EACH ROW EXECUTE FUNCTION public.check_group_capacity();


--
-- Name: refunds trg_check_refund_amount_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_refund_amount_limit BEFORE INSERT OR UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.check_refund_amount_limit();


--
-- Name: sessions trg_check_teacher_conflict; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_check_teacher_conflict BEFORE INSERT OR UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.check_teacher_conflict();


--
-- Name: courses trg_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: placement_tests trg_decrease_slot_booked; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_decrease_slot_booked AFTER DELETE ON public.placement_tests FOR EACH ROW EXECUTE FUNCTION public.decrease_test_slot_booked_count();


--
-- Name: employees trg_employees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: enrollments trg_enrollments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gradebook_entries trg_gradebook_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gradebook_entries_updated_at BEFORE UPDATE ON public.gradebook_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: groups trg_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inventory_items trg_inventory_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices trg_invoices_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_invoices_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();


--
-- Name: invoices trg_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kb_articles trg_kb_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_kb_articles_updated_at BEFORE UPDATE ON public.kb_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kb_categories trg_kb_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_kb_categories_updated_at BEFORE UPDATE ON public.kb_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads trg_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lms_lessons trg_lms_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lms_lessons_updated_at BEFORE UPDATE ON public.lms_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lms_modules trg_lms_modules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lms_modules_updated_at BEFORE UPDATE ON public.lms_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads trg_log_lead_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_lead_status_change AFTER UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();


--
-- Name: notification_preferences trg_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payments trg_payment_financial_log; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payment_financial_log AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.log_payment_transaction();


--
-- Name: payments trg_payments_receipt; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payments_receipt BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number();


--
-- Name: payroll_entries trg_payroll_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payroll_entries_updated_at BEFORE UPDATE ON public.payroll_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: placement_tests trg_placement_tests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_placement_tests_updated_at BEFORE UPDATE ON public.placement_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices trg_protect_invoice_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_invoice_total BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.protect_invoice_total_amount();


--
-- Name: quizzes trg_quizzes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: refunds trg_refund_financial_log; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_refund_financial_log AFTER INSERT ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.log_refund_transaction();


--
-- Name: settings trg_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stock_levels trg_stock_levels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_stock_levels_updated_at BEFORE UPDATE ON public.stock_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: student_profiles trg_student_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: students trg_students_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_students_number BEFORE INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION public.generate_student_number();


--
-- Name: students trg_students_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: submissions trg_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payments trg_sync_invoice_on_payment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_invoice_on_payment AFTER INSERT OR DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_financials();


--
-- Name: refunds trg_sync_invoice_on_refund; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_invoice_on_refund AFTER INSERT OR DELETE OR UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_financials();


--
-- Name: teacher_evaluations trg_teacher_evaluations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_teacher_evaluations_updated_at BEFORE UPDATE ON public.teacher_evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: placement_tests trg_update_slot_booked; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_slot_booked AFTER INSERT ON public.placement_tests FOR EACH ROW EXECUTE FUNCTION public.update_test_slot_booked_count();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: groups trg_verify_group_teacher; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_verify_group_teacher BEFORE INSERT OR UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.verify_group_teacher_role();


--
-- Name: activities fk_act_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT fk_act_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: activities fk_act_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT fk_act_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs fk_al_actor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fk_al_actor FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activity_photos fk_ap_activity; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_photos
    ADD CONSTRAINT fk_ap_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: activity_photos fk_ap_uploaded_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_photos
    ADD CONSTRAINT fk_ap_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activity_registrations fk_ar_activity; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT fk_ar_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: activity_registrations fk_ar_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT fk_ar_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: assignments fk_asgn_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT fk_asgn_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: assignments fk_asgn_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT fk_asgn_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: attendances fk_att_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT fk_att_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: attendances fk_att_session; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT fk_att_session FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: attendances fk_att_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: blog_posts fk_bp_author; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT fk_bp_author FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: branches fk_branches_manager; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT fk_branches_manager FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: certificates fk_cert_course; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT fk_cert_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT;


--
-- Name: certificates fk_cert_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT fk_cert_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE RESTRICT;


--
-- Name: certificates fk_cert_issued_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT fk_cert_issued_by FOREIGN KEY (issued_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: certificates fk_cert_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT fk_cert_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: certificates fk_cert_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT fk_cert_template FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON DELETE SET NULL;


--
-- Name: classrooms fk_classrooms_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT fk_classrooms_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: course_materials fk_cm_course; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT fk_cm_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_materials fk_cm_item; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT fk_cm_item FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- Name: chat_messages fk_cm_reply_to; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_cm_reply_to FOREIGN KEY (reply_to_id) REFERENCES public.chat_messages(id) ON DELETE SET NULL;


--
-- Name: chat_messages fk_cm_room; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_cm_room FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;


--
-- Name: chat_messages fk_cm_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_cm_sender FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: course_prerequisites fk_cp_course; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT fk_cp_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_prerequisites fk_cp_prereq; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT fk_cp_prereq FOREIGN KEY (prerequisite_course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: chat_rooms fk_cr_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT fk_cr_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_rooms fk_cr_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT fk_cr_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;


--
-- Name: chat_room_members fk_crm_room; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT fk_crm_room FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;


--
-- Name: chat_room_members fk_crm_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT fk_crm_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_strikes fk_cs_applied_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_strikes
    ADD CONSTRAINT fk_cs_applied_by FOREIGN KEY (applied_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_strikes fk_cs_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_strikes
    ADD CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_strikes fk_cs_violation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_strikes
    ADD CONSTRAINT fk_cs_violation FOREIGN KEY (violation_id) REFERENCES public.chat_violations(id) ON DELETE CASCADE;


--
-- Name: certificate_templates fk_ct_course; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT fk_ct_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: certificate_templates fk_ct_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT fk_ct_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_violations fk_cv_message; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT fk_cv_message FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;


--
-- Name: chat_violations fk_cv_moderator; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT fk_cv_moderator FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_violations fk_cv_room; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT fk_cv_room FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;


--
-- Name: chat_violations fk_cv_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT fk_cv_sender FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: employee_documents fk_ed_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT fk_ed_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employees fk_emp_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: enrollments fk_enr_enrolled_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enr_enrolled_by FOREIGN KEY (enrolled_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: enrollments fk_enr_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enr_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE RESTRICT;


--
-- Name: enrollments fk_enr_promo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enr_promo FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id) ON DELETE SET NULL;


--
-- Name: enrollments fk_enr_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enr_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: financial_transactions fk_ft_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT fk_ft_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: financial_transactions fk_ft_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT fk_ft_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: financial_transactions fk_ft_invoice; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT fk_ft_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: financial_transactions fk_ft_payment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT fk_ft_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;


--
-- Name: financial_transactions fk_ft_refund; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT fk_ft_refund FOREIGN KEY (refund_id) REFERENCES public.refunds(id) ON DELETE SET NULL;


--
-- Name: follow_ups fk_fu_assigned; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT fk_fu_assigned FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follow_ups fk_fu_lead; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT fk_fu_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: gradebook_categories fk_gc_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_categories
    ADD CONSTRAINT fk_gc_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: gradebook_categories fk_gc_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_categories
    ADD CONSTRAINT fk_gc_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: gradebook_entries fk_ge_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT fk_ge_category FOREIGN KEY (category_id) REFERENCES public.gradebook_categories(id) ON DELETE CASCADE;


--
-- Name: gradebook_entries fk_ge_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT fk_ge_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: gradebook_entries fk_ge_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT fk_ge_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: gradebook_entries fk_ge_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT fk_ge_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: groups fk_groups_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT fk_groups_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: groups fk_groups_course; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT fk_groups_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT;


--
-- Name: groups fk_groups_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT fk_groups_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: groups fk_groups_sub_teacher; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT fk_groups_sub_teacher FOREIGN KEY (substitute_teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: groups fk_groups_teacher; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT fk_groups_teacher FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: group_schedules fk_gs_classroom; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_schedules
    ADD CONSTRAINT fk_gs_classroom FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE SET NULL;


--
-- Name: group_students fk_gs_enrolled_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT fk_gs_enrolled_by FOREIGN KEY (enrolled_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: group_schedules fk_gs_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_schedules
    ADD CONSTRAINT fk_gs_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_students fk_gs_group_ref; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT fk_gs_group_ref FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_students fk_gs_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT fk_gs_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: installments fk_inst_invoice; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installments
    ADD CONSTRAINT fk_inst_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices fk_inv_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_inv_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: invoices fk_inv_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_inv_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invoices fk_inv_enrollment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_inv_enrollment FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE RESTRICT;


--
-- Name: invoices fk_inv_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_inv_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: invoice_items fk_invoice_item_course; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT fk_invoice_item_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: invoice_items fk_invoice_item_invoice; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT fk_invoice_item_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: kb_articles fk_ka_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT fk_ka_category FOREIGN KEY (category_id) REFERENCES public.kb_categories(id) ON DELETE RESTRICT;


--
-- Name: kb_articles fk_ka_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT fk_ka_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kb_articles fk_ka_updated_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT fk_ka_updated_by FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kb_article_versions fk_kav_article; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_article_versions
    ADD CONSTRAINT fk_kav_article FOREIGN KEY (article_id) REFERENCES public.kb_articles(id) ON DELETE CASCADE;


--
-- Name: kb_article_versions fk_kav_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_article_versions
    ADD CONSTRAINT fk_kav_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kb_categories fk_kbc_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_categories
    ADD CONSTRAINT fk_kbc_parent FOREIGN KEY (parent_id) REFERENCES public.kb_categories(id) ON DELETE SET NULL;


--
-- Name: lead_activities fk_la_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT fk_la_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lead_activities fk_la_lead; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT fk_la_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: leads fk_leads_assigned_to; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: leads fk_leads_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT fk_leads_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: lms_lessons fk_ll_module; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_lessons
    ADD CONSTRAINT fk_ll_module FOREIGN KEY (module_id) REFERENCES public.lms_modules(id) ON DELETE CASCADE;


--
-- Name: lms_modules fk_lm_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_modules
    ADD CONSTRAINT fk_lm_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lms_modules fk_lm_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_modules
    ADD CONSTRAINT fk_lm_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: leave_requests fk_lr_approved_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT fk_lr_approved_by FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: leave_requests fk_lr_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT fk_lr_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: lms_resources fk_lr_lesson; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_resources
    ADD CONSTRAINT fk_lr_lesson FOREIGN KEY (lesson_id) REFERENCES public.lms_lessons(id) ON DELETE CASCADE;


--
-- Name: lead_tags fk_lt_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT fk_lt_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: lead_tag_pivot fk_ltp_lead; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tag_pivot
    ADD CONSTRAINT fk_ltp_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_tag_pivot fk_ltp_tag; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tag_pivot
    ADD CONSTRAINT fk_ltp_tag FOREIGN KEY (tag_id) REFERENCES public.lead_tags(id) ON DELETE CASCADE;


--
-- Name: notifications fk_notif_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_preferences fk_np_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT fk_np_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments fk_pay_invoice; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE RESTRICT;


--
-- Name: payments fk_pay_recorded_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_pay_recorded_by FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: promo_codes fk_pc_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT fk_pc_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payroll_entries fk_pe_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT fk_pe_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: payroll_entries fk_pe_period; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT fk_pe_period FOREIGN KEY (payroll_period_id) REFERENCES public.payroll_periods(id) ON DELETE RESTRICT;


--
-- Name: payroll_periods fk_pp_closed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT fk_pp_closed_by FOREIGN KEY (closed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: placement_tests fk_pt_examiner; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT fk_pt_examiner FOREIGN KEY (examiner_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: placement_tests fk_pt_lead; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT fk_pt_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: placement_tests fk_pt_slot; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT fk_pt_slot FOREIGN KEY (slot_id) REFERENCES public.test_slots(id) ON DELETE RESTRICT;


--
-- Name: placement_tests fk_pt_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT fk_pt_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: placement_test_answers fk_pta_question; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_answers
    ADD CONSTRAINT fk_pta_question FOREIGN KEY (question_id) REFERENCES public.test_questions(id) ON DELETE RESTRICT;


--
-- Name: placement_test_answers fk_pta_test; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_answers
    ADD CONSTRAINT fk_pta_test FOREIGN KEY (test_id) REFERENCES public.placement_tests(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts fk_qa_graded_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT fk_qa_graded_by FOREIGN KEY (graded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quiz_attempts fk_qa_quiz; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT fk_qa_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts fk_qa_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT fk_qa_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: quiz_questions fk_qq_bank; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT fk_qq_bank FOREIGN KEY (bank_question_id) REFERENCES public.test_questions(id) ON DELETE SET NULL;


--
-- Name: quiz_questions fk_qq_quiz; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT fk_qq_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quizzes fk_quiz_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT fk_quiz_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quizzes fk_quiz_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT fk_quiz_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: refunds fk_ref_approved_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_ref_approved_by FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: refunds fk_ref_invoice; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_ref_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE RESTRICT;


--
-- Name: referrals fk_ref_lead; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT fk_ref_lead FOREIGN KEY (referred_lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: refunds fk_ref_payment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_ref_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT;


--
-- Name: refunds fk_ref_processed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_ref_processed_by FOREIGN KEY (processed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: referrals fk_ref_referred_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT fk_ref_referred_student FOREIGN KEY (referred_student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: referrals fk_ref_referrer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT fk_ref_referrer FOREIGN KEY (referrer_student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: role_permissions fk_rp_permission; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions fk_rp_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: sessions fk_sessions_classroom; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_sessions_classroom FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE SET NULL;


--
-- Name: sessions fk_sessions_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_sessions_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: student_item_issues fk_sii_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT fk_sii_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: student_item_issues fk_sii_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT fk_sii_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: student_item_issues fk_sii_item; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT fk_sii_item FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;


--
-- Name: student_item_issues fk_sii_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT fk_sii_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: stock_levels fk_sl_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT fk_sl_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: stock_levels fk_sl_item; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT fk_sl_item FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- Name: student_level_history fk_slh_changed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_level_history
    ADD CONSTRAINT fk_slh_changed_by FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: student_level_history fk_slh_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_level_history
    ADD CONSTRAINT fk_slh_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: stock_moves fk_sm_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_moves
    ADD CONSTRAINT fk_sm_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: stock_moves fk_sm_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_moves
    ADD CONSTRAINT fk_sm_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: stock_moves fk_sm_item; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_moves
    ADD CONSTRAINT fk_sm_item FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;


--
-- Name: student_profiles fk_sp_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT fk_sp_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_surveys fk_ss_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_surveys
    ADD CONSTRAINT fk_ss_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: student_surveys fk_ss_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_surveys
    ADD CONSTRAINT fk_ss_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_surveys fk_ss_teacher; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_surveys
    ADD CONSTRAINT fk_ss_teacher FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sales_targets fk_st_agent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT fk_st_agent FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: students fk_students_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_students_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: students fk_students_placement_test; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_students_placement_test FOREIGN KEY (placement_test_id) REFERENCES public.placement_tests(id) ON DELETE SET NULL;


--
-- Name: students fk_students_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: submissions fk_sub_assignment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fk_sub_assignment FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: submissions fk_sub_graded_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fk_sub_graded_by FOREIGN KEY (graded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: submissions fk_sub_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fk_sub_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: teacher_availabilities fk_ta_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_availabilities
    ADD CONSTRAINT fk_ta_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: teacher_evaluations fk_te_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_evaluations
    ADD CONSTRAINT fk_te_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: teacher_evaluations fk_te_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_evaluations
    ADD CONSTRAINT fk_te_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: teacher_evaluations fk_te_teacher; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_evaluations
    ADD CONSTRAINT fk_te_teacher FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: testimonials fk_test_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT fk_test_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: test_questions fk_tq_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT fk_tq_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: test_slots fk_ts_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_slots
    ADD CONSTRAINT fk_ts_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: test_slots fk_ts_examiner; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_slots
    ADD CONSTRAINT fk_ts_examiner FOREIGN KEY (examiner_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: user_roles fk_ur_assigned_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_ur_assigned_by FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_roles fk_ur_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_ur_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users fk_users_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: waitlists fk_wl_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT fk_wl_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: waitlists fk_wl_course; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT fk_wl_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: waitlists fk_wl_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT fk_wl_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict JCLUd03cxeEBJOXhVadQt0zs6TclLAvxWfnxia1wj66OmzSw2HkV1spwq3oggAV

