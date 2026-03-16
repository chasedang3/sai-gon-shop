import { Injectable } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';

export type AdminAuthResult = {
  token: string;
  adminEmail: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Mock admin authentication.
   * Replace this implementation with a real API call later.
   */
  login(email: string, password: string): Observable<AdminAuthResult> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();

    // Intentionally *not* in template; this is mock-only logic.
    const isValidMock =
      normalizedEmail.length > 0 &&
      password.length > 0 &&
      password === 'Admin@1234';

    if (!isValidMock) {
      return throwError(() => new Error('Email hoặc mật khẩu không đúng.')).pipe(delay(650));
    }

    return of(true).pipe(
      delay(650),
      map(() => ({
        token: 'mock-admin-token',
        adminEmail: normalizedEmail
      }))
    );
  }
}

