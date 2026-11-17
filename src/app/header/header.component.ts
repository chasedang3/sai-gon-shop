import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})

export class HeaderComponent {
  private readonly router = inject(Router);

  readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const search = this.router.parseUrl(e.urlAfterRedirects).queryParams['search'] ?? '';
        this.searchControl.setValue(search, { emitEvent: false });
      });
  }

  onSearch(event: Event, closeMenu = false): void {
    event.preventDefault();

    const search = this.searchControl.value.trim();

    this.router.navigate(['/products'], {
      queryParams: {
        search: search || null,
        page: 1,
        type: null,
        category: null,
        categories: null,
      },
    });

    if (closeMenu) {
      document.querySelector<HTMLElement>('#bdNavbar .btn-close')?.click();
    }
  }
}
