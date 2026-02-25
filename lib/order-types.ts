export type OrderItem = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  items: OrderItem[];
  created_at?: string;
};
