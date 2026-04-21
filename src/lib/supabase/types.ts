export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anonymous_chat_sessions: {
        Row: {
          conversation: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          ip_hash: string | null
          last_message_at: string | null
          message_count: number | null
          session_id: string
        }
        Insert: {
          conversation?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_hash?: string | null
          last_message_at?: string | null
          message_count?: number | null
          session_id: string
        }
        Update: {
          conversation?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_hash?: string | null
          last_message_at?: string | null
          message_count?: number | null
          session_id?: string
        }
        Relationships: []
      }
      appointment_attendance: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          late_minutes: number | null
          marked_at: string | null
          marked_by: string | null
          professional_id: string
          professional_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          late_minutes?: number | null
          marked_at?: string | null
          marked_by?: string | null
          professional_id: string
          professional_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          late_minutes?: number | null
          marked_at?: string | null
          marked_by?: string | null
          professional_id?: string
          professional_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_attendance_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_attendance_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "appointment_attendance_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_attendance_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_notifications: {
        Row: {
          appointment_id: string
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          professional_id: string
          professional_user_id: string
          provider_message_id: string | null
          rule_id: string | null
          sent_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          professional_id: string
          professional_user_id: string
          provider_message_id?: string | null
          rule_id?: string | null
          sent_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          professional_id?: string
          professional_user_id?: string
          provider_message_id?: string | null
          rule_id?: string | null
          sent_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "appointment_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_notifications_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "reminder_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_ratings: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string
          id: string
          professional_id: string
          professional_user_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id: string
          professional_user_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          professional_user_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_ratings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "appointment_ratings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_ratings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          cancellation_notify_patient: boolean | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          consultation_type: string
          created_at: string | null
          created_by_user_id: string | null
          created_via: string
          date_time: string | null
          decided_at: string | null
          decided_by: string | null
          duration_minutes: number
          id: string
          location: string | null
          notes: string | null
          patient_id: string | null
          patient_user_id: string | null
          payment_status: string | null
          price: number | null
          professional_id: string
          professional_user_id: string
          rejection_reason: string | null
          service_id: string | null
          status: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          cancellation_notify_patient?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          consultation_type: string
          created_at?: string | null
          created_by_user_id?: string | null
          created_via?: string
          date_time?: string | null
          decided_at?: string | null
          decided_by?: string | null
          duration_minutes: number
          id?: string
          location?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_user_id?: string | null
          payment_status?: string | null
          price?: number | null
          professional_id: string
          professional_user_id: string
          rejection_reason?: string | null
          service_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          cancellation_notify_patient?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          consultation_type?: string
          created_at?: string | null
          created_by_user_id?: string | null
          created_via?: string
          date_time?: string | null
          decided_at?: string | null
          decided_by?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_user_id?: string | null
          payment_status?: string | null
          price?: number | null
          professional_id?: string
          professional_user_id?: string
          rejection_reason?: string | null
          service_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_blocked: boolean | null
          is_recurring: boolean | null
          professional_id: string
          professional_user_id: string | null
          specific_date: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_blocked?: boolean | null
          is_recurring?: boolean | null
          professional_id: string
          professional_user_id?: string | null
          specific_date?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_blocked?: boolean | null
          is_recurring?: boolean | null
          professional_id?: string
          professional_user_id?: string | null
          specific_date?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_calendars: {
        Row: {
          color: string | null
          connection_id: string
          created_at: string
          external_calendar_id: string
          id: string
          is_primary: boolean
          name: string
          professional_user_id: string
          selected: boolean
          timezone: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          connection_id: string
          created_at?: string
          external_calendar_id: string
          id?: string
          is_primary?: boolean
          name: string
          professional_user_id: string
          selected?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          connection_id?: string
          created_at?: string
          external_calendar_id?: string
          id?: string
          is_primary?: boolean
          name?: string
          professional_user_id?: string
          selected?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_calendars_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token_encrypted: string
          account_email: string
          created_at: string
          expires_at: string
          id: string
          professional_id: string
          professional_user_id: string
          provider: string
          refresh_token_encrypted: string
          revoked_at: string | null
          scopes: string[]
          updated_at: string
        }
        Insert: {
          access_token_encrypted: string
          account_email: string
          created_at?: string
          expires_at: string
          id?: string
          professional_id: string
          professional_user_id: string
          provider: string
          refresh_token_encrypted: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string
          account_email?: string
          created_at?: string
          expires_at?: string
          id?: string
          professional_id?: string
          professional_user_id?: string
          provider?: string
          refresh_token_encrypted?: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "calendar_connections_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_connections_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_state: {
        Row: {
          calendar_id: string
          created_at: string
          delta_link: string | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          professional_user_id: string
          provider: string
          sync_token: string | null
          updated_at: string
        }
        Insert: {
          calendar_id: string
          created_at?: string
          delta_link?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          professional_user_id: string
          provider: string
          sync_token?: string | null
          updated_at?: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          delta_link?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          professional_user_id?: string
          provider?: string
          sync_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_state_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: true
            referencedRelation: "calendar_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_notes: {
        Row: {
          appointment_id: string
          content: string
          created_at: string
          follow_up_needed: boolean
          follow_up_suggested_date: string | null
          id: string
          patient_id: string
          professional_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          content: string
          created_at?: string
          follow_up_needed?: boolean
          follow_up_suggested_date?: string | null
          id?: string
          patient_id: string
          professional_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          content?: string
          created_at?: string
          follow_up_needed?: boolean
          follow_up_suggested_date?: string | null
          id?: string
          patient_id?: string
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "consultation_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pages: {
        Row: {
          content_en: string
          content_fr: string | null
          content_pt: string
          created_at: string | null
          id: string
          is_published: boolean | null
          meta_description_en: string | null
          meta_description_fr: string | null
          meta_description_pt: string | null
          slug: string
          title_en: string
          title_fr: string | null
          title_pt: string
          updated_at: string | null
        }
        Insert: {
          content_en: string
          content_fr?: string | null
          content_pt: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description_en?: string | null
          meta_description_fr?: string | null
          meta_description_pt?: string | null
          slug: string
          title_en: string
          title_fr?: string | null
          title_pt: string
          updated_at?: string | null
        }
        Update: {
          content_en?: string
          content_fr?: string | null
          content_pt?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description_en?: string | null
          meta_description_fr?: string | null
          meta_description_pt?: string | null
          slug?: string
          title_en?: string
          title_fr?: string | null
          title_pt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          appointment_id: string | null
          category: string
          created_at: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          patient_id: string
          patient_user_id: string | null
          professional_id: string | null
          professional_user_id: string | null
          title: string
          uploaded_by: string
        }
        Insert: {
          appointment_id?: string | null
          category: string
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          patient_id: string
          patient_user_id?: string | null
          professional_id?: string | null
          professional_user_id?: string | null
          title: string
          uploaded_by: string
        }
        Update: {
          appointment_id?: string | null
          category?: string
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          patient_id?: string
          patient_user_id?: string | null
          professional_id?: string | null
          professional_user_id?: string | null
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      external_calendar_events: {
        Row: {
          all_day: boolean
          calendar_id: string
          description: string | null
          ends_at: string
          external_calendar_id: string
          external_event_id: string
          id: string
          last_synced_at: string
          location: string | null
          organizer: string | null
          professional_user_id: string
          provider: string
          raw: Json | null
          starts_at: string
          status: string
          title: string
        }
        Insert: {
          all_day?: boolean
          calendar_id: string
          description?: string | null
          ends_at: string
          external_calendar_id: string
          external_event_id: string
          id?: string
          last_synced_at?: string
          location?: string | null
          organizer?: string | null
          professional_user_id: string
          provider: string
          raw?: Json | null
          starts_at: string
          status?: string
          title?: string
        }
        Update: {
          all_day?: boolean
          calendar_id?: string
          description?: string | null
          ends_at?: string
          external_calendar_id?: string
          external_event_id?: string
          id?: string
          last_synced_at?: string
          location?: string | null
          organizer?: string | null
          professional_user_id?: string
          provider?: string
          raw?: Json | null
          starts_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_calendar_events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendar_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer_en: string
          answer_fr: string | null
          answer_pt: string
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_published: boolean | null
          question_en: string
          question_fr: string | null
          question_pt: string
          updated_at: string | null
        }
        Insert: {
          answer_en: string
          answer_fr?: string | null
          answer_pt: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question_en: string
          question_fr?: string | null
          question_pt: string
          updated_at?: string | null
        }
        Update: {
          answer_en?: string
          answer_fr?: string | null
          answer_pt?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question_en?: string
          question_fr?: string | null
          question_pt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      insurance_providers: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          is_global: boolean
          locale: string
          name: string
          professional_id: string | null
          professional_user_id: string | null
          subject: string | null
          timing_key: string | null
          type: string
          updated_at: string
        }
        Insert: {
          channel: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_global?: boolean
          locale?: string
          name: string
          professional_id?: string | null
          professional_user_id?: string | null
          subject?: string | null
          timing_key?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_global?: boolean
          locale?: string
          name?: string
          professional_id?: string | null
          professional_user_id?: string | null
          subject?: string | null
          timing_key?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "message_templates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          params: Json | null
          read_at: string | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          params?: Json | null
          read_at?: string | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          params?: Json | null
          read_at?: string | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_favorites: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          patient_user_id: string | null
          professional_id: string
          professional_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          patient_user_id?: string | null
          professional_id: string
          professional_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          patient_user_id?: string | null
          professional_id?: string
          professional_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_favorites_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "patient_favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_settings: {
        Row: {
          appointment_reminders: boolean
          created_at: string
          dark_mode: boolean
          date_format: string
          email_notifications: boolean
          id: string
          marketing_emails: boolean
          public_profile: boolean
          reminder_frequency: string
          sms_notifications: boolean
          theme_preference: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean
          created_at?: string
          dark_mode?: boolean
          date_format?: string
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          public_profile?: boolean
          reminder_frequency?: string
          sms_notifications?: boolean
          theme_preference?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean
          created_at?: string
          dark_mode?: boolean
          date_format?: string
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          public_profile?: boolean
          reminder_frequency?: string
          sms_notifications?: boolean
          theme_preference?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          absence_count: number
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string | null
          created_by_professional_id: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string | null
          gender: string | null
          id: string
          insurance_number: string | null
          insurance_provider: string | null
          insurance_provider_id: string | null
          languages_spoken: string[] | null
          last_name: string | null
          last_visit_at: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          absence_count?: number
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          created_by_professional_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          insurance_provider_id?: string | null
          languages_spoken?: string[] | null
          last_name?: string | null
          last_visit_at?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          absence_count?: number
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          created_by_professional_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          insurance_provider_id?: string | null
          languages_spoken?: string[] | null
          last_name?: string | null
          last_visit_at?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_professional_id_fkey"
            columns: ["created_by_professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "patients_created_by_professional_id_fkey"
            columns: ["created_by_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_created_by_professional_id_fkey"
            columns: ["created_by_professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_insurance_provider_id_fkey"
            columns: ["insurance_provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string | null
          id: string
          paid_at: string | null
          patient_id: string
          patient_user_id: string | null
          payment_method: string | null
          professional_id: string
          professional_user_id: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          patient_id: string
          patient_user_id?: string | null
          payment_method?: string | null
          professional_id: string
          professional_user_id?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          patient_id?: string
          patient_user_id?: string | null
          payment_method?: string | null
          professional_id?: string
          professional_user_id?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "payments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_hidden_patients: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          professional_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          professional_id: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_hidden_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_hidden_patients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "professional_hidden_patients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_hidden_patients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_insurances: {
        Row: {
          created_at: string | null
          id: string
          insurance_provider_id: string
          professional_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          insurance_provider_id: string
          professional_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          insurance_provider_id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_insurances_insurance_provider_id_fkey"
            columns: ["insurance_provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_insurances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "professional_insurances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_insurances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_settings: {
        Row: {
          auto_confirm: boolean
          channel_email: boolean
          channel_sms: boolean
          created_at: string
          default_duration_minutes: number
          min_booking_hours: number
          notify_cancellations: boolean
          notify_new_appointments: boolean
          notify_reminders: boolean
          notify_sound: boolean
          patient_reminders: boolean
          theme_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_confirm?: boolean
          channel_email?: boolean
          channel_sms?: boolean
          created_at?: string
          default_duration_minutes?: number
          min_booking_hours?: number
          notify_cancellations?: boolean
          notify_new_appointments?: boolean
          notify_reminders?: boolean
          notify_sound?: boolean
          patient_reminders?: boolean
          theme_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_confirm?: boolean
          channel_email?: boolean
          channel_sms?: boolean
          created_at?: string
          default_duration_minutes?: number
          min_booking_hours?: number
          notify_cancellations?: boolean
          notify_new_appointments?: boolean
          notify_reminders?: boolean
          notify_sound?: boolean
          patient_reminders?: boolean
          theme_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          accessibility_options: Json | null
          address: string | null
          bio: string | null
          bio_en: string | null
          bio_fr: string | null
          bio_pt: string | null
          cabinet_name: string | null
          city: string | null
          consultation_fee: number | null
          created_at: string | null
          id: string
          insurances_accepted: string[] | null
          languages_spoken: string[] | null
          latitude: number | null
          license_verified: boolean | null
          longitude: number | null
          neighborhood: string | null
          office_hours: Json | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          postal_code: string | null
          practice_situation: string | null
          practice_type: string | null
          rating: number | null
          registration_number: string
          specialty: string
          subspecialties: string[] | null
          third_party_payment: boolean | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          years_experience: number | null
        }
        Insert: {
          accessibility_options?: Json | null
          address?: string | null
          bio?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          bio_pt?: string | null
          cabinet_name?: string | null
          city?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          id?: string
          insurances_accepted?: string[] | null
          languages_spoken?: string[] | null
          latitude?: number | null
          license_verified?: boolean | null
          longitude?: number | null
          neighborhood?: string | null
          office_hours?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          postal_code?: string | null
          practice_situation?: string | null
          practice_type?: string | null
          rating?: number | null
          registration_number: string
          specialty: string
          subspecialties?: string[] | null
          third_party_payment?: boolean | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          years_experience?: number | null
        }
        Update: {
          accessibility_options?: Json | null
          address?: string | null
          bio?: string | null
          bio_en?: string | null
          bio_fr?: string | null
          bio_pt?: string | null
          cabinet_name?: string | null
          city?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          id?: string
          insurances_accepted?: string[] | null
          languages_spoken?: string[] | null
          latitude?: number | null
          license_verified?: boolean | null
          longitude?: number | null
          neighborhood?: string | null
          office_hours?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          postal_code?: string | null
          practice_situation?: string | null
          practice_type?: string | null
          rating?: number | null
          registration_number?: string
          specialty?: string
          subspecialties?: string[] | null
          third_party_payment?: boolean | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_rules: {
        Row: {
          channel: string
          created_at: string
          delay_unit: string
          delay_value: number
          exclude_weekends: boolean
          id: string
          is_enabled: boolean
          only_if_not_confirmed: boolean
          professional_id: string
          professional_user_id: string
          template_id: string | null
          trigger_moment: string
          type: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          delay_unit?: string
          delay_value?: number
          exclude_weekends?: boolean
          id?: string
          is_enabled?: boolean
          only_if_not_confirmed?: boolean
          professional_id: string
          professional_user_id: string
          template_id?: string | null
          trigger_moment?: string
          type: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          delay_unit?: string
          delay_value?: number
          exclude_weekends?: boolean
          id?: string
          is_enabled?: boolean
          only_if_not_confirmed?: boolean
          professional_id?: string
          professional_user_id?: string
          template_id?: string | null
          trigger_moment?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "reminder_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          appointment_id: string
          created_at: string
          declined: boolean
          id: string
          opened_at: string | null
          patient_id: string
          sent_at: string
          token: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          declined?: boolean
          id?: string
          opened_at?: string | null
          patient_id: string
          sent_at?: string
          token?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          declined?: boolean
          id?: string
          opened_at?: string | null
          patient_id?: string
          sent_at?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_anonymous: boolean
          moderated_at: string | null
          moderated_by: string | null
          patient_id: string | null
          patient_user_id: string | null
          professional_id: string
          professional_reply: string | null
          professional_user_id: string | null
          rating: number
          rating_clarity: number | null
          rating_listening: number | null
          rating_punctuality: number | null
          replied_at: string | null
          status: string
          updated_at: string
          would_recommend: boolean | null
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          patient_id?: string | null
          patient_user_id?: string | null
          professional_id: string
          professional_reply?: string | null
          professional_user_id?: string | null
          rating: number
          rating_clarity?: number | null
          rating_listening?: number | null
          rating_punctuality?: number | null
          replied_at?: string | null
          status?: string
          updated_at?: string
          would_recommend?: boolean | null
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          patient_id?: string | null
          patient_user_id?: string | null
          professional_id?: string
          professional_reply?: string | null
          professional_user_id?: string | null
          rating?: number
          rating_clarity?: number | null
          rating_listening?: number | null
          rating_punctuality?: number | null
          replied_at?: string | null
          status?: string
          updated_at?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          consultation_type: string
          created_at: string | null
          description: string | null
          description_en: string | null
          description_fr: string | null
          description_pt: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          name_fr: string | null
          name_pt: string | null
          price: number
          professional_id: string
          professional_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          consultation_type: string
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_pt?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          name_fr?: string | null
          name_pt?: string | null
          price: number
          professional_id: string
          professional_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          consultation_type?: string
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_pt?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          name_fr?: string | null
          name_pt?: string | null
          price?: number
          professional_id?: string
          professional_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          awaiting_confirmation_at: string | null
          closed_at: string | null
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          priority: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          awaiting_confirmation_at?: string | null
          closed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          awaiting_confirmation_at?: string | null
          closed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender_id: string | null
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          language: string | null
          last_name: string
          phone: string | null
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          language?: string | null
          last_name: string
          phone?: string | null
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          language?: string | null
          last_name?: string
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      platform_stats: {
        Row: {
          appointments_this_month: number | null
          open_tickets: number | null
          pending_professionals: number | null
          revenue_this_month: number | null
          total_completed_appointments: number | null
          total_patients: number | null
          total_professionals: number | null
          upcoming_appointments: number | null
          verified_professionals: number | null
        }
        Relationships: []
      }
      professional_monthly_stats: {
        Row: {
          cancelled_appointments: number | null
          completed_appointments: number | null
          completion_rate: number | null
          month: string | null
          no_show_appointments: number | null
          professional_id: string | null
          professional_name: string | null
          specialty: string | null
          total_appointments: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      professional_ratings_detail: {
        Row: {
          appointment_date: string | null
          comment: string | null
          created_at: string | null
          id: string | null
          patient_identifier: string | null
          professional_id: string | null
          professional_user_id: string | null
          rating: number | null
          service_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_ratings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_monthly_stats"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "appointment_ratings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_ratings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "top_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      top_professionals: {
        Row: {
          average_rating: number | null
          city: string | null
          id: string | null
          name: string | null
          rating: number | null
          specialty: string | null
          total_appointments: number | null
          total_reviews: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      book_appointment_atomic: {
        Args: {
          p_appointment_date: string
          p_appointment_time: string
          p_consultation_type: string
          p_created_via?: string
          p_duration_minutes: number
          p_notes?: string
          p_patient_id: string
          p_patient_user_id: string
          p_price: number
          p_professional_id: string
          p_professional_user_id: string
          p_service_id: string
        }
        Returns: string
      }
      calculate_attendance_rate: { Args: { prof_id: string }; Returns: number }
      create_availability_slot: {
        Args: {
          p_day_of_week: number
          p_end_time: string
          p_is_recurring?: boolean
          p_professional_id: string
          p_specific_date?: string
          p_start_time: string
        }
        Returns: Json
      }
      create_patient_for_pro: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_phone?: string
        }
        Returns: Json
      }
      decrypt_token: {
        Args: { p_encrypted: string; p_key: string }
        Returns: string
      }
      duplicate_global_templates_for_pro: {
        Args: { p_professional_id: string; p_professional_user_id: string }
        Returns: number
      }
      encrypt_token: {
        Args: { p_key: string; p_token: string }
        Returns: string
      }
      get_admin_id: { Args: never; Returns: string }
      get_available_slots: {
        Args: { p_date: string; p_professional_id: string }
        Returns: {
          slot_end: string
          slot_start: string
        }[]
      }
      get_hidden_patient_ids: {
        Args: { p_professional_id: string }
        Returns: {
          patient_id: string
        }[]
      }
      get_next_available_slot: {
        Args: { p_professional_id: string }
        Returns: string
      }
      get_pro_dashboard_stats: {
        Args: {
          p_created_via?: string
          p_from_date?: string
          p_professional_id: string
          p_service_id?: string
          p_to_date?: string
        }
        Returns: Json
      }
      get_pro_patient_count: {
        Args: { p_professional_id: string }
        Returns: number
      }
      get_pro_statistics: {
        Args: {
          p_from_date?: string
          p_professional_id: string
          p_to_date?: string
        }
        Returns: Json
      }
      get_professional_rating_stats: {
        Args: { professional_uuid: string }
        Returns: Json
      }
      hide_patient_for_pro: {
        Args: { p_patient_id: string; p_professional_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_professional: { Args: never; Returns: boolean }
      promote_to_admin: { Args: { target_email: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
