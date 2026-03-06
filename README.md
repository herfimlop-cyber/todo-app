# Todo Notification PWA

## Features

### 🔔 Notification System
- **Schedule notifications** at specific times (GMT+7 timezone)
- **Multiple schedules** - Add as many notification times as you want
- **Works when app is closed** - Service Worker keeps running in background
- **Real-time checks** - App checks for due notifications every minute
- **Background periodic sync** - Additional periodic checking (15-minute intervals)

### ✓ Todo Management
- Add and delete todos as before
- Works offline with Service Worker caching

### 📱 PWA Features
- **Installable** - Can be installed on mobile and desktop as a standalone app
- **Offline support** - Works without internet connection
- **Push notifications** - Sent even when app is closed (requires permission)

## How to Use

### 1. Start the Server
```bash
npm install  # If needed
npm start
```

The server will run on `http://localhost:3000`

### 2. Open in Browser
- Visit `http://localhost:3000` on your mobile or computer
- For Chrome/Edge on mobile: Click menu → "Install app" or "Add to Home screen"
- For Safari on iOS: Click Share → "Add to Home Screen"

### 3. Allow Notifications
- Click the permission status bar to allow notifications
- Or the app will ask when you add your first notification schedule

### 4. Schedule Notifications
1. Select a time in the "Schedule Notification" section (24-hour format, GMT+7)
2. Click "Add Schedule"
3. The time will appear in the notification list
4. When the time is reached, you'll receive a notification even if the app is closed

### 5. Use Todo List
- Add todos in the "Todo List" section
- Delete todos with the Delete button

## Technical Details

### Timezone
All notifications are scheduled and checked in **GMT+7** timezone.
Current server time is used for checking if scheduled time matches.

### How It Works (Background Notifications)

1. **Service Worker** (`sw.js`)
   - Runs in background when app is closed
   - Can receive periodic sync events
   - Shows notifications when triggered

2. **Frontend Check** (`script.js`)
   - Checks for due notifications every 60 seconds
   - Requests permission from user
   - Displays notifications in real-time

3. **Backend Check** (`/api/notifications/check`)
   - Compares current time (GMT+7) with scheduled times
   - Returns list of notifications that are due
   - Only triggered when client requests it

4. **Notification Database** (`notifications.json`)
   - Stores all scheduled notification times
   - Simple JSON format for easy management

### API Endpoints

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Add new todo
- `DELETE /api/todos/:id` - Delete todo

- `GET /api/notifications` - Get all scheduled notifications
- `POST /api/notifications` - Add new notification schedule
- `DELETE /api/notifications/:id` - Delete notification schedule
- `GET /api/notifications/check` - Check for due notifications

## Browser Support

- ✓ Chrome/Chromium (Desktop & Mobile)
- ✓ Firefox (Desktop)
- ✓ Edge (Desktop & Mobile)
- ✓ Opera (Desktop & Mobile)
- ⚠ Safari (Limited - notifications may not work in background)

## Important Notes

1. **Permissions Required**: Allow notifications when prompted
2. **Must be HTTPS or localhost**: PWA features only work on secure connections
3. **Background Sync**: May not work on all browsers/devices - app checks periodically as fallback
4. **Battery Impact**: Periodic checking may use slight battery on mobile - interval is optimized at 15 minutes via Periodic Sync API and 1 minute via frontend polling

## Troubleshooting

### Notifications not showing
1. Check browser notification permissions (in browser settings)
2. Make sure time is in GMT+7 format (HH:MM, 24-hour)
3. Restart the app if it's been running for a while

### App not installing (Install button not showing)
1. Must be on HTTPS (or localhost for testing)
2. Make sure manifest.json is properly loaded
3. Clear browser cache and reload

### Service Worker not working
1. Check browser developer tools → Application → Service Workers
2. Make sure sw.js is being served correctly
3. Check browser console for errors

## Files Structure

```
EMM0603/
├── public/
│   ├── index.html          # Main HTML with manifest link
│   ├── script.js           # Frontend logic and notification handling
│   ├── sw.js               # Service Worker for background tasks
│   └── manifest.json       # PWA manifest file
├── server.js               # Express server with notification APIs
├── todos.json              # Todo list data
├── notifications.json      # Scheduled notifications data
└── package.json            # NPM dependencies
```
