async function updateUI() {
    try {
        const response = await fetch('/api/state');
        const state = await response.json();
        
        // Update Progress Circle
        const percentage = Math.min((state.current_ml / state.goal_ml) * 100, 100);
        const circle = document.getElementById('progress-circle');
        const offset = 283 - (283 * percentage) / 100;
        circle.style.strokeDashoffset = offset;
        
        // Update Text
        document.getElementById('percentage').innerText = `${Math.round(percentage)}%`;
        document.getElementById('current-ml').innerText = `${state.current_ml} ml`;
        document.getElementById('goal-ml').innerText = `${state.goal_ml} ml`;
        document.getElementById('interval-input').value = state.reminder_interval_minutes;
        
        // Update Logs
        const logList = document.getElementById('log-list');
        logList.innerHTML = state.logs.map(log => `
            <div class="log-item">
                <span class="time">${log.time}</span>
                <span class="amt">+${log.amount}ml</span>
            </div>
        `).reverse().join('');

    } catch (err) {
        console.error("Failed to fetch state:", err);
    }
}

async function addWater(amount) {
    try {
        const response = await fetch(`/api/add?amount=${amount}`, { method: 'POST' });
        await response.json();
        updateUI();
        showNotification(`HYDRATION_SYNC: +${amount}ml`);
        createExplosionDroplets();
        // Reset reminder timer on drinking
        resetReminderTimer();
    } catch (err) {
        console.error("Failed to add water:", err);
    }
}

let lastHydrationTime = Date.now();
let reminderInterval = 60; // default minutes

async function updateInterval() {
    const mins = document.getElementById('interval-input').value;
    try {
        await fetch(`/api/set_interval?minutes=${mins}`, { method: 'POST' });
        reminderInterval = parseInt(mins);
        showNotification(`SYNC: INTERVAL_UPDATED -> ${mins}m`);
        resetReminderTimer();
    } catch (err) {
        console.error("Failed to set interval:", err);
    }
}

function resetReminderTimer() {
    lastHydrationTime = Date.now();
    updateReminderDisplay();
}

function updateReminderDisplay() {
    const nextTime = new Date(lastHydrationTime + reminderInterval * 60 * 1000);
    const hrs = String(nextTime.getHours()).padStart(2, '0');
    const mins = String(nextTime.getMinutes()).padStart(2, '0');
    
    const now = Date.now();
    const diff = (lastHydrationTime + reminderInterval * 60 * 1000) - now;
    const diffMins = Math.floor(diff / (1000 * 60));
    const diffSecs = Math.floor((diff / 1000) % 60);
    
    const countdownStr = diff > 0 ? ` [${diffMins}m ${diffSecs}s]` : " [OVERDUE!]";
    document.getElementById('next-reminder-info').innerText = `NEXT_DRINK: ${hrs}:${mins}${countdownStr}`;
}

// Check reminders every second
setInterval(() => {
    const now = Date.now();
    const timeSinceLast = (now - lastHydrationTime) / (1000 * 60);
    
    if (timeSinceLast >= reminderInterval) {
        showNotification("CRITICAL: TIME TO DRINK WATER", true);
        createExplosionDroplets(); 
        lastHydrationTime = now; // Reset to now so it doesn't spam every second
        updateReminderDisplay();
    }
    updateReminderDisplay();
}, 1000);

function showNotification(text, critical = false) {
    const container = document.getElementById('notifications');
    const notif = document.createElement('div');
    notif.className = 'notif';
    if (critical) notif.style.borderColor = '#ef4444'; // Red border for critical
    notif.innerHTML = `
        <div style="color:${critical ? '#ef4444' : 'var(--aqua)'}; font-weight:bold; margin-bottom:4px;">SYSTEM_MSG</div>
        <div>${text}</div>
    `;
    container.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(20px)';
        setTimeout(() => notif.remove(), 500);
    }, critical ? 10000 : 3000);
}

// Procedural Droplets
function createDroplet() {
    const droplet = document.createElement('div');
    droplet.className = 'droplet';
    
    const size = Math.random() * 15 + 5;
    droplet.style.width = `${size}px`;
    droplet.style.height = `${size}px`;
    
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;
    
    droplet.style.left = `${startX}px`;
    droplet.style.top = `${startY}px`;
    
    document.body.appendChild(droplet);
    
    const duration = Math.random() * 10 + 10;
    const xMove = (Math.random() - 0.5) * 200;
    const yMove = (Math.random() - 0.5) * 200;
    
    droplet.animate([
        { transform: 'translate(0, 0)', opacity: 0 },
        { transform: `translate(${xMove/2}px, ${yMove/2}px)`, opacity: 0.8, offset: 0.1 },
        { transform: `translate(${xMove}px, ${yMove}px)`, opacity: 0 }
    ], {
        duration: duration * 1000,
        iterations: Infinity
    });
}

function createExplosionDroplets() {
    for(let i=0; i<10; i++) {
        const droplet = document.createElement('div');
        droplet.className = 'droplet';
        const size = Math.random() * 10 + 5;
        droplet.style.width = `${size}px`;
        droplet.style.height = `${size}px`;
        
        // Center of the phone
        const rect = document.querySelector('.phone-frame').getBoundingClientRect();
        droplet.style.left = `${rect.left + rect.width/2}px`;
        droplet.style.top = `${rect.top + rect.height/2}px`;
        
        document.body.appendChild(droplet);
        
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 200 + 100;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        
        const anim = droplet.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${x}px, ${y}px) scale(0)`, opacity: 0 }
        ], {
            duration: 2000,
            easing: 'cubic-bezier(0, .9, .5, 1)'
        });
        
        anim.onfinish = () => droplet.remove();
    }
}

// Initialize
for(let i=0; i<20; i++) createDroplet();
updateUI();
updateReminderDisplay();

// Time update
setInterval(() => {
    const now = new Date();
    document.getElementById('current-time').innerText = 
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}, 1000);
