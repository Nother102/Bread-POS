import { Injectable } from '@angular/core';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items: CartItem[] = [];

  // ข้อมูลอ้างอิงของ AI
  private productMasterData: { [key: string]: { name: string, price: number } } = {
    'Blue_doughnut': { name: 'โดนัทสีน้ำเงิน', price: 20 },
    'Bread_with_filling': { name: 'ขนมปังมีไส้', price: 20 },
    'Bread_with_chocolate_filling': { name: 'ขนมปังไส้ช็อกโกแลต', price: 20 },
  };

  constructor() { }

  // ---------------------------------------------
  // ส่วนที่ 1: สำหรับหน้า Scan (AI)
  // ---------------------------------------------
  updateCartFromDetectionResults(detectedClasses: string[]) {
    this.clearCart(); 
    const counts = detectedClasses.reduce((acc, className) => {
      acc[className] = (acc[className] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    for (const [className, quantity] of Object.entries(counts)) {
      const productInfo = this.productMasterData[className];
      if (productInfo) {
        this.items.push({
          id: className,
          name: productInfo.name,
          price: productInfo.price,
          quantity: quantity
        });
      }
    }
  }

  // ---------------------------------------------
  // ส่วนที่ 2: สำหรับหน้า Manual (กดมือ)
  // ---------------------------------------------
  addItem(product: any) {
    const existing = this.items.find(item => item.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.image
      });
    }
  }

  decreaseItem(productId: string) {
    const index = this.items.findIndex(item => item.id === productId);
    if (index !== -1) {
      if (this.items[index].quantity > 1) {
        this.items[index].quantity--;
      } else {
        // ถ้าเหลือ 1 แล้วกดลดอีก ให้ลบออกจากตะกร้า
        this.items.splice(index, 1);
      }
    }
  }

  // ---------------------------------------------
  // ส่วนที่ 3: ฟังก์ชันส่วนกลาง (ดึงข้อมูล/คำนวณ)
  // ---------------------------------------------
  getItems(): CartItem[] {
    return this.items;
  }

  getTotalQuantity(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  clearCart() {
    this.items = [];
    return this.items;
  }
}