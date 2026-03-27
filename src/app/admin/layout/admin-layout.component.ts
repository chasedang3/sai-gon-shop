import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

type AdminNavItem = {
  label: string;
  icon: string;
  route: string;
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: AdminNavItem[] = [
    { label: 'Products', icon: '📦', route: '/admin/products' },
    { label: 'Categories', icon: '🏷️', route: '/admin/categories' },
    { label: 'Upload Image', icon: '🖼️', route: '/admin/upload' }
  ];

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }
}

