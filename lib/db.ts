/**
 * Supabase client for server-side persistence.
 *
 * Run the following SQL in your Supabase SQL editor once to create the tables:
 *
 *   CREATE TABLE IF NOT EXISTS datasets (
 *     cid               text PRIMARY KEY,
 *     file_name         text NOT NULL,
 *     file_size         bigint NOT NULL DEFAULT 0,
 *     patient_wallet    text NOT NULL,
 *     phone_number      text DEFAULT '',
 *     encrypted_payload text NOT NULL,
 *     uploaded_at       timestamptz DEFAULT now()
 *   );
 *
 *   CREATE TABLE IF NOT EXISTS consent_grants (
 *     id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     dataset_cid        text NOT NULL,
 *     patient_wallet     text NOT NULL,
 *     researcher_address text NOT NULL,
 *     researcher_name    text DEFAULT '',
 *     purpose            text DEFAULT 'Unspecified',
 *     expires_at         timestamptz NOT NULL,
 *     revoked            boolean DEFAULT false,
 *     created_at         timestamptz DEFAULT now()
 *   );
 *
 *   -- Disable RLS for demo (re-enable and add policies for production)
 *   ALTER TABLE datasets DISABLE ROW LEVEL SECURITY;
 *   ALTER TABLE consent_grants DISABLE ROW LEVEL SECURITY;
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn("[db] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — DB writes will be skipped");
}

export const supabase = url && key ? createClient(url, key) : null;

export interface DbDataset {
  cid: string;
  file_name: string;
  file_size: number;
  patient_wallet: string;
  phone_number: string;
  encrypted_payload: string;
  uploaded_at: string;
}

export interface DbGrant {
  id: string;
  dataset_cid: string;
  patient_wallet: string;
  researcher_address: string;
  researcher_name: string;
  purpose: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}
