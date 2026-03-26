# Hackathon Horizon

This project is a high-performance registration and project management portal for Hackathon Horizon, built with Next.js, ShadCN UI, and Firebase.

## Firebase Project Information
- **Project ID:** `studio-134112252-362bd`
- **Database:** Cloud Firestore (NoSQL)
- **Auth:** Google Authentication
- **Storage:** Firebase Storage (for PPT/PDF uploads)
- **Admin Email:** `rishikeshavjha51@gmail.com`

## 🚀 Critical Fix: Firebase Storage Setup
If you are getting a **"Missing or insufficient permissions"** or **"Location Error"** in the console:

1. **GCP Resource Location**:
   - Go to **Project Settings** (gear icon ⚙️) > **General**.
   - Look for **"Default GCP resource location"**.
   - If not set, click edit and choose any region (e.g., `us-central1`). **Wait for it to finalize.**

2. **No-Cost Storage Bucket (Free Tier)**:
   - Go to **Storage** tab > click **"Get started"**.
   - Select **"Regional"**.
   - **IMPORTANT**: Pick **`us-central1`** as the location. This is one of the specific regions that supports the **no-cost tier** for Spark plans.
   - Click **Done**.

3. **Storage Security Rules**:
   - In the Storage tab, click **Rules** and paste this:
   ```rules
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /submissions/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## Core Features
- **AI-Powered Tools**: 
  - **Team Name Generator**: Creative suggestions during registration.
  - **Abstract Assistant**: Drafts professional project summaries.
- **Dynamic Team Management**: Leaders can add/remove up to 3 teammates.
- **Evaluation Panel**: Admin route (`/admin`) for authorized users to view/export data.

## How to Evaluate Teams
1. Login as `rishikeshavjha51@gmail.com`.
2. Visit `[your-url]/admin`.
3. View the table or click **Export to CSV** to download the master list.
