# VipuDevAI Studio V2

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file with:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_password
   ```

3. **Push database schema:**
   ```bash
   npm run db:push
   ```

4. **Start the app:**
   ```bash
   npm run dev
   ```

5. **Open in browser:** http://localhost:5000

## Features
- AI Chat with history (requires database)
- App Builder with AI Assistant
- Image Generation (DALL-E)
- Code Editor & Sandbox

## Important
- Enter your OpenAI API key in the Chat or Builder page
- Database is required for Chat history and App Builder conversations
- Without database, only Image Generation works

Built with love by Balaji for Vipu
