import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductSearch } from './product-search';

describe('ProductSearch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // (e) stale product fetch is aborted when query changes
 it('aborts the previous fetch when the query changes', async () => {
  const signals: AbortSignal[] = [];
  let call = 0;

  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    const signal = init!.signal!;
    signals.push(signal);
    call++;

    if (call === 1) {
      // First fetch: stays pending until the signal aborts, then rejects
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      });
    }

    // Second fetch: resolves immediately so whenStable() can settle
    return Promise.resolve(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  vi.stubGlobal('fetch', fetchMock);

  const fixture = TestBed.createComponent(ProductSearch);
  fixture.componentRef.setInput('query', 'a');
  TestBed.tick(); 

  fixture.componentRef.setInput('query', 'ab');
 TestBed.tick(); 

  expect(signals.length).toBe(2);
  expect(signals[0].aborted).toBe(true);
  expect(signals[1].aborted).toBe(false);
});

  // (f) non-2xx fetch response ends in the error view
  it('ends in error state on a non-2xx fetch response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('nope', { status: 503 })),
    );

    const fixture = TestBed.createComponent(ProductSearch);
    fixture.componentRef.setInput('query', 'x');
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="search-error"]')).toBeTruthy();
  });
});