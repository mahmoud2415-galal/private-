-- Private invoice storage: read/write is performed by the authenticated server only.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('invoice-files','invoice-files',false,3145728,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=3145728,allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];
