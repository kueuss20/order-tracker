
export type OrderStatus='PENDING'|'SHIPPED'|'PAID';

export interface Order{
  id:string;
  customerId:string;
  status:OrderStatus;
  total:number;
}
export interface Customer{
  id:string;
  name:string;
}

export interface Product{
  sku:string;
  name:string;
  price:number;
}