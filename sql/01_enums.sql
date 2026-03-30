-- =====================================================
-- LIFELY - Types ENUM
-- À exécuter en premier dans Supabase SQL Editor
-- =====================================================

-- Types de transaction (5 types inspirés de la structure Excel)
CREATE TYPE public.transaction_type AS ENUM (
  'revenue',            -- Revenus (salaire, extras, freelance)
  'variable_expense',   -- Dépenses variables (courses, carburant, sorties)
  'fixed_expense',      -- Charges fixes / factures (électricité, Netflix, téléphone)
  'credit',             -- Crédits / remboursements (maison, voiture)
  'savings'             -- Épargne (livret A, investissements)
);

-- Fréquence des transactions récurrentes
CREATE TYPE public.recurrence_frequency AS ENUM (
  'monthly',
  'weekly',
  'yearly'
);

-- Types de comptes
CREATE TYPE public.account_type AS ENUM (
  'personal',    -- Personnel
  'business'     -- Professionnel
);