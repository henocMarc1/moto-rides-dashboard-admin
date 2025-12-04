import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../controllers/verification_controller.dart';
import '../models/driver_verification.dart';

class AdminVerificationScreen extends StatefulWidget {
  const AdminVerificationScreen({Key? key}) : super(key: key);

  @override
  State<AdminVerificationScreen> createState() =>
      _AdminVerificationScreenState();
}

class _AdminVerificationScreenState extends State<AdminVerificationScreen>
    with SingleTickerProviderStateMixin {
  late VerificationController verificationController;
  late TabController _tabController;
  late List<DriverVerification> pendingVerifications;

  @override
  void initState() {
    super.initState();
    verificationController = Get.put(VerificationController());
    _tabController = TabController(length: 3, vsync: this);
    _loadVerifications();
  }

  void _loadVerifications() async {
    final verifications = await verificationController.getPendingVerifications();
    setState(() {
      pendingVerifications = verifications;
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vérification des Chauffeurs'),
        centerTitle: true,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          onTap: (_) => _loadVerifications(),
          tabs: const [
            Tab(text: 'En Attente', icon: Icon(Icons.hourglass_top)),
            Tab(text: 'Approuvés', icon: Icon(Icons.check_circle)),
            Tab(text: 'Rejetés', icon: Icon(Icons.cancel)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadVerifications(),
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildPendingList(),
            _buildApprovedList(),
            _buildRejectedList(),
          ],
        ),
      ),
    );
  }

  Widget _buildPendingList() {
    final pending = pendingVerifications
        .where((v) => v.status == VerificationStatus.pending)
        .toList();

    if (pending.isEmpty) {
      return _buildEmptyState(
        icon: Icons.done_all,
        title: 'Tout est à jour!',
        message: 'Aucune demande en attente.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: pending.length,
      itemBuilder: (context, index) {
        final verification = pending[index];
        return _buildVerificationCard(verification);
      },
    );
  }

  Widget _buildApprovedList() {
    final approved = pendingVerifications
        .where((v) => v.status == VerificationStatus.approved)
        .toList();

    if (approved.isEmpty) {
      return _buildEmptyState(
        icon: Icons.inbox,
        title: 'Aucun approuvé',
        message: 'Les chauffeurs approuvés apparaîtront ici.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: approved.length,
      itemBuilder: (context, index) {
        final verification = approved[index];
        return _buildApprovedCard(verification);
      },
    );
  }

  Widget _buildRejectedList() {
    final rejected = pendingVerifications
        .where((v) => v.status == VerificationStatus.rejected)
        .toList();

    if (rejected.isEmpty) {
      return _buildEmptyState(
        icon: Icons.inbox,
        title: 'Aucun rejeté',
        message: 'Les chauffeurs rejetés apparaîtront ici.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: rejected.length,
      itemBuilder: (context, index) {
        final verification = rejected[index];
        return _buildRejectedCard(verification);
      },
    );
  }

  Widget _buildVerificationCard(DriverVerification verification) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        children: [
          ListTile(
            leading: verification.driverPhotoUrl != null
                ? CachedNetworkImage(
                    imageUrl: verification.driverPhotoUrl!,
                    imageBuilder: (context, imageProvider) => CircleAvatar(
                      backgroundImage: imageProvider,
                    ),
                    placeholder: (context, url) =>
                        const CircleAvatar(child: Icon(Icons.person)),
                    errorWidget: (context, url, error) =>
                        const CircleAvatar(child: Icon(Icons.person)),
                  )
                : const CircleAvatar(child: Icon(Icons.person)),
            title: Text('Chauffeur ID: ${verification.driverId.substring(0, 8)}...'),
            subtitle: Text('Soumis: ${_formatDate(verification.submittedAt)}'),
            trailing: const Icon(Icons.arrow_forward),
            onTap: () => _showVerificationDetails(verification),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _approveVerification(verification),
                    icon: const Icon(Icons.check),
                    label: const Text('Approuver'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _rejectVerification(verification),
                    icon: const Icon(Icons.close),
                    label: const Text('Rejeter'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApprovedCard(DriverVerification verification) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: verification.driverPhotoUrl != null
            ? CachedNetworkImage(
                imageUrl: verification.driverPhotoUrl!,
                imageBuilder: (context, imageProvider) => CircleAvatar(
                  backgroundImage: imageProvider,
                ),
                placeholder: (context, url) =>
                    const CircleAvatar(child: Icon(Icons.person)),
                errorWidget: (context, url, error) =>
                    const CircleAvatar(child: Icon(Icons.person)),
              )
            : const CircleAvatar(child: Icon(Icons.person)),
        title: Text(
            'Chauffeur ID: ${verification.driverId.substring(0, 8)}...'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Approuvé: ${_formatDate(verification.verifiedAt!)}'),
            if (verification.adminNotes != null)
              Text('Notes: ${verification.adminNotes}',
                  maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
        trailing: const Icon(Icons.check_circle, color: Colors.green),
        onTap: () => _showVerificationDetails(verification),
      ),
    );
  }

  Widget _buildRejectedCard(DriverVerification verification) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: verification.driverPhotoUrl != null
            ? CachedNetworkImage(
                imageUrl: verification.driverPhotoUrl!,
                imageBuilder: (context, imageProvider) => CircleAvatar(
                  backgroundImage: imageProvider,
                ),
                placeholder: (context, url) =>
                    const CircleAvatar(child: Icon(Icons.person)),
                errorWidget: (context, url, error) =>
                    const CircleAvatar(child: Icon(Icons.person)),
              )
            : const CircleAvatar(child: Icon(Icons.person)),
        title: Text(
            'Chauffeur ID: ${verification.driverId.substring(0, 8)}...'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Rejeté: ${_formatDate(verification.updatedAt!)}'),
            if (verification.rejectionReason != null)
              Text('Raison: ${verification.rejectionReason}',
                  maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
        trailing: const Icon(Icons.cancel, color: Colors.red),
        onTap: () => _showVerificationDetails(verification),
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String message,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: const TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  void _showVerificationDetails(DriverVerification verification) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Détails de Vérification'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Photos
              const Text('📸 Photos:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              if (verification.identityPhotoUrl != null) ...[
                const Text('Pièce d\'identité:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () =>
                      _showImagePreview(verification.identityPhotoUrl!),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedNetworkImage(
                      imageUrl: verification.identityPhotoUrl!,
                      height: 150,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (verification.driverPhotoUrl != null) ...[
                const Text('Photo du chauffeur:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () => _showImagePreview(verification.driverPhotoUrl!),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedNetworkImage(
                      imageUrl: verification.driverPhotoUrl!,
                      height: 150,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (verification.motorcyclePhotoUrl != null) ...[
                const Text('Photo de la moto:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () =>
                      _showImagePreview(verification.motorcyclePhotoUrl!),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedNetworkImage(
                      imageUrl: verification.motorcyclePhotoUrl!,
                      height: 150,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              // Infos moto
              const Divider(),
              const SizedBox(height: 8),
              const Text('🏍️ Infos Moto:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (verification.motorcycleModel != null)
                Text('Modèle: ${verification.motorcycleModel}'),
              if (verification.motorcycleColor != null)
                Text('Couleur: ${verification.motorcycleColor}'),
              if (verification.motorcyclePlate != null)
                Text('Plaque: ${verification.motorcyclePlate}'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }

  void _showImagePreview(String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CachedNetworkImage(imageUrl: imageUrl),
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Fermer'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _approveVerification(DriverVerification verification) async {
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Approuver le Chauffeur'),
        content: TextField(
          controller: notesController,
          decoration: const InputDecoration(
            labelText: 'Notes (optionnel)',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final success =
                  await verificationController.approveVerification(
                verification.id,
                'ADMIN_ID_HERE', // À remplacer par l'ID admin réel
                notes: notesController.text.isNotEmpty
                    ? notesController.text
                    : null,
              );
              if (success) {
                _loadVerifications();
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Approuver'),
          ),
        ],
      ),
    );
  }

  void _rejectVerification(DriverVerification verification) async {
    final reasonController = TextEditingController();
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rejeter le Chauffeur'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: reasonController,
                decoration: const InputDecoration(
                  labelText: 'Raison du rejet *',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(
                  labelText: 'Notes (optionnel)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (reasonController.text.isEmpty) {
                Get.snackbar('Erreur', 'Veuillez entrer une raison');
                return;
              }
              Navigator.pop(context);
              final success = await verificationController.rejectVerification(
                verification.id,
                'ADMIN_ID_HERE', // À remplacer par l'ID admin réel
                reasonController.text,
                notes: notesController.text.isNotEmpty
                    ? notesController.text
                    : null,
              );
              if (success) {
                _loadVerifications();
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Rejeter'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}
