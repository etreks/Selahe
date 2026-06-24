export type Action = {
  id: string;
  user_id: string;
  title: string | null;
  color: string | null;
  created_at: string;
  archived_at: string | null;
};

export type CardVersion = {
  id: string;
  action_id: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  duration_minutes: number | null;
  days_of_week: number[];
  why_text: string | null;
  is_active: boolean;
  superseded_by_id: string | null;
  created_at: string;
};

export type Punch = {
  id: string;
  action_id: string;
  card_version_id: string;
  punched_at: string;
  scheduled_date: string;
};

export type MessageRole = "user" | "assistant" | "system";
export type MessageType =
  | "dialogue"
  | "card_created"
  | "card_updated"
  | "auto_log"
  | "saved_notification";

export type Message = {
  id: string;
  action_id: string;
  role: MessageRole;
  content: string;
  message_type: MessageType;
  card_version_id: string | null;
  punch_id: string | null;
  created_at: string;
};

export type CardState = "draft" | "scheduled" | "completed";

// A card with its parent action joined in — what the UI renders.
export type CardWithAction = CardVersion & {
  action: Action;
};

export type ProposedCard = {
  type: "propose_card";
  title: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  duration_minutes: number | null;
  days_of_week: number[];
  why_text: string;
};
