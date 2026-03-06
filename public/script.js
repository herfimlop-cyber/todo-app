const API = "/api/todos";
const NOTIFICATIONS_API = "/api/notifications";

// Register Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully:', registration);
            
            // Try to register periodic sync
            if ('periodicSync' in registration) {
                try {
                    await registration.periodicSync.register('check-notifications', {
                        minInterval: 15 * 60 * 1000 // Check every 15 minutes
                    });
                    console.log('Periodic sync registered');
                } catch (error) {
                    console.log('Periodic sync not supported:', error);
                }
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// Request Notification Permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        updatePermissionStatus('not-supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        updatePermissionStatus('granted');
        startNotificationCheck();
        return true;
    }

    if (Notification.permission !== 'denied') {
        try {
            const permission = await Notification.requestPermission();
            updatePermissionStatus(permission);
            
            if (permission === 'granted') {
                startNotificationCheck();
                return true;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            updatePermissionStatus('error');
        }
    } else {
        updatePermissionStatus('denied');
    }

    return false;
}

function updatePermissionStatus(status) {
    const statusElement = document.getElementById('permissionStatus');
    
    if (status === 'granted') {
        statusElement.textContent = '✓ Notification permission granted';
        statusElement.className = 'permission-status granted';
    } else if (status === 'denied') {
        statusElement.textContent = '✗ Notification permission denied. Go to browser settings to enable.';
        statusElement.className = 'permission-status denied';
    } else if (status === 'default') {
        statusElement.textContent = 'Click button below to allow notifications';
        statusElement.className = 'permission-status default';
    } else if (status === 'not-supported') {
        statusElement.textContent = 'Your browser does not support notifications';
        statusElement.className = 'permission-status denied';
    } else {
        statusElement.textContent = 'Error checking notification permission';
        statusElement.className = 'permission-status denied';
    }
}

// Check and start notification checking
function startNotificationCheck() {
    // Tell service worker to start checking
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CHECK_NOTIFICATIONS'
        });
        console.log('[App] Service Worker notification check enabled');
    }
    
    // Also check from main thread every second when app is active
    setInterval(checkNotifications, 1000);
}

async function checkNotifications() {
    try {
        const response = await fetch(NOTIFICATIONS_API + '/check');
        const data = await response.json();
        
        if (data.notifications && Array.isArray(data.notifications)) {
            for (const notification of data.notifications) {
                if (Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.body,
                        tag: `notification-${notification.id}`,
                        requireInteraction: false
                    });
                } else if (Notification.permission !== 'denied') {
                    // Try to get permission and show notification
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                        new Notification(notification.title, {
                            body: notification.body,
                            tag: `notification-${notification.id}`,
                            requireInteraction: false
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

// Add notification schedule
async function addNotificationSchedule() {
    const input = document.getElementById('notificationTime');
    const time = input.value;
    
    if (!time) {
        alert('Please select a time');
        return;
    }
    
    try {
        const response = await fetch(NOTIFICATIONS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time })
        });
        
        if (!response.ok) {
            throw new Error('Failed to add notification schedule');
        }
        
        input.value = '';
        loadNotificationSchedules();
        
        // Request permission if not already granted
        if (Notification.permission !== 'granted') {
            requestNotificationPermission();
        }
    } catch (error) {
        console.error('Error adding notification schedule:', error);
        alert('Error adding notification schedule');
    }
}

// Load notification schedules
async function loadNotificationSchedules() {
    try {
        const response = await fetch(NOTIFICATIONS_API);
        const schedules = await response.json();
        
        const list = document.getElementById('notificationsList');
        list.innerHTML = '';
        
        if (!schedules || schedules.length === 0) {
            list.innerHTML = '<div class="empty-message">No scheduled notifications yet</div>';
            return;
        }
        
        schedules.forEach(schedule => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="notification-time">${schedule.time}</span>
                <button class="danger" onclick="deleteNotificationSchedule(${schedule.id})">Delete</button>
            `;
            list.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading notification schedules:', error);
    }
}

// Delete notification schedule
async function deleteNotificationSchedule(id) {
    try {
        const response = await fetch(NOTIFICATIONS_API + '/' + id, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete notification schedule');
        }
        
        loadNotificationSchedules();
    } catch (error) {
        console.error('Error deleting notification schedule:', error);
        alert('Error deleting notification schedule');
    }
}

// Original Todo functions
async function loadTodos() {
    const res = await fetch(API);
    const todos = await res.json();

    const list = document.getElementById("list");
    list.innerHTML = "";

    if (!todos || todos.length === 0) {
        list.innerHTML = '<div class="empty-message">No todos yet. Add one to get started!</div>';
        return;
    }

    todos.forEach(todo => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${todo.text}</span>
            <button class="danger" onclick="deleteTodo(${todo.id})">Delete</button>
        `;
        list.appendChild(li);
    });
}

async function addTodo() {
    const input = document.getElementById("todoInput");
    
    if (!input.value.trim()) {
        return;
    }

    try {
        await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: input.value
            })
        });

        input.value = "";
        loadTodos();
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('Error adding todo');
    }
}

async function deleteTodo(id) {
    try {
        await fetch(API + "/" + id, {
            method: "DELETE"
        });

        loadTodos();
    } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Error deleting todo');
    }
}

// Initialize app
async function initApp() {
    // Register Service Worker
    await registerServiceWorker();
    
    // Check notification permission
    updatePermissionStatus(Notification.permission || 'default');
    
    if (Notification.permission === 'granted') {
        startNotificationCheck();
    }
    
    // Load initial data
    loadTodos();
    loadNotificationSchedules();
}

// Start the app
initApp();