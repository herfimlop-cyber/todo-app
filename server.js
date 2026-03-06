// Web Push
const webpush = require('web-push');
const VAPID_PUBLIC_KEY = 'BE9qIgu3-Orbmkp9Y6DdpEpdZ5WHVGdogl_G1VQXo692PHxnsxYHCoKIq2U3qafoEucKpgl46RcKp-L5Ng4YrGE';
const VAPID_PRIVATE_KEY = 'QHP38IxZEkYjIQ4pyYzVUsea9kZTFMQQeudF5UfrsGk';
webpush.setVapidDetails(
  'mailto:admin@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const SUBSCRIPTIONS_FILE = 'push_subscriptions.json';
function readSubscriptions() {
    try {
        return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE));
    } catch {
        return [];
    }
}
function saveSubscriptions(subs) {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
}

// Subscribe endpoint
app.post('/api/subscribe', (req, res) => {
    const sub = req.body;
    let subs = readSubscriptions();
    // Check for duplicate
    if (!subs.find(s => s.endpoint === sub.endpoint)) {
        subs.push(sub);
        saveSubscriptions(subs);
    }
    res.status(201).json({ success: true });
});

// Send push notification to all subscribers
async function sendPushToAll(title, body) {
    const subs = readSubscriptions();
    const payload = JSON.stringify({ title, body });
    for (const sub of subs) {
        try {
            await webpush.sendNotification(sub, payload);
        } catch (err) {
            // Remove invalid subscription
            if (err.statusCode === 410 || err.statusCode === 404) {
                saveSubscriptions(subs.filter(s => s.endpoint !== sub.endpoint));
            }
        }
    }
}
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const TODOS_FILE = "todos.json";
const NOTIFICATIONS_FILE = "notifications.json";

// Initialize notification schedules file if it doesn't exist
function initializeNotificationsFile() {
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
        fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
    }
}

function readTodos() {
    const data = fs.readFileSync(TODOS_FILE);
    return JSON.parse(data);
}

function saveTodos(todos) {
    fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2));
}

function readNotifications() {
    try {
        const data = fs.readFileSync(NOTIFICATIONS_FILE);
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function saveNotifications(notifications) {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
}

// Helper function to check if notification time matches current time
function getCurrentTimeGMT7() {
    const now = new Date();
    // Convert to GMT+7
    const gmt7Time = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hours = String(gmt7Time.getUTCHours()).padStart(2, '0');
    const minutes = String(gmt7Time.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getLastCheckTime() {
    try {
        const data = fs.readFileSync('lastcheck.json');
        return JSON.parse(data).lastCheck;
    } catch {
        return null;
    }
}

function saveLastCheckTime() {
    fs.writeFileSync('lastcheck.json', JSON.stringify({ lastCheck: new Date().toISOString() }));
}

// GET todos
app.get("/api/todos", (req, res) => {
    try {
        res.json(readTodos());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ADD todo
app.post("/api/todos", (req, res) => {
    try {
        const todos = readTodos();
        const newTodo = {
            id: Date.now(),
            text: req.body.text
        };

        todos.push(newTodo);
        saveTodos(todos);

        res.json(newTodo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE todo
app.delete("/api/todos/:id", (req, res) => {
    try {
        let todos = readTodos();
        todos = todos.filter(t => t.id != req.params.id);
        saveTodos(todos);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET notification schedules
app.get("/api/notifications", (req, res) => {
    try {
        const notifications = readNotifications();
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ADD notification schedule
app.post("/api/notifications", (req, res) => {
    try {
        const notifications = readNotifications();
        const newNotification = {
            id: Date.now(),
            time: req.body.time,
            createdAt: new Date().toISOString()
        };

        notifications.push(newNotification);
        saveNotifications(notifications);

        res.json(newNotification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE notification schedule
app.delete("/api/notifications/:id", (req, res) => {
    try {
        let notifications = readNotifications();
        notifications = notifications.filter(n => n.id != req.params.id);
        saveNotifications(notifications);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CHECK for due notifications
app.get("/api/notifications/check", async (req, res) => {
    try {
        const notifications = readNotifications();
        const currentTime = getCurrentTimeGMT7();
        const lastCheck = getLastCheckTime();
        const dueNotifications = [];
        for (const notification of notifications) {
            if (notification.time === currentTime) {
                dueNotifications.push({
                    id: notification.id,
                    title: "📌 Scheduled Notification",
                    body: `Time: ${notification.time} (GMT+7)`
                });
            }
        }
        // Save check time to avoid duplicate notifications
        if (dueNotifications.length > 0) {
            saveLastCheckTime();
            // ส่ง push notification ไปทุก subscriber
            for (const n of dueNotifications) {
                await sendPushToAll(n.title, n.body);
            }
        }
        res.json({ notifications: dueNotifications });
    } catch (error) {
        res.status(500).json({ error: error.message, notifications: [] });
    }
});

// Initialize
initializeNotificationsFile();

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Timezone: GMT+7`);
});