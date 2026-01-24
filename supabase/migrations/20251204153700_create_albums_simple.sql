-- Create albums table
CREATE TABLE albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visibility TEXT NOT NULL DEFAULT 'private',
    password_hash TEXT,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_default BOOLEAN DEFAULT false
);

-- Create album_media table
CREATE TABLE album_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(album_id, media_id)
);

-- Add indexes
CREATE INDEX idx_albums_creator_id ON albums(creator_id);
CREATE INDEX idx_album_media_album_id ON album_media(album_id);
CREATE INDEX idx_album_media_media_id ON album_media(media_id);

-- Enable RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_media ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies for albums
CREATE POLICY "Users can view public albums" ON albums
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can view their own albums" ON albums
    FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can create albums" ON albums
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own albums" ON albums
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own albums" ON albums
    FOR DELETE USING (creator_id = auth.uid());

-- Basic RLS Policies for album_media
CREATE POLICY "Users can view media in their albums" ON album_media
    FOR SELECT USING (
        album_id IN (SELECT id FROM albums WHERE creator_id = auth.uid())
    );

CREATE POLICY "Users can add media to their albums" ON album_media
    FOR INSERT WITH CHECK (
        album_id IN (SELECT id FROM albums WHERE creator_id = auth.uid())
        AND added_by = auth.uid()
    );

CREATE POLICY "Users can remove media from their albums" ON album_media
    FOR DELETE USING (
        album_id IN (SELECT id FROM albums WHERE creator_id = auth.uid())
    );