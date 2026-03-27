import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environment';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private readonly artworksApiUrl = `${environment.apiUrl}/Artworks`;

  constructor(private readonly http: HttpClient) {}

  getProducts(params?: {
    page?: number;
    pageSize?: number;
    categoryId?: string;
    isAvailable?: boolean;
  }): Observable<Product[]> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params?.pageSize != null) httpParams = httpParams.set('pageSize', String(params.pageSize));
    if (params?.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params?.isAvailable != null) httpParams = httpParams.set('isAvailable', String(params.isAvailable));

    return this.http
      .get<Product[] | { items: Product[] }>(this.apiUrl, { params: httpParams })
      .pipe(
        map((res) => (Array.isArray(res) ? res : res.items)),
        catchError((err) =>
          this.handleError(err, 'Không thể tải danh sách sản phẩm.', 'Không tìm thấy API danh sách sản phẩm.')
        )
      );
  }

  getProductById(id: string): Observable<Product> {
    return this.http
      .get<Product>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(catchError((err) => this.handleError(err, 'Không thể tải thông tin sản phẩm.', 'Không tìm thấy sản phẩm.')));
  }

  createProduct(payload: Omit<Product, 'id'>): Observable<void> {
    return this.http
      .post(this.artworksApiUrl, payload, { headers: this.buildHeaders(), responseType: 'text' })
      .pipe(
        map(() => void 0),
        catchError((err) =>
          this.handleError(err, 'Không thể tạo sản phẩm.', 'Không tìm thấy API tạo sản phẩm (POST /Artworks).')
        )
      );
  }

  updateProduct(id: string, payload: Partial<Product>): Observable<void> {
    return this.http
      .put(`${this.artworksApiUrl}/${encodeURIComponent(id)}`, payload, {
        headers: this.buildHeaders(),
        responseType: 'text'
      })
      .pipe(
        map(() => void 0),
        catchError((err) => this.handleError(err, 'Không thể cập nhật sản phẩm.', 'Không tìm thấy sản phẩm.'))
      );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http
      .delete(`${this.artworksApiUrl}/${encodeURIComponent(id)}`, {
        headers: this.buildHeaders(),
        responseType: 'text'
      })
      .pipe(
        map(() => void 0),
        catchError((err) => this.handleError(err, 'Không thể xóa sản phẩm.', 'Không tìm thấy sản phẩm.'))
      );
  }

  /**
   * Auth-ready: interceptor can attach JWT later.
   */
  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private handleError(error: unknown, fallbackMessage: string, notFoundMessage: string = fallbackMessage): Observable<never> {
    // eslint-disable-next-line no-console
    console.error('[ProductService] API error', error);

    if (error instanceof HttpErrorResponse) {
      const message = this.toUserMessage(error, fallbackMessage, notFoundMessage);
      return throwError(() => new Error(message));
    }

    return throwError(() => new Error(fallbackMessage));
  }

  private toUserMessage(error: HttpErrorResponse, fallbackMessage: string, notFoundMessage: string): string {
    if (error.status === 0) return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.';
    if (error.status === 400) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    if (error.status === 401) return 'Bạn cần đăng nhập để thực hiện thao tác này.';
    if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (error.status === 404) return notFoundMessage;
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

