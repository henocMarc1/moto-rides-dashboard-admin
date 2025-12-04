// ========== FIREBASE AUTHENTICATION + SUPABASE DATABASE ==========
// Firebase pour l'authentification uniquement
const firebaseConfig = {
    apiKey: "AIzaSyDEpmj_ecsZukMRZAxcnt5xgaBO1hjeefY",
    authDomain: "loca-moto.firebaseapp.com",
    projectId: "loca-moto",
    storageBucket: "loca-moto.firebasestorage.app",
    messagingSenderId: "348767056002",
    appId: "1:348767056002:web:8ffbf9d07bafd18def849b",
    measurementId: "G-E0BGTJD610"
};

// Supabase pour la base de données
const SUPABASE_URL = 'https://pmlzqzvylfjpnabsowvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbHpxenZ5bGZqcG5hYnNvd3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNTg4NDIsImV4cCI6MjA0ODgzNDg0Mn0.BahEcFCmpnLaWVqkn1SkMwrRwwrNFuuDbYu1N8Gd5BE';

// Initialize Firebase Auth
let auth = null;

// Initialize Supabase Client
let supabaseClient = null;
let db = null; // Alias pour compatibilité

// Initialize both services
async function initFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase library not loaded.');
            return false;
        }

        // Initialize Firebase App for Authentication
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        auth = firebase.auth();
        console.log('✓ Firebase Auth connected successfully');
        
        // Initialize Supabase for Database
        if (typeof window.supabase !== 'undefined') {
            const { createClient } = window.supabase;
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            db = supabaseClient; // Alias
            console.log('✓ Supabase Database connected successfully');
        } else {
            console.warn('⚠️ Supabase library not loaded - database features disabled');
        }
        
        // Check authentication
        await checkAdminAuth();
        
        return true;
    } catch (error) {
        console.error('Failed to initialize:', error);
        return false;
    }
}

// Compatibility aliases
const initSupabase = initFirebase;
let supabase = supabaseClient;

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
                
                console.log('✓ User session found (Firebase):', user.uid);
                
                // Check if user is admin in Supabase database
                if (!supabaseClient) {
                    console.warn('⚠️ Supabase not available, skipping admin check');
                    updateAdminUI({ full_name: user.email.split('@')[0] });
                    resolve(true);
                    return;
                }
                
                const { data: admin, error } = await supabaseClient
                    .from('admins')
                    .select('*')
                    .eq('id', user.uid)
                    .single();
                
                if (error || !admin) {
                    console.log('❌ User is not admin in database, signing out');
                    await auth.signOut();
                    window.location.href = 'login.html';
                    resolve(false);
                    return;
                }
                
                console.log('✓ Admin verified (Supabase):', admin.full_name);
                
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
    if (!supabaseClient) return;

    const subscription = supabaseClient
        .channel('active_rides')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'rides',
                filter: `status=in.(pending,accepted,inProgress,arrived)`
            },
            (payload) => {
                console.log('Active rides update:', payload);
                updateActiveRidesCount(callback);
            }
        )
        .subscribe();

    return subscription;
}

// Get count of active rides
async function updateActiveRidesCount(callback) {
    if (!supabaseClient) return;

    try {
        const { count } = await supabaseClient
            .from('rides')
            .select('id', { count: 'exact', head: true })
            .in('status', ['pending', 'accepted', 'inProgress', 'arrived']);

        callback && callback(count || 0);
        return count || 0;
    } catch (error) {
        console.error('Error getting active rides count:', error);
    }
}

// 2. Subscribe to online drivers count (real-time)
function subscribeToOnlineDrivers(callback) {
    if (!supabaseClient) return;

    const subscription = supabaseClient
        .channel('online_drivers')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'drivers',
                filter: `status=eq.available`
            },
            (payload) => {
                console.log('Online drivers update:', payload);
                updateOnlineDriversCount(callback);
            }
        )
        .subscribe();

    return subscription;
}

// Get count of online drivers
async function updateOnlineDriversCount(callback) {
    if (!supabaseClient) return;

    try {
        const { count } = await supabaseClient
            .from('drivers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'available');

        callback && callback(count || 0);
        return count || 0;
    } catch (error) {
        console.error('Error getting online drivers count:', error);
    }
}

// 3. Subscribe to real-time earnings (dashboard revenue)
function subscribeToEarnings(callback) {
    if (!supabaseClient) return;

    const subscription = supabaseClient
        .channel('earnings_real_time')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'driver_earnings'
            },
            (payload) => {
                console.log('New earning recorded:', payload);
                updateTodayRevenue(callback);
            }
        )
        .subscribe();

    return subscription;
}

// Get today's revenue (platform commission)
async function updateTodayRevenue(callback) {
    if (!supabaseClient) return;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabaseClient
            .from('driver_earnings')
            .select('commission')
            .gte('created_at', today.toISOString());

        if (error) throw error;

        const totalCommission = (data || []).reduce((sum, e) => sum + (e.commission || 0), 0);
        callback && callback(totalCommission);
        return totalCommission;
    } catch (error) {
        console.error('Error getting today revenue:', error);
    }
}

// 4. Subscribe to total rides today
function subscribeToDailyRides(callback) {
    if (!supabaseClient) return;

    const subscription = supabaseClient
        .channel('daily_rides')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'rides',
                filter: `status=eq.completed`
            },
            (payload) => {
                console.log('Ride completed:', payload);
                updateDailyRidesCount(callback);
            }
        )
        .subscribe();

    return subscription;
}

// Get today's completed rides
async function updateDailyRidesCount(callback) {
    if (!supabaseClient) return;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count } = await supabaseClient
            .from('rides')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('created_at', today.toISOString());

        callback && callback(count || 0);
        return count || 0;
    } catch (error) {
        console.error('Error getting daily rides count:', error);
    }
}

// ========== REAL-TIME TABLES DATA ==========

// 5. Subscribe to recent rides (for table updates)
function subscribeToRecentRides(callback, limit = 20) {
    if (!supabaseClient) return;

    const subscription = supabaseClient
        .channel('recent_rides')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'rides'
            },
            (payload) => {
                console.log('Rides table update:', payload);
                fetchRecentRides(callback, limit);
            }
        )
        .subscribe();

    return subscription;
}

// Fetch recent rides with details
async function fetchRecentRides(callback, limit = 20) {
    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('rides')
            .select(`
                id,
                status,
                distance,
                price,
                created_at,
                users!client_id (id, full_name),
                drivers!driver_id (id, full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        callback && callback(data || []);
        return data || [];
    } catch (error) {
        console.error('Error fetching recent rides:', error);
    }
}

// 6. Subscribe to drivers list updates
function subscribeToDriversList(callback) {
    if (!supabaseClient) return;

    const subscription = supabaseClient
        .channel('drivers_list')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'drivers'
            },
            (payload) => {
                console.log('Drivers list update:', payload);
                fetchDriversList(callback);
            }
        )
        .subscribe();

    return subscription;
}

// Fetch drivers with details
async function fetchDriversList(callback) {
    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('drivers')
            .select('id, full_name, email, phone, status, rating, total_rides, total_earnings')
            .order('total_rides', { ascending: false });

        if (error) throw error;
        callback && callback(data || []);
        return data || [];
    } catch (error) {
        console.error('Error fetching drivers list:', error);
    }
}

// 7. Subscribe to clients list updates
function subscribeToClientsList(callback) {
    if (!supabaseClient) return;

    const subscription = supabaseClient
        .channel('clients_list')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'users'
            },
            (payload) => {
                console.log('Clients list update:', payload);
                fetchClientsList(callback);
            }
        )
        .subscribe();

    return subscription;
}

// Fetch clients with details
async function fetchClientsList(callback) {
    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, full_name, email, phone, total_spent, rides_count, created_at')
            .eq('user_type', 'client')
            .order('created_at', { ascending: false });

        if (error) throw error;
        callback && callback(data || []);
        return data || [];
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
