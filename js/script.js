// ========== THEME TOGGLE ==========
const themeToggle = document.querySelector('.theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
        showNotification(`🌟 Thème ${theme === 'light' ? 'clair' : 'sombre'} activé`, 'info');
    });
}

// ========== COUNTER ANIMATION FOR STATS ==========
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const isLarge = end > 100000; // Pour les grands nombres comme les revenus
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        
        if (isLarge) {
            element.textContent = (current / 1000000).toFixed(1) + 'M CFA';
        } else {
            element.textContent = current.toLocaleString('fr-FR');
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Animate stat values on page load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.stat-value[data-target]').forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        animateValue(stat, 0, target, 1500);
    });
});

// ========== EXPORT FUNCTIONALITY ==========
const exportBtn = document.querySelector('.export-btn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        showNotification('📥 Export en cours...', 'info');
        
        setTimeout(() => {
            const csvContent = generateCSV();
            downloadCSV(csvContent, 'moto-rides-data.csv');
            showNotification('✅ Données exportées avec succès!', 'success');
        }, 1500);
    });
}

function generateCSV() {
    const table = document.querySelector('.data-table');
    if (!table) return '';
    
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => `"${cell.textContent.trim()}"`).join(',');
    }).join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// ========== REAL-TIME NOTIFICATIONS ==========
function simulateRealTimeNotifications() {
    const notifications = [
        { message: '👥 Nouveau client inscrit!', type: 'info' },
        { message: '🏍️ Course terminée avec succès', type: 'success' },
        { message: '⚠️ Document en attente de vérification', type: 'warning' },
        { message: '💰 Paiement reçu: 3,500 CFA', type: 'success' }
    ];
    
    let index = 0;
    setInterval(() => {
        if (Math.random() > 0.7) {
            const notif = notifications[index % notifications.length];
            showNotification(notif.message, notif.type);
            updateNotificationBadge();
            index++;
        }
    }, 30000); // Every 30 seconds
}

function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const current = parseInt(badge.textContent) || 0;
        badge.textContent = current + 1;
    }
}

// Start real-time notifications
simulateRealTimeNotifications();

// ========== PAGE NAVIGATION ==========
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');

const pageNames = {
    'dashboard': 'Dashboard',
    'clients': 'Gestion des Clients',
    'drivers': 'Gestion des Conducteurs',
    'rides': 'Historique des Courses',
    'documents': 'Vérification Documents',
    'settings': 'Paramètres'
};

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Hide all pages
        pages.forEach(page => page.classList.remove('active'));
        
        // Show selected page
        const pageId = item.getAttribute('data-page');
        document.getElementById(pageId).classList.add('active');
        
        // Update page title
        pageTitle.textContent = pageNames[pageId] || 'Dashboard';
        
        // Initialize charts if on dashboard
        if (pageId === 'dashboard') {
            setTimeout(initCharts, 100);
        }
    });
});

// ========== CHARTS INITIALIZATION ==========
let ridesChart = null;
let revenueChart = null;

function initCharts() {
    // Rides Chart
    const ridesCtx = document.getElementById('ridesChart');
    if (ridesCtx && !ridesChart) {
        ridesChart = new Chart(ridesCtx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                datasets: [{
                    label: 'Courses',
                    data: [150, 180, 220, 195, 240, 310, 280],
                    borderColor: '#FFD700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#FFD700',
                    pointBorderColor: '#1A1A1A',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#E0E0E0',
                            font: { size: 12, weight: 'bold' },
                            usePointStyle: true,
                            padding: 20,
                        }
                    },
                    filler: {
                        propagate: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#888888',
                            font: { size: 11 }
                        },
                        grid: {
                            color: 'rgba(51, 51, 51, 0.3)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#888888',
                            font: { size: 11 }
                        },
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }

    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx && !revenueChart) {
        revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'],
                datasets: [{
                    label: 'Revenus (M CFA)',
                    data: [85, 92, 78, 110],
                    backgroundColor: [
                        'rgba(255, 215, 0, 0.8)',
                        'rgba(255, 215, 0, 0.8)',
                        'rgba(255, 215, 0, 0.8)',
                        'rgba(255, 215, 0, 0.9)',
                    ],
                    borderColor: '#FFD700',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'x',
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#E0E0E0',
                            font: { size: 12, weight: 'bold' },
                            usePointStyle: true,
                            padding: 20,
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#888888',
                            font: { size: 11 }
                        },
                        grid: {
                            color: 'rgba(51, 51, 51, 0.3)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#888888',
                            font: { size: 11 }
                        },
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }
}

// Initialize charts on page load
document.addEventListener('DOMContentLoaded', initCharts);

// ========== SEARCH FUNCTIONALITY ==========
const searchBar = document.querySelector('.search-bar');
const tableRows = document.querySelectorAll('.data-table tbody tr');

if (searchBar) {
    searchBar.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        tableRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
                row.style.animation = 'fadeIn 0.3s ease';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// ========== BUTTON INTERACTIONS ==========
const approveButtons = document.querySelectorAll('.btn-approve');
const rejectButtons = document.querySelectorAll('.btn-reject');

approveButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        showNotification('✓ Document approuvé!', 'success');
        e.target.closest('.doc-card').style.opacity = '0.6';
    });
});

rejectButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        showNotification('✗ Document rejeté!', 'error');
        e.target.closest('.doc-card').style.opacity = '0.6';
    });
});

// ========== NOTIFICATIONS ==========
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== ANIMATIONS ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ========== TABLE ROW INTERACTIONS ==========
document.querySelectorAll('.data-table tbody tr').forEach(row => {
    row.addEventListener('click', function() {
        // Remove active state from all rows
        document.querySelectorAll('.data-table tbody tr').forEach(r => {
            r.style.backgroundColor = '';
        });
        // Add active state to clicked row
        this.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
    });
});

// ========== LOGOUT FUNCTIONALITY ==========
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
            showNotification('Déconnexion...', 'info');
            
            // Sign out from Firebase if initialized
            if (typeof firebase !== 'undefined' && firebase.auth()) {
                await firebase.auth().signOut();
            }
            
            // Clear local storage
            localStorage.removeItem('adminSession');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    });
}

// ========== SETTINGS FORM ==========
const settingsForm = document.querySelector('.settings-form');
if (settingsForm) {
    const submitBtn = settingsForm.querySelector('.btn-primary');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('✓ Paramètres enregistrés!', 'success');
        });
    }
}

// ========== BUTTON ACTIONS ==========
document.querySelectorAll('.btn-small').forEach(btn => {
    if (!btn.disabled) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rowData = btn.closest('tr').querySelectorAll('td');
            const id = rowData[0].textContent;
            showNotification(`Détails de ${id} affichés`, 'info');
        });
    }
});

// ========== THEME TOGGLE (Optional) ==========
// You can add a theme toggle button in the header if needed
// For now, we'll keep the dark theme as default

// ========== RESPONSIVE SIDEBAR TOGGLE ==========
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
    const mainContent = document.querySelector('.main-content');
    mainContent.classList.toggle('expanded');
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchBar?.focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchBar) {
        searchBar.value = '';
        tableRows.forEach(row => row.style.display = '');
    }
});

// ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ========== PAGE LOAD ANIMATION ==========
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// ========== PRINT FUNCTIONALITY ==========
function printTable() {
    const printWindow = window.open('', '_blank');
    const table = document.querySelector('.data-table');
    printWindow.document.write(`
        <html>
            <head>
                <title>Moto Rides - Report</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #FFD700; color: black; }
                </style>
            </head>
            <body>
                ${table.outerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Add print button functionality
document.addEventListener('DOMContentLoaded', () => {
    // You can add print buttons to table cards if needed
    const tableCards = document.querySelectorAll('.table-card');
    tableCards.forEach((card, index) => {
        const printBtn = document.createElement('button');
        printBtn.className = 'btn-small';
        printBtn.textContent = '🖨️ Imprimer';
        printBtn.style.marginLeft = '10px';
        // Add to card header if you want
    });
});
