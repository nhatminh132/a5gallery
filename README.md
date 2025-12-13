# Media Gallery Application

A modern, full-featured image and video gallery application built with React, TypeScript, and Supabase. Upload, manage, and view your media files with a beautiful, responsive interface.

## Features

### Authentication
- Secure email/password authentication
- User registration and login
- Automatic profile creation
- Protected routes and content

### Media Management
- **Upload**: Support for multiple formats
  - Images: JPEG, PNG, GIF, WebP
  - Videos: MP4, WebM, MOV
- **Automatic Processing**:
  - Image compression for files over 2MB
  - Automatic video thumbnail generation
  - Dimension and duration detection
- **Organization**:
  - Title and description metadata
  - Upload date tracking
  - File size and type information

### User Interface
- **Home Page**:
  - Responsive grid layout
  - Real-time search by title or description
  - Filter by media type (all, images, videos)
  - Upload button for quick access
  - Delete functionality for own media
- **Gallery View**:
  - Full-screen media viewer
  - Keyboard navigation (arrow keys, Escape)
  - Previous/Next buttons
  - Detailed metadata display
  - Download functionality
  - Video playback with controls

### Design
- Modern, clean interface
- Smooth animations and transitions
- Responsive design (mobile, tablet, desktop)
- Loading states and error handling
- Hover effects and visual feedback

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase
  - PostgreSQL database
  - Storage buckets
  - Row Level Security (RLS)
  - Authentication
- **Build Tool**: Vite
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/
│   ├── Auth.tsx              # Authentication UI
│   ├── MediaGrid.tsx         # Grid display of media items
│   └── UploadModal.tsx       # Upload interface
├── contexts/
│   └── AuthContext.tsx       # Authentication state management
├── lib/
│   ├── supabase.ts          # Supabase client configuration
│   ├── fileUtils.ts         # File processing utilities
│   └── uploadService.ts     # Upload and storage logic
├── pages/
│   ├── Home.tsx             # Main gallery page
│   └── Gallery.tsx          # Detailed media view
├── App.tsx                   # Main application component
└── main.tsx                  # Application entry point
```

## Database Schema

### Tables

#### `profiles`
Stores user profile information:
- `id` - User ID (references auth.users)
- `email` - User email
- `full_name` - Display name
- `avatar_url` - Profile picture URL
- `created_at` - Account creation date
- `updated_at` - Last update date

#### `media`
Stores media file metadata:
- `id` - Unique media identifier
- `user_id` - Owner reference
- `filename` - Original filename
- `file_path` - Storage path
- `title` - Media title
- `description` - Optional description
- `file_type` - MIME type
- `file_size` - Size in bytes
- `width` - Pixel width
- `height` - Pixel height
- `duration` - Video duration (seconds)
- `thumbnail_path` - Video thumbnail path
- `upload_date` - Upload timestamp
- `created_at` - Record creation date

### Storage

#### `media` bucket
Public bucket storing:
- User-uploaded images and videos
- Auto-generated video thumbnails
- Organized by user ID folders

### Security

All tables use Row Level Security (RLS):
- Users can view all media
- Users can only modify their own content
- Authenticated access required
- Automatic profile creation on signup

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. The application is already configured with Supabase. The environment variables are set in `.env`:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

3. Database migrations have been applied automatically:
   - User profiles table
   - Media metadata table
   - Storage bucket with policies
   - Row Level Security policies

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Usage Guide

### Getting Started

1. **Sign Up**: Create a new account with email and password
2. **Upload Media**: Click the "Upload" button and select an image or video
3. **Add Details**: Enter a title and optional description
4. **Browse**: View all uploaded media in the grid layout
5. **Search**: Use the search bar to find specific media
6. **Filter**: Switch between all media, images only, or videos only

### Viewing Media

1. **Click** any media item to open the full-screen gallery view
2. **Navigate** using:
   - Arrow keys (left/right)
   - Previous/Next buttons
   - Escape key to close
3. **Download** media using the download button
4. **View Details** including upload date, file size, dimensions, and more

### Managing Media

- **Delete**: Hover over your own media items and click the trash icon
- **Edit**: Currently, titles and descriptions are set during upload

## Key Features Explained

### Image Compression
Images larger than 2MB are automatically compressed to reduce storage and improve loading times while maintaining quality.

### Video Thumbnails
When uploading videos, a thumbnail is automatically generated from a frame in the video for quick preview in the grid view.

### Responsive Grid
The grid layout automatically adapts to different screen sizes:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

### Search and Filter
- Search works across both titles and descriptions
- Filters are instant and work with search
- Case-insensitive matching

## Performance Considerations

- Images are lazy-loaded for better performance
- Compressed images reduce bandwidth
- Thumbnails used in grid view
- Efficient database queries with indexes
- Optimized bundle size

## Security Features

- Row Level Security on all tables
- Secure file storage with user-specific folders
- Password requirements (minimum 6 characters)
- Authenticated-only access to media management
- XSS protection through React

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### Upload fails
- Check file size (max 100MB)
- Verify file format is supported
- Check internet connection

### Images not loading
- Verify Supabase storage bucket is public
- Check browser console for errors
- Confirm storage policies are correct

### Authentication issues
- Clear browser cache and cookies
- Check network connection
- Verify Supabase credentials

## Future Enhancements

Possible improvements:
- Albums/collections organization
- Sharing capabilities
- Advanced editing (crop, rotate)
- Bulk upload
- Comments and likes
- User profiles
- Tags and categories
- Export functionality

## License

This project is open source and available for personal and commercial use.
