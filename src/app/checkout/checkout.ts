import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';

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

  showPaymentPopup: boolean = false;
  selectedPaymentMethod: string = '';
  paymentSuccess: boolean = false;

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit() {
    this.cartItems = this.cartService.getItems();
    this.totalPrice = this.cartService.getTotalPrice();
    this.totalQuantity = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ฟังก์ชันจำลองเมื่อกดเลือกวิธีชำระเงิน
  selectPaymentMethod(method: string) {
    this.selectedPaymentMethod = method;
    this.showPaymentPopup = true;
  }

  getPaymentTitle(): string {
    switch (this.selectedPaymentMethod) {
      case 'Thai QR': return 'ชำระเงินผ่าน Thai QR';
      case 'Credit Card': return 'ชำระเงินด้วยบัตรเครดิต';
      case 'Cash': return 'ชำระเงินด้วยเงินสด';
      default: return 'ชำระเงิน';
    }
  }

  confirmPayment() {
    this.showPaymentPopup = false;
    this.paymentSuccess = true;
    this.cartService.clearCart();

    // Redirect after showing success message
    setTimeout(() => {
      this.paymentSuccess = false;
      this.router.navigate(['/hub']);
    }, 2000);
  }

  cancelPayment() {
    this.showPaymentPopup = false;
    this.selectedPaymentMethod = '';
  }
}