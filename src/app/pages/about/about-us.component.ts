import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-about-us',
  imports: [CommonModule, RouterLink],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss',
})
export class AboutUsComponent {
  readonly values = [
    {
      title: 'Nghệ thuật & Cảm xúc',
      description:
        'Mỗi bức tranh không chỉ là màu sắc và đường nét, mà còn là cảm xúc, ký ức và câu chuyện riêng.',
    },
    {
      title: 'Chất lượng & Thẩm mỹ',
      description:
        'Chúng tôi tuyển chọn kỹ từng chất liệu, bố cục và bảng màu để bức tranh thật sự hài hòa trong không gian sống.',
    },
    {
      title: 'Tuyển chọn kỹ lưỡng',
      description:
        'Bộ sưu tập được chọn lọc từ nhiều nghệ sĩ, phong cách khác nhau nhưng vẫn giữ chung một tinh thần hiện đại, tinh tế.',
    },
    {
      title: 'Đồng hành cùng khách hàng',
      description:
        'Không chỉ bán tranh, chúng tôi lắng nghe câu chuyện của bạn để gợi ý những tác phẩm phù hợp nhất.',
    },
  ];

  readonly offerings = [
    {
      title: 'Tranh treo tường nghệ thuật',
      description:
        'Các dòng tranh sơn dầu, canvas, in nghệ thuật phù hợp nhiều phong cách nội thất khác nhau.',
    },
    {
      title: 'Bộ sưu tập theo chủ đề',
      description:
        'Phong cảnh, tối giản, trừu tượng, thiên nhiên, thành phố – được sắp xếp thành từng bộ sưu tập dễ lựa chọn.',
    },
    {
      title: 'Tư vấn chọn tranh theo không gian',
      description:
        'Gợi ý kích thước, màu sắc và bố cục tranh phù hợp với phòng khách, phòng ngủ, văn phòng hoặc quán café.',
    },
    {
      title: 'Hướng dẫn treo & bảo quản tranh',
      description:
        'Hỗ trợ hướng dẫn treo tranh an toàn, bền đẹp và cách bảo quản để tranh luôn giữ được chất lượng.',
    },
  ];
}

