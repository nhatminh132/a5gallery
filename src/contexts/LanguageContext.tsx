import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  en: {
    // Navigation
    'nav.gallery': 'Gallery',
    'nav.images': 'Images',
    'nav.videos': 'Videos',
    'nav.upload': 'Upload',
    'nav.classMembers': 'Class Members',
    'nav.settings': 'Settings',
    'nav.adminPanel': 'Admin Panel',
    'nav.signIn': 'SIGN IN',
    'nav.disconnect': 'DISCONNECT',
    
    // Home/Dashboard
    'home.welcome': 'Welcome back, {name}!',
    'home.welcomeGuest': 'Photo Gallery',
    'home.yourActivity': 'Here\'s your recent activity',
    'home.explore': 'Explore our collection',
    'home.refresh': 'Refresh',
    'home.recentMedia': 'Recent Media',
    'home.viewAll': 'View All',
    'home.noMedia': 'No media yet',
    'home.startUploading': 'Start by uploading your first image or video',
    'home.checkBack': 'Check back soon for new content',
    'home.uploadMedia': 'Upload Media',
    'home.images': 'Images',
    'home.videos': 'Videos',
    'home.storage': 'Storage',
    
    // Images Page
    'images.title': 'Images',
    'images.subtitle': 'Browse your image collection',
    'images.backToGallery': 'Back to Gallery',
    
    // Videos Page
    'videos.title': 'Videos',
    'videos.subtitle': 'Browse your video collection',
    
    // Upload Page
    'upload.title': 'Upload Media',
    'upload.subtitle': 'Add photos and videos to your collection',
    
    // Class Members
    'class.title': 'Class Members',
    'class.subtitle': 'View class member profiles',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account and preferences',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.auto': 'Auto',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.accentColor': 'Accent Color',
    'settings.close': 'Close',
    'settings.backToGallery': 'Back to Gallery',
    'settings.profile': 'Profile',
    'settings.account': 'Account',
    'settings.notifications': 'Notifications',
    'settings.storage': 'Storage',
    'settings.adminPanel': 'Admin Panel',
    'settings.profileInfo': 'Profile Information',
    'settings.emailAddress': 'Email Address',
    'settings.change': 'Change',
    'settings.newEmailAddress': 'New Email Address',
    'settings.update': 'Update',
    'settings.cancel': 'Cancel',
    'settings.emailConfirmation': 'You\'ll receive confirmation links at both your old and new email addresses.',
    'settings.fullName': 'Full Name',
    'settings.enterFullName': 'Enter your full name',
    'settings.bio': 'Bio',
    'settings.tellAboutYourself': 'Tell us about yourself',
    'settings.saveChanges': 'Save Changes',
    'settings.securitySettings': 'Security Settings',
    'settings.currentPassword': 'Current Password',
    'settings.enterCurrentPassword': 'Enter current password',
    'settings.newPassword': 'New Password',
    'settings.enterNewPassword': 'Enter new password',
    'settings.confirmNewPassword': 'Confirm New Password',
    'settings.confirmPassword': 'Confirm new password',
    'settings.updatePassword': 'Update Password',
    'settings.exportData': 'Export Data',
    'settings.notificationPreferences': 'Notification Preferences',
    'settings.emailNotifications': 'Email Notifications',
    'settings.emailNotificationsDesc': 'Receive notifications about your account via email',
    'settings.uploadNotifications': 'Upload Notifications',
    'settings.uploadNotificationsDesc': 'Get notified when your uploads are complete',
    'settings.storageUsage': 'Storage Usage',
    'settings.storageUsed': 'Storage Used',
    'settings.storagePercentage': '% of available storage used',
    
    // Image Slider
    'slider.featured': 'Featured',
    'slider.viewMore': 'View More',
    'slider.previous': 'Previous',
    'slider.next': 'Next',
    
    // Media Detail Modal
    'modal.mediaInformation': 'Media Information',
    'modal.title': 'Title',
    'modal.description': 'Description',
    'modal.identification': 'Identification',
    'modal.mediaId': 'Media ID',
    'modal.databaseId': 'Database ID',
    'modal.uploadInformation': 'Upload Information',
    'modal.uploadDate': 'Upload Date',
    'modal.uploadedBy': 'Uploaded by',
    'modal.actions': 'Actions',
    'modal.downloadOriginal': 'Download Original File',
    'modal.share': 'Share',
    'modal.copyMediaId': 'Copy Media ID',
    'modal.copyDatabaseId': 'Copy Database ID',
    'modal.comments': 'Comments',
    'modal.likes': 'Likes',
    'modal.addComment': 'Add a comment...',
    'modal.post': 'Post',
    'modal.like': 'Like',
    'modal.unlike': 'Unlike',
    'modal.noComments': 'No comments yet',
    'modal.beFirst': 'Be the first to comment!',
    
    // Upload
    'upload.dragDrop': 'Drag and drop files here, or click to browse',
    'upload.selectFiles': 'Select Files',
    'upload.supportedFormats': 'Supported formats: JPEG, PNG, GIF, MP4, MOV, AVI',
    'upload.maxSize': 'Max file size: 100MB',
    'upload.uploading': 'Uploading...',
    'upload.processing': 'Processing...',
    'upload.completed': 'Upload completed!',
    'upload.failed': 'Upload failed',
    'upload.retry': 'Retry',
    'upload.remove': 'Remove',
    'upload.cancel': 'Cancel',
    'upload.uploadMore': 'Upload More Files',
    'upload.storageUsage': 'Storage Usage',
    'upload.unlimited': 'Unlimited',
    
    // Class Members
    'class.student': 'Student',
    'class.teacher': 'Teacher',
    'class.role': 'Role',
    'class.email': 'Email',
    'class.joinDate': 'Join Date',
    'class.searchMembers': 'Search members...',
    'class.noMembers': 'No members found',
    'class.memberInfo': 'Member Information',
    
    // Share Modal
    'share.shareMedia': 'Share Media',
    'share.copyLink': 'Copy Link',
    'share.socialShare': 'Share on Social Media',
    'share.downloadOriginal': 'Download Original',
    'share.linkCopied': 'Link copied to clipboard!',
    'share.downloadFailed': 'Download failed',
    
    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.fullName': 'Full Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.dontHaveAccount': 'Don\'t have an account?',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.signInToUpload': 'SIGN IN TO UPLOAD',
    'auth.signInToAccess': 'Sign in to access your photo gallery',
    'auth.orContinueWith': 'Or continue with email',
    
    'auth.signInWithMagic': 'Sign in with magic link',
    'auth.usePasswordInstead': 'Use password instead',
    'auth.joinGallery': 'Join A5 Gallery and start sharing your memories',
    'auth.byCreatingAccount': 'By creating an account, you agree to our terms of service. You\'ll need to verify your email address to activate your account.',
    'auth.magicLinkDescription': 'We\'ll send a secure sign-in link to your email. Click the link to access your account without a password.',
    'auth.enterEmailForMagic': 'Enter your email to receive a magic link',
    'common.or': 'or',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.noMediaFound': 'No media found',
    'common.tryAdjusting': 'Try adjusting your search or filters',
    'common.startUploading': 'Start by uploading your first image or video',
    'common.pleaseSignIn': 'Please sign in',
    'common.needSignIn': 'You need to be signed in to view your media collection',
  },
  vi: {
    // Navigation
    'nav.gallery': 'Thư Viện',
    'nav.images': 'Hình Ảnh',
    'nav.videos': 'Video',
    'nav.upload': 'Tải Lên',
    'nav.classMembers': 'Thành Viên Lớp',
    'nav.settings': 'Cài Đặt',
    'nav.adminPanel': 'Quản Trị',
    'nav.signIn': 'ĐĂNG NHẬP',
    'nav.disconnect': 'ĐĂNG XUẤT',
    
    // Home/Dashboard
    'home.welcome': 'Chào mừng trở lại, {name}!',
    'home.welcomeGuest': 'Thư Viện Ảnh',
    'home.yourActivity': 'Đây là hoạt động gần đây của bạn',
    'home.explore': 'Khám phá bộ sưu tập của chúng tôi',
    'home.refresh': 'Làm Mới',
    'home.recentMedia': 'Phương Tiện Gần Đây',
    'home.viewAll': 'Xem Tất Cả',
    'home.noMedia': 'Chưa có phương tiện',
    'home.startUploading': 'Bắt đầu bằng cách tải lên hình ảnh hoặc video đầu tiên',
    'home.checkBack': 'Hãy quay lại sau để xem nội dung mới',
    'home.uploadMedia': 'Tải Lên Phương Tiện',
    'home.images': 'Hình Ảnh',
    'home.videos': 'Video',
    'home.storage': 'Lưu Trữ',
    
    // Images Page
    'images.title': 'Hình Ảnh',
    'images.subtitle': 'Duyệt bộ sưu tập hình ảnh của bạn',
    'images.backToGallery': 'Về Thư Viện',
    
    // Videos Page
    'videos.title': 'Video',
    'videos.subtitle': 'Duyệt bộ sưu tập video của bạn',
    
    // Upload Page
    'upload.title': 'Tải Lên Phương Tiện',
    'upload.subtitle': 'Thêm ảnh và video vào bộ sưu tập của bạn',
    
    // Class Members
    'class.title': 'Thành Viên Lớp',
    'class.subtitle': 'Xem hồ sơ thành viên lớp',
    
    // Settings
    'settings.title': 'Cài Đặt',
    'settings.subtitle': 'Quản lý tài khoản và tùy chọn của bạn',
    'settings.appearance': 'Giao Diện',
    'settings.language': 'Ngôn Ngữ',
    'settings.theme': 'Chủ Đề',
    'settings.auto': 'Tự Động',
    'settings.light': 'Sáng',
    'settings.dark': 'Tối',
    'settings.accentColor': 'Màu Nhấn',
    'settings.close': 'Đóng',
    'settings.backToGallery': 'Về Thư Viện',
    'settings.profile': 'Hồ Sơ',
    'settings.account': 'Tài Khoản',
    'settings.notifications': 'Thông Báo',
    'settings.storage': 'Lưu Trữ',
    'settings.adminPanel': 'Quản Trị',
    'settings.profileInfo': 'Thông Tin Hồ Sơ',
    'settings.emailAddress': 'Địa Chỉ Email',
    'settings.change': 'Thay Đổi',
    'settings.newEmailAddress': 'Địa Chỉ Email Mới',
    'settings.update': 'Cập Nhật',
    'settings.cancel': 'Hủy',
    'settings.emailConfirmation': 'Bạn sẽ nhận được liên kết xác nhận tại cả địa chỉ email cũ và mới.',
    'settings.fullName': 'Họ Và Tên',
    'settings.enterFullName': 'Nhập họ và tên của bạn',
    'settings.bio': 'Tiểu Sử',
    'settings.tellAboutYourself': 'Hãy kể về bản thân bạn',
    'settings.saveChanges': 'Lưu Thay Đổi',
    'settings.securitySettings': 'Cài Đặt Bảo Mật',
    'settings.currentPassword': 'Mật Khẩu Hiện Tại',
    'settings.enterCurrentPassword': 'Nhập mật khẩu hiện tại',
    'settings.newPassword': 'Mật Khẩu Mới',
    'settings.enterNewPassword': 'Nhập mật khẩu mới',
    'settings.confirmNewPassword': 'Xác Nhận Mật Khẩu Mới',
    'settings.confirmPassword': 'Xác nhận mật khẩu mới',
    'settings.updatePassword': 'Cập Nhật Mật Khẩu',
    'settings.exportData': 'Xuất Dữ Liệu',
    'settings.notificationPreferences': 'Tùy Chọn Thông Báo',
    'settings.emailNotifications': 'Thông Báo Email',
    'settings.emailNotificationsDesc': 'Nhận thông báo về tài khoản của bạn qua email',
    'settings.uploadNotifications': 'Thông Báo Tải Lên',
    'settings.uploadNotificationsDesc': 'Được thông báo khi việc tải lên hoàn tất',
    'settings.storageUsage': 'Sử Dụng Lưu Trữ',
    'settings.storageUsed': 'Đã Sử Dụng',
    'settings.storagePercentage': '% dung lượng lưu trữ đã sử dụng',
    
    // Image Slider
    'slider.featured': 'Nổi Bật',
    'slider.viewMore': 'Xem Thêm',
    'slider.previous': 'Trước',
    'slider.next': 'Tiếp',
    
    // Media Detail Modal
    'modal.mediaInformation': 'Thông Tin Phương Tiện',
    'modal.title': 'Tiêu Đề',
    'modal.description': 'Mô Tả',
    'modal.identification': 'Định Danh',
    'modal.mediaId': 'ID Phương Tiện',
    'modal.databaseId': 'ID Cơ Sở Dữ Liệu',
    'modal.uploadInformation': 'Thông Tin Tải Lên',
    'modal.uploadDate': 'Ngày Tải Lên',
    'modal.uploadedBy': 'Được tải lên bởi',
    'modal.actions': 'Hành Động',
    'modal.downloadOriginal': 'Tải Xuống File Gốc',
    'modal.share': 'Chia Sẻ',
    'modal.copyMediaId': 'Sao Chép ID Phương Tiện',
    'modal.copyDatabaseId': 'Sao Chép ID Cơ Sở Dữ Liệu',
    'modal.comments': 'Bình Luận',
    'modal.likes': 'Lượt Thích',
    'modal.addComment': 'Thêm bình luận...',
    'modal.post': 'Đăng',
    'modal.like': 'Thích',
    'modal.unlike': 'Bỏ Thích',
    'modal.noComments': 'Chưa có bình luận nào',
    'modal.beFirst': 'Hãy là người đầu tiên bình luận!',
    
    // Upload
    'upload.dragDrop': 'Kéo và thả file vào đây, hoặc nhấp để duyệt',
    'upload.selectFiles': 'Chọn File',
    'upload.supportedFormats': 'Định dạng hỗ trợ: JPEG, PNG, GIF, MP4, MOV, AVI',
    'upload.maxSize': 'Kích thước tối đa: 100MB',
    'upload.uploading': 'Đang tải lên...',
    'upload.processing': 'Đang xử lý...',
    'upload.completed': 'Tải lên hoàn tất!',
    'upload.failed': 'Tải lên thất bại',
    'upload.retry': 'Thử Lại',
    'upload.remove': 'Xóa',
    'upload.cancel': 'Hủy',
    'upload.uploadMore': 'Tải Lên Thêm File',
    'upload.storageUsage': 'Sử Dụng Lưu Trữ',
    'upload.unlimited': 'Không Giới Hạn',
    
    // Class Members
    'class.student': 'Học Sinh',
    'class.teacher': 'Giáo Viên',
    'class.role': 'Vai Trò',
    'class.email': 'Email',
    'class.joinDate': 'Ngày Tham Gia',
    'class.searchMembers': 'Tìm kiếm thành viên...',
    'class.noMembers': 'Không tìm thấy thành viên',
    'class.memberInfo': 'Thông Tin Thành Viên',
    
    // Share Modal
    'share.shareMedia': 'Chia Sẻ Phương Tiện',
    'share.copyLink': 'Sao Chép Liên Kết',
    'share.socialShare': 'Chia Sẻ Trên Mạng Xã Hội',
    'share.downloadOriginal': 'Tải Xuống Bản Gốc',
    'share.linkCopied': 'Đã sao chép liên kết!',
    'share.downloadFailed': 'Tải xuống thất bại',
    
    // Auth
    'auth.signIn': 'Đăng Nhập',
    'auth.signUp': 'Đăng Ký',
    'auth.email': 'Email',
    'auth.password': 'Mật Khẩu',
    'auth.confirmPassword': 'Xác Nhận Mật Khẩu',
    'auth.fullName': 'Họ Và Tên',
    'auth.forgotPassword': 'Quên Mật Khẩu?',
    'auth.dontHaveAccount': 'Chưa có tài khoản?',
    'auth.alreadyHaveAccount': 'Đã có tài khoản?',
    'auth.signInToUpload': 'ĐĂNG NHẬP ĐỂ TẢI LÊN',
    'auth.signInToAccess': 'Đăng nhập để truy cập thư viện ảnh của bạn',
    'auth.orContinueWith': 'Hoặc tiếp tục với email',
    
    'auth.signInWithMagic': 'Đăng nhập bằng liên kết thần kỳ',
    'auth.usePasswordInstead': 'Sử dụng mật khẩu thay thế',
    'auth.joinGallery': 'Tham gia A5 Gallery và bắt đầu chia sẻ kỷ niệm của bạn',
    'auth.byCreatingAccount': 'Bằng cách tạo tài khoản, bạn đồng ý với điều khoản dịch vụ của chúng tôi. Bạn sẽ cần xác minh địa chỉ email để kích hoạt tài khoản.',
    'auth.magicLinkDescription': 'Chúng tôi sẽ gửi một liên kết đăng nhập an toàn đến email của bạn. Nhấp vào liên kết để truy cập tài khoản mà không cần mật khẩu.',
    'auth.enterEmailForMagic': 'Nhập email của bạn để nhận liên kết thần kỳ',
    'common.or': 'hoặc',
    
    // Common
    'common.loading': 'Đang tải...',
    'common.error': 'Lỗi',
    'common.success': 'Thành công',
    'common.cancel': 'Hủy',
    'common.save': 'Lưu',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.view': 'Xem',
    'common.noMediaFound': 'Không tìm thấy phương tiện',
    'common.tryAdjusting': 'Thử điều chỉnh tìm kiếm hoặc bộ lọc của bạn',
    'common.startUploading': 'Bắt đầu bằng cách tải lên hình ảnh hoặc video đầu tiên',
    'common.pleaseSignIn': 'Vui lòng đăng nhập',
    'common.needSignIn': 'Bạn cần đăng nhập để xem bộ sưu tập phương tiện của mình',
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage && ['en', 'vi'].includes(savedLanguage) ? savedLanguage : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, params?: Record<string, string>) => {
    let translation = translations[language][key] || translations.en[key] || key;
    
    // Handle parameter substitution
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, value);
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}