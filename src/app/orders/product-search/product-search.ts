import { Component, computed, input, resource } from '@angular/core';
import { Product } from '../models';

@Component({
  imports: [],
  selector: 'app-product-search',
  styleUrl: './product-search.css',
  templateUrl: './product-search.html',
})
export class ProductSearch {

  readonly query = input<string>('');

  readonly isIdle = computed(() => {
    const q = this.query();
    return !q || q.trim() === '';
    
  });
  readonly productResource = resource({
    params: () => {
      const q = this.query();
      if (!q || q.trim() === '') {
        return undefined;
      }
      return q.trim();
    },
    loader: async ({ params: q, abortSignal }) => {
      const response = await fetch('/api/products?q=' + encodeURIComponent(q), {
        signal: abortSignal
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Product[];
    }
  });
}
