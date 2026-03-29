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

type ArtworkCategoryDto = {
  id?: string;
  name?: string;
};

export interface PagedProducts {
  items: Product[];
  totalCount: number;
}

type ArtworkDto = Partial<Omit<Product, 'categoryIds'>> & {
  categories?: ArtworkCategoryDto[];
  categoryIds?: string[];
};

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly artworksApiUrl = `${environment.apiUrl}/Artworks`;

  constructor(private readonly http: HttpClient) {}

  getProducts(params?: {
    page?: number;
    pageSize?: number;
    categoryId?: string;
    isAvailable?: boolean;
    all?: boolean;
  }): Observable<Product[]> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params?.pageSize != null) httpParams = httpParams.set('pageSize', String(params.pageSize));
    if (params?.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params?.isAvailable != null) httpParams = httpParams.set('isAvailable', String(params.isAvailable));
    if (params?.all != null) httpParams = httpParams.set('all', String(params.all));

    return this.http
      .get<ArtworkDto[] | { items: ArtworkDto[] }>(this.artworksApiUrl, { params: httpParams })
      .pipe(
        map((res) => {
          const items = Array.isArray(res) ? res : res.items;
          return (items ?? []).map((item) => this.toProduct(item));
        }),
        catchError((err) =>
          this.handleError(err, 'Không thể tải danh sách sản phẩm.', 'Không tìm thấy API danh sách sản phẩm.')
        )
      );
  }

  /**
   * Paged shop list: GET /Artworks?page=&pageSize=&all=
   * Expects `items` + `totalCount` (camelCase or PascalCase), or a bare array (total falls back to length).
   */
  getProductsPage(params: { page: number; pageSize: number; all?: boolean }): Observable<PagedProducts> {
    const httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize))
      .set('all', String(params.all ?? false));

    return this.http.get<unknown>(this.artworksApiUrl, { params: httpParams }).pipe(
      map((res) => this.parsePagedArtworks(res)),
      catchError((err) =>
        this.handleError(err, 'Không thể tải danh sách sản phẩm.', 'Không tìm thấy API danh sách sản phẩm.')
      )
    );
  }

  getProductById(id: string): Observable<Product> {
    const notFoundError = () => new Error('Không tìm thấy sản phẩm.');

    return this.http
      .get<ArtworkDto>(`${this.artworksApiUrl}/${encodeURIComponent(id)}`)
      .pipe(
        map((res) => this.toProduct(res)),
        catchError((err: unknown) => {
          if (!(err instanceof HttpErrorResponse) || err.status !== 404) {
            return this.handleError(err, 'Không thể tải thông tin sản phẩm.', 'Không tìm thấy sản phẩm.');
          }

          const params = new HttpParams().set('id', id);
          return this.http
            .get<ArtworkDto | { items?: ArtworkDto[] }>(this.artworksApiUrl, { params })
            .pipe(
              map((res) => {
                if ('items' in res && Array.isArray(res.items)) {
                  return res.items[0];
                }
                return res as ArtworkDto;
              }),
              map((entity) => {
                if (!entity) throw notFoundError();
                return this.toProduct(entity);
              }),
              catchError((innerErr: unknown) =>
                this.handleError(innerErr, 'Không thể tải thông tin sản phẩm.', 'Không tìm thấy sản phẩm.')
              )
            );
        })
      );
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

  private parsePagedArtworks(res: unknown): PagedProducts {
    if (Array.isArray(res)) {
      return {
        items: res.map((item) => this.toProduct(item as ArtworkDto)),
        totalCount: res.length
      };
    }

    if (res && typeof res === 'object') {
      const o = res as Record<string, unknown>;
      const rawItems = o['items'] ?? o['Items'];
      const items = Array.isArray(rawItems)
        ? rawItems.map((item) => this.toProduct(item as ArtworkDto))
        : [];

      const totalCount =
        typeof o['totalCount'] === 'number'
          ? o['totalCount']
          : typeof o['TotalCount'] === 'number'
            ? o['TotalCount']
            : typeof o['total'] === 'number'
              ? o['total']
              : typeof o['Total'] === 'number'
                ? o['Total']
                : items.length;

      return { items, totalCount };
    }

    return { items: [], totalCount: 0 };
  }

  private toProduct(entity: ArtworkDto): Product {
    const categories = Array.isArray(entity.categories) ? entity.categories : [];
    const categoryIdsFromCategories = categories
      .map((c) => c?.id)
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    const categoryIds =
      Array.isArray(entity.categoryIds) && entity.categoryIds.length > 0
        ? entity.categoryIds
        : categoryIdsFromCategories;

    const mappedCategories = categories
      .map((c) => ({
        id: typeof c?.id === 'string' ? c.id : '',
        name: typeof c?.name === 'string' ? c.name : ''
      }))
      .filter((c) => c.id.length > 0);

    return {
      id: typeof entity.id === 'string' ? entity.id : '',
      title: typeof entity.title === 'string' ? entity.title : '',
      description: typeof entity.description === 'string' ? entity.description : '',
      price: typeof entity.price === 'number' ? entity.price : 0,
      imageUrl: typeof entity.imageUrl === 'string' ? entity.imageUrl : '',
      type: typeof entity.type === 'string' ? entity.type : 'canvas',
      isAvailable: typeof entity.isAvailable === 'boolean' ? entity.isAvailable : true,
      categoryIds,
      categories: mappedCategories.length > 0 ? mappedCategories : undefined
    };
  }
}

