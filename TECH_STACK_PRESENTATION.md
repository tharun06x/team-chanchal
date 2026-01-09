# 🎓 CampusMarket: Technical Architecture & Stack

## 1. Frontend (Client-Side)
The user interface is built for speed, responsiveness, and a modern aesthetic.

*   **React.js (Vite)**: 
    *   *Why?* Extremely fast development HMR (Hot Module Replacement), component-based architecture for reusable UI updates.
*   **Tailwind CSS**: 
    *   *Why?* Utility-first CSS framework allowing for rapid, custom designs without fighting against pre-built component styles. Used for glassmorphism effects (`backdrop-blur`) and gradients.
*   **Lucide React**: 
    *   *Why?* A modern, lightweight icon library for crisp, consistent iconography (User, Chat, Calendar icons).
*   **React Router DOM**: 
    *   *Why?* seamless Single Page Application (SPA) navigation without page reloads.

## 2. Backend (Server-Side)
Reviewing the engine that powers the marketplace logic.

*   **Node.js & Express.js**: 
    *   *Why?* Non-blocking I/O ideal for handling multiple concurrent requests (listings, chats). JavaScript on both ends (Full Stack JS) simplifies development.
*   **REST API Architecture**: 
    *   *Why?* Standardized endpoints (`GET /api/listings`, `POST /api/conversations`) for clean communication between client and server.

## 3. Database & Storage
Hybrid approach for optimal performance and cost-efficiency.

*   **MongoDB (Atlas)**: 
    *   *Why?* NoSQL flexibility allows for evolving data schemas (Listings, Chats) without downtime. Excellent for JSON-like document storage.
*   **Cloudinary**: 
    *   *Why?* Specialized cloud storage for images. Handles image optimization, resizing, and delivery via CDN automatically, unlike storing locally or in generic blob storage.

## 4. Authentication & Security
*   **Firebase Authentication (Google Identity)**: 
    *   *Why?* Secure, battle-tested authentication.
    *   **Domain Restriction**: Configured to ONLY allow emails from `@vjcet.org`, ensuring the marketplace remains exclusive to college students.

## 5. Google Integrations (Smart Features)
Leveraging the Google Ecosystem for enhanced UX without extra infrastructure.

*   **Google Calendar API (URL Scheme)**: 
    *   *Feature*: "Schedule Meetup" button.
    *   *How*: Generates a dynamic link that opens the User's minimal calendar with pre-filled details about the item meeting.
*   **Google Forms**: 
    *   *Feature*: "Report Item".
    *   *How*: Direct integration for handling moderation tickets securely.

## 6. Deployment & DevOps
*   **Frontend**: Hosted on **Vercel** (Global Edge Network for speed).
*   **Backend**: Hosted on **Render** (Auto-deploys from GitHub).
*   **Version Control**: **Git & GitHub** (Monorepo structure).

## Summary Diagram
```mermaid
graph TD
    Client[React Frontend (Vercel)] <-->|REST API| Server[Node/Express Server (Render)]
    Server <-->|Data| DB[(MongoDB Atlas)]
    Server <-->|Media| Cloud[Cloudinary]
    Client <-->|Auth| Fire[Firebase Auth]
    Client -.->|External| Cal[Google Calendar]
```
