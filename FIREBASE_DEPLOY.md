# Deploying to Firebase Hosting

This guide helps you host your Neon Void Shooter game on Google's Firebase Hosting for free.

## Prerequisites

1.  **Google Account**: You need a Google account.
2.  **Node.js**: Ensure you have Node installed (you likely do if you are running this project).

## Step 1: Install Firebase CLI

Open your terminal and install the Firebase tools globally:

```bash
npm install -g firebase-tools
```

## Step 2: Login

Log in to your Google account via the CLI:

```bash
firebase login
```
This opens your browser to authorize access.

## Step 3: Initialize Project

Run this command in your project root directory:

```bash
firebase init hosting
```

**Select the following options when prompted:**
1.  **Are you ready to proceed?** → `Y`
2.  **Please select an option:** → `Use an existing project` (if you made one in the Firebase console) OR `Create a new project`.
3.  **What do you want to use as your public directory?** → `.`  
    *(Type `.` and hit Enter. This tells Firebase that your `index.html` is in the current folder, not a subfolder like `public` or `dist`)*.
4.  **Configure as a single-page app (rewrite all urls to /index.html)?** → `No`  
    *(This is a game, not a React/Angular SPA).*
5.  **Set up automatic builds and deploys with GitHub?** → `No` (unless you want that).
6.  **File index.html already exists. Overwrite?** → `No`  
    *(**IMPORTANT**: Do not overwrite your game's index.html!)*

## Step 4: Deploy

Once initialization is complete, deploy your game:

```bash
firebase deploy
```

The terminal will output a **Hosting URL** (e.g., `https://your-project-name.web.app`). Click it to play your game online!

## Updating the Game

If you make changes to the code, simply run:

```bash
firebase deploy
```
again to update the live site.
