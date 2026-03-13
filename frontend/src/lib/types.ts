// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user_id: string;
  email: string;
}

export interface TeacherProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

// ── Students ─────────────────────────────────────────────────────────────────

export interface StudentCreate {
  first_name: string;
  last_name: string;
  student_code?: string;
}

export interface StudentUpdate {
  first_name?: string;
  last_name?: string;
  student_code?: string;
}

export interface StudentProfileUpdate {
  profile_data: Record<string, number>;
}

export interface StudentListItem {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string | null;
  has_prediction: boolean;
  last_updated: string;
}

export interface StudentResponse {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
  student_code: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  profile: Record<string, number> | null;
  latest_prediction: PredictionResponse | null;
  latest_explanation: ExplanationResponse | null;
}

export interface ValidationResponse {
  is_valid: boolean;
  is_ready: boolean;
  filled_fields: string[];
  missing_fields: string[];
  missing_required: string[];
  warnings: string[];
  filled_count: number;
  total_required: number;
}

// ── Predictions ──────────────────────────────────────────────────────────────

export interface PredictionResult {
  ridge_score: number;
  xgb_score: number;
  features_used: string[];
}

export interface PredictionResponse {
  id: string;
  student_id: string;
  prediction_result: PredictionResult;
  model_version: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  created_by: string;
}

export interface PredictionHistoryResponse {
  predictions: PredictionResponse[];
  count: number;
}

// ── Explanations ─────────────────────────────────────────────────────────────

export interface FeatureImpact {
  name: string;
  value: number;
  impact: number;
}

export interface ExplanationResponse {
  id: string;
  prediction_id: string;
  explanation_data: {
    base_value: number;
    xgb_score: number;
    feature_impacts: FeatureImpact[];
  };
  top_positive_factors: FeatureImpact[];
  top_negative_factors: FeatureImpact[];
  created_at: string;
}

export interface ExplanationHistoryResponse {
  explanations: ExplanationResponse[];
  count: number;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  student_id: string;
  teacher_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatRequest {
  student_id: string;
  message: string;
}

// ── Notes ────────────────────────────────────────────────────────────────────

export interface NoteCreate {
  content: string;
}

export interface NoteResponse {
  id: string;
  student_id: string;
  teacher_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ── Summaries ───────────────────────────────────────────────────────────────

export interface SummaryResponse {
  id: string;
  student_id: string;
  summary_text: string;
  generated_from: string;
  created_at: string;
}

// ── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { message: string; missing_fields?: string[] };
}
