# BreadPos - คู่มือการติดตั้งและใช้งาน

โปรเจคนี้เป็นระบบ POS สำหรับร้านเบเกอรี่ พัฒนาด้วยระบบ Full-Stack:

- **Frontend**: Angular (SSR) และ Express
- **Backend (AI Processing)**: Python (Flask, YOLO) สำหรับประมวลผลเซ็นเซอร์กล้องตรวจจับเบเกอรี่
- Python 3.12.0 link https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe

---

## 1. สิ่งที่ต้องมีก่อนการติดตั้ง (Prerequisites)

- **Node.js**: เวอร์ชัน 20.x หรือสูงกว่า (แนะนำเวอร์ชัน LTS)
- **npm**: (ติดตั้งมาพร้อมกับ Node.js)
- **Python**: ติดตั้งเวอร์ชัน 3.12 add to PATH (HIGH RECOMMEND สำหรับระบบ Backend AI)
- Python 3.12.0 link https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe

## 2. การติดตั้ง (Installation)

### 2.1 ติดตั้งไลบรารีสำหรับฝั่ง Frontend (Angular/Node.js)

เมื่อดาวน์โหลดโปรเจคมาแล้ว ให้คลิ๊กขวาแล้วเปิด Terminal ในโฟลเดอร์หลักของโปรเจคแล้วรันคำสั่ง:

```bash
npm install
```

### 2.2 ติดตั้งไลบรารีสำหรับฝั่ง Backend (Python/AI)

ฟังก์ชันประมวลผลกล้องจะต้องใช้ไลบรารีเพิ่มเติม (เช่น ไฟล์อ่านรูป, Flask และ YOLO)
เปิด Terminal ที่โฟลเดอร์หลัก แล้วพิมพ์คำสั่งเพื่อติดตั้งไลบรารี Python:

```bash
cd backend
pip install -r requirements.txt
cd ..
```

---

## 3. การใช้งานในโหมดพัฒนา (Development)

แนะนำให้เปิด **Terminal แยกกัน 2 หน้าต่าง** เพื่อรันทั้ง 2 ระบบไปพร้อมกันครับ

### หน้าต่างที่ 1: รัน Backend (Python)

เปิดเพื่อใช้สำหรับโมเดล AI ในการประมวลผลรูปภาพจากกล้อง:

```bash
cd backend
python app2.py
```

_(Backend จะทำงานที่พอร์ต 5000 เป็นหลัก)_

### หน้าต่างที่ 2: รัน Frontend (Angular)

หากต้องการแก้ไขโค้ดและดูการเปลี่ยนแปลงหน้าเว็บทันที:

```bash
npm start
```

- แอปพลิเคชันจะรันที่: `http://localhost:4200`
- โค้ดจะทำการ Reload อัตโนมัติเมื่อมีการแก้ไขไฟล์

---

## 4. การนำไปใช้งานจริง (Production Deployment)

สำหรับการรันบน Server เพื่อใช้งานจริง ให้ทำตามขั้นตอนดังนี้:

### 4.1. การเตรียมและรันฝั่ง Backend (Python AI)

เปิดเทอร์มินัลแล้วรันตัวอ่านพิกัด:

```bash
# ถ้าใช้การรันปกติ
cd backend
python app2.py

# หรือใช้ PM2 ช่วยรันแบบ Background
pm2 start app2.py --name "breadpos-ai-backend" --interpreter python
```

### 4.2. การเตรียมและรันฝั่ง Frontend (Angular Web)

**ขั้นตอนที่ 1: Build โปรเจค**
รันคำสั่งเพื่อสร้างไฟล์สำหรับ Production (กลับมาที่โฟลเดอร์หลัก):

```bash
npm run build
```

_คำสั่งนี้จะสร้างโฟลเดอร์ `dist/BreadPos` ขึ้นมา ซึ่งประกอบด้วยส่วนของ browser และ server_

**ขั้นตอนที่ 2: รัน Web Server**
ใช้ Node.js รันไฟล์ server ที่สร้างจากการ build:

```bash
node dist/BreadPos/server/server.mjs
```

- แอปพลิเคชันจะทำงานที่พอร์ตเริ่มต้นคือ `4000` (หรือตามที่ระบุใน Environment Variable)
- คุณสามารถเข้าไปดูผลลัพธ์ได้ที่: `http://localhost:4000`

---

## 5. ข้อแนะนำเพิ่มเติมสำหรับการใช้งานจริง (Tips)

### การรันฝั่ง Frontend แบบ Background ด้วย PM2

เพื่อป้องกันไม่ให้ Web Server หยุดทำงานเมื่อปิด Terminal แนะนำให้ใช้ [PM2](https://pm2.keymetrics.io/):

```bash
# ติดตั้ง PM2 (ถ้ายังไม่มี)
npm install -g pm2

# เริ่มทำงานเว็บแอปพลิเคชัน
pm2 start dist/BreadPos/server/server.mjs --name "breadpos-web"

# ดูสถานะการทำงานทั้ง Python และ Node
pm2 list
```

### การตั้งค่า Environment

- ตรวจสอบไฟล์ `.env` ในโฟลเดอร์หลัก หากมีการเชื่อมต่อกับ Database หรือ API ภายนอก ต้องมั่นใจว่าได้ตั้งค่าต่างๆ ถูกต้องก่อนทำการ Build
- หากโมเดลทำงานไม่ถูกต้อง ให้เช็คไฟล์ตระกูล `.pt` ว่าอยู่ในโฟลเดอร์ `backend/` แล้วหรือยัง (เช่น `best.pt`)
