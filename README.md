# Readarr Portal - Book Request & Download System

A beautiful, self-hosted Next.js application that acts as a request and download portal for books, fully integrated with Readarr.

![Dark Mode](https://img.shields.io/badge/Dark%20Mode-Enabled-success)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Shadcn UI](https://img.shields.io/badge/Shadcn%20UI-Latest-purple)

## ✨ Features

### 🔍 Discovery Page
- Search for books using Readarr's lookup API
- Responsive grid layout with book covers
- **Smart Cover Fallback System** - Uses Open Library API when Readarr covers aren't available
- Shows title, author, year, and page count
- "Request" button for books not in library
- "Download" button for available books

### 📚 Library Dashboard
- View all books in your Readarr library
- Filter by: All / Downloaded / Missing
- Real-time statistics and progress tracking
- Visual progress bar showing download completion
- Click to download available books instantly

### 📥 Download System
- Stream files directly to user's browser
- Supports EPUB, PDF, MOBI, AZW, AZW3, and more
- Automatic path translation between Readarr and container
- Proper MIME type detection

### 🎨 Design
- Dark mode by default (Overseerr-inspired)
- Minimalist, high-density information display
- Toast notifications for all actions
- Fully responsive (mobile-friendly)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Readarr instance (running or in Docker)
- Books directory accessible to both Readarr and the portal

### 🔐 Authentication

The portal includes simple authentication. Default credentials:
- **Username:** `admin`
- **Password:** `admin`

⚠️ **Change these immediately!** See [AUTH.md](./AUTH.md) for detailed setup.

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd books
   ```

2. **Create environment file**
   ```bash
   # Create .env file in the project root
   cat > .env << EOF
   READARR_API_KEY=your-api-key-here
   JWT_SECRET=your-secure-random-string-change-this
   AUTH_USER_1=admin
   AUTH_PASS_1=admin
   EOF
   ```

3. **Update docker-compose.yml**
   - Change `./my-local-books` to your actual books directory
   - Update `READARR_API_URL` if your Readarr runs elsewhere
   - Adjust the Readarr service or remove it if you run Readarr separately

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Access the portal**
   - Open http://localhost:3000 in your browser
   - Start searching and requesting books!

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Readarr Configuration
READARR_API_URL=http://10.10.10.105:8787
READARR_API_KEY=your-readarr-api-key-here

# Books Path (inside container)
BOOKS_PATH=/books
```

### Volume Mapping

The application needs access to your books directory. In `docker-compose.yml`:

```yaml
volumes:
  # Your local books directory : Container path : Read-only
  - /path/to/your/books:/books:ro
```

**Important:** The path must match between Readarr and the portal:
- If Readarr stores books in `/data/books`, mount that to `/books` in both containers
- The portal translates paths automatically (see `src/app/api/download/[bookId]/route.ts`)

### Getting Your Readarr API Key

1. Open Readarr web interface
2. Go to Settings → General
3. Copy the API Key under "Security" section

## 📚 Book Cover System

The application uses a sophisticated fallback system for book covers:

1. **Readarr covers** (primary source)
2. **Open Library API** (free, no API key required)
3. **Placeholder image** (final fallback)

Covers are automatically loaded using ISBN or Open Library IDs. See [COVER-SYSTEM.md](./COVER-SYSTEM.md) for details.

## 📦 Docker Compose Setup

### Full Stack (Readarr + Portal)

```yaml
version: '3.8'

services:
  readarr-portal:
    build: .
    ports:
      - "3000:3000"
    environment:
      - READARR_API_URL=http://readarr:8787
      - READARR_API_KEY=${READARR_API_KEY}
      - BOOKS_PATH=/books
    volumes:
      - ./my-local-books:/books:ro
    depends_on:
      - readarr

  readarr:
    image: lscr.io/linuxserver/readarr:develop
    ports:
      - "8787:8787"
    volumes:
      - ./readarr-config:/config
      - ./my-local-books:/books
      - ./downloads:/downloads
```

### Portal Only (External Readarr)

```yaml
version: '3.8'

services:
  readarr-portal:
    build: .
    ports:
      - "3000:3000"
    environment:
      - READARR_API_URL=http://10.10.10.105:8787
      - READARR_API_KEY=${READARR_API_KEY}
      - BOOKS_PATH=/books
    volumes:
      - /mnt/books:/books:ro
```

## 🛠️ Development

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   # or
   yarn install
   ```

2. **Create `.env.local`**
   ```env
   READARR_API_URL=http://10.10.10.105:8787
   READARR_API_KEY=your-api-key-here
   BOOKS_PATH=/path/to/books
   ```

3. **Run development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. **Open http://localhost:3000**

### Project Structure

```
books/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── search/       # Book search endpoint
│   │   │   ├── books/        # Library & add book
│   │   │   ├── download/     # File download streaming
│   │   │   └── health/       # Health check
│   │   ├── library/          # Library dashboard page
│   │   ├── layout.tsx        # Root layout with navigation
│   │   ├── page.tsx          # Discovery/search page
│   │   └── globals.css       # Global styles (dark mode)
│   ├── components/
│   │   ├── ui/               # Shadcn UI components
│   │   ├── navigation.tsx    # Top navigation bar
│   │   └── book-card.tsx     # Reusable book card
│   ├── lib/
│   │   ├── readarr.ts        # Readarr API client
│   │   └── utils.ts          # Utility functions
│   ├── types/
│   │   └── readarr.ts        # TypeScript interfaces
│   └── hooks/
│       └── use-debounce.ts   # Custom hooks
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Docker Compose configuration
└── next.config.ts            # Next.js configuration
```

## 🎯 API Endpoints

### Search Books
```
GET /api/search?q={query}
```

### Get Library
```
GET /api/books
```

### Add Book
```
POST /api/books/add
Body: { title, author, editions, ... }
```

### Download Book
```
GET /api/download/[bookId]
```

## 🐛 Troubleshooting

### "Failed to connect to Readarr"
- Check that `READARR_API_URL` is correct
- Verify `READARR_API_KEY` is valid
- Ensure Readarr is running and accessible

### "File not found on server"
- Verify volume mapping in `docker-compose.yml`
- Check that paths match between Readarr and portal
- Ensure books directory has proper permissions

### Books not downloading after request
- Check Readarr's download client settings
- Verify indexers are configured in Readarr
- Look at Readarr logs for errors

### Images not loading
- Check `next.config.ts` has proper image domains
- Verify Readarr can fetch metadata

## 🎨 Customization

### Changing Theme
Edit `src/app/globals.css` to customize colors:

```css
.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  /* ... more variables */
}
```

### Adding Features
- Extend `src/types/readarr.ts` for new API types
- Add new API routes in `src/app/api/`
- Create new pages in `src/app/`

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🙏 Credits

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Integrates with [Readarr](https://readarr.com/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Enjoy your self-hosted book portal! 📚**
