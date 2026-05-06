-- Create chat-images storage bucket (public, 5 MB limit)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read chat images
DROP POLICY IF EXISTS "chat_images_public_read" ON storage.objects;
CREATE POLICY "chat_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "chat_images_auth_insert" ON storage.objects;
CREATE POLICY "chat_images_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-images');
