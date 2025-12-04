-- ========================================
-- SCRIPT D'INSERTION DE DONNÉES DE TEST
-- ========================================
-- Exécutez ces requêtes dans Supabase SQL Editor
-- pour créer des données de démonstration

-- ========================================
-- 1. CRÉER DES UTILISATEURS DE TEST
-- ========================================

-- Note: Vous devez d'abord créer ces utilisateurs dans Firebase Authentication
-- ou dans Supabase Auth, puis récupérer leurs UUIDs
-- Pour ce test, nous utilisons des UUIDs fictifs que vous devrez remplacer

-- Insérer un client test
INSERT INTO public.users (id, name, email, phone, rating, is_driver, total_rides, address, created_at)
VALUES 
  (gen_random_uuid(), 'Jean Dupont', 'jean.dupont@test.com', '+221 77 123 45 67', 4.5, false, 12, 'Plateau, Dakar', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), 'Marie Ndiaye', 'marie.ndiaye@test.com', '+221 77 234 56 78', 4.8, false, 25, 'Almadies, Dakar', NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), 'Amadou Sall', 'amadou.sall@test.com', '+221 77 345 67 89', 4.2, false, 8, 'Sacré-Cœur, Dakar', NOW() - INTERVAL '10 days'),
  (gen_random_uuid(), 'Fatou Diop', 'fatou.diop@test.com', '+221 77 456 78 90', 5.0, false, 35, 'Mermoz, Dakar', NOW() - INTERVAL '45 days'),
  (gen_random_uuid(), 'Ibrahima Kane', 'ibrahima.kane@test.com', '+221 77 567 89 01', 4.6, false, 18, 'Point E, Dakar', NOW() - INTERVAL '15 days')
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- 2. CRÉER DES CONDUCTEURS DE TEST
-- ========================================

-- D'abord créer des utilisateurs pour les conducteurs
DO $$
DECLARE
  driver1_id UUID := gen_random_uuid();
  driver2_id UUID := gen_random_uuid();
  driver3_id UUID := gen_random_uuid();
  driver4_id UUID := gen_random_uuid();
BEGIN
  -- Insérer utilisateurs conducteurs
  INSERT INTO public.users (id, name, email, phone, rating, is_driver, total_rides, created_at)
  VALUES 
    (driver1_id, 'Mamadou Diallo', 'mamadou.diallo@driver.com', '+221 77 111 22 33', 4.8, true, 156, NOW() - INTERVAL '6 months'),
    (driver2_id, 'Ousmane Fall', 'ousmane.fall@driver.com', '+221 77 222 33 44', 4.6, true, 98, NOW() - INTERVAL '4 months'),
    (driver3_id, 'Cheikh Mbaye', 'cheikh.mbaye@driver.com', '+221 77 333 44 55', 4.9, true, 203, NOW() - INTERVAL '1 year'),
    (driver4_id, 'Babacar Sarr', 'babacar.sarr@driver.com', '+221 77 444 55 66', 4.3, true, 67, NOW() - INTERVAL '2 months')
  ON CONFLICT (email) DO NOTHING;

  -- Insérer les détails des conducteurs
  INSERT INTO public.drivers (id, user_id, full_name, phone, email, vehicle_type, vehicle_plate, license_number, is_verified, rating, created_at)
  VALUES 
    (driver1_id, driver1_id, 'Mamadou Diallo', '+221 77 111 22 33', 'mamadou.diallo@driver.com', 'Moto', 'DK-1234-AA', 'SN123456789', true, 4.8, NOW() - INTERVAL '6 months'),
    (driver2_id, driver2_id, 'Ousmane Fall', '+221 77 222 33 44', 'ousmane.fall@driver.com', 'Moto', 'DK-5678-BB', 'SN987654321', true, 4.6, NOW() - INTERVAL '4 months'),
    (driver3_id, driver3_id, 'Cheikh Mbaye', '+221 77 333 44 55', 'cheikh.mbaye@driver.com', 'Moto', 'DK-9012-CC', 'SN456789123', true, 4.9, NOW() - INTERVAL '1 year'),
    (driver4_id, driver4_id, 'Babacar Sarr', '+221 77 444 55 66', 'babacar.sarr@driver.com', 'Moto', 'DK-3456-DD', 'SN321654987', true, 4.3, NOW() - INTERVAL '2 months')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ========================================
-- 3. CRÉER DES COURSES DE TEST
-- ========================================

-- Insérer 50 courses de test avec différents statuts et dates
DO $$
DECLARE
  client_ids UUID[];
  driver_ids UUID[];
  i INTEGER;
BEGIN
  -- Récupérer les IDs des clients et conducteurs
  SELECT ARRAY_AGG(id) INTO client_ids FROM public.users WHERE is_driver = false LIMIT 5;
  SELECT ARRAY_AGG(id) INTO driver_ids FROM public.drivers LIMIT 4;

  -- Créer 50 courses
  FOR i IN 1..50 LOOP
    INSERT INTO public.rides (
      user_id,
      driver_id,
      pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address,
      dropoff_lat,
      dropoff_lng,
      distance,
      duration,
      total_price,
      payment_method,
      status,
      user_rating,
      driver_rating,
      created_at,
      completed_at
    ) VALUES (
      client_ids[1 + (i % array_length(client_ids, 1))],
      driver_ids[1 + (i % array_length(driver_ids, 1))],
      'Place de l''Indépendance, Dakar',
      14.6928,
      -17.4467,
      CASE 
        WHEN i % 5 = 0 THEN 'Aéroport Blaise Diagne'
        WHEN i % 5 = 1 THEN 'Université Cheikh Anta Diop'
        WHEN i % 5 = 2 THEN 'Marché Sandaga'
        WHEN i % 5 = 3 THEN 'Corniche Ouest'
        ELSE 'Plateau, Dakar'
      END,
      14.7167 + (random() - 0.5) * 0.1,
      -17.4677 + (random() - 0.5) * 0.1,
      (5000 + (random() * 40000))::INTEGER, -- 5-45 km
      (600 + (random() * 3000))::INTEGER, -- 10-60 minutes
      (2000 + (random() * 20000))::NUMERIC(10,2), -- 2000-22000 CFA
      CASE 
        WHEN i % 3 = 0 THEN 'cash'
        WHEN i % 3 = 1 THEN 'mobile_money'
        ELSE 'card'
      END,
      CASE 
        WHEN i < 40 THEN 'completed'
        WHEN i < 45 THEN 'in_progress'
        WHEN i < 48 THEN 'accepted'
        ELSE 'pending'
      END,
      (3 + random() * 2)::INTEGER, -- rating 3-5
      (3 + random() * 2)::INTEGER, -- rating 3-5
      NOW() - INTERVAL '1 day' * (50 - i), -- Étalé sur 50 jours
      CASE 
        WHEN i < 40 THEN NOW() - INTERVAL '1 day' * (50 - i) + INTERVAL '30 minutes'
        ELSE NULL
      END
    );
  END LOOP;
END $$;

-- ========================================
-- 4. CRÉER DES VÉRIFICATIONS DE CONDUCTEURS
-- ========================================

-- Insérer des vérifications en attente pour tester l'onglet Documents
DO $$
DECLARE
  pending_driver_id UUID := gen_random_uuid();
  pending_user_id UUID := gen_random_uuid();
BEGIN
  -- Créer un nouvel utilisateur conducteur non vérifié
  INSERT INTO public.users (id, name, email, phone, rating, is_driver, total_rides, created_at)
  VALUES 
    (pending_user_id, 'Modou Gueye', 'modou.gueye@driver.com', '+221 77 999 88 77', 5.0, true, 0, NOW())
  ON CONFLICT (email) DO NOTHING;

  -- Créer le conducteur non vérifié
  INSERT INTO public.drivers (id, user_id, full_name, phone, email, vehicle_type, vehicle_plate, license_number, is_verified, created_at)
  VALUES 
    (pending_user_id, pending_user_id, 'Modou Gueye', '+221 77 999 88 77', 'modou.gueye@driver.com', 'Moto', 'DK-7890-EE', 'SN147258369', false, NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Créer la demande de vérification
  INSERT INTO public.driver_verifications (
    driver_id,
    user_id,
    identity_photo_url,
    driver_photo_url,
    motorcycle_photo_url,
    motorcycle_model,
    motorcycle_color,
    motorcycle_plate,
    status,
    submitted_at
  ) VALUES (
    pending_user_id,
    pending_user_id,
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1558981033-6f682c207e5d?w=400',
    'Yamaha XTZ 125',
    'Rouge',
    'DK-7890-EE',
    'pending',
    NOW()
  );
END $$;

-- ========================================
-- 5. VÉRIFICATION DES DONNÉES
-- ========================================

-- Compter les enregistrements créés
SELECT 
  (SELECT COUNT(*) FROM public.users WHERE is_driver = false) as clients_count,
  (SELECT COUNT(*) FROM public.drivers) as drivers_count,
  (SELECT COUNT(*) FROM public.rides) as rides_count,
  (SELECT COUNT(*) FROM public.driver_verifications) as verifications_count,
  (SELECT SUM(total_price) FROM public.rides WHERE status = 'completed') as total_revenue;

-- Afficher les statistiques par statut de course
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_price) as revenue
FROM public.rides
GROUP BY status
ORDER BY count DESC;

-- ========================================
-- 6. NETTOYAGE (OPTIONNEL)
-- ========================================
-- Si vous voulez supprimer toutes les données de test :
-- ATTENTION: Ceci supprime TOUTES les données !

-- DELETE FROM public.rides;
-- DELETE FROM public.driver_verifications;
-- DELETE FROM public.drivers;
-- DELETE FROM public.users WHERE email LIKE '%@test.com' OR email LIKE '%@driver.com';

-- ========================================
-- INSTRUCTIONS D'UTILISATION
-- ========================================
-- 1. Copiez tout ce script
-- 2. Allez dans Supabase Dashboard → SQL Editor
-- 3. Cliquez sur "New Query"
-- 4. Collez le script complet
-- 5. Cliquez sur "Run" (Ctrl+Enter)
-- 6. Vérifiez dans Table Editor que les données sont créées
-- 7. Rafraîchissez votre dashboard admin
-- 8. Les statistiques doivent maintenant afficher les vraies données !
