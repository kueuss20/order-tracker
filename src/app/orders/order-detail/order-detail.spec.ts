import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OrderDetail } from './order-detail';
import { ApplicationRef } from '@angular/core';

describe('OrderDetail', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderDetail],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // (a) no request while orderId is undefined
  it('sends no request at all while orderId is undefined', async () => {
    const fixture = TestBed.createComponent(OrderDetail);
    fixture.componentRef.setInput('orderId', undefined);
    await fixture.whenStable();

    expect(httpMock.match(() => true).length).toBe(0);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="order-idle"]')).toBeTruthy();
  });

  // (b) order error shows error view, nothing throws
  it('renders error view without throwing', async () => {
    const fixture = TestBed.createComponent(OrderDetail);
    fixture.componentRef.setInput('orderId', '1');

    TestBed.tick();
    const pending = httpMock.match('/api/orders/1');
expect(pending.length, `pending: ${pending.map(r => r.request.url).join(', ')}`).toBe(1);
pending[0].flush(null, { status: 500, statusText: 'Server Error' });

await fixture.whenStable();
console.log('error():', fixture.componentInstance.orderResource.error());

    TestBed.tick();
   
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="order-error"]')!.textContent).toContain('500');
    expect(el.querySelector('[data-testid="order-status"]')).toBeNull();
    expect(el.querySelector('[data-testid="order-total"]')).toBeNull();
  });

  // (c) customer request fires only after order resolves, exactly once
  it('does not request customer until order resolves, then exactly once', async () => {
    const fixture = TestBed.createComponent(OrderDetail);
    fixture.componentRef.setInput('orderId', '1');
   
    TestBed.tick();
    // only the order request is pending at this point
     const orderReqs = httpMock.match('/api/orders/1');
     expect(orderReqs.length, 'order request should be pending').toBe(1);
    
    const customerBefore = httpMock.match('/api/customers/c1');
  expect(customerBefore.length, 'customer must not fire before order resolves').toBe(0);
   
  
   orderReqs[0].flush({
    id: '1',
    customerId: 'c1',
    status: 'PAID',
    total: 100,
  });

  await new Promise<void>(r => setTimeout(r, 0));

  TestBed.tick();
    const customerReqs = httpMock.match('/api/customers/c1');
    expect(customerReqs.length).toBe(1);
    
    customerReqs[0].flush({ id: 'c1', name: 'Alice' });
    
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const nameEl = el.querySelector('[data-testid="customer-name"]');
  expect(nameEl, `❌ customer-name missing. DOM:\n${el.innerHTML}`).toBeTruthy();
  expect(nameEl!.textContent).toContain('Alice');
  });

  // (d) old values stay visible during reload
  it('keeps old values visible during reload', async () => {
  const fixture = TestBed.createComponent(OrderDetail);
  fixture.componentRef.setInput('orderId', '1');

  // ===== Initial load — order =====
  TestBed.tick();                                       // ← MUST come before expectOne
  const orderInit = httpMock.match('/api/orders/1');
  expect(orderInit.length, 'initial order request').toBe(1);
  orderInit[0].flush({ id: '1', customerId: 'c1', status: 'PAID', total: 100 });

  // ===== Initial load — customer =====
  await new Promise<void>(r => setTimeout(r, 0));
  TestBed.tick();
  const custInit = httpMock.match('/api/customers/c1');
  expect(custInit.length, 'initial customer request').toBe(1);
  custInit[0].flush({ id: 'c1', name: 'Alice' });

  await fixture.whenStable();

  const el = fixture.nativeElement as HTMLElement;
  expect(el.querySelector('[data-testid="order-status"]')!.textContent).toContain('PAID');

  // ===== Trigger reload =====
  el.querySelector<HTMLButtonElement>('[data-testid="order-reload"]')!.click();
  TestBed.tick();

  // During reload: old values visible, no loading view, refreshing indicator shown
  expect(el.querySelector('[data-testid="order-status"]')!.textContent).toContain('PAID');
  expect(el.querySelector('[data-testid="order-total"]')!.textContent).toContain('100');
  expect(el.querySelector('[data-testid="order-loading"]')).toBeNull();
  expect(el.querySelector('[data-testid="order-refreshing"]')).toBeTruthy();

  // ===== Resolve reload — order =====
  const orderReload = httpMock.match('/api/orders/1');
  expect(orderReload.length, 'reload order request').toBe(1);
  orderReload[0].flush({ id: '1', customerId: 'c1', status: 'SHIPPED', total: 150 });

  // ===== Resolve reload — customer =====
  await new Promise<void>(r => setTimeout(r, 0));
  TestBed.tick();
  const custReload = httpMock.match('/api/customers/c1');
  expect(custReload.length, 'reload customer request').toBe(1);
  custReload[0].flush({ id: 'c1', name: 'Alice' });

  await fixture.whenStable();

  expect(el.querySelector('[data-testid="order-status"]')!.textContent).toContain('SHIPPED');
  expect(el.querySelector('[data-testid="order-total"]')!.textContent).toContain('150');
});
});