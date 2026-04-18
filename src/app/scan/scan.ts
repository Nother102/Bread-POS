import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common'; // เพิ่ม CommonModule
import { RouterLink, Router } from '@angular/router'; // เพิ่ม Router
import { HttpClient, HttpClientModule } from '@angular/common/http'; // เพิ่ม HttpClient
import { CartService } from '../services/cart.service'; // เพิ่ม CartService

@Component({
  selector: 'app-scan',
  standalone: true,
  // 📌 เพิ่ม Module ที่จำเป็นสำหรับเชื่อม API และเปลี่ยนหน้า
  imports: [CommonModule, RouterLink, HttpClientModule], 
  templateUrl: './scan.html',
  styleUrls: ['./scan.css']
})
export class Scan implements AfterViewInit, OnDestroy {
  @ViewChild('camera1') camera1!: ElementRef<HTMLVideoElement>;
  @ViewChild('camera2') camera2!: ElementRef<HTMLVideoElement>;
  @ViewChild('camera3') camera3!: ElementRef<HTMLVideoElement>;

  // 📌 เพิ่ม ViewChild สำหรับ Canvas (ใช้แคปภาพส่ง AI)
  @ViewChild('canvas1') canvas1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas2') canvas2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas3') canvas3!: ElementRef<HTMLCanvasElement>;

  private streams: MediaStream[] = [];

  // ตำแหน่งกล้องเดิมของคุณที่ใช้งานได้
  private selectedCameraIndices: number[] = [0, 1, 3]; 

  // 📌 ตัวแปรสำหรับระบบ AI
  isLoading: boolean = false;
  private readonly AI_API_URL = 'http://127.0.0.1:5000/api/detect-bakery'; // ถ้าเครื่องผู้ใช้ (เบราว์เซอร์) กับ Backend เป็นเครื่องเดียวกัน ใช้ 127.0.0.1 ได้เลย

  // 📌 Inject Service ที่จำเป็นเพิ่มเข้ามา
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private router: Router,
    private cartService: CartService
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startCameras();
    }
  }

  ngOnDestroy() {
    this.streams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
  }

  // ==========================================
  // ส่วนเปิดกล้อง (ใช้โค้ดเดิมของคุณ 100%)
  // ==========================================
  async startCameras() {
    try {
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log(`พบกล้องทั้งหมด ${videoDevices.length} ตัว:`, videoDevices);
      initialStream.getTracks().forEach(track => track.stop());

      const getConstraints = (deviceId: string) => ({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      const cameraElements = [this.camera1, this.camera2, this.camera3];

      for (let i = 0; i < this.selectedCameraIndices.length; i++) {
        const targetIndex = this.selectedCameraIndices[i];

        if (videoDevices[targetIndex] && i < cameraElements.length) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia(getConstraints(videoDevices[targetIndex].deviceId));
            cameraElements[i].nativeElement.srcObject = stream;
            this.streams.push(stream);
            await cameraElements[i].nativeElement.play().catch(e => console.warn(`Play error กล้องจอที่ ${i + 1}:`, e));
            
            console.log(`✅ จอที่ ${i + 1} ดึงภาพจากกล้อง Index: ${targetIndex} (${videoDevices[targetIndex].label})`);
          } catch (camError) {
            console.error(`❌ ไม่สามารถเปิดกล้องจอที่ ${i + 1} (Index: ${targetIndex}) ได้:`, camError);
          }
        } else {
          console.warn(`⚠️ ข้ามจอที่ ${i + 1} เพราะหา Index ${targetIndex} ไม่เจอ หรือมีจอไม่พอ`);
        }
      }

    } catch (error) {
      console.error('เกิดข้อผิดพลาดรวมในการดึงข้อมูลกล้อง:', error);
    }
  }

  // ==========================================
  // ส่วนที่เพิ่มใหม่: แคปภาพและส่งเข้า Backend AI
  // ==========================================
  // ==========================================
  // ส่วนที่เพิ่มใหม่: แคปภาพและส่งเข้า Backend AI
  // ==========================================
  async confirmScan() {
    if (this.isLoading) return;
    this.isLoading = true; // เปิดโหมดโหลด

    try {
      console.log('📸 กำลังแคปภาพจากกล้องทั้ง 3 ตัว...');
      
      // ดึงภาพจากวิดีโอลง Canvas
      const imageBlobs = await Promise.all([
        this.captureVideoToBlob(this.camera1.nativeElement, this.canvas1.nativeElement),
        this.captureVideoToBlob(this.camera2.nativeElement, this.canvas2.nativeElement),
        this.captureVideoToBlob(this.camera3.nativeElement, this.canvas3.nativeElement)
      ]);

      // สร้างฟอร์มส่งไฟล์
      const formData = new FormData();
      formData.append('image_top', imageBlobs[0], 'top.jpg');
      formData.append('image_side1', imageBlobs[1], 'side1.jpg');
      formData.append('image_side2', imageBlobs[2], 'side2.jpg');

      console.log('🚀 กำลังส่งไปให้ AI คำนวณ...');

      this.http.post<any>(this.AI_API_URL, formData).subscribe({
        next: (response) => {
          console.log('✅ AI ประมวลผลเสร็จแล้ว:', response);
          if (response && response.detected_items) {
            // โยนผลลัพธ์ใส่ตะกร้า
            this.cartService.updateCartFromDetectionResults(response.detected_items);
            this.isLoading = false;
            
            // วาร์ปไปหน้า Checkout
            this.router.navigate(['/checkout']);
          }
        },
        error: (err) => {
          console.error('❌ เรียก API ไม่สำเร็จ:', err);
          alert('ไม่สามารถเชื่อมต่อระบบ AI ได้'); // Popup แจ้งเตือน
          this.isLoading = false;
          
          // 📌 เพิ่มบรรทัดนี้: เมื่อกด OK จาก alert จะทำงานบรรทัดนี้ต่อ
          this.router.navigate(['/hub']);
        }
      });

    } catch (error) {
      console.error('❌ แคปภาพล้มเหลว:', error);
      alert('เกิดข้อผิดพลาดตอนดึงภาพจากกล้อง'); // Popup แจ้งเตือน
      this.isLoading = false;
      
      // 📌 เพิ่มบรรทัดนี้: เมื่อกด OK จาก alert จะทำงานบรรทัดนี้ต่อ
      this.router.navigate(['/hub']);
    }
  }

  // ฟังก์ชันแปลง Video เป็นไฟล์รูปภาพ
  private captureVideoToBlob(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        reject(new Error('กล้องยังส่งภาพมาไม่ครบ'));
        return;
      }
      const context = canvas.getContext('2d');
      if (!context) return reject(new Error('ไม่สามารถสร้าง Canvas 2D ได้'));

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        blob ? resolve(blob) : reject(new Error('แปลงรูปเป็น Blob ไม่ได้'));
      }, 'image/jpeg', 0.9);
    });
  }
}