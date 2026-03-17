import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

const STORAGE_KEY = 'admin_logged_in';

const MOCK_ADMIN_EMAIL = 'admin@artgallery.com';
const MOCK_ADMIN_PASSWORD = 'admin123';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Temporary mock admin authentication.
   * Replace with real API call (JWT) later.
   */
  login(email: string, password: string): Observable<boolean> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    const normalizedPassword = (password ?? '').trim();

    const ok =
      normalizedEmail === MOCK_ADMIN_EMAIL &&
      normalizedPassword === MOCK_ADMIN_PASSWORD;

    if (ok) {
      this.setLoggedIn(true);
    }

    // Simulate async behavior like a real API call.
    return of(ok).pipe(delay(450));
  }

  logout(): void {
    this.setLoggedIn(false);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  private setLoggedIn(value: boolean): void {
    if (value) {
      localStorage.setItem(STORAGE_KEY, 'true');
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
  }
}

