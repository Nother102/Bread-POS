import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  pin: string = '';
  
  private router = inject(Router);

  addDigit(digit: number) {
    if (this.pin.length < 4) {
      this.pin += digit.toString();
      
      if (this.pin.length === 4) {
        this.submitPin();
      }
    }
  }

  removeDigit() {
    if (this.pin.length > 0) {
      this.pin = this.pin.slice(0, -1);
    }
  }

  submitPin() {
    if (this.pin === environment.loginPin) {
      this.router.navigate(['hub']);
    } else {
      alert('รหัส PIN ไม่ถูกต้อง ลองใหม่อีกครั้ง');
      this.pin = '';
    }
  }
}