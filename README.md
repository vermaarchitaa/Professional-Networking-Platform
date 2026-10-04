<div align="center">

# Professional Networking Platform

A full-stack professional networking platform inspired by LinkedIn, enabling users to build professional profiles, connect with other users, share posts, discover people, communicate through messaging, and manage their professional network.

This is an independent project and is **not** affiliated with LinkedIn.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Redux](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[Repository](https://github.com/vermaarchitaa/Professional-Networking-Platform) · [Author](https://github.com/vermaarchitaa)

</div>

---

## Overview

Professional networking tools are often either too narrow (a static resume site) or too heavy to study as a complete product. This project is a working MERN-style application that covers the core loop of a professional network: identity, discovery, connections, a social feed, and private messaging.

Users can create an account, maintain a public professional profile, find and connect with other members, publish posts, comment and react, send 1-to-1 messages to accepted connections, and receive notifications when relevant activity happens.

The frontend is a **Next.js Pages Router** app (`linkedin/`) talking to an **Express** API (`backend/`) over HTTP. Persistent data lives in **MongoDB**. Client state is managed with **Redux Toolkit**. Authentication uses a server-issued session token stored on the user record and sent with API requests.

---

## Key Features

### Authentication & Profile

- User registration and login
- Password visibility toggle on the shared Sign In / Sign Up form
- Token-based session persisted in the browser after login
- Professional profile management: name, username, headline, about/bio, location, and intro details
- Profile photo and cover photo upload, edit, delete, visibility, and frame options
- Experience, education, skills, and languages
- Contact information with visibility controls
- Open to work settings
- Public profile pages at `/in/[username]`
- Custom public profile URL
- Profile activity view
- Resume/PDF download generated from the profile

### Networking

- Discover people from the network directory
- Send, accept, and decline connection requests
- Pending incoming and outgoing request lists
- Accepted connections list with connection counts
- Remove an accepted connection
- Connection suggestions based on a viewed profile’s accepted network
- People search from the navbar and a dedicated results page
- Relationship-aware profile actions (connect, pending, accept/decline, message)

### Posts & Feed

- Create posts with text and optional image/video media
- Home dashboard feed
- Profile posts, featured posts, and saved posts
- Post owner actions: edit, delete, comment permissions, and feature on profile
- Reactions (like, love, celebrate, funny, insightful, support)
- Comments with replies, images, GIFs, reactions, and emoji
- Trending posts surfaced on the blog page
- Static career/community articles on `/blog`

### Messaging

- One-to-one conversations between **accepted connections only**
- Conversation list and message history
- Unread conversation count on the Navbar Messaging icon
- Text messages
- Image/video media and document attachments
- GIF search and send (GIPHY, when configured)
- Gifts, stickers, and Unicode emoji insertion
- Share a user profile as a message card
- Message composer actions stay independent (showing a GIF picker does not send a gift, and so on)

### Notifications

- Notification bell for likes, comments, connection requests, and accepted connections
- Unread count on the bell, refreshed on an interval while logged in
- Mark individual notifications or all bell notifications as read
- Persistent `new_post` notifications for accepted connections when someone they know publishes a post
- Small red badge on the Home navbar icon when unseen new-post notifications exist
- Opening the Home dashboard (`/dashboard`) marks `new_post` notifications as seen
- Bell mark-all-read does **not** clear Home new-post badges
- Unseen new-post state survives refresh and logout/login until Home is opened

### Search

- Navbar people search with live suggestions (minimum 3 characters)
- Search by name, username, or headline
- Full results page at `/search/people`
- Results link to public profile pages
- Relationship-aware connect actions on search results

### Internationalization

- UI translations for English, Hindi, Spanish, French, German, Japanese, Chinese, and Portuguese
- Language preference stored in the browser

---

## Screenshots

> Screenshots will be added here.

---

## Tech Stack

| Layer | Technologies |
|------|--------------|
| Frontend | Next.js 16 (Pages Router), React 19, Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB via Mongoose |
| State Management | Redux Toolkit, React Redux |
| Styling | CSS Modules, global CSS |
| Authentication | bcrypt password hashing; random session token stored on the user document |
| File Handling | Multer uploads (images, video, documents); files served from `backend/uploads` |
| Documents | PDF resume generation (`pdfkit`) |
| External Services | GIPHY API for GIF search (optional; requires `GIPHY_API_KEY`) |
| Tooling | ESLint (Next.js config), Nodemon |

---

## Project Architecture

```text
Professional-Networking-Platform/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── linkedin/
│   ├── public/
│   ├── src/
│   │   ├── Components/
│   │   ├── config/          # Axios client, Redux, validation, utilities
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── layout/
│   │   ├── pages/           # Next.js Pages Router
│   │   └── styles/
│   ├── package.json
│   └── next.config.mjs
│
└── README.md
```

**Frontend (`linkedin/`)** renders the product UI, owns client-side validation, and talks to the API through a shared Axios instance (`http://localhost:9090`). Authenticated pages use a dashboard layout and a Redux store with slices for auth, posts, profile, connections, notifications, and messages.

**Backend (`backend/`)** exposes REST routes for users, posts, messages, and notifications. Controllers authenticate requests by looking up the submitted session token, enforce connection rules for messaging, write MongoDB documents, and store uploaded files on disk.

---

## Core Application Flow

### Authentication Flow

1. The user registers or signs in on `/login`.
2. The frontend posts credentials to `/register` or `/login`.
3. Passwords are hashed with bcrypt. Login compares the hash and issues a random session token stored on the user record.
4. The token is returned to the client and kept for subsequent API calls.
5. Redux auth state and route guards decide whether the user can open protected pages such as `/dashboard`.

### Networking Flow

1. A user discovers someone via search, the network directory, or a public profile.
2. They send a connection request (`status_accepted` starts as pending).
3. The recipient can accept or decline. Accepting creates an accepted connection in both directions.
4. Either side can later remove an accepted connection.
5. Connection status drives profile CTAs and **restricts messaging to accepted connections**.

### Messaging Flow

1. Only accepted connections can open a conversation or send a message.
2. The client loads conversations, then messages for a selected conversation.
3. Text, attachments, GIFs, gifts, stickers, or a shared profile card are posted to `/messages/send`.
4. Attachments are validated and stored on the server; message documents are saved in MongoDB.
5. Unread counts update the Messaging navbar badge. Opening a conversation marks it read.

### Post Notification Flow

1. A user creates a post.
2. The backend finds that user’s **accepted** connections and creates a `new_post` notification for each of them (never for the author).
3. Recipients see a Home-icon badge after the navbar fetches the unseen count.
4. Opening `/dashboard` calls the mark-seen API and clears only `new_post` notifications.
5. Existing posts are not backfilled; only newly created posts generate these notifications.

---

## API Overview

Routes are mounted at the Express root. Authenticated endpoints expect the session `token` in the request body or query string.

| Module | Purpose |
|--------|---------|
| Authentication | Registration and login |
| Users | Profile, photos, skills, resume download |
| Connections | Requests, accept/decline, remove, suggestions |
| Posts | Create/read/update/delete posts, comments, reactions, saves |
| Messages | Conversations, send, read, recipients, profile share |
| Notifications | Bell list/unread, new-post count, mark seen |
| Search | People search |
| GIFs | GIF search/trending proxy |

### Representative endpoints

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/register` | Create user + empty profile |
| `POST` | `/login` | Returns a session token |
| `POST` | `/get_user_and_profile` | Current user profile |
| `POST` | `/get_profile_by_username` | Public profile for a username |
| `GET` | `/user/search_people` | People search |
| `POST` | `/user/send_connection_request` | Send a request |
| `POST` | `/user/accept_connection_request` | Accept or decline |
| `POST` | `/user/remove_connection` | Remove an accepted connection |
| `POST` | `/post` | Create a post (optional media) |
| `GET` | `/posts` | Feed |
| `GET` | `/gifs` | GIPHY-backed GIF search |
| `POST` | `/messages/send` | Send a 1-to-1 message |
| `GET` | `/messages/conversations` | Conversation list |
| `GET` | `/notifications` | Bell notifications (excludes `new_post`) |
| `GET` | `/notifications/new_post_count` | Unseen Home-badge count |
| `POST` | `/notifications/new_post_seen` | Mark Home new-post notifications seen |

---

## Database Models

| Model | Responsibility |
|-------|----------------|
| **User** | Account identity, profile/cover photo metadata, session token |
| **Profile** | Headline, about, experience, education, skills, languages, contact, open-to-work |
| **Post** | Feed posts, media, reactions, comment permission, featured flag |
| **Comment** | Post comments and replies, optional image/GIF, reactions |
| **ConnectionRequest** | Pending, accepted, or declined connection between two users |
| **Message** | 1-to-1 messages (text, media, document, gif, gift, sticker, profile) |
| **Notification** | Bell events plus persistent `new_post` Home notifications |
| **SavedPost** | Per-user saved posts |

Passwords are stored hashed. Profile populate paths omit password fields from typical profile responses.

---

## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB instance (local or MongoDB Atlas)
- A [GIPHY API key](https://developers.giphy.com/) if you want GIF search in comments and messaging

### Clone

```bash
git clone https://github.com/vermaarchitaa/Professional-Networking-Platform.git
cd Professional-Networking-Platform
```

### Install dependencies

```bash
cd backend
npm install
```

```bash
cd linkedin
npm install
```

---

## Environment Variables

Create a `backend/.env` file. A template lives at `backend/.env.example`.

```env
MONGO_URI=your_mongodb_connection_string
GIPHY_API_KEY=your_giphy_api_key
```

| Variable | Purpose | Used by |
|----------|---------|---------|
| `MONGO_URI` | MongoDB connection string | `backend/server.js` |
| `GIPHY_API_KEY` | GIPHY API key for GIF search | `GET /gifs` in the posts controller |

The frontend Axios client is configured for `http://localhost:9090`. The API CORS origin is `http://localhost:3000`. Those values are currently set in source, not environment variables.

**Do not commit `.env` files or real secrets.**

---

## Running the Application

Start the API and the Next.js app in two terminals.

### Backend

Listens on **port 9090**.

```bash
cd backend
npm run dev
```

This runs `nodemon server.js`.

### Frontend

Serves the app on **port 3000**.

```bash
cd linkedin
npm run dev
```

This runs `next --port 3000`.

Open [http://localhost:3000](http://localhost:3000), then register or sign in at `/login`.

---

## Build & Validation

From `linkedin/`:

```bash
npm run build
```

```bash
npm run lint
```

```bash
npm start
```

`npm start` serves the production Next.js build.

Whitespace / conflict-marker check from the repository root:

```bash
git diff --check
```

The backend `package.json` does not define an automated test suite.

---

## Security & Validation

Implemented practices visible in the codebase:

- Passwords hashed with bcrypt before storage
- Session token required on authenticated routes (looked up on the user document)
- Messaging and some profile suggestion endpoints require an accepted connection
- Connection accept/decline is limited to the request recipient
- Multer file filters and size limits (for example, profile images 2 MB, post/message uploads 10 MB)
- Client-side form validation plus server-side required-field and type checks
- Contact fields can be hidden from other viewers
- Profile queries typically populate public user fields and omit the password hash
- CORS is restricted to `http://localhost:3000`

This is application-level protection for a development setup. It is not a claim of production hardening (no rate limiting, HTTPS termination, or dedicated auth middleware layer is implemented).

---

## Future Improvements

These are **not implemented** today:

- Real-time messaging and notifications with WebSockets / Socket.IO
- Message pagination and typing indicators
- Online/offline presence
- Home-badge updates without a refresh while already on another page
- Broader search (skills, location, and similar filters)
- Automated backend/frontend tests
- Environment-based API URLs and deployment automation
- Dedicated jobs product (the navbar Jobs item is currently disabled)

---

## Contributing

1. Fork the repository.
2. Create a focused feature branch.
3. Make your changes.
4. Run the frontend build and exercise the affected flows locally.
5. Open a pull request with a clear description of the change.

Please keep pull requests small and avoid committing secrets or generated upload files.

---

## License

> No license has been specified yet.

---

## Author

**Archita**

GitHub: [https://github.com/vermaarchitaa](https://github.com/vermaarchitaa)
