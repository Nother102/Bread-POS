import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // 1. นำเข้า Router
import { CartService, CartItem } from '../services/cart.service';

@Component({
  selector: 'app-manual',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manual.html',
  styleUrls: ['./manual.css']
})
export class Manual implements OnInit {
  
  products = [
    { id: 'Blue_doughnut', name: 'โดนัทสีน้ำเงิน', price: 29, image: 'assets/images/products/Blue_doughnut.jpg' },
    { id: 'Bread_with_chocolate_filling', name: 'ขนมปังมีไส้ช็อกโกแลต', price: 45, image: 'assets/images/products/Bread_with_chocolate_filling.jpg' },
    { id: 'Bread_with_milk_filling', name: 'ขนมปังมีไส้นม', price: 40, image: 'assets/images/products/Bread_with_milk_filling.jpg' },
    { id: 'Bread_with_milk_tea_filling', name: 'ขนมปังมีไส้ชาไทย', price: 40, image: 'assets/images/products/Bread_with_milk_tea_filling.jpg' },
    { id: 'Bread_with_pandan_filling', name: 'ขนมปังมีไส้สังขยาใบเตย', price: 45, image: 'assets/images/products/Bread_with_pandan_filling.jpg' },
    { id: 'Green_doughnut', name: 'โดนัทสีเขียว', price: 29, image: 'assets/images/products/Green_doughnut.jpg' },
    { id: 'Lotus_bun', name: 'ขนมปังรูปดอกไม้', price: 30, image: 'assets/images/products/Lotus_bun.jpg' },
    { id: 'Melon_pang', name: 'ขนมปังเมล่อน', price: 50, image: 'assets/images/products/Melon_pang.jpg' },
    { id: 'Soft_bread', name: 'ขนมปังไส้มะพร้าว (ใหญ่)', price: 35, image: 'assets/images/products/Soft_bread.jpg' },
    { id: 'Soft_sesame_bun', name: 'ขนมปังไส้มะพร้าว (เล็ก)', price: 30, image: 'assets/images/products/Soft_sesame_bun.jpg' }
  ];

  cartItems: CartItem[] = [];

  // 2. Inject Router เข้ามาใช้งานคู่กับ CartService
  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit() {
    this.cartItems = this.cartService.getItems();
  }

  getTotalQuantity(): number {
    return this.cartService.getTotalQuantity();
  }

  addToCart(product: any) {
    this.cartService.addItem(product);
  }

  decreaseQuantity(item: CartItem) {
    this.cartService.decreaseItem(item.id);
  }

  // 3. ใส่ฟังก์ชัน goToCheckout ของคุณลงไป
  goToCheckout() {
    if (this.cartItems.length > 0) {
      this.router.navigate(['/checkout']); 
    } else {
      alert('กรุณาเลือกสินค้าก่อนทำรายการครับ');
    }
  }
}