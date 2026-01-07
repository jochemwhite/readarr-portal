# Environment Variables Configuration

This file documents all environment variables needed for the Readarr Portal application.

## Required Variables

### READARR_API_URL
- **Description**: The full URL to your Readarr instance
- **Example**: `http://10.10.10.105:8787`
- **Docker Example**: `http://readarr:8787` (if using docker-compose with Readarr)
- **Required**: Yes

### READARR_API_KEY
- **Description**: Your Readarr API key for authentication
- **Where to find**: Readarr → Settings → General → Security → API Key
- **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Required**: Yes

### BOOKS_PATH
- **Description**: The path where books are stored inside the container
- **Default**: `/books`
- **Example**: `/books`
- **Required**: No (uses default if not set)
- **Note**: This should match the mounted volume in docker-compose.yml

## Setting Up Environment Variables

### For Local Development

Create a `.env.local` file in the project root:

```env
READARR_API_URL=http://10.10.10.105:8787
READARR_API_KEY=your-readarr-api-key-here
BOOKS_PATH=/path/to/your/books
```

### For Docker Deployment

Create a `.env` file in the project root:

```env
READARR_API_KEY=your-readarr-api-key-here
```

Then use it in `docker-compose.yml`:

```yaml
environment:
  - READARR_API_URL=http://readarr:8787
  - READARR_API_KEY=${READARR_API_KEY}
  - BOOKS_PATH=/books
```

## Security Notes

⚠️ **Important Security Information:**

1. **Never commit `.env` or `.env.local` files to version control**
   - These files are already in `.gitignore`
   - They contain sensitive API keys

2. **Protect your API key**
   - Treat it like a password
   - Don't share it publicly
   - Rotate it if compromised

3. **Read-only book access**
   - Mount books volume as read-only (`:ro`) in docker-compose
   - The portal only needs read access to serve downloads

## Troubleshooting

### "Failed to connect to Readarr"
- Verify `READARR_API_URL` is correct and accessible
- Check that Readarr is running
- Ensure there are no firewall rules blocking access

### "Unauthorized" or "Invalid API Key"
- Double-check your `READARR_API_KEY`
- Copy it directly from Readarr settings
- Ensure there are no extra spaces or quotes

### "File not found on server"
- Verify `BOOKS_PATH` matches your volume mount
- Check that the volume is mounted correctly in docker-compose.yml
- Ensure file permissions are correct

## Example Configurations

### Scenario 1: Readarr on Same Host
```env
READARR_API_URL=http://10.10.10.105:8787
READARR_API_KEY=abc123def456
BOOKS_PATH=/books
```

### Scenario 2: Readarr in Docker Compose
```env
READARR_API_URL=http://readarr:8787
READARR_API_KEY=abc123def456
BOOKS_PATH=/books
```

### Scenario 3: External Readarr with Custom Path
```env
READARR_API_URL=https://readarr.example.com
READARR_API_KEY=abc123def456
BOOKS_PATH=/mnt/library/books
```
