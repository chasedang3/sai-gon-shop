import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { UploadService } from '../../../core/services/upload.service';

type UploadState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-admin-upload-image',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
  templateUrl: './admin-upload-image.component.html',
  styleUrl: './admin-upload-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUploadImageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly uploadService = inject(UploadService);

  readonly state = signal<UploadState>('idle');
  readonly selectedFile = signal<File | null>(null);
  readonly uploadedImageUrl = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly copiedMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    file: this.fb.control<File | null>(null, [Validators.required])
  });

  readonly canUpload = computed(() => this.form.valid && this.state() !== 'loading');
  readonly uploadedImagePreview = computed(() => this.uploadedImageUrl());

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.errorMessage.set(null);
    this.copiedMessage.set(null);
    this.state.set('idle');
    this.uploadedImageUrl.set(null);

    if (!file) {
      this.selectedFile.set(null);
      this.form.controls.file.setValue(null);
      this.form.controls.file.markAsTouched();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.selectedFile.set(null);
      this.form.controls.file.setValue(null);
      this.form.controls.file.markAsTouched();
      this.errorMessage.set('Vui lòng chọn file ảnh hợp lệ (jpg, png, webp, ...).');

      if (input) input.value = '';
      return;
    }

    this.selectedFile.set(file);
    this.form.controls.file.setValue(file);
    this.form.controls.file.markAsTouched();
  }

  uploadImage(): void {
    this.errorMessage.set(null);
    this.copiedMessage.set(null);

    if (this.state() === 'loading') return;

    if (this.form.invalid || !this.selectedFile()) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Vui lòng chọn ảnh trước khi upload.');
      this.state.set('error');
      return;
    }

    const file = this.selectedFile();
    if (!file) return;

    this.state.set('loading');

    this.uploadService
      .uploadImage(file)
      .pipe(
        finalize(() => {
          if (this.state() === 'loading') {
            this.state.set('idle');
          }
        })
      )
      .subscribe({
        next: (url) => {
          this.uploadedImageUrl.set(url);
          this.state.set('success');
        },
        error: (err: unknown) => {
          this.state.set('error');
          this.errorMessage.set(err instanceof Error ? err.message : 'Upload ảnh thất bại. Vui lòng thử lại.');
        }
      });
  }

  async copyImageUrl(): Promise<void> {
    const url = this.uploadedImageUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      this.copiedMessage.set('Đã copy link ảnh.');
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('[AdminUploadImage] Copy failed', error);
      this.errorMessage.set('Không thể copy tự động. Vui lòng copy thủ công.');
    }
  }

  resetForm(fileInput: HTMLInputElement): void {
    this.form.reset({ file: null });
    this.selectedFile.set(null);
    this.uploadedImageUrl.set(null);
    this.errorMessage.set(null);
    this.copiedMessage.set(null);
    this.state.set('idle');
    fileInput.value = '';
  }
}

