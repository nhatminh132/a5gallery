import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Hash, Folder, Search, Filter } from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Tag {
  id: string;
  name: string;
  color: string;
  usage_count: number;
  created_by: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  media_count: number;
  created_by: string;
}

interface TagsCategoriesProps {
  media?: Media;
  onTagSelect?: (tag: string) => void;
  onCategorySelect?: (category: string) => void;
  mode?: 'manage' | 'filter' | 'assign';
  className?: string;
}

export default function TagsCategories({ 
  media, 
  onTagSelect, 
  onCategorySelect, 
  mode = 'filter',
  className = '' 
}: TagsCategoriesProps) {
  const { user, profile } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaTags, setMediaTags] = useState<string[]>([]);
  const [mediaCategory, setMediaCategory] = useState<string>('');
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3B82F6' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tags' | 'categories'>('tags');

  const tagColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  useEffect(() => {
    loadTagsAndCategories();
    if (media) {
      loadMediaTagsAndCategory();
    }
  }, [media]);

  const loadTagsAndCategories = async () => {
    try {
      setLoading(true);

      // Load tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (tagsError) {
        console.error('Error loading tags:', tagsError);
      } else {
        setTags(tagsData || []);
      }

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('media_count', { ascending: false });

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMediaTagsAndCategory = async () => {
    if (!media) return;

    try {
      // Load media tags
      const { data: mediaTagsData, error: tagsError } = await supabase
        .from('media_tags')
        .select('tag_id, tags(name)')
        .eq('media_id', media.id);

      if (!tagsError && mediaTagsData) {
        setMediaTags(mediaTagsData.map(mt => mt.tags?.name).filter(Boolean));
      }

      // Load media category
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('category_id, categories(name)')
        .eq('id', media.id)
        .single();

      if (!mediaError && mediaData?.categories?.name) {
        setMediaCategory(mediaData.categories.name);
      }

    } catch (error) {
      console.error('Error loading media tags and category:', error);
    }
  };

  const createTag = async () => {
    if (!newTag.trim() || !user) return;

    try {
      const randomColor = tagColors[Math.floor(Math.random() * tagColors.length)];
      
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: newTag.trim().toLowerCase(),
          color: randomColor,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setTags(prev => [...prev, { ...data, usage_count: 0 }]);
      setNewTag('');
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag. It might already exist.');
    }
  };

  const createCategory = async () => {
    if (!newCategory.name.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name.trim(),
          description: newCategory.description.trim(),
          color: newCategory.color,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, { ...data, media_count: 0 }]);
      setNewCategory({ name: '', description: '', color: '#3B82F6' });
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category. It might already exist.');
    }
  };

  const addTagToMedia = async (tagName: string) => {
    if (!media || !user) return;

    try {
      // Find or create tag
      let tag = tags.find(t => t.name === tagName);
      if (!tag) {
        const { data: newTagData, error: tagError } = await supabase
          .from('tags')
          .insert({
            name: tagName,
            color: tagColors[Math.floor(Math.random() * tagColors.length)],
            created_by: user.id
          })
          .select()
          .single();

        if (tagError) throw tagError;
        tag = newTagData;
        setTags(prev => [...prev, { ...tag!, usage_count: 0 }]);
      }

      // Add tag to media
      const { error } = await supabase
        .from('media_tags')
        .insert({
          media_id: media.id,
          tag_id: tag.id
        });

      if (error) throw error;

      setMediaTags(prev => [...prev, tagName]);
      
      // Update tag usage count
      setTags(prev => prev.map(t => 
        t.id === tag!.id ? { ...t, usage_count: t.usage_count + 1 } : t
      ));

    } catch (error) {
      console.error('Error adding tag to media:', error);
    }
  };

  const removeTagFromMedia = async (tagName: string) => {
    if (!media) return;

    try {
      const tag = tags.find(t => t.name === tagName);
      if (!tag) return;

      const { error } = await supabase
        .from('media_tags')
        .delete()
        .eq('media_id', media.id)
        .eq('tag_id', tag.id);

      if (error) throw error;

      setMediaTags(prev => prev.filter(t => t !== tagName));
      
      // Update tag usage count
      setTags(prev => prev.map(t => 
        t.id === tag.id ? { ...t, usage_count: Math.max(0, t.usage_count - 1) } : t
      ));

    } catch (error) {
      console.error('Error removing tag from media:', error);
    }
  };

  const assignCategoryToMedia = async (categoryName: string) => {
    if (!media || !user) return;

    try {
      const category = categories.find(c => c.name === categoryName);
      if (!category) return;

      const { error } = await supabase
        .from('media')
        .update({ category_id: category.id })
        .eq('id', media.id);

      if (error) throw error;

      setMediaCategory(categoryName);

    } catch (error) {
      console.error('Error assigning category to media:', error);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-14"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('tags')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'tags'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Hash className="w-4 h-4" />
          Tags
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Folder className="w-4 h-4" />
          Categories
        </button>
      </div>

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          {/* Current Media Tags */}
          {media && mediaTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {mediaTags.map((tagName) => {
                  const tag = tags.find(t => t.name === tagName);
                  return (
                    <span
                      key={tagName}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: tag?.color || '#6B7280' }}
                    >
                      #{tagName}
                      {mode === 'assign' && (
                        <button
                          onClick={() => removeTagFromMedia(tagName)}
                          className="hover:bg-white/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add New Tag */}
          {(mode === 'manage' || mode === 'assign') && user && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (media && mode === 'assign') {
                      addTagToMedia(newTag.trim().toLowerCase());
                    } else {
                      createTag();
                    }
                  }
                }}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  if (media && mode === 'assign') {
                    addTagToMedia(newTag.trim().toLowerCase());
                  } else {
                    createTag();
                  }
                }}
                disabled={!newTag.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Available Tags */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Tags ({tags.length})
            </h4>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (mode === 'filter' && onTagSelect) {
                      onTagSelect(tag.name);
                    } else if (mode === 'assign' && media && !mediaTags.includes(tag.name)) {
                      addTagToMedia(tag.name);
                    }
                  }}
                  disabled={mode === 'assign' && media && mediaTags.includes(tag.name)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white transition-opacity ${
                    mode === 'assign' && media && mediaTags.includes(tag.name) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:opacity-80'
                  }`}
                  style={{ backgroundColor: tag.color }}
                >
                  #{tag.name}
                  <span className="text-xs opacity-75">({tag.usage_count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Current Media Category */}
          {media && mediaCategory && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Category
              </h4>
              <div className="flex items-center gap-2">
                {(() => {
                  const category = categories.find(c => c.name === mediaCategory);
                  return (
                    <span
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: category?.color || '#6B7280' }}
                    >
                      <Folder className="w-3 h-3" />
                      {mediaCategory}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Add New Category */}
          {(mode === 'manage' || mode === 'assign') && user && (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Category</h5>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Category name..."
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Description (optional)..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={createCategory}
                    disabled={!newCategory.name.trim()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm transition-colors"
                  >
                    Create Category
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Available Categories */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Categories ({categories.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    if (mode === 'filter' && onCategorySelect) {
                      onCategorySelect(category.name);
                    } else if (mode === 'assign' && media) {
                      assignCategoryToMedia(category.name);
                    }
                  }}
                  disabled={mode === 'assign' && media && mediaCategory === category.name}
                  className={`p-3 rounded-lg text-left transition-opacity ${
                    mode === 'assign' && media && mediaCategory === category.name
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:opacity-80'
                  }`}
                  style={{ backgroundColor: category.color + '20', borderLeft: `4px solid ${category.color}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" style={{ color: category.color }} />
                      <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({category.media_count})
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {category.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}