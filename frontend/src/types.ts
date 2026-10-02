export interface User { id: number; name: string; role: 'user' | 'admin'; }
export interface EventItem {
  id: number; title: string; description: string; event_date: string;
  image_url: string; max_participants: number; approved_count: number;
}
export interface Notice { id: number; message: string; is_read: number; created_at: string; }
export type Status = 'pending' | 'approved' | 'rejected';
