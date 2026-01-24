import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Search, User as UserIcon, X, Instagram, Facebook } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ClassMembersProps {
  onNavigate: (page: string) => void;
}

interface Member {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  instagram?: string;
  facebook?: string;
}

export default function ClassMembers({ onNavigate }: ClassMembersProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
  const getRoleTranslation = (role: string) => {
    if (role.includes('Teacher')) return t('class.teacher');
    if (role.includes('Student')) {
      return role.replace('Student', t('class.student'));
    }
    return role;
  };
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [members] = useState<Member[]>([
    // Teachers
    { id: '1', name: 'TẠ UYÊN VY', role: 'Teacher' },
    { id: '2', name: 'HUYỀN ANH', role: 'Teacher' },
    { id: '3', name: 'NGUYỄN THỊ ĐÀO', role: 'Teacher' },
    { id: '4', name: 'PHẠM THỊ THANH THỦY', role: 'Teacher' },
    
    // Students
    { id: '5', name: 'ĐƯỜNG MINH THÙY ANH', role: 'Student' },
    { id: '6', name: 'HUỲNH NGỌC QUỲNH ANH', role: 'Student' },
    { id: '7', name: 'NGUYỄN HỒNG MINH ANH', role: 'Student' },
    { id: '8', name: 'PHẠM QUỲNH ANH', role: 'Student' },
    { id: '9', name: 'NGUYỄN VĨNH THIÊN ẤN', role: 'Student' },
    { id: '10', name: 'NGUYỄN HÙNG DŨNG', role: 'Student' },
    { id: '11', name: 'NGUYỄN QUỐC HUY', role: 'Student' },
    { id: '12', name: 'NGUYỄN TRẦN NGUYÊN KHANG', role: 'Student' },
    { id: '13', name: 'TRƯƠNG NHẬT MINH KHANG', role: 'Student' },
    { id: '14', name: 'NGUYỄN HỒNG PHƯƠNG KHANH', role: 'Student' },
    { id: '15', name: 'PHẠM PHƯỚC KHOA', role: 'Student / nole' },
    { id: '16', name: 'BÙI TRÌNH MINH KHUÊ', role: 'Student' },
    { id: '17', name: 'TRỊNH QUÁN LÂM', role: 'Student / Entrepreneur' },
    { id: '18', name: 'NGUYỄN HOÀNG MAI', role: 'Student' },
    { id: '19', name: 'LÊ PHƯỚC NHẬT MINH', role: 'Student / Lead Developer' },
    { id: '20', name: 'PHẠM ĐĂNG MINH', role: 'Student' },
    { id: '21', name: 'ĐẶNG BẢO NGỌC', role: 'Student' },
    { id: '22', name: 'PHÙNG VÂN KHÁNH NGỌC', role: 'Student' },
    { id: '23', name: 'TRẦN THIỆN NHÂN', role: 'Student / THE LIEMS' },
    { id: '24', name: 'CHUNG TIẾN PHÁT', role: 'Student / Cali |||' },
    { id: '25', name: 'VŨ MINH GIA PHÚC', role: 'Student' },
    { id: '26', name: 'NGUYỄN THIỆN HẠNH THẢO', role: 'Student' },
    { id: '27', name: 'HỒ KHOA PHƯỚC THỊNH', role: 'Student' },
    { id: '28', name: 'NGUYỄN HUỲNH ANH THƯ', role: 'Student' },
    { id: '29', name: 'ĐỖ THỊ PHƯƠNG UYÊN', role: 'Student' },
    { id: '30', name: 'NGUYỄN HỒ THANH VÂN', role: 'Student' },
    { id: '31', name: 'NGÔ TRẦN PHƯƠNG VY', role: 'Student' },
    { id: '32', name: 'NGUYỄN QUÝ THANH VÂN', role: 'Student' },
    { id: '33', name: 'NGUYỄN CẢNH KHÔI', role: 'Student' },
    { id: '34', name: 'NGUYỄN HÀ ANH DUY', role: 'Student' },
    { id: '35', name: 'DANH THIÊN KIM', role: 'Student' },
  ]);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Create particle effect
  const createParticleEffect = (element: HTMLElement) => {
    const particles = 8;
    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-3 h-3 bg-blue-500 rounded-full opacity-80 animate-ping pointer-events-none z-10';
      particle.style.left = `${10 + Math.random() * 80}%`;
      particle.style.top = `${10 + Math.random() * 80}%`;
      particle.style.animationDelay = `${Math.random() * 0.3}s`;
      particle.style.animationDuration = `${0.6 + Math.random() * 0.4}s`;
      
      element.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 1000);
    }
  };


  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      {/* Particle Background - only in dark mode */}
      <div className="particles-bg absolute inset-0 z-0 hidden dark:block"></div>
      
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
              <span className="hidden sm:inline">Back to Gallery</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-black border border-blue-200 dark:border-blue-500/30 rounded-lg shadow-lg dark:shadow-blue-500/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('class.title')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-6 dark:backdrop-blur-sm">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members by name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden dark:backdrop-blur-sm">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                  <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No members found' : 'No members added yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Members will appear here once added to the class'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMembers.map((member) => {
                  return (
                    <div
                      key={member.id}
                      className={`relative overflow-visible p-6 transition-all duration-200 ${
                        member.role === 'Teacher'
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-l-4 border-amber-400 dark:border-amber-500 shadow-lg hover:shadow-xl hover:shadow-amber-200/50 dark:hover:shadow-amber-800/30 animate-pulse-slow'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      style={{ position: 'relative' }}
                      onMouseEnter={(e) => {
                        createParticleEffect(e.currentTarget);
                      }}
                    >
                    {/* Member Info */}
                    <div className="w-full">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 
                            className={`text-lg font-semibold truncate transition-all duration-300 cursor-pointer hover:underline ${
                              member.name === 'TRẦN THIỆN NHÂN'
                                ? 'bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent animate-pulse hover:animate-bounce'
                                : member.name === 'LÊ PHƯỚC NHẬT MINH'
                                ? 'text-cyan-400 dark:text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] dark:drop-shadow-[0_0_15px_rgba(103,232,249,0.9)] hover:drop-shadow-[0_0_20px_rgba(34,211,238,1)] animate-pulse hover:animate-bounce'
                                : (member.name === 'CHUNG TIẾN PHÁT' || member.name === 'PHẠM PHƯỚC KHOA')
                                ? 'text-lime-400 dark:text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.8)] dark:drop-shadow-[0_0_12px_rgba(190,242,100,0.9)] hover:drop-shadow-[0_0_18px_rgba(163,230,53,1)] animate-pulse hover:animate-bounce'
                                : member.role === 'Teacher'
                                ? 'text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.5)] dark:hover:drop-shadow-[0_0_12px_rgba(244,114,182,0.6)] animate-pulse'
                                : 'text-gray-900 dark:text-white'
                            }`}
                            onClick={() => {
                              setSelectedMember(member);
                              setShowMemberModal(true);
                            }}
                          >
                            {member.name === 'LÊ PHƯỚC NHẬT MINH' && <span className="text-yellow-400 mr-1">👑</span>}
                            {(member.name === 'CHUNG TIẾN PHÁT' || member.name === 'PHẠM PHƯỚC KHOA') && <span className="text-gray-400 mr-1">👑</span>}
                            {member.name}
                          </h3>
                          {member.role && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${
                              member.name === 'TRẦN THIỆN NHÂN'
                                ? 'bg-gradient-to-r from-red-400 via-orange-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 to-purple-400 text-white font-bold animate-pulse hover:animate-bounce shadow-lg hover:shadow-xl'
                                : member.name === 'LÊ PHƯỚC NHẬT MINH'
                                ? 'bg-cyan-900/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] hover:shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse hover:animate-bounce font-bold'
                                : (member.name === 'CHUNG TIẾN PHÁT' || member.name === 'PHẠM PHƯỚC KHOA')
                                ? 'bg-lime-900/20 text-lime-300 border border-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)] hover:shadow-[0_0_12px_rgba(163,230,53,0.8)] animate-pulse hover:animate-bounce font-bold'
                                : member.role === 'Teacher'
                                ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-800/30 hover:drop-shadow-[0_0_6px_rgba(236,72,153,0.4)] dark:hover:drop-shadow-[0_0_8px_rgba(244,114,182,0.5)] animate-pulse'
                                : 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300'
                            }`}>
                              {getRoleTranslation(member.role || '')}
                            </span>
                          )}
                        </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Member Social Media Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-gray-800 rounded-xl shadow-2xl max-w-md w-full backdrop-blur-sm relative z-20">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedMember.name}
              </h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Member Role */}
              {selectedMember.role && (
                <div className="text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedMember.role === 'Teacher'
                      ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300'
                      : 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300'
                  }`}>
                    {getRoleTranslation(selectedMember.role)}
                  </span>
                </div>
              )}

              {/* Social Media Buttons */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">
                  Connect on Social Media
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Instagram Button */}
                  <button
                    onClick={() => {
                      // TODO: Handle Instagram link - will use your data file
                      console.log('Instagram clicked for:', selectedMember.name);
                      // For now, just close the modal
                      setShowMemberModal(false);
                    }}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="font-medium">Instagram</span>
                  </button>

                  {/* Facebook Button */}
                  <button
                    onClick={() => {
                      // TODO: Handle Facebook link - will use your data file
                      console.log('Facebook clicked for:', selectedMember.name);
                      // For now, just close the modal
                      setShowMemberModal(false);
                    }}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Facebook className="w-5 h-5" />
                    <span className="font-medium">Facebook</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to visit their social media profiles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}