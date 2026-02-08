/*
  # Create categories table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `description` (text)
      - `icon_name` (text, Lucide icon reference)
      - `sort_order` (integer)
      - `parent_id` (uuid, self-referencing FK for sub-categories)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public read access for all authenticated and anonymous users
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon_name text DEFAULT 'folder',
  sort_order integer DEFAULT 0,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO authenticated, anon
  USING (id IS NOT NULL);
