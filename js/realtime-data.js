// ========== REAL-TIME DATA SYNC WITH SUPABASE ==========

let realtimeSubscriptions = [];

// Initialize real-time data loading
async function initRealtimeData() {
    if (!window.supabaseAPI) {
        console.error('Supabase API not initialized');
        return;
    }

    try {
        // Load all data initially
        await Promise.all([
            loadDashboardStats(),
            loadClientsList(),
            loadDriversList(),
            loadRidesList()
        ]);

        // Setup real-time subscriptions
        setupRealtimeSubscriptions();
        
        console.log('✅ Real-time data sync initialized');
    } catch (error) {
        console.error('Error initializing real-time data:', error);
        showNotification('⚠️ Erreur de chargement des données', 'error');
    }
}

// ========== DASHBOARD STATS ==========
async function loadDashboardStats() {
    try {
        // Fetch real counts from Supabase
        const [clientsResult, driversResult, ridesResult, pendingVerifications] = await Promise.all([
            supabaseAPI.supabaseClient.from('users').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0, error: true })),
            supabaseAPI.supabaseClient.from('drivers').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0, error: true })),
            supabaseAPI.supabaseClient.from('rides').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0, error: true })),
            supabaseAPI.fetchDriverVerifications('pending').catch(() => [])
        ]);

        const clientsCount = clientsResult.count || 0;
        const driversCount = driversResult.count || 0;
        const ridesCount = ridesResult.count || 0;
        const pendingDocsCount = pendingVerifications?.length || 0;

        // Calculate total revenue from completed rides
        const { data: completedRides } = await supabaseAPI.supabaseClient
            .from('rides')
            .select('total_price')
            .eq('status', 'completed')
            .catch(() => ({ data: [] }));
        
        const totalRevenue = completedRides?.reduce((sum, ride) => sum + (parseFloat(ride.total_price) || 0), 0) || 0;

        // Update mini-stats with real data (will show 0 if no data)
        updateStatCard('clients-stat', clientsCount);
        updateStatCard('drivers-stat', driversCount);
        updateStatCard('rides-stat', ridesCount);
        updateStatCard('revenue-stat', totalRevenue, true); // true for currency format

        // Update stat-change indicators
        updateStatChange('clients-stat', clientsCount);
        updateStatChange('drivers-stat', driversCount);
        updateStatChange('rides-stat', ridesCount);
        updateStatChange('revenue-stat', totalRevenue);

        // Update pending verifications badge
        const docsBadge = document.querySelector('[data-page="documents"] .badge');
        if (docsBadge && pendingDocsCount > 0) {
            docsBadge.textContent = pendingDocsCount;
            docsBadge.style.display = 'inline-block';
        } else if (docsBadge) {
            docsBadge.style.display = 'none';
        }

        // Update charts with real data
        await updateChartsWithRealData();

        // Log status
        console.log(`📊 Stats loaded: ${clientsCount} clients, ${driversCount} drivers, ${ridesCount} rides, ${totalRevenue} CFA revenue`);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Set all to 0 on error
        updateStatCard('clients-stat', 0);
        updateStatCard('drivers-stat', 0);
        updateStatCard('rides-stat', 0);
        updateStatCard('revenue-stat', 0, true);
    }
}

function updateStatCard(statId, value, isCurrency = false) {
    const statElement = document.querySelector(`[data-stat="${statId}"] .stat-value`);
    if (statElement) {
        if (isCurrency) {
            statElement.textContent = formatCurrency(value);
        } else {
            statElement.textContent = value.toLocaleString('fr-FR');
        }
    }
}

function updateStatChange(statId, value) {
    const statChangeElement = document.querySelector(`[data-stat="${statId}"] .stat-change`);
    if (statChangeElement) {
        if (value === 0) {
            statChangeElement.textContent = 'Aucune donnée';
            statChangeElement.className = 'stat-change';
        }
        // Keep existing percentage text if there's data
    }
}

// ========== CHARTS WITH REAL DATA ==========
async function updateChartsWithRealData() {
    try {
        // Get rides data for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentRides } = await supabaseAPI.supabaseClient
            .from('rides')
            .select('created_at, total_price, status')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        if (recentRides && recentRides.length > 0) {
            // Group rides by day
            const ridesByDay = groupByDay(recentRides);
            const labels = Object.keys(ridesByDay);
            const rideCounts = Object.values(ridesByDay).map(day => day.count);
            const revenueByDay = Object.values(ridesByDay).map(day => day.revenue / 1000000); // Convert to millions

            // Update rides chart
            if (window.ridesChart) {
                window.ridesChart.data.labels = labels;
                window.ridesChart.data.datasets[0].data = rideCounts;
                window.ridesChart.update();
            }

            // Get weekly revenue for the last 4 weeks
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

            const { data: monthlyRides } = await supabaseAPI.supabaseClient
                .from('rides')
                .select('created_at, total_price')
                .eq('status', 'completed')
                .gte('created_at', fourWeeksAgo.toISOString());

            if (monthlyRides && monthlyRides.length > 0) {
                const revenueByWeek = groupByWeek(monthlyRides);
                const weekLabels = Object.keys(revenueByWeek);
                const weekRevenues = Object.values(revenueByWeek).map(revenue => revenue / 1000000);

                // Update revenue chart
                if (window.revenueChart) {
                    window.revenueChart.data.labels = weekLabels;
                    window.revenueChart.data.datasets[0].data = weekRevenues;
                    window.revenueChart.update();
                }
            }
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function groupByDay(rides) {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const result = {};

    rides.forEach(ride => {
        const date = new Date(ride.created_at);
        const dayName = days[date.getDay()];
        
        if (!result[dayName]) {
            result[dayName] = { count: 0, revenue: 0 };
        }
        
        result[dayName].count++;
        if (ride.status === 'completed') {
            result[dayName].revenue += parseFloat(ride.total_price) || 0;
        }
    });

    return result;
}

function groupByWeek(rides) {
    const result = {};
    const now = new Date();

    rides.forEach(ride => {
        const date = new Date(ride.created_at);
        const weekDiff = Math.floor((now - date) / (7 * 24 * 60 * 60 * 1000));
        const weekLabel = `Semaine ${4 - weekDiff}`;
        
        if (!result[weekLabel]) {
            result[weekLabel] = 0;
        }
        
        result[weekLabel] += parseFloat(ride.total_price) || 0;
    });

    return result;
}

// ========== CLIENTS LIST ==========
async function loadClientsList() {
    try {
        const { data: clients, error } = await supabaseAPI.supabaseClient
            .from('users')
            .select('*')
            .eq('is_driver', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.querySelector('#clients .data-table tbody');
        if (!tbody) return;

        if (!clients || clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucun client pour le moment</td></tr>';
            return;
        }

        tbody.innerHTML = clients.map(client => `
            <tr data-user-id="${client.id}">
                <td>${client.name || 'N/A'}</td>
                <td>${client.email}</td>
                <td>${client.phone || 'N/A'}</td>
                <td>${client.total_rides || 0}</td>
                <td>${client.rating ? client.rating.toFixed(1) : '5.0'}/5 ⭐</td>
                <td><button class="btn-small" onclick="viewUserDetails('${client.id}')">Voir</button></td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading clients:', error);
        showNotification('⚠️ Erreur de chargement des clients', 'error');
    }
}

// ========== DRIVERS LIST ==========
async function loadDriversList() {
    try {
        const { data: drivers, error } = await supabaseAPI.supabaseClient
            .from('drivers')
            .select(`
                *,
                users!drivers_user_id_fkey (
                    name,
                    email,
                    rating,
                    total_rides
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.querySelector('#drivers .data-table tbody');
        if (!tbody) return;

        if (!drivers || drivers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Aucun conducteur pour le moment</td></tr>';
            return;
        }

        tbody.innerHTML = drivers.map(driver => {
            const user = driver.users || {};
            return `
                <tr data-driver-id="${driver.id}">
                    <td>${driver.full_name}</td>
                    <td>${driver.email}</td>
                    <td>${driver.phone}</td>
                    <td>${user.total_rides || 0}</td>
                    <td>${user.rating ? user.rating.toFixed(1) : '5.0'}/5 ⭐</td>
                    <td>
                        <span class="badge ${driver.is_verified ? 'approved' : 'pending'}">
                            ${driver.is_verified ? 'Vérifié ✓' : 'En attente'}
                        </span>
                    </td>
                    <td><button class="btn-small" onclick="viewDriverDetails('${driver.id}')">Voir</button></td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading drivers:', error);
        showNotification('⚠️ Erreur de chargement des conducteurs', 'error');
    }
}

// ========== RIDES LIST ==========
async function loadRidesList() {
    try {
        const { data: rides, error } = await supabaseAPI.supabaseClient
            .from('rides')
            .select(`
                *,
                users!rides_user_id_fkey (name, phone),
                drivers!rides_driver_id_fkey (full_name, phone)
            `)
            .order('created_at', { ascending: false })
            .limit(100); // Limit to last 100 rides

        if (error) throw error;

        const tbody = document.querySelector('#rides .data-table tbody');
        if (!tbody) return;

        if (!rides || rides.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Aucune course pour le moment</td></tr>';
            return;
        }

        tbody.innerHTML = rides.map(ride => {
            const client = ride.users || {};
            const driver = ride.drivers || {};
            return `
                <tr data-ride-id="${ride.id}">
                    <td>#${ride.id.substring(0, 8)}</td>
                    <td>${client.name || 'N/A'}</td>
                    <td>${driver.full_name || 'N/A'}</td>
                    <td>${formatAddress(ride.pickup_address)}</td>
                    <td>${formatAddress(ride.dropoff_address)}</td>
                    <td>
                        <span class="badge ${getStatusClass(ride.status)}">
                            ${getStatusLabel(ride.status)}
                        </span>
                    </td>
                    <td>${formatCurrency(ride.total_price)}</td>
                    <td><button class="btn-small" onclick="viewRideDetails('${ride.id}')">Voir</button></td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading rides:', error);
        showNotification('⚠️ Erreur de chargement des courses', 'error');
    }
}

// ========== REAL-TIME SUBSCRIPTIONS ==========
function setupRealtimeSubscriptions() {
    // Subscribe to users changes
    const usersSubscription = supabaseAPI.supabaseClient
        .channel('users-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
            console.log('Users change detected:', payload);
            loadClientsList();
            loadDashboardStats();
            showNotification('📥 Données clients mises à jour', 'info');
        })
        .subscribe();

    // Subscribe to drivers changes
    const driversSubscription = supabaseAPI.supabaseClient
        .channel('drivers-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, (payload) => {
            console.log('Drivers change detected:', payload);
            loadDriversList();
            loadDashboardStats();
            showNotification('📥 Données conducteurs mises à jour', 'info');
        })
        .subscribe();

    // Subscribe to rides changes
    const ridesSubscription = supabaseAPI.supabaseClient
        .channel('rides-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, (payload) => {
            console.log('Rides change detected:', payload);
            loadRidesList();
            loadDashboardStats();
            
            if (payload.eventType === 'INSERT') {
                showNotification('🏍️ Nouvelle course créée!', 'success');
            } else if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
                showNotification('✅ Course terminée!', 'success');
            }
        })
        .subscribe();

    // Subscribe to driver verifications changes
    const verificationsSubscription = supabaseAPI.supabaseClient
        .channel('verifications-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_verifications' }, (payload) => {
            console.log('Verifications change detected:', payload);
            loadDashboardStats();
            
            if (payload.eventType === 'INSERT') {
                showNotification('📄 Nouveau document à vérifier!', 'warning');
            }
        })
        .subscribe();

    // Store subscriptions for cleanup
    realtimeSubscriptions = [usersSubscription, driversSubscription, ridesSubscription, verificationsSubscription];
}

// ========== UTILITY FUNCTIONS ==========
function formatCurrency(amount) {
    if (!amount) return '0 CFA';
    const num = parseFloat(amount);
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M CFA';
    }
    return num.toLocaleString('fr-FR') + ' CFA';
}

function formatAddress(address) {
    if (!address) return 'N/A';
    return address.length > 30 ? address.substring(0, 30) + '...' : address;
}

function getStatusClass(status) {
    const statusMap = {
        'pending': 'pending',
        'accepted': 'info',
        'in_progress': 'warning',
        'completed': 'approved',
        'cancelled': 'rejected'
    };
    return statusMap[status] || 'pending';
}

function getStatusLabel(status) {
    const labelMap = {
        'pending': 'En attente',
        'accepted': 'Acceptée',
        'in_progress': 'En cours',
        'completed': 'Terminée',
        'cancelled': 'Annulée'
    };
    return labelMap[status] || status;
}

// ========== DETAIL VIEW FUNCTIONS ==========
window.viewUserDetails = async function(userId) {
    try {
        const { data: user, error } = await supabaseAPI.supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: #1A1A1A; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; border: 2px solid #FFD700;">
                <h2 style="color: #FFD700; margin-top: 0;">Détails du Client</h2>
                <p><strong>Nom:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Téléphone:</strong> ${user.phone || 'N/A'}</p>
                <p><strong>Adresse:</strong> ${user.address || 'N/A'}</p>
                <p><strong>Courses totales:</strong> ${user.total_rides || 0}</p>
                <p><strong>Note:</strong> ${user.rating || 5.0}/5 ⭐</p>
                <p><strong>Inscrit le:</strong> ${new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #FFD700; color: #000; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Fermer</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (error) {
        console.error('Error viewing user details:', error);
        showNotification('⚠️ Erreur de chargement des détails', 'error');
    }
};

window.viewDriverDetails = async function(driverId) {
    try {
        const { data: driver, error } = await supabaseAPI.supabaseClient
            .from('drivers')
            .select(`
                *,
                users!drivers_user_id_fkey (*)
            `)
            .eq('id', driverId)
            .single();

        if (error) throw error;

        const user = driver.users || {};
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: #1A1A1A; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; border: 2px solid #FFD700;">
                <h2 style="color: #FFD700; margin-top: 0;">Détails du Conducteur</h2>
                <p><strong>Nom:</strong> ${driver.full_name}</p>
                <p><strong>Email:</strong> ${driver.email}</p>
                <p><strong>Téléphone:</strong> ${driver.phone}</p>
                <p><strong>Type de véhicule:</strong> ${driver.vehicle_type || 'N/A'}</p>
                <p><strong>Plaque:</strong> ${driver.vehicle_plate || 'N/A'}</p>
                <p><strong>Permis N°:</strong> ${driver.license_number || 'N/A'}</p>
                <p><strong>Courses totales:</strong> ${user.total_rides || 0}</p>
                <p><strong>Note:</strong> ${user.rating || 5.0}/5 ⭐</p>
                <p><strong>Statut:</strong> <span class="badge ${driver.is_verified ? 'approved' : 'pending'}">${driver.is_verified ? 'Vérifié ✓' : 'En attente'}</span></p>
                <p><strong>Inscrit le:</strong> ${new Date(driver.created_at).toLocaleDateString('fr-FR')}</p>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #FFD700; color: #000; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Fermer</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (error) {
        console.error('Error viewing driver details:', error);
        showNotification('⚠️ Erreur de chargement des détails', 'error');
    }
};

window.viewRideDetails = async function(rideId) {
    try {
        const { data: ride, error } = await supabaseAPI.supabaseClient
            .from('rides')
            .select(`
                *,
                users!rides_user_id_fkey (*),
                drivers!rides_driver_id_fkey (*)
            `)
            .eq('id', rideId)
            .single();

        if (error) throw error;

        const client = ride.users || {};
        const driver = ride.drivers || {};
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10000; overflow-y: auto;
        `;
        
        modal.innerHTML = `
            <div style="background: #1A1A1A; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; border: 2px solid #FFD700; margin: 20px;">
                <h2 style="color: #FFD700; margin-top: 0;">Détails de la Course #${ride.id.substring(0, 8)}</h2>
                
                <h3 style="color: #FFD700; margin-top: 20px;">Client</h3>
                <p><strong>Nom:</strong> ${client.name || 'N/A'}</p>
                <p><strong>Téléphone:</strong> ${client.phone || 'N/A'}</p>
                
                <h3 style="color: #FFD700; margin-top: 20px;">Conducteur</h3>
                <p><strong>Nom:</strong> ${driver.full_name || 'N/A'}</p>
                <p><strong>Téléphone:</strong> ${driver.phone || 'N/A'}</p>
                
                <h3 style="color: #FFD700; margin-top: 20px;">Trajet</h3>
                <p><strong>Départ:</strong> ${ride.pickup_address || 'N/A'}</p>
                <p><strong>Arrivée:</strong> ${ride.dropoff_address || 'N/A'}</p>
                <p><strong>Distance:</strong> ${ride.distance ? (ride.distance / 1000).toFixed(2) + ' km' : 'N/A'}</p>
                <p><strong>Durée:</strong> ${ride.duration ? Math.round(ride.duration / 60) + ' min' : 'N/A'}</p>
                
                <h3 style="color: #FFD700; margin-top: 20px;">Détails</h3>
                <p><strong>Statut:</strong> <span class="badge ${getStatusClass(ride.status)}">${getStatusLabel(ride.status)}</span></p>
                <p><strong>Prix:</strong> ${formatCurrency(ride.total_price)}</p>
                <p><strong>Mode de paiement:</strong> ${ride.payment_method || 'N/A'}</p>
                <p><strong>Créée le:</strong> ${new Date(ride.created_at).toLocaleString('fr-FR')}</p>
                ${ride.completed_at ? `<p><strong>Terminée le:</strong> ${new Date(ride.completed_at).toLocaleString('fr-FR')}</p>` : ''}
                
                <button onclick="this.parentElement.parentElement.remove()" style="background: #FFD700; color: #000; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Fermer</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (error) {
        console.error('Error viewing ride details:', error);
        showNotification('⚠️ Erreur de chargement des détails', 'error');
    }
};

// ========== CLEANUP ON PAGE UNLOAD ==========
window.addEventListener('beforeunload', () => {
    realtimeSubscriptions.forEach(sub => {
        if (sub && sub.unsubscribe) {
            sub.unsubscribe();
        }
    });
});

// ========== INITIALIZE ON SUPABASE READY ==========
function waitForSupabase() {
    return new Promise((resolve) => {
        const checkSupabase = () => {
            if (window.supabaseAPI && window.supabaseAPI.supabaseClient) {
                console.log('✅ Supabase ready, initializing real-time data...');
                resolve();
            } else {
                console.log('⏳ Waiting for Supabase...');
                setTimeout(checkSupabase, 500);
            }
        };
        checkSupabase();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await waitForSupabase();
        await initRealtimeData();
    });
} else {
    waitForSupabase().then(() => initRealtimeData());
}

// Re-load data when switching tabs
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const pageId = item.getAttribute('data-page');
        
        setTimeout(() => {
            switch(pageId) {
                case 'dashboard':
                    loadDashboardStats();
                    break;
                case 'clients':
                    loadClientsList();
                    break;
                case 'drivers':
                    loadDriversList();
                    break;
                case 'rides':
                    loadRidesList();
                    break;
            }
        }, 100);
    });
});
