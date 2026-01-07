# Book Cover System

This document explains how the book cover fallback system works in the Readarr Portal.

## Overview

The application uses a sophisticated multi-source fallback system to ensure books always have cover images, even when Readarr's internal covers are not accessible.

## Cover Source Priority

The system tries to load covers in the following order:

1. **Readarr Remote Cover** - The primary source from Readarr's metadata
2. **Readarr Images** - Secondary images from Readarr's database
3. **Open Library (ISBN)** - Free public API using ISBN lookup
4. **Open Library (OLID)** - Open Library ID from edition metadata
5. **Placeholder SVG** - Final fallback with a "No Cover" graphic

## Implementation

### BookCover Component

The `BookCover` component (`src/components/book-cover.tsx`) handles the cascading fallback:

```tsx
<BookCover book={book} className="w-full h-full object-cover" />
```

**Features:**
- Automatic fallback on image load errors
- Loading spinner during transitions
- Lazy loading for performance
- No flash of broken images

### Cover Utilities

The `cover-utils.ts` library provides helper functions:

#### `getBookCoverUrl(book)`
Returns the best available cover URL for a book.

#### `getBookCoverSources(book)`
Returns an array of all possible cover sources in priority order.

#### `getBookISBN(book)`
Extracts ISBN13 or ASIN from book editions.

#### `extractOpenLibraryId(foreignEditionId)`
Parses Open Library IDs from Readarr's foreign edition IDs.

## Open Library API

We use the [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers), which is:

- ✅ **Free** - No API key required
- ✅ **Reliable** - Backed by Internet Archive
- ✅ **No Rate Limits** - For reasonable use
- ✅ **Large Database** - Millions of book covers

### Cover Sizes

The API supports multiple sizes:
- `-S.jpg` - Small (width: 120px)
- `-M.jpg` - Medium (width: 250px)
- `-L.jpg` - Large (width: 400px)

We use `-L.jpg` for the best quality.

### Cover URL Formats

```
By ISBN: https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg
By OLID: https://covers.openlibrary.org/b/olid/{olid}-L.jpg
By LCCN: https://covers.openlibrary.org/b/lccn/{lccn}-L.jpg
```

## How It Works

### 1. Initial Load
When a book card renders, the `BookCover` component:
1. Gets all possible cover sources via `getBookCoverSources()`
2. Starts with the first source (Readarr)
3. Shows a loading spinner

### 2. On Error
If an image fails to load:
1. The `onError` handler is triggered
2. Component advances to the next source in the array
3. Process repeats until a working source is found
4. Final fallback is always the placeholder SVG

### 3. On Success
When an image loads successfully:
1. Loading spinner is hidden
2. Image is displayed
3. No further attempts are made

## Example Flow

```
Book: "The Great Gatsby" by F. Scott Fitzgerald
ISBN: 9780743273565

Attempt 1: Readarr remote cover
  ❌ 404 Not Found (MediaCover endpoint not accessible)

Attempt 2: Open Library ISBN
  ✅ https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg
  Success! Image displayed
```

## Troubleshooting

### No covers are loading
1. Check browser console for network errors
2. Verify Open Library is accessible: https://openlibrary.org
3. Check if books have ISBN data in Readarr

### Covers load slowly
- This is normal on first load
- Open Library CDN may cache images after first request
- Consider implementing local caching (future enhancement)

### Wrong cover displayed
- Readarr metadata may be incorrect
- Check ISBN in Readarr's book details
- Update metadata in Readarr

## Future Enhancements

Possible improvements to consider:

1. **Google Books API** - Additional fallback source
   - Requires API key
   - Good coverage for recent books

2. **Local Caching** - Store successful cover URLs
   - Reduce API calls
   - Faster subsequent loads

3. **Cover Upload** - Allow manual cover uploads
   - For books with no metadata
   - Store in `/public/covers/`

4. **Thumbnail Generation** - Create optimized thumbnails
   - Better performance
   - Less bandwidth

5. **Next.js Image Component** - Use `next/image`
   - Automatic optimization
   - Better lazy loading
   - Would require static image imports

## API Rate Limits

**Open Library:**
- No official rate limits for covers
- Be respectful with requests
- Consider caching for production use

**Google Books:**
- 1,000 requests/day (free tier)
- Requires API key
- Not currently implemented

## Configuration

The cover system requires no configuration. However, ensure your `next.config.ts` allows remote images:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'covers.openlibrary.org',
    },
  ],
}
```

This is already configured in the project.

## Performance

The cascading fallback system is designed to be performant:

- **Lazy Loading** - Images load only when scrolled into view
- **Client-Side** - No server processing required
- **Fast Fails** - Browser quickly moves to next source on error
- **CDN Backed** - Open Library uses CDN for fast delivery

## Credits

- **Open Library** - Cover images (https://openlibrary.org)
- **Internet Archive** - Infrastructure for Open Library
