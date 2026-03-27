import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environment';

type UploadResponse = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly uploadUrl = `${environment.apiUrl}/upload`;

  constructor(private readonly http: HttpClient) {}

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(this.uploadUrl, formData).pipe(
      map(response => this.extractUrl(response)),
      catchError((err: unknown) => this.handleError(err))
    );
  }

  private extractUrl(response: UploadResponse): string {
    const candidate =
      this.readString(response['url']) ??
      this.readString(response['imageUrl']) ??
      this.readString(response['Url']) ??
      this.readNestedUrl(response['data']);

    if (!candidate) {
      throw new Error('Upload thành công nhưng không nhận được link ảnh từ máy chủ.');
    }

    return candidate;
  }

  private readNestedUrl(value: unknown): string | null {
    if (!value || typeof value !== 'object') return null;

    const data = value as Record<string, unknown>;
    return this.readString(data['url']) ?? this.readString(data['imageUrl']) ?? this.readString(data['Url']);
  }

  private readString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private handleError(error: unknown): Observable<never> {
    // eslint-disable-next-line no-console
    console.error('[UploadService] API error', error);

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return throwError(() => new Error('Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.'));
      }

      if (error.status === 400) {
        return throwError(() => new Error('File tải lên không hợp lệ. Vui lòng chọn lại ảnh.'));
      }

      if (error.status >= 500) {
        return throwError(() => new Error('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'));
      }
    }

    return throwError(() => new Error('Upload ảnh thất bại. Vui lòng thử lại.'));
  }
}

