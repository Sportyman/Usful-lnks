export interface Coupon {
  id: string;
  code: string;
  discount: string;
  minSpend: string;
  description: string;
  month: string;
  year: string;
  event: string;
  date_added: string;
  expiry_date?: string;
  status: 'active' | 'upcoming';
  start_date?: string;
}
