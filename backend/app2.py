import os
import io
import time
import math
import numpy as np
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO

# ========================================================
# 1. ตั้งค่า Flask App และอนุญาต CORS
# ========================================================
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ========================================================
# 2. ตั้งค่า YOLO และ Homography Matrix
# ========================================================
MODEL_PATH = 'best.pt'
if not os.path.exists(MODEL_PATH):
    print(f"⚠️ คำเตือน: ไม่พบไฟล์โมเดลที่ path: {MODEL_PATH}")

print(f"🎬 กำลังโหลดโมเดล YOLO จาก {MODEL_PATH}...")
model = YOLO(MODEL_PATH)
print("✅ โมเดลโหลดเสร็จเรียบร้อย พร้อมใช้งาน!")

CHECK_DIR = './check'
if not os.path.exists(CHECK_DIR):
    os.makedirs(CHECK_DIR)
    print(f"📁 สร้างโฟลเดอร์ {CHECK_DIR} สำหรับเซฟภาพแล้ว")

# 🛑 ใส่ค่า Homography Matrix ของแต่ละกล้อง (ใช้ key ให้ตรงกับชื่อไฟล์ที่ส่งมาจาก Frontend)
MATRICES = {
    'image_top': np.array([[-5.00032430e-02, -7.65177052e-04,  4.82485606e+01],
 [-8.06047739e-04,  7.13595532e-02, -3.47653043e+01],   
 [-1.17996247e-05,  9.00743586e-04,  1.00000000e+00]], dtype=np.float32),
    
    'image_side1': np.array([[ 2.05042322e-02,  5.40077936e-02, -4.47663266e+01],
 [ 3.91119380e-02, -2.99589666e-02, -2.20341817e+01],   
 [-7.17092000e-05,  7.28945223e-04,  1.00000000e+00]], dtype=np.float32),
    
    'image_side2': np.array([[ 2.38871427e-02, -5.80375839e-02,  2.09276797e+00],
 [-4.23959621e-02, -3.47948956e-02,  5.75919543e+01],
 [ 8.56117587e-05,  8.07649380e-04,  1.00000000e+00]], dtype=np.float32)
}
# ตั้งค่าเงื่อนไขของคลาสขนมปัง
SPECIFIC_FILLINGS = [
"Blue_doughnut",
    "Bread_with_chocolate_filling",
    # "Bread_with_filling",  <-- ❌ ลบบรรทัดนี้ทิ้งครับ
    "Bread_with_milk_filling",
    "Bread_with_milk_tea_filling",
    "Bread_with_pandan_filling",
    "Green_doughnut",
    "Lotus_bun",
    "Melon_pang",
    "Soft_bread",
    "Soft_sesame_bun"
]
GENERIC_FILLING = "Bread_with_filling"

# ระยะห่างสูงสุดที่จะถือว่าเป็นขนมปัง "ชิ้นเดียวกัน" (หน่วยเป็นเซนติเมตร)
DISTANCE_THRESHOLD = 8

# ========================================================
# 3. ฟังก์ชันจัดกลุ่มและแก้ปัญหาชื่อคลาส (Sensor Fusion)
# ========================================================
def merge_and_resolve_items(all_detections):
    grouped_items = []
    
    # 3.1 จัดกลุ่มด้วยระยะห่างแบบ Best Match (หาชิ้นที่ใกล้ที่สุด)
    for det in all_detections:
        best_match_idx = -1
        min_dist = DISTANCE_THRESHOLD 
        
        for idx, group in enumerate(grouped_items):
            dist = math.hypot(det['x'] - group['center_x'], det['y'] - group['center_y'])
            if dist < min_dist:
                min_dist = dist
                best_match_idx = idx
                
        if best_match_idx != -1:
            best_group = grouped_items[best_match_idx]
            best_group['members'].append(det)
            best_group['center_x'] = sum(m['x'] for m in best_group['members']) / len(best_group['members'])
            best_group['center_y'] = sum(m['y'] for m in best_group['members']) / len(best_group['members'])
        else:
            grouped_items.append({
                'center_x': det['x'],
                'center_y': det['y'],
                'members': [det]
            })

    # 3.2 หาข้อสรุปของแต่ละชิ้น (Rule-based Resolution)
# 3.2 หาข้อสรุปของแต่ละชิ้น (Rule-based Resolution)
    final_items = []
    for idx, group in enumerate(grouped_items):
        members = group['members']
        
        # 📌 กรองหาเฉพาะสมาชิกที่ถูกระบุว่าเป็น "ไส้เฉพาะเจาะจง" (Specific Fillings)
        specific_members = [m for m in members if m['class_name'] in SPECIFIC_FILLINGS]
        
        if specific_members:
            # ✅ ถ้าในกลุ่มนี้ มีกล้องใดกล้องหนึ่งเห็นเป็นไส้เฉพาะ
            # ให้เลือกไส้เฉพาะที่มีค่า Conf สูงสุด (ไม่สนใจคลาส Generic เลย)
            best_specific = max(specific_members, key=lambda m: m['conf'])
            final_class = best_specific['class_name']
        else:
            # ❌ ถ้าไม่มีกล้องไหนเห็นไส้เฉพาะเลย (มีแต่ Generic ล้วนๆ)
            # ค่อยเลือกตัวที่ Conf สูงสุดตามปกติ
            best_member = max(members, key=lambda m: m['conf'])
            final_class = best_member['class_name']

        final_items.append({
            'item_id': idx + 1,
            'class_name': final_class,
            'x': round(group['center_x'], 2),
            'y': round(group['center_y'], 2),
            'seen_by': [m['camera'] for m in members]
        })
        
    return final_items

# ========================================================
# 4. API Endpoint หลัก: POST /api/detect-bakery
# ========================================================
@app.route('/api/detect-bakery', methods=['POST'])
def detect_bakery():
    required_files = ['image_top', 'image_side1', 'image_side2']
    if not all(name in request.files for name in required_files):
        return jsonify({
            'status': 'error',
            'message': f'❌ ส่งไฟล์ภาพมาไม่ครบ จำเป็นต้องมี {required_files}'
        }), 400

    print("📸 รับภาพถ่าย 3 ไฟล์จาก Frontend... กำลังเริ่มประมวลผลด้วย AI")
    
    timestamp_str = str(int(time.time()))
    all_raw_detections = []

    # วนลูปประมวลผลภาพทีละกล้อง
    for cam_name in required_files:
        image_file = request.files[cam_name]
        print(f"  --> กำลังรัน YOLO และแปลงพิกัดภาพ: {cam_name}...")
        
        # แปลงไฟล์ภาพจาก Flask ให้เป็น OpenCV Format
        img_bytes = image_file.read()
        np_img = np.frombuffer(img_bytes, np.uint8)
        img_cv = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        # ถอดค่า Homography Matrix สำหรับกล้องตัวนี้
        h_matrix = MATRICES.get(cam_name)
        
        # รัน YOLO
        results = model(img_cv, imgsz=1080, conf=0.5, verbose=False)
        
        # 📌 สั่งเซฟภาพที่มีกรอบ Bounding Box ลงโฟลเดอร์ ./check
        save_filename = f"{timestamp_str}_{cam_name}.jpg"
        save_path = os.path.join(CHECK_DIR, save_filename)
        results[0].save(filename=save_path)
        
        # ดึงข้อมูลการตรวจจับ
        for box in results[0].boxes:
            class_id = int(box.cls[0].cpu().numpy())
            class_name = model.names[class_id]
            conf = float(box.conf[0].cpu().numpy())
            
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            center_x = (x1 + x2) / 2.0
            center_y = (y1 + y2) / 2.0
            
            # แปลง Pixel เป็น CM
            point_px = np.array([[[center_x, center_y]]], dtype=np.float32)
            point_cm = cv2.perspectiveTransform(point_px, h_matrix)
            
            real_x_cm = float(point_cm[0][0][0])
            real_y_cm = float(point_cm[0][0][1])
            
            all_raw_detections.append({
                'class_name': class_name,
                'conf': conf,
                'x': real_x_cm,
                'y': real_y_cm,
                'camera': cam_name
            })

    # ส่งเข้าฟังก์ชัน Match เพื่อรวมร่าง
    final_results = merge_and_resolve_items(all_raw_detections)
    
    # นับจำนวนสรุปส่งกลับไปให้ Frontend โชว์บนเว็บ
    detected_items_list = [item['class_name'] for item in final_results]
    
    summary_counts = {}
    for cls in detected_items_list:
        summary_counts[cls] = summary_counts.get(cls, 0) + 1

    response_data = {
        'status': 'success',
        'count': len(final_results),
        'detected_items': detected_items_list,  # ส่งกลับเป็น List ชื่อคลาสเพื่อให้ง่ายต่อการนับ/แสดงผล
        'details': final_results, # ส่งรายละเอียด (พิกัด, ID, กล้องที่เห็น) ไปเผื่อเว็บอยากเอาไปโชว์
        'summary': summary_counts
    }
    
    print(f"✅ ประมวลผลเสร็จสิ้น! เจอขนมปังรวม {len(final_results)} ชิ้น")
    for cls_name, count in summary_counts.items():
        print(f" 🍞 {cls_name}: {count} ชิ้น")
        
    return jsonify(response_data)

# ========================================================
# Start Server
# ========================================================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)