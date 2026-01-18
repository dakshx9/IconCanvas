# 🎨 IconCanvas AI

> **A powerful, collaborative icon design and canvas editor built for United Hacks V6**

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)

## 🚀 Overview  

**IconCanvas** is a feature-rich, browser-based design tool that combines the power of icon search, canvas editing, and real-time collaboration. Create stunning graphics, presentations, and icon compositions with an intuitive drag-and-drop interface.

## ✨ Features

### 🔍 Smart Icon Search
- **Freepik Integration**: Access 200,000+ icons from popular icon sets (Material, Lucide, Heroicons, Font Awesome, and more)
- **AI-Powered Search**: Intelligent search suggestions to find the perfect icon
- **Quick Preview**: Hover to preview icons before adding to canvas

### 🎨 Powerful Canvas Editor
- **Multi-Layer System**: Organize elements with drag-and-drop layer management
- **Rich Text Support**: Add styled text with custom fonts, colors, and effects
- **Shape Tools**: Create rectangles, circles, and custom shapes
- **Drawing Canvas**: Freehand drawing with customizable brushes
- **Image Import**: Upload and edit images directly on canvas

### 📑 Multi-Slide System
- **Slide Management**: Create multiple slides/canvases in one project
- **Slide Thumbnails**: Visual slide navigation bar
- **Bulk Export**: Export all slides as a ZIP file

### 🎬 Effects & Transformations
- **Transform Controls**: Rotate, flip, resize, and position elements
- **Visual Effects**: Shadow, blur, brightness, contrast, saturation, and grayscale
- **Opacity Control**: Fine-tune transparency for all elements
- **Layer Visibility**: Hide/show and lock layers

### 👥 Real-Time Collaboration
- **Live Editing**: Work together with team members in real-time
- **Member Cursors**: See where collaborators are working
- **Built-in Chat**: Communicate with team members without leaving the editor
- **Group System**: Create or join collaboration groups

### 📤 Export Options
- **Multiple Formats**: PNG, JPG, WebP support
- **Scale Options**: Export at 0.5x, 1x, 2x, or 4x resolution
- **ZIP Download**: Download all slides in one archive

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Radix UI** | Accessible UI components |
| **Framer Motion** | Smooth animations |
| **Freepik API** | Icon search and retrieval |
| **JSZip** | Client-side ZIP generation |
| **Sonner** | Toast notifications |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/dakshx9/IconCanvas/
cd IconCanvas

# Install dependencies
npm install

# Run build
npm run build

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
# Add API keys for enhanced features
GEMINI_API_KEYS=your_gemini_key  # For AI-powered features
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=your_public_liveblocks_api # For Room
```

## 📁 Project Structure

```
IconCanvas/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── search-icons/  # Iconify search endpoint
│   │   └── analyze-*/     # AI analysis endpoints
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── canvas-editor.tsx  # Main canvas editor
│   ├── icon-search-panel.tsx
│   ├── slide-panel.tsx
│   ├── editor-chat-panel.tsx
│   └── ui/               # Shadcn/UI components
├── lib/                  # Utilities and context
│   ├── utils.ts
│   └── collaboration-context.tsx
├── types/                # TypeScript type definitions
│   ├── icon.ts
│   ├── slide.ts
│   └── collaboration.ts
└── public/              # Static assets
```

## 🎯 Key Features Demo

### Canvas Editing
1. Select tools from the left toolbar
2. Add icons, text, shapes, or images
3. Use the right panel to customize properties
4. Navigate slides with the bottom panel

### Collaboration
1. Click the collaboration controls in the header
2. Create or join a group
3. Share the group code with teammates
4. See live cursors and chat in real-time

### Export
1. Click "Export" in the header
2. Choose your format (PNG, JPG, WebP, or ZIP)
3. Select resolution scale
4. Download your creation!

## 🏆 United Hacks V6

This project was built for **United Hacks V6** hackathon, showcasing:
- Modern web development practices
- Real-time collaboration capabilities
- Intuitive design tool UX
- Comprehensive icon management

## 👨‍💻 Team

Built with ❤️ for United Hacks V6

## 📄 License

MIT License - feel free to use this project for your own purposes!

---

<p align="center">
  <strong>⭐ Star this repo if you found it helpful!</strong>
</p>
