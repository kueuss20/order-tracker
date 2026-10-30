import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, input, signal } from '@angular/core';
import { Customer, Order } from '../models';

@Component({
  imports: [],
  selector: 'app-order-detail',
  styleUrl: './order-detail.css',
  templateUrl: './order-detail.html',
})
export class OrderDetail {


  orderId=input<string|undefined>(undefined);

  orderResource = httpResource<Order>(()=>{
    const id = this.orderId();
    return id ? `/api/orders/${id}` : undefined;

  });
  readonly orderErrorStatus = computed(() => {
    const err = this.orderResource.error();
    return err instanceof HttpErrorResponse ? err.status : undefined;
  });
  readonly customerResource = httpResource<Customer>(() => {
    if (!this.orderResource.hasValue()) {
      return undefined;
    }
    const order = this.orderResource.value();
    if (!order?.customerId) {
      return undefined;
    }
    return `/api/customers/${order.customerId}`;
  });
}
