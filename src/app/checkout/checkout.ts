import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service'; // ปรับ path ให้ตรงกับโปรเจกต์คุณ

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class Checkout implements OnInit {
  cartItems: any[] = [];
  totalPrice: number = 0;
  totalQuantity: number = 0;

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.cartItems = this.cartService.getItems();
    this.totalPrice = this.cartService.getTotalPrice();
    this.totalQuantity = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ฟังก์ชันจำลองเมื่อกดเลือกวิธีชำระเงิน
  selectPaymentMethod(method: string) {
    console.log('เลือกวิธีชำระเงิน:', method);
    // TODO: ใส่ Logic เชื่อมต่อ API ชำระเงินที่นี่
    alert(`กำลังดำเนินการชำระเงินด้วย: ${method} ยอดรวม ${this.totalPrice} บาท`);
  }
}