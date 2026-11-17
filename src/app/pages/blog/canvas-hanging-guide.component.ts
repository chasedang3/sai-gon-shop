import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

interface GuideImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

@Component({
  standalone: true,
  selector: 'app-canvas-hanging-guide',
  imports: [CommonModule],
  templateUrl: './canvas-hanging-guide.component.html',
  styleUrl: './canvas-hanging-guide.component.css',
})

export class CanvasHangingGuideComponent {
  private readonly document = inject(DOCUMENT);

  /**
   * Đặt 6 ảnh vào thư mục `public/images/guide/` (Angular 18 mặc định dùng `public/`).
   * Nếu project của bạn dùng `src/assets`, đổi tiền tố thành `assets/guide/...`.
   */
  readonly images = {
    size: {
      src: 'images/guide/guide-size.jpg',
      alt: 'Hướng dẫn ước lượng kích thước tranh so với sofa dài 220 cm',
      width: 1024,
      height: 1024,
    },
    structure: {
      src: 'images/guide/guide-structure.jpg',
      alt: 'Cấu tạo tranh tráng gương khung viền composite gồm 4 lớp',
      width: 900,
      height: 900,
    },
    frame: {
      src: 'images/guide/guide-frame.jpg',
      alt: 'Cận cảnh viền khung mạ vàng với các thông số 0.2 cm và 1 cm',
      width: 752,
      height: 720,
    },
    photos: {
      src: 'images/guide/guide-photos.jpg',
      alt: 'Tổng hợp hình ảnh các mẫu tranh tráng gương thực tế',
      width: 1500,
      height: 1385,
    },
    hang: {
      src: 'images/guide/guide-hang.jpg',
      alt: 'Ba bước treo tranh: giữ ghim vào tường, gõ búa nhẹ, treo móc tranh',
      width: 675,
      height: 611,
    },
    policy: {
      src: 'images/guide/guide-policy.jpg',
      alt: 'Ưu điểm khi mua tranh: đổi trả 1 đổi 1 trong 7 ngày, bảo hành 12 tháng',
      width: 785,
      height: 785,
    },
  } satisfies Record<string, GuideImage>;

  readonly toc = [
    { id: 'size', label: 'Kích thước' },
    { id: 'structure', label: 'Cấu tạo' },
    { id: 'frame', label: 'Viền khung' },
    { id: 'photos', label: 'Hình ảnh thực tế' },
    { id: 'hang', label: 'Cách treo' },
    { id: 'policy', label: 'Đổi trả và bảo hành' },
  ];

  readonly sizes = ['20x30', '30x40', '40x60', '50x70', '60x80', '60x120', '80x150'];

  readonly layers = [
    {
      label: 'Lớp 1',
      title: 'Mặt tráng gương',
      desc: '(crystal lamination) bảo vệ bề mặt tranh.',
    },
    { label: 'Lớp 2', title: 'Giấy ảnh cao cấp', desc: ', mực in sắc nét.' },
    { label: 'Lớp 3', title: 'Tấm lót', desc: 'không ẩm mốc, không cong vênh.' },
    { label: 'Lớp 4', title: 'Khung viền composite', desc: 'giữ trọn bộ tranh.' },
  ];

  readonly features = [
    { title: 'Chất lượng', icon: 'diamond' },
    { title: 'Chống nước', icon: 'water' },
    { title: 'Chống mối mọt', icon: 'shield' },
  ] as const;

  readonly hangSteps = [
    { label: 'Bước 1', text: 'Giữ ghim áp vào vị trí cần đóng, hướng phần mũi tên lên trên.' },
    { label: 'Bước 2', text: 'Dùng búa gõ nhẹ vào 3 đầu đinh, gõ từ từ cho đến khi đinh vào hết.' },
    { label: 'Bước 3', text: 'Treo móc tranh vào ghim là xong.' },
  ];

  readonly policies = [
    {
      title: 'Đổi trả 1 đổi 1 trong 7 ngày',
      desc: 'Áp dụng khi sản phẩm bị lỗi hoặc hư hại trong quá trình vận chuyển, hoặc người bán giao sai, thiếu sản phẩm.',
    },
    {
      title: 'Bảo hành 12 tháng',
      desc: 'Áp dụng khi sản phẩm nhận được khác biệt rõ rệt so với thông tin trong mô tả, hoặc màu sắc sản phẩm bị phai.',
    },
  ];

  readonly notes = [
    'Luôn kiểm tra tải trọng tối đa của đinh 3 chân và so sánh với trọng lượng tranh.',
    'Không dùng đinh 3 chân cho tường quá yếu, ẩm hoặc dễ bong tróc; khi đó nên dùng khoan nở và vít.',
    'Hạn chế đóng đinh tại vị trí có thể đi đường điện âm tường (ngay phía trên ổ cắm, công tắc).',
    'Với người thích thay tranh thường xuyên, đinh 3 chân là lựa chọn linh hoạt, ít để lại dấu lớn trên tường.',
  ];

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

