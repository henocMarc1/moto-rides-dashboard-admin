// ========== FIREBASE CONFIGURATION ==========
// Replace with your actual Firebase credentials
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let auth = null;
let db = null;

// Initialize Firebase connection
async function initFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase library not loaded. Using mock data for now.');
            return false;
        }

        // Initialize Firebase App
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        auth = firebase.auth();
        db = firebase.firestore();
        
        console.log('✓ Firebase connected successfully');
        
        // Check authentication
        await checkAdminAuth();
        
        return true;
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        return false;
    }
}

// Compatibility aliases
const initSupabase = initFirebase;
let supabaseClient = null;
let supabase = null;

// Check if user is authenticated admin
async function checkAdminAuth() {
    if (!auth) {
        console.warn('Firebase not initialized, skipping auth check');
        return true; // Allow access for testing
    }
    
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            try {
                if (!user) {
                    // Not logged in, redirect to login
                    if (!window.location.pathname.includes('login.html')) {
                        console.log('No user session, redirecting to login');
                        window.location.href = 'login.html';
                    }
                    resolve(false);
                    return;
                }
                
                console.log('✓ User session found:', user.uid);
                
                // Check if user is admin in Firestore
                const adminDoc = await db.collection('admins').doc(user.uid).get();
                
                if (!adminDoc.exists) {
                    // Not an admin, sign out and redirect
                    console.log('User is not admin, signing out');
                    await auth.signOut();
                    window.location.href = 'login.html';
                    resolve(false);
                    return;
                }
                
                const admin = adminDoc.data();
                console.log('✓ Admin verified:', admin.full_name);
                
                // Update UI with admin info
                updateAdminUI(admin);
                resolve(true);
                
            } catch (error) {
                console.error('Auth check error:', error);
                // Allow access for testing
                if (user) {
                    updateAdminUI({ full_name: user.email.split('@')[0] });
                }
                resolve(true);
            }
        });
    });
}

// Update UI with admin information
function updateAdminUI(admin) {
    const userProfile = document.querySelector('.user-profile span');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (userProfile) {
        userProfile.textContent = admin.full_name || 'Admin';
    }
    
    if (userAvatar) {
        userAvatar.textContent = (admin.full_name || 'Admin')[0].toUpperCase();
    }
}

// ========== REAL-TIME STATISTICS SUBSCRIPTIONS ==========

// 1. Subscribe to active rides count (real-time)
function subscribeToActiveRides(callback) {
    if (!db) return;

    const unsubscribe = db.collection('rides')
        .where('status', 'in', ['pending', 'accepted', 'inProgress', 'arrived'])
        .onSnapshot((snapshot) => {
            console.log('Active rides update:', snapshot.size);
            callback && callback(snapshot.size);
        }, (error) => {
            console.error('Error subscribing to active rides:', error);
        });

    return unsubscribe;
}

// Get count of active rides
async function updateActiveRidesCount(callback) {
    if (!db) return;

    try {
        const snapshot = await db.collection('rides')
            .where('status', 'in', ['pending', 'accepted', 'inProgress', 'arrived'])
            .get();

        const count = snapshot.size;
        callback && callback(count);
        return count;
    } catch (error) {
        console.error('Error getting active rides count:', error);
    }
}

// 2. Subscribe to online drivers count (real-time)
function subscribeToOnlineDrivers(callback) {
    if (!db) return;

    const unsubscribe = db.collection('drivers')
        .where('status', '==', 'available')
        .onSnapshot((snapshot) => {
            console.log('Online drivers update:', snapshot.size);
            callback && callback(snapshot.size);
        }, (error) => {
            console.error('Error subscribing to online drivers:', error);
        });

    return unsubscribe;
}

// Get count of online drivers
async function updateOnlineDriversCount(callback) {
    if (!db) return;

    try {
        const snapshot = await db.collection('drivers')
            .where('status', '==', 'available')
            .get();

        const count = snapshot.size;
        callback && callback(count);
        return count;
    } catch (error) {
        console.error('Error getting online drivers count:', error);
    }
}

// 3. Subscribe to real-time earnings (dashboard revenue)
function subscribeToEarnings(callback) {
    if (!db) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unsubscribe = db.collection('driver_earnings')
        .where('created_at', '>=', firebase.firestore.Timestamp.fromDate(today))
        .onSnapshot((snapshot) => {
            console.log('Earnings update');
            updateTodayRevenue(callback);
        }, (error) => {
            console.error('Error subscribing to earnings:', error);
        });

    return unsubscribe;
}

// Get today's revenue (platform commission)
async function updateTodayRevenue(callback) {
    if (!db) return;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const snapshot = await db.collection('driver_earnings')
            .where('created_at', '>=', firebase.firestore.Timestamp.fromDate(today))
            .get();

        let totalCommission = 0;
        snapshot.forEach(doc => {
            totalCommission += doc.data().commission || 0;
        });

        callback && callback(totalCommission);
        return totalCommission;
    } catch (error) {
        console.error('Error getting today revenue:', error);
    }
}

// 4. Subscribe to total rides today
function subscribeToDailyRides(callback) {
    if (!db) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unsubscribe = db.collection('rides')
        .where('status', '==', 'completed')
        .where('created_at', '>=', firebase.firestore.Timestamp.fromDate(today))
        .onSnapshot((snapshot) => {
            console.log('Daily rides update:', snapshot.size);
            callback && callback(snapshot.size);
        }, (error) => {
            console.error('Error subscribing to daily rides:', error);
        });

    return unsubscribe;
}

// Get today's completed rides
async function updateDailyRidesCount(callback) {
    if (!db) return;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const snapshot = await db.collection('rides')
            .where('status', '==', 'completed')
            .where('created_at', '>=', firebase.firestore.Timestamp.fromDate(today))
            .get();

        const count = snapshot.size;
        callback && callback(count);
        return count;
    } catch (error) {
        console.error('Error getting daily rides count:', error);
    }
}

// ========== REAL-TIME TABLES DATA ==========

// 5. Subscribe to recent rides (for table updates)
function subscribeToRecentRides(callback, limit = 20) {
    if (!db) return;

    const unsubscribe = db.collection('rides')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .onSnapshot((snapshot) => {
            console.log('Rides table update');
            const rides = [];
            snapshot.forEach(doc => {
                rides.push({ id: doc.id, ...doc.data() });
            });
            callback && callback(rides);
        }, (error) => {
            console.error('Error subscribing to rides:', error);
        });

    return unsubscribe;
}

// Fetch recent rides with details
async function fetchRecentRides(callback, limit = 20) {
    if (!db) return;

    try {
        const ridesSnapshot = await db.collection('rides')
            .orderBy('created_at', 'desc')
            .limit(limit)
            .get();

        const rides = [];
        for (const doc of ridesSnapshot.docs) {
            const ride = { id: doc.id, ...doc.data() };
            
            // Fetch client details
            if (ride.client_id) {
                const clientDoc = await db.collection('users').doc(ride.client_id).get();
                ride.client = clientDoc.exists ? clientDoc.data() : null;
            }
            
            // Fetch driver details
            if (ride.driver_id) {
                const driverDoc = await db.collection('drivers').doc(ride.driver_id).get();
                ride.driver = driverDoc.exists ? driverDoc.data() : null;
            }
            
            rides.push(ride);
        }

        callback && callback(rides);
        return rides;
    } catch (error) {
        console.error('Error fetching recent rides:', error);
    }
}

// 6. Subscribe to drivers list updates
function subscribeToDriversList(callback) {
    if (!db) return;

    const unsubscribe = db.collection('drivers')
        .orderBy('total_rides', 'desc')
        .onSnapshot((snapshot) => {
            console.log('Drivers list update');
            const drivers = [];
            snapshot.forEach(doc => {
                drivers.push({ id: doc.id, ...doc.data() });
            });
            callback && callback(drivers);
        }, (error) => {
            console.error('Error subscribing to drivers:', error);
        });

    return unsubscribe;
}

// Fetch drivers with details
async function fetchDriversList(callback) {
    if (!db) return;

    try {
        const snapshot = await db.collection('drivers')
            .orderBy('total_rides', 'desc')
            .get();

        const drivers = [];
        snapshot.forEach(doc => {
            drivers.push({ id: doc.id, ...doc.data() });
        });

        callback && callback(drivers);
        return drivers;
    } catch (error) {
        console.error('Error fetching drivers list:', error);
    }
}

// 7. Subscribe to clients list updates
function subscribeToClientsList(callback) {
    if (!db) return;

    const unsubscribe = db.collection('users')
        .where('user_type', '==', 'client')
        .orderBy('created_at', 'desc')
        .onSnapshot((snapshot) => {
            console.log('Clients list update');
            const clients = [];
            snapshot.forEach(doc => {
                clients.push({ id: doc.id, ...doc.data() });
            });
            callback && callback(clients);
        }, (error) => {
            console.error('Error subscribing to clients:', error);
        });

    return unsubscribe;
}

// Fetch clients with details
async function fetchClientsList(callback) {
    if (!db) return;

    try {
        const snapshot = await db.collection('users')
            .where('user_type', '==', 'client')
            .orderBy('created_at', 'desc')
            .get();

        const clients = [];
        snapshot.forEach(doc => {
            clients.push({ id: doc.id, ...doc.data() });
        });

        callback && callback(clients);
        return clients;
    } catch (error) {
        console.error('Error fetching clients list:', error);
    }
}

// ========== HELPER FUNCTIONS ==========

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF'
    }).format(amount);
}

// Format distance
function formatDistance(km) {
    return `${km.toFixed(1)} km`;
}

// Format status badge
function getStatusBadge(status) {
    const badges = {
        'completed': { class: 'completed', text: 'Complété' },
        'inProgress': { class: 'pending', text: 'En cours' },
        'pending': { class: 'pending', text: 'En attente' },
        'accepted': { class: 'pending', text: 'Accepté' },
        'cancelled': { class: 'cancelled', text: 'Annulé' },
        'available': { class: 'online', text: 'Disponible' },
        'offline': { class: 'offline', text: 'Hors ligne' },
        'onRide': { class: 'pending', text: 'En course' }
    };
    
    const badge = badges[status] || { class: 'pending', text: status };
    return `<span class="badge ${badge.class}">${badge.text}</span>`;
}

// ========== INITIALIZATION ==========

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    const isConnected = await initFirebase();
    
    if (isConnected) {
        console.log('Starting real-time subscriptions...');
        
        // Setup all subscriptions with update callbacks
        setupDashboardSubscriptions();
    } else {
        console.warn('Firebase not connected. Using simulated data.');
        setupMockData();
    }
});

// Setup all dashboard subscriptions
function setupDashboardSubscriptions() {
    // Update stat cards in real-time
    subscribeToActiveRides((count) => {
        const element = document.querySelector('[data-stat="rides"] .stat-value');
        if (element) animateValue(element, parseInt(element.textContent) || 0, count, 500);
    });

    subscribeToOnlineDrivers((count) => {
        const element = document.querySelector('[data-stat="drivers"] .stat-value');
        if (element) animateValue(element, parseInt(element.textContent) || 0, count, 500);
    });

    updateDailyRidesCount((count) => {
        const element = document.querySelector('[data-stat="rides"] .stat-value');
        if (element) animateValue(element, parseInt(element.textContent) || 0, count, 500);
    });

    updateTodayRevenue((amount) => {
        const element = document.querySelector('[data-stat="revenue"] .stat-value');
        if (element) {
            const display = (amount / 1000000).toFixed(1) + 'M CFA';
            element.textContent = display;
        }
    });

    // Update tables in real-time
    subscribeToRecentRides((rides) => {
        updateRecentRidesTable(rides);
    });

    subscribeToDriversList((drivers) => {
        updateDriversTable(drivers);
    });

    subscribeToClientsList((clients) => {
        updateClientsTable(clients);
    });
}

// Setup mock data for testing
function setupMockData() {
    console.log('Using mock data for dashboard');
    
    // Simulate real-time updates with mock data
    setInterval(() => {
        // Update random stat
        const stats = ['clients', 'drivers', 'rides', 'revenue'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        
        const element = document.querySelector(`[data-stat="${randomStat}"] .stat-value`);
        if (element) {
            const current = parseInt(element.textContent.replace(/\D/g, '')) || 0;
            const increase = Math.floor(Math.random() * 10) + 1;
            animateValue(element, current, current + increase, 300);
        }
    }, 5000);
}

// ========== TABLE UPDATE FUNCTIONS ==========

function updateRecentRidesTable(rides) {
    const tbody = document.querySelector('.table-card tbody');
    if (!tbody) return;

    // Keep only first row if empty, otherwise replace
    const rows = rides.slice(0, 10).map(ride => `
        <tr>
            <td>${ride.id.substring(0, 8)}</td>
            <td>${ride.client?.full_name || 'N/A'}</td>
            <td>${ride.driver?.full_name || 'N/A'}</td>
            <td>${formatDistance(ride.distance || 0)}</td>
            <td>${formatCurrency(ride.price || 0)}</td>
            ${getStatusBadge(ride.status)}
            <td><button class="btn-small">Détails</button></td>
        </tr>
    `).join('');

    tbody.innerHTML = rows || '<tr><td colspan="7">Aucune course</td></tr>';
}

function updateDriversTable(drivers) {
    const tbody = document.querySelector('table tbody');
    if (!tbody || !drivers) return;

    const rows = drivers.slice(0, 10).map(driver => `
        <tr>
            <td>${driver.full_name}</td>
            <td>${driver.email || 'N/A'}</td>
            <td>${driver.total_rides || 0}</td>
            <td>${(driver.rating || 0).toFixed(1)}/5 ⭐</td>
            <td>${formatCurrency(driver.total_earnings || 0)}</td>
            ${getStatusBadge(driver.status || 'offline')}
            <td><button class="btn-small">Voir</button></td>
        </tr>
    `).join('');

    tbody.innerHTML = rows || '<tr><td colspan="7">Aucun conducteur</td></tr>';
}

function updateClientsTable(clients) {
    const tbody = document.querySelector('table tbody');
    if (!tbody || !clients) return;

    const rows = clients.slice(0, 10).map(client => `
        <tr>
            <td>${client.full_name}</td>
            <td>${client.email}</td>
            <td>${client.phone || 'N/A'}</td>
            <td>${client.rides_count || 0}</td>
            <td>${formatCurrency(client.total_spent || 0)}</td>
            <span class="badge active">Actif</span>
            <td><button class="btn-small">Modifier</button></td>
        </tr>
    `).join('');

    tbody.innerHTML = rows || '<tr><td colspan="7">Aucun client</td></tr>';
}

// Export functions for use in other scripts
window.supabaseAPI = {
    initSupabase,
    subscribeToActiveRides,
    subscribeToOnlineDrivers,
    subscribeToEarnings,
    subscribeToDailyRides,
    updateTodayRevenue,
    formatCurrency,
    formatDistance,
    getStatusBadge
};
