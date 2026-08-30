export type BBox = {
  page: number; // 0-based page index within the given document's page image array
  x: number; // top-left x, percentage 0-100 of page image width
  y: number; // top-left y, percentage 0-100 of page image height
  w: number; // width, percentage 0-100
  h: number; // height, percentage 0-100
};

export type Question = {
  id: string;
  number: string; // exact printed numbering, e.g. "11(a)"
  text: string;
  page: number;
  bbox: BBox;
  maxMarks?: number;
};

export type AnswerSegment = {
  id: string;
  matchedQuestionNumber: string | null;
  text: string;
  regions: BBox[];
};

export type MappingStatus = "answered" | "unanswered" | "out_of_order";

export type QuestionMapping = {
  question: Question;
  status: MappingStatus;
  answer?: AnswerSegment;
};

export type GradeResult = {
  questionNumber: string;
  marksAwarded: number;
  maxMarks: number;
  verdict: "correct" | "partial" | "incorrect" | "ungraded";
  feedback: string;
};

export type GradingSummary = {
  totalAwarded: number;
  totalMax: number;
  overallFeedback: string;
  perQuestion: GradeResult[];
};

export type PageImage = {
  page: number;
  dataUrl: string; // base64 PNG data URL
  width: number;
  height: number;
};

export type ProcessingStage =
  | "idle"
  | "rasterizing"
  | "extracting_questions"
  | "extracting_answers"
  | "mapping"
  | "grading"
  | "done"
  | "error";
