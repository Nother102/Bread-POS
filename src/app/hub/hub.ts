import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // 1. นำเข้า RouterLink

@Component({
  selector: 'app-hub',
  standalone: true, // ตรวจสอบว่าเป็น true
  imports: [RouterLink], // 2. ใส่ RouterLink ลงใน imports
  templateUrl: './hub.html', // หรือ ./hub.component.html
  styleUrls: ['./hub.css']   // หรือ ./hub.component.css
})
export class Hub {
  // โค้ดอื่นๆ ของคุณ
}