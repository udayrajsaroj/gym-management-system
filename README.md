# ⚡ IronPulse - Gym Management System

IronPulse is a modern, full-stack gym administration platform built with the MERN stack. It replaces manual logbooks with an automated, highly secure attendance tracking system powered by dynamic QR codes and a rotating token architecture.

---

## 🚀 Core Features

*   **Automated Attendance Tracking:** Seamless member check-in and check-out logging to calculate peak facility hours and individual consistency.
*   **Dynamic QR Code Integration:** Generates scan-ready QR components on the client side for instant hardware or mobile scanner validation at the front desk.
*   **Rotating Cryptographic Tokens:** A secure backend mechanism that generates time-sensitive, continuously rotating tokens to prevent unauthorized entry or QR code sharing.
*   **Admin Dashboard:** Real-time visibility into active members currently inside the facility, along with historical attendance metrics.
*   **Secure Authentication:** JWT-based session management for administrators and staff.

---

## 🛠️ Tech Stack

*   **Frontend:** React.js, Tailwind CSS, HTML5 Canvas (for QR rendering)
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB Atlas, Mongoose ODM
*   **Security & Auth:** JSON Web Tokens (JWT), bcrypt (password hashing)

---

**💻 How to Run Locally:**
```bash
# Clone this specific repository
git clone https://github.com/udayrajsaroj/gym-management-system.git
cd gym-management-system

# Setup environment variables in backend/.env (PORT, MONGO_URI, JWT_SECRET)

# Run Backend
cd server
npm install
node server.js

# Run Frontend (in a new terminal)
cd ../client
npm install
npm run dev