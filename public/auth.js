// API Base URL
const API_URL = 'http://localhost:5000/api';

// Login Function
async function login(email, password, role) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            alert('Login successful!');
            window.location.href = 'index.html';
        } else {
            alert(data.msg || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

// Register Function
async function register(name, email, password, role) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            alert('Registration successful!');
            window.location.href = 'index.html';
        } else {
            alert(data.msg || 'Registration failed');
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('An error occurred during registration');
    }
}

// Fetch Events for Homepage
async function fetchHighlightedEvents() {
    try {
        const response = await fetch(`${API_URL}/events/highlighted`);
        const events = await response.json();
        
        // Update the events carousel with real data
        displayEvents(events);
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

function displayEvents(events) {
    const carousel = document.getElementById('eventsCarousel');
    if (!carousel) return;

    carousel.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-image">
                <img src="${event.image}" alt="${event.title}">
                <div class="event-badge">Upcoming</div>
            </div>
            <div class="event-content">
                <h3>${event.title}</h3>
                <p class="event-date"><i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString()}</p>
                <p class="event-time"><i class="fas fa-clock"></i> ${event.time}</p>
                <p class="event-desc">${event.description}</p>
                <button class="btn-event">Register Now</button>
            </div>
        </div>
    `).join('');
}

// Load events on page load
if (document.getElementById('eventsCarousel')) {
    fetchHighlightedEvents();
}