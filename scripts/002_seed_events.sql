-- PME Challenge - Seed all 12 events with their options
-- Point values exactly match the spec

-- 1. Crise de trésorerie
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Crise de trésorerie', 'La trésorerie est insuffisante pour payer les fournisseurs ce mois-ci.', 'tresorerie', 1);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Demander un prêt bancaire', 'Solliciter un financement auprès de la banque pour couvrir les dépenses.', -5, 0, 20, 0, 0, 5, 1),
('00000000-0000-0000-0000-000000000001', 'Négocier des délais', 'Demander aux fournisseurs un report de paiement.', 0, -5, 10, 0, 0, 1.67, 2),
('00000000-0000-0000-0000-000000000001', 'Réduire les dépenses', 'Couper dans les budgets non essentiels pour dégager de la trésorerie.', -5, 0, 5, -10, 0, -3.33, 3);

-- 2. Investissement stratégique
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000002', 'Investissement stratégique', 'Une opportunité d''achat de matériel innovant se présente.', 'production', 2);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000002', 'Investir maintenant', 'Acheter le matériel immédiatement pour profiter de l''opportunité.', 0, 0, -15, 20, 0, 2.5, 1),
('00000000-0000-0000-0000-000000000002', 'Attendre', 'Reporter l''investissement pour observer le marché.', 0, 0, 0, 5, 0, 5, 2),
('00000000-0000-0000-0000-000000000002', 'Ne pas investir', 'Renoncer à l''investissement et conserver la trésorerie.', 0, 0, 0, 0, 0, 0, 3);

-- 3. Départ d'un collaborateur clé
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000003', 'Départ d''un collaborateur clé', 'Un employé central annonce son départ.', 'social', 3);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000003', 'Recruter rapidement', 'Lancer un recrutement urgent pour le remplacer.', 10, 0, -10, 0, 0, 0, 1),
('00000000-0000-0000-0000-000000000003', 'Redistribuer les tâches', 'Répartir ses responsabilités parmi les autres employés.', -5, 0, 0, -5, 0, -5, 2),
('00000000-0000-0000-0000-000000000003', 'Réorganiser sans remplacement', 'Supprimer le poste et réorganiser l''entreprise.', -10, 0, 0, -10, 0, -10, 3);

-- 4. Conflit d'équipe
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000004', 'Conflit d''équipe', 'Deux collaborateurs sont en désaccord et impactent la productivité.', 'social', 4);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000004', 'Médiation', 'Organiser une médiation entre les deux collaborateurs.', 10, 0, 0, 0, 0, 10, 1),
('00000000-0000-0000-0000-000000000004', 'Réorganisation interne', 'Séparer les deux employés dans des services différents.', 5, 0, 0, 0, 0, 5, 2),
('00000000-0000-0000-0000-000000000004', 'Ignorer', 'Ne rien faire et laisser le conflit se résoudre seul.', -10, 0, 0, -5, 0, -7.5, 3);

-- 5. Nouvelle demande d'un gros client
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000005', 'Nouvelle demande d''un gros client', 'Un client stratégique propose un gros contrat avec des conditions strictes.', 'commercial', 5);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000005', 'Accepter', 'Accepter le contrat tel quel pour sécuriser le client.', -5, 25, 5, -5, 0, 5, 1),
('00000000-0000-0000-0000-000000000005', 'Négocier', 'Discuter les conditions pour un accord plus équilibré.', 0, 15, 5, 5, 0, 6.25, 2),
('00000000-0000-0000-0000-000000000005', 'Refuser', 'Décliner l''offre pour préserver les ressources.', 0, -5, 0, 0, 0, -1.25, 3);

-- 6. Avis négatif viral
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000006', 'Avis négatif viral', 'Un avis négatif se propage sur les réseaux sociaux.', 'commercial', 6);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000006', 'Réponse publique', 'Publier une réponse officielle et transparente.', 0, 10, 0, 0, 0, 10, 1),
('00000000-0000-0000-0000-000000000006', 'Contacter le client', 'Contacter le client en privé pour résoudre le problème.', 0, 5, 0, 0, 0, 5, 2),
('00000000-0000-0000-0000-000000000006', 'Ignorer', 'Ne pas réagir et attendre que ça passe.', 0, -15, 0, 0, 0, -15, 3);

-- 7. Panne de matériel
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000007', 'Panne de matériel', 'Un équipement clé tombe en panne.', 'production', 7);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000007', 'Réparer immédiatement', 'Faire appel à un technicien en urgence.', 0, 0, -10, 20, 0, 2.5, 1),
('00000000-0000-0000-0000-000000000007', 'Louer du matériel', 'Louer un équipement de remplacement temporaire.', 0, 0, -5, 15, 0, 5, 2),
('00000000-0000-0000-0000-000000000007', 'Réorganiser le planning', 'Adapter la production sans remplacer le matériel.', 0, 0, 0, -10, 0, -10, 3);

-- 8. Augmentation des matières premières
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000008', 'Augmentation des matières premières', 'Le prix d''une matière première essentielle augmente.', 'tresorerie', 8);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000008', 'Augmenter le prix de vente', 'Répercuter la hausse sur les clients.', 0, -5, 10, 0, 0, 1.67, 1),
('00000000-0000-0000-0000-000000000008', 'Chercher un fournisseur alternatif', 'Trouver un autre fournisseur proposant un meilleur tarif.', 0, 0, 5, 5, 0, 5, 2),
('00000000-0000-0000-0000-000000000008', 'Absorber le coût', 'Supporter la hausse sans modifier les prix.', 0, 0, -10, 0, 0, -10, 3);

-- 9. Proposition de formation
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000009', 'Proposition de formation', 'Opportunité de formation pour un ou plusieurs employés.', 'social', 9);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000009', 'Accepter', 'Envoyer les employés en formation.', 10, 0, -5, 5, 0, 3.33, 1),
('00000000-0000-0000-0000-000000000009', 'Refuser', 'Décliner l''offre de formation.', -5, 0, 0, 0, 0, -5, 2),
('00000000-0000-0000-0000-000000000009', 'Former seulement certains', 'Sélectionner quelques employés pour la formation.', 5, 0, -2, 5, 0, 2.67, 3);

-- 10. Nouvelle réglementation
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000010', 'Nouvelle réglementation', 'Une loi impacte le secteur d''activité de l''entreprise.', 'reglementaire', 10);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000010', 'Se conformer', 'Mettre en place les changements nécessaires immédiatement.', 0, 0, -5, 0, 10, 1.67, 1),
('00000000-0000-0000-0000-000000000010', 'Demander une adaptation', 'Négocier un délai ou des aménagements.', 0, 0, 0, 0, 5, 5, 2),
('00000000-0000-0000-0000-000000000010', 'Ignorer', 'Ne pas se conformer à la nouvelle réglementation.', 0, 0, -10, 0, -10, -10, 3);

-- 11. Inspection surprise
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000011', 'Inspection surprise', 'Une inspection administrative a lieu dans l''entreprise.', 'reglementaire', 11);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000011', 'Préparer tous les documents', 'Rassembler et présenter tous les documents requis.', 0, 0, 0, 0, 10, 10, 1),
('00000000-0000-0000-0000-000000000011', 'Minimiser', 'Présenter le minimum requis.', 0, 0, 0, 0, -5, -5, 2),
('00000000-0000-0000-0000-000000000011', 'Contester', 'Contester la légitimité de l''inspection.', 0, 0, 0, 0, -10, -10, 3);

-- 12. Campagne marketing ratée
INSERT INTO public.events (id, title, description, category, sort_order) VALUES
('00000000-0000-0000-0000-000000000012', 'Campagne marketing ratée', 'La campagne marketing n''a pas attiré les clients escomptés.', 'commercial', 12);

INSERT INTO public.event_options (event_id, label, description, points_social, points_commercial, points_tresorerie, points_production, points_reglementaire, points_moyenne, sort_order) VALUES
('00000000-0000-0000-0000-000000000012', 'Relancer', 'Investir à nouveau dans une nouvelle campagne.', 0, 5, -5, 0, 0, 0, 1),
('00000000-0000-0000-0000-000000000012', 'Modifier le message', 'Ajuster le message marketing et ciblage.', 0, 5, -2, 0, 0, 1, 2),
('00000000-0000-0000-0000-000000000012', 'Suspendre', 'Arrêter la campagne et attendre.', 0, -5, 0, 0, 0, -1.67, 3);
