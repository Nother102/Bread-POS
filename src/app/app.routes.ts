import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login'; 
import { Hub } from './hub/hub';

// 1. นำเข้า Component ของหน้า Scan และ Manual (แก้ path ให้ตรงกับโฟลเดอร์ของคุณนะครับ)
import { Scan } from './scan/scan'; 
import { Manual } from './manual/manual'; 
import { Checkout } from './checkout/checkout';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'hub', component: Hub }, 
  
  // 2. เพิ่ม Route สำหรับหน้า Scan และ Manual
  { path: 'scan', component: Scan },
  { path: 'manual', component: Manual },
  { path: 'checkout', component: Checkout }, // เพิ่ม Route สำหรับหน้า Checkout
  
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];