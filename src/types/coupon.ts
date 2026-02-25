export interface Coupon {
  id: string;
  code: string;
  discount: string;
  minSpend: string;
  description: string;
  sourceUrl: string;
  createdAt: any;
  expiresAt?: any;
}
