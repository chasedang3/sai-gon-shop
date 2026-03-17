import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Category } from './category.model';
import { environment } from '../../../../environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[] | { items: Category[] }>(this.apiUrl).pipe(
      map((res) => (Array.isArray(res) ? res : res.items)),
      catchError((err) => this.handleError(err, 'Không thể tải danh sách danh mục.'))
    );
  }

  createCategory(payload: Omit<Category, 'id'>): Observable<Category> {
    return this.http
      .post<Category>(this.apiUrl, payload, { headers: this.buildHeaders() })
      .pipe(
        catchError((err) => this.handleError(err, 'Không thể tạo danh mục.'))
      );
  }

  updateCategory(id: string, payload: Partial<Category>): Observable<Category> {
    return this.http
      .put<Category>(`${this.apiUrl}/${encodeURIComponent(id)}`, payload, {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError((err) => this.handleError(err, 'Không thể cập nhật danh mục.'))
      );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`, {
        headers: this.buildHeaders()
      })
      .pipe(
        catchError((err) => this.handleError(err, 'Không thể xóa danh mục.'))
      );
  }

  /**
   * Prepared for JWT authentication headers later.
   * Example (later): headers = headers.set('Authorization', `Bearer ${token}`)
   */
  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return headers;
  }

  private handleError(
    error: unknown,
    fallbackMessage: string
  ): Observable<never> {
    // eslint-disable-next-line no-console
    console.error('[CategoryService] API error', error);

    if (error instanceof HttpErrorResponse) {
      const message = this.toUserMessage(error, fallbackMessage);
      return throwError(() => new Error(message));
    }

    return throwError(() => new Error(fallbackMessage));
  }

  private toUserMessage(
    error: HttpErrorResponse,
    fallbackMessage: string
  ): string {
    if (error.status === 0) return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.';
    if (error.status === 400) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    if (error.status === 401) return 'Bạn cần đăng nhập để thực hiện thao tác này.';
    if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (error.status === 404) return 'Không tìm thấy danh mục.';
    if (error.status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';

    const backendMessage =
      (typeof error.error === 'object' &&
        error.error &&
        'message' in error.error &&
        typeof (error.error as { message?: unknown }).message === 'string' &&
        (error.error as { message: string }).message) ||
      '';

    return backendMessage.trim() || fallbackMessage;
  }
}

