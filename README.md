# 🎓 CampusMarket (Team Chanchal)

> A secure, college-exclusive marketplace for students to buy, sell, and connect.

🚀 **Live Demo:** [https://team-chanchal.vercel.app/](https://team-chanchal.vercel.app/)

![CampusMarket Banner](https://via.placeholder.com/1200x400?text=CampusMarket+Preview)

## 🌟 Overview
**CampusMarket** reduces the friction of buying and selling items on campus. Unlike open platforms like OLX, this marketplace is **restricted strictly to our college domain (`@vjcet.org`)**, creating a verified and safe environment for students.

Built with the **MERN Stack** and powered by **Google Cloud Platform**, it features real-time-like messaging, smart meet-up scheduling, and a modern glassmorphism UI.

## ✨ Key Features
*   **🔒 exclusive Access**: Authentication is locked to `vjcet.org` Google accounts via **Firebase Auth**.
*   **💬 Integrated Chat**: Discuss prices and details directly with sellers using our built-in messaging system.
*   **🔔 Smart Notifications**: Get notified (Red Dot + Browser Popup) when you receive a new reply.
*   **📅 One-Click Meetups**: "Schedule Meetup" button integrates with **Google Calendar** to set up safe exchange times instantly.
*   **📸 Media Rich**: Drag-and-drop image uploads optimized by **Cloudinary**.
*   **📱 Mobile First**: Fully responsive design that looks great on phones and laptops.

## 🛠️ Tech Stack

### Frontend
*   **React + Vite**: Fast, component-based UI.
*   **Tailwind CSS**: Modern styling with glassmorphism effects.
*   **React Router**: Seamless navigation (SPA).

### Backend
*   **Node.js & Express**: Robust REST API handling listings and chats.
*   **Firebase Firestore**: NoSQL Cloud Database for scalable data storage.
*   **Firebase Admin**: Secure server-side database operations.

### Cloud & Services
*   **Google Cloud Platform (GCP)**: Identity Platform & Firestore.
*   **Cloudinary**: Image optimization and storage CDN.
*   **Render**: Backend hosting.
*   **Vercel**: Frontend hosting (Global CDN).

## 🚀 Getting Started Locally

### Prerequisites
*   Node.js (v18+)
*   MongoDB or Firebase Service Account (if running backend locally)

### Installation

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/tharun06x/team-chanchal.git
    cd team-chanchal
    ```

2.  **Setup Backend**
    ```bash
    cd server
    npm install
    # Create a .env file with your credentials (PORT, CLOUDINARY_*, FIREBASE_*)
    # Place serviceAccountKey.json in the server folder
    node index.js
    ```

3.  **Setup Frontend**
    ```bash
    cd client
    npm install
    # Create .env with VITE_API_URL=http://localhost:5000
    npm run dev
    ```

## 📸 Screenshots
*(Add screenshots of your Login Page, Home Feed, and Chat here)*

## 🤝 Contributing
Built by **Team Chanchal** for the Hackathon.
