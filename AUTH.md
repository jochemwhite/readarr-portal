# Authentication Setup

The Readarr Portal includes simple authentication to protect your self-hosted instance.

## Quick Setup

Add these variables to your `.env` or `.env.local` file:

```env
# JWT Secret (change this to a random string!)
JWT_SECRET=your-very-secure-random-string-change-this

# Default Admin User
AUTH_USER_1=admin
AUTH_PASS_1=admin

# Additional Users (optional)
AUTH_USER_2=user2
AUTH_PASS_2=password2
```

## Default Credentials

**Username:** `admin`  
**Password:** `admin`

⚠️ **IMPORTANT:** Change these immediately after first login!

## Adding More Users

Add additional users by incrementing the number:

```env
AUTH_USER_1=admin
AUTH_PASS_1=securepassword1

AUTH_USER_2=john
AUTH_PASS_2=johnspassword

AUTH_USER_3=jane
AUTH_PASS_3=janespassword
```

## Using Hashed Passwords (Recommended)

For better security, use bcrypt hashed passwords:

### Generate a Hashed Password:

**Option 1: Using Node.js**
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your-password', 10);
console.log(hash);
```

**Option 2: Using bun**
```bash
bun -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('your-password', 10))"
```

**Option 3: Online Tool**
Use https://bcrypt-generator.com/ (use 10 rounds)

### Use the Hash in .env:

```env
AUTH_USER_1=admin
AUTH_PASS_1=$2a$10$X8xhXKt7VwLmYKPQfW0qy...  # Your bcrypt hash
```

## Docker Setup

When using Docker, pass environment variables:

```yaml
services:
  readarr-portal:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - AUTH_USER_1=${AUTH_USER_1}
      - AUTH_PASS_1=${AUTH_PASS_1}
```

Or use a `.env` file:

```bash
docker-compose --env-file .env up -d
```

## Session Management

- **Session Duration:** 7 days
- **Cookie:** HTTP-only, secure (in production)
- **Token:** JWT signed with your secret

## Security Best Practices

1. ✅ Change default credentials immediately
2. ✅ Use strong, unique passwords
3. ✅ Use hashed passwords in production
4. ✅ Use a strong JWT_SECRET (random 32+ character string)
5. ✅ Enable HTTPS in production
6. ✅ Keep your environment files secure (never commit to git)

## Logout

Click the "Logout" button in the navigation bar to end your session.

## Troubleshooting

### "Invalid credentials" error
- Check username and password are correct
- Ensure environment variables are loaded
- Restart the server after changing .env

### Redirected to login after successful login
- Check JWT_SECRET is set
- Clear browser cookies
- Check server logs for errors

### Can't access any pages
- Ensure middleware.ts is in the src/ directory
- Check that session cookie is being set
- Verify JWT_SECRET matches between restarts
