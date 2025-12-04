// ========== DRIVER VERIFICATIONS MANAGEMENT ==========

let currentVerifications = [];
let selectedVerification = null;

// Load pending verifications
async function loadPendingVerifications() {
    console.log('Loading pending verifications...');
    
    try {
        const verifications = await window.supabaseAPI.fetchDriverVerifications('pending');
        currentVerifications = verifications;
        renderVerificationsGrid(verifications);
    } catch (error) {
        console.error('Error loading verifications:', error);
        showNotification('Erreur lors du chargement des vérifications', 'error');
    }
}

// Render verifications grid
function renderVerificationsGrid(verifications) {
    const grid = document.querySelector('.documents-grid');
    if (!grid) return;

    if (verifications.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px;">Aucune vérification en attente</p>';
        return;
    }

    grid.innerHTML = verifications.map(v => `
        <div class="doc-card ${v.status}" data-verification-id="${v.id}">
            <div class="doc-image">
                ${v.motorcycle_photo_url ? `
                    <img src="${v.motorcycle_photo_url}" alt="Moto" style="width: 100%; height: 100%; object-fit: cover;">
                ` : `
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 10H15V5C15 3.9 14.1 3 13 3H11C9.9 3 9 3.9 9 5V10H5C3.9 10 3 10.9 3 12V14C3 15.1 3.9 16 5 16H6V21C6 22.1 6.9 23 8 23C9.1 23 10 22.1 10 21V16H14V21C14 22.1 14.9 23 16 23C17.1 23 18 22.1 18 21V16H19C20.1 16 21 15.1 21 14V12C21 10.9 20.1 10 19 10ZM15 10H9V5H15V10Z" fill="currentColor"/>
                    </svg>
                `}
            </div>
            <div class="doc-info">
                <div class="doc-header">
                    <h3>${v.drivers?.full_name || 'Conducteur'}</h3>
                    <span class="badge ${v.status}">${getStatusLabel(v.status)}</span>
                </div>
                <div class="doc-details">
                    <p><strong>Email:</strong> ${v.drivers?.email || 'N/A'}</p>
                    <p><strong>Téléphone:</strong> ${v.drivers?.phone || 'N/A'}</p>
                    <p><strong>Permis:</strong> ${v.drivers?.license_number || 'N/A'}</p>
                    <p><strong>Moto:</strong> ${v.motorcycle_color || ''} ${v.motorcycle_model || 'Non spécifiée'}</p>
                    <p><strong>Plaque:</strong> ${v.motorcycle_plate || 'N/A'}</p>
                    <p><strong>Soumis:</strong> ${formatDate(v.submitted_at)}</p>
                </div>
                <div class="doc-actions">
                    ${v.status === 'pending' ? `
                        <button class="btn-approve" onclick="approveVerification('${v.id}')">✓ Valider</button>
                        <button class="btn-reject" onclick="showRejectModal('${v.id}')">✗ Refuser</button>
                    ` : ''}
                    <button class="btn-view" onclick="viewVerificationDetails('${v.id}')">👁 Détails</button>
                </div>
            </div>
        </div>
    `).join('');

    // Update stats
    updateVerificationStats();
}

// Get status label
function getStatusLabel(status) {
    const labels = {
        'pending': 'En attente',
        'in_review': 'En examen',
        'approved': 'Approuvé',
        'rejected': 'Refusé'
    };
    return labels[status] || status;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Approve verification
async function approveVerification(verificationId, adminNotes = '') {
    if (!confirm('Êtes-vous sûr de vouloir approuver cette vérification ?')) return;

    try {
        const success = await window.supabaseAPI.approveDriverVerification(verificationId, adminNotes);
        
        if (success) {
            showNotification('✓ Vérification approuvée avec succès', 'success');
            await loadPendingVerifications();
        } else {
            showNotification('Erreur lors de l\'approbation', 'error');
        }
    } catch (error) {
        console.error('Error approving verification:', error);
        showNotification('Erreur lors de l\'approbation', 'error');
    }
}

// Show reject modal
function showRejectModal(verificationId) {
    const reason = prompt('Motif du refus:');
    if (reason === null) return;

    const notes = prompt('Notes additionnelles (optionnel):') || '';
    rejectVerification(verificationId, reason, notes);
}

// Reject verification
async function rejectVerification(verificationId, reason = '', notes = '') {
    try {
        const success = await window.supabaseAPI.rejectDriverVerification(verificationId, reason, notes);
        
        if (success) {
            showNotification('✓ Vérification refusée', 'success');
            await loadPendingVerifications();
        } else {
            showNotification('Erreur lors du refus', 'error');
        }
    } catch (error) {
        console.error('Error rejecting verification:', error);
        showNotification('Erreur lors du refus', 'error');
    }
}

// View verification details
async function viewVerificationDetails(verificationId) {
    try {
        const details = await window.supabaseAPI.getDriverVerificationDetails(verificationId);
        
        if (!details) {
            showNotification('Impossible de charger les détails', 'error');
            return;
        }

        // Build details HTML
        let detailsHTML = `
            <div class="verification-details-modal">
                <div class="modal-header">
                    <h2>Détails de la Vérification</h2>
                    <span class="badge ${details.status}">${getStatusLabel(details.status)}</span>
                </div>
                
                <div class="modal-content">
                    <div class="driver-info">
                        <h3>Informations du Conducteur</h3>
                        <p><strong>Nom:</strong> ${details.drivers?.full_name || 'N/A'}</p>
                        <p><strong>Email:</strong> ${details.drivers?.email || 'N/A'}</p>
                        <p><strong>Téléphone:</strong> ${details.drivers?.phone || 'N/A'}</p>
                        <p><strong>Permis:</strong> ${details.drivers?.license_number || 'N/A'}</p>
                        <p><strong>Type Véhicule:</strong> ${details.drivers?.vehicle_type || 'N/A'}</p>
                    </div>

                    <div class="bike-info">
                        <h3>Informations de la Moto</h3>
                        <p><strong>Modèle:</strong> ${details.motorcycle_model || 'N/A'}</p>
                        <p><strong>Couleur:</strong> ${details.motorcycle_color || 'N/A'}</p>
                        <p><strong>Plaque:</strong> ${details.motorcycle_plate || 'N/A'}</p>
                    </div>

                    <div class="photos-section">
                        <h3>Photos Soumises</h3>
                        <div class="photos-grid">
                            ${details.identity_photo_url ? `
                                <div class="photo-item">
                                    <label>Carte d'Identité</label>
                                    <img src="${details.identity_photo_url}" alt="Identité" onclick="window.open(this.src, '_blank')">
                                </div>
                            ` : ''}
                            ${details.driver_photo_url ? `
                                <div class="photo-item">
                                    <label>Photo du Conducteur</label>
                                    <img src="${details.driver_photo_url}" alt="Conducteur" onclick="window.open(this.src, '_blank')">
                                </div>
                            ` : ''}
                            ${details.motorcycle_photo_url ? `
                                <div class="photo-item">
                                    <label>Photo de la Moto</label>
                                    <img src="${details.motorcycle_photo_url}" alt="Moto" onclick="window.open(this.src, '_blank')">
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="timeline-info">
                        <h3>Historique</h3>
                        <p><strong>Soumis:</strong> ${formatDate(details.submitted_at)}</p>
                        ${details.verified_at ? `<p><strong>Approuvé:</strong> ${formatDate(details.verified_at)}</p>` : ''}
                        ${details.rejection_reason ? `<p><strong>Motif du refus:</strong> ${details.rejection_reason}</p>` : ''}
                        ${details.admin_notes ? `<p><strong>Notes Admin:</strong> ${details.admin_notes}</p>` : ''}
                    </div>

                    ${details.status === 'pending' ? `
                        <div class="action-buttons">
                            <button class="btn-approve" onclick="approveVerification('${details.id}')">✓ Approuver</button>
                            <button class="btn-reject" onclick="showRejectModal('${details.id}')">✗ Refuser</button>
                            <button class="btn-secondary" onclick="closeDetailsModal()">Fermer</button>
                        </div>
                    ` : `
                        <div class="action-buttons">
                            <button class="btn-secondary" onclick="closeDetailsModal()">Fermer</button>
                        </div>
                    `}
                </div>
            </div>
        `;

        // Show modal
        showModal(detailsHTML);
    } catch (error) {
        console.error('Error viewing details:', error);
        showNotification('Erreur lors du chargement des détails', 'error');
    }
}

// Show modal
function showModal(content) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box">${content}</div>`;
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };

    document.body.appendChild(overlay);

    // Add modal styles
    if (!document.querySelector('#modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-box {
                background: white;
                border-radius: 12px;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 24px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .verification-details-modal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 2px solid #eee;
            }
            .verification-details-modal h3 {
                margin-top: 20px;
                margin-bottom: 12px;
                font-size: 1.1rem;
                color: #333;
            }
            .verification-details-modal p {
                margin: 8px 0;
                font-size: 0.95rem;
                color: #555;
            }
            .photos-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-top: 12px;
            }
            .photo-item {
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
            }
            .photo-item label {
                display: block;
                background: #f5f5f5;
                padding: 8px;
                font-weight: 600;
                font-size: 0.85rem;
            }
            .photo-item img {
                width: 100%;
                height: 150px;
                object-fit: cover;
                cursor: pointer;
            }
            .action-buttons {
                display: flex;
                gap: 12px;
                margin-top: 24px;
                justify-content: flex-end;
            }
        `;
        document.head.appendChild(style);
    }
}

// Close details modal
function closeDetailsModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
}

// Update verification stats
function updateVerificationStats() {
    try {
        const pending = currentVerifications.filter(v => v.status === 'pending').length;
        const approved = currentVerifications.filter(v => v.status === 'approved').length;
        const rejected = currentVerifications.filter(v => v.status === 'rejected').length;

        // Update mini stats
        const miniStats = document.querySelectorAll('.mini-stat');
        if (miniStats.length >= 3) {
            miniStats[0].querySelector('.mini-value').textContent = pending;
            miniStats[1].querySelector('.mini-value').textContent = approved;
            miniStats[2].querySelector('.mini-value').textContent = rejected;
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Verifications module loaded');
    // Load verifications when Documents tab is clicked
    const docTab = document.querySelector('[data-page="documents"]');
    if (docTab) {
        docTab.addEventListener('click', loadPendingVerifications);
    }
});
