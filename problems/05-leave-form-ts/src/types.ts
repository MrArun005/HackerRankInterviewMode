export interface LeaveRequest {
  startDate: string;   // yyyy-mm-dd
  endDate: string;     // yyyy-mm-dd
  reason: string;
}

/** A message per invalid field. A valid request produces an empty object. */
export type FieldErrors = Partial<Record<keyof LeaveRequest, string>>;

export const MAX_DAYS = 30;
export const MIN_REASON = 10;
