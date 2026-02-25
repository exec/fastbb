# FastBB - Fast, Lightweight Forum Software

[![CI/CD](https://github.com/exec/fastbb/actions/workflows/ci.yml/badge.svg)](https://github.com/exec/fastbb/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

FastBB is a high-performance forum software built with modern web technologies. Designed for speed, ease of use, and flexibility, it features a blazing-fast Express.js backend with SQLite storage, a modern React frontend, and multiple template options.

## Features

| Category | Features |
|----------|----------|
| **Performance** | SQLite database, in-memory caching, JWT authentication, optimized queries |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Dark mode, Responsive design |
| **Backend** | Express.js, JWT auth, Rate limiting, Compression, RESTful API |
| **Templates** | Default, Modern (gradient), Classic (MyBB-inspired) |
| **Installation** | Multi-step wizard, Template selection, Auto-configured SQLite |
| **Forum Features** | Topics, Posts, Moderation, User profiles, Search, Categories |

## System Requirements

- **Node.js**: 18.0 or higher
- **SQLite**: 3.7 or higher (included via npm)
- **Memory**: 256MB minimum (512MB recommended)
- **Storage**: 50MB for the application + database

## Installation

### Quick Start

```bash
# Install Node.js dependencies
npm install

# Run the installation wizard
npm run dev

# Or run backend and frontend separately
npm start --workspace=src/backend  # Backend on port 8080
npm run dev --workspace=src/frontend  # Frontend on port 3000
```

### Production Build

```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Manual Installation

1. Copy `.env.example` to `.env` and configure:
   - `PORT` - Backend server port (default: 8080)
   - `JWT_SECRET` - Secret key for JWT tokens (generate with `openssl rand -base64 32`)
   - `DB_PATH` - SQLite database path
   - `SITE_NAME` - Your forum name
   - `SITE_URL` - Your forum URL

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the migration to create the database:
   ```bash
   cd src/backend
   npm run migrate
   ```

4. Start the server:
   ```bash
   cd ../..
   npm start
   ```

## Project Structure

```
FastBB/
├── package.json                    # Workspace root
├── README.md                       # This file
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── src/
│   ├── backend/                    # Node.js/Express server
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── config/            # Database config
│   │   │   │   └── database.js
│   │   │   ├── db/                # Database schema
│   │   │   │   ├── schema.js
│   │   │   │   └── migrate.js
│   │   │   ├── middleware/        # Express middleware
│   │   │   │   ├── rateLimiter.js
│   │   │   │   ├── cache.js
│   │   │   │   └── auth.js
│   │   │   ├── routes/            # API routes
│   │   │   │   ├── auth.js
│   │   │   │   ├── forums.js
│   │   │   │   ├── topics.js
│   │   │   │   ├── posts.js
│   │   │   │   ├── search.js
│   │   │   │   ├── users.js
│   │   │   │   └── system.js
│   │   │   ├── services/          # Business logic
│   │   │   │   ├── authService.js
│   │   │   │   ├── forumService.js
│   │   │   │   └── topicService.js
│   │   │   └── server.js          # Main entry point
│   │   └── data/                  # SQLite database
│   │       └── fastbb.db
│   │
│   ├── frontend/                   # React/Vite frontend
│   │   ├── package.json
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── index.css
│   │       ├── vite-env.d.ts
│   │       ├── contexts/          # React contexts
│   │       │   ├── ThemeContext.tsx
│   │       │   └── AuthContext.tsx
│   │       ├── components/        # React components
│   │       │   ├── Header.tsx
│   │       │   ├── Footer.tsx
│   │       │   └── ProtectedRoute.tsx
│   │       ├── pages/             # Page components
│   │       │   ├── ForumsList.tsx
│   │       │   ├── ForumView.tsx
│   │       │   ├── TopicView.tsx
│   │       │   ├── NewTopic.tsx
│   │       │   ├── NewPost.tsx
│   │       │   ├── Login.tsx
│   │       │   ├── Register.tsx
│   │       │   ├── UserProfile.tsx
│   │       │   └── Search.tsx
│   │       └── utils/             # Utility functions
│   │
│   ├── installer/                  # Installation wizard
│   │   ├── index.html
│   │   ├── style.css
│   │   └── install.js
│   │
│   ├── templates/                  # Forum templates
│   │   ├── default/               # Clean, professional
│   │   │   ├── index.html
│   │   │   ├── forum.html
│   │   │   ├── topic.html
│   │   │   ├── post_form.html
│   │   │   ├── user_profile.html
│   │   │   ├── header.html
│   │   │   ├── footer.html
│   │   │   ├── style.css
│   │   │   └── template.xml
│   │   ├── modern/                # Gradient-themed
│   │   │   └── (same structure)
│   │   └── classic/               # MyBB-inspired
│   │       └── (same structure)
│   │
│   ├── assets/                     # Static assets
│   └── config/                     # Configuration files
│
└── tests/                          # Test files
```

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout (requires auth) |
| GET | `/api/auth/me` | Get current user (requires auth) |
| POST | `/api/auth/reset-password` | Request password reset |

### Forums

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forums` | List all forums |
| GET | `/api/forums/:id` | Get forum details |
| POST | `/api/forums` | Create forum (admin) |
| PUT | `/api/forums/:id` | Update forum (admin) |
| DELETE | `/api/forums/:id` | Delete forum (admin) |
| POST | `/api/forums/:id/mark-read` | Mark forum as read |

### Topics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/topics/:id` | Get topic with posts |
| POST | `/api/topics` | Create topic (requires auth) |
| PUT | `/api/topics/:id` | Update topic (requires auth) |
| DELETE | `/api/topics/:id` | Delete topic (requires auth) |
| POST | `/api/topics/:id/lock` | Lock topic (admin) |
| POST | `/api/topics/:id/unlock` | Unlock topic (admin) |
| POST | `/api/topics/:id/pin` | Pin topic (admin) |
| POST | `/api/topics/:id/unpin` | Unpin topic (admin) |
| POST | `/api/topics/:id/views` | Increment topic views |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/:id` | Get post details |
| POST | `/api/posts` | Create post (requires auth) |
| PUT | `/api/posts/:id` | Update post (requires auth) |
| DELETE | `/api/posts/:id` | Delete post (requires auth) |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user profile (requires auth) |
| DELETE | `/api/users/:id` | Delete user (requires auth) |
| GET | `/api/users/:id/topics` | Get user topics |
| GET | `/api/users/:id/posts` | Get user posts |
| GET | `/api/users/members` | List all members |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=&type=` | Search posts and topics (`all`, `posts`, `topics`) |
| GET | `/api/search?q=&type=&page=&limit=` | Search with pagination |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system/stats` | Get system statistics |
| GET | `/api/system/config` | Get system configuration |
| POST | `/api/system/cache/clear` | Clear cache |
| GET | `/api/system/health` | Health check |

## Template System

### Template Selection

Three templates are included:

1. **Default** - Clean, professional design with card-based layout
2. **Modern** - Gradient colors, glassmorphism effects, vibrant design
3. **Classic** - Traditional MyBB-inspired table-based layout

### Creating a New Template

1. Copy the `default` folder and rename it
2. Update `template.xml` with your template information
3. Customize `style.css` for styling
4. Modify HTML templates for layout changes

### Template Structure

```xml
<template>
    <name>Your Template Name</name>
    <version>1.0.0</version>
    <author>Your Name</author>
    <description>Template description</description>
    <template_set_id>your-template-id</template_set_id>
    <features>
        <responsive>true</responsive>
        <dark_mode>true</dark_mode>
    </features>
</template>
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Backend server port |
| `DB_PATH` | `./data/fastbb.db` | SQLite database path |
| `JWT_SECRET` | *required* | Secret for JWT token signing |
| `JWT_EXPIRY` | `24h` | JWT token expiration |
| `SITE_NAME` | `FastBB Forum` | Forum name |
| `SITE_URL` | `http://localhost:8080` | Forum URL |
| `ENABLE_REGISTRATION` | `true` | Allow new registrations |
| `ENABLE_SEARCH` | `true` | Enable search functionality |
| `POSTS_PER_PAGE` | `20` | Posts per page |
| `TOPICS_PER_PAGE` | `20` | Topics per page |
| `DEFAULT_THEME` | `default` | Default template |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins |

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `user_groups` | User permission groups |
| `forums` | Forum categories and forums |
| `topics` | Discussion topics |
| `posts` | Forum posts |
| `sessions` | Authentication sessions |
| `user_settings` | User preferences |
| `forum_reads` | Read tracking |

### Indexes

All tables have appropriate indexes for query performance:
- `idx_users_username`, `idx_users_email`, `idx_users_group_id`, `idx_users_is_active`
- `idx_forums_parent_id`, `idx_forums_sort_order`, `idx_forums_is_active`
- `idx_topics_forum_id`, `idx_topics_user_id`, `idx_topics_last_post_id`, `idx_topics_created`
- `idx_posts_topic_id`, `idx_posts_user_id`, `idx_posts_created`, `idx_posts_is_deleted`, `idx_posts_last_post_id`
- `idx_sessions_user_id`, `idx_sessions_token`, `idx_sessions_expires`
- `idx_forum_reads_user_id`, `idx_forum_reads_forum_id`

## Security Features

- **JWT Authentication**: Token-based auth with configurable expiration
- **Password Hashing**: bcrypt with 12 salt rounds
- **Rate Limiting**: Stricter limits for auth endpoints
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configurable allowed origins
- **XSS Prevention**: Client-side HTML sanitization and server-side input filtering
- **SQL Injection Protection**: Prepared statements and query whitelists

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by MyBB's user experience and search-first approach
- Built with modern web technologies for optimal performance
- SQLite for fast, serverless database operations

## Support

For issues and feature requests, please open an issue on GitHub.

---

**FastBB** - Fast. Lightweight. Powerful.
