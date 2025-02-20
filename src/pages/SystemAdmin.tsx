import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Battery as Category, Store, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BusinessCategory, SystemSettings, Profile } from '../types';

export function SystemAdmin() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileData?.role !== 'system_admin') {
        navigate('/');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    }

    loadProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  return <SystemAdminDashboard />;
}

function SystemAdminDashboard() {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    icon: '',
    active: true
  });
  const [settings, setSettings] = useState<SystemSettings>({
    delivery_settings: {
      min_order_value: 15,
      max_delivery_radius: 5,
      default_delivery_fee: 5
    },
    business_settings: {
      require_address: true,
      require_phone: true,
      max_categories: 3
    }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('business_categories')
        .select('*')
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Load settings
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('*');

      if (settingsData) {
        const settingsObj: Partial<SystemSettings> = {
          delivery_settings: {
            min_order_value: 15,
            max_delivery_radius: 5,
            default_delivery_fee: 5
          },
          business_settings: {
            require_address: true,
            require_phone: true,
            max_categories: 3
          }
        };

        settingsData.forEach(setting => {
          if (setting.key === 'delivery_settings' || setting.key === 'business_settings') {
            settingsObj[setting.key] = setting.value;
          }
        });

        setSettings(settingsObj as SystemSettings);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error loading data. Please try again.');
    }
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedCategory) {
        // Update existing category
        const { error } = await supabase
          .from('business_categories')
          .update({
            name: newCategory.name,
            slug: newCategory.slug,
            icon: newCategory.icon,
            active: newCategory.active
          })
          .eq('id', selectedCategory.id);

        if (error) throw error;
        setSuccess('Category updated successfully!');
      } else {
        // Create new category
        const { error } = await supabase
          .from('business_categories')
          .insert([newCategory]);

        if (error) throw error;
        setSuccess('Category created successfully!');
      }

      loadData();
      setSelectedCategory(null);
      setNewCategory({ name: '', slug: '', icon: '', active: true });
    } catch (err) {
      setError('Error saving category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update delivery settings
      const { error: deliveryError } = await supabase
        .from('system_settings')
        .update({ value: settings.delivery_settings })
        .eq('key', 'delivery_settings');

      if (deliveryError) throw deliveryError;

      // Update business settings
      const { error: businessError } = await supabase
        .from('system_settings')
        .update({ value: settings.business_settings })
        .eq('key', 'business_settings');

      if (businessError) throw businessError;

      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">System Administration</h1>
          <p className="text-gray-600">Settings and Management</p>
        </div>
        <Settings className="h-12 w-12 text-red-600" />
      </div>

      {/* Categories Management */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Business Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Category List */}
          <div>
            <div className="space-y-4">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-red-200 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(category);
                    setNewCategory({
                      name: category.name,
                      slug: category.slug,
                      icon: category.icon,
                      active: category.active
                    });
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <Category className="h-6 w-6 text-gray-500" />
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.slug}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    category.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Form */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {selectedCategory ? 'Edit Category' : 'New Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newCategory.active}
                    onChange={(e) => setNewCategory({ ...newCategory, active: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              {success && (
                <div className="text-green-600 text-sm">{success}</div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setNewCategory({ name: '', slug: '', icon: '', active: true });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
                >
                  {saving ? 'Saving...' : (selectedCategory ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">System Settings</h2>
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Delivery Settings */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Delivery Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Value
                </label>
                <input
                  type="number"
                  value={settings.delivery_settings.min_order_value}
                  onChange={(e) => setSettings({
                    ...settings,
                    delivery_settings: {
                      ...settings.delivery_settings,
                      min_order_value: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Delivery Radius (km)
                </label>
                <input
                  type="number"
                  value={settings.delivery_settings.max_delivery_radius}
                  onChange={(e) => setSettings({
                    ...settings,
                    delivery_settings: {
                      ...settings.delivery_settings,
                      max_delivery_radius: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  step="0.1"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Delivery Fee
                </label>
                <input
                  type="number"
                  value={settings.delivery_settings.default_delivery_fee}
                  onChange={(e) => setSettings({
                    ...settings,
                    delivery_settings: {
                      ...settings.delivery_settings,
                      default_delivery_fee: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Business Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Business Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.business_settings.require_address}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_settings: {
                        ...settings.business_settings,
                        require_address: e.target.checked
                      }
                    })}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Require business address
                  </span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.business_settings.require_phone}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_settings: {
                        ...settings.business_settings,
                        require_phone: e.target.checked
                      }
                    })}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Require business phone
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Categories per Business
                </label>
                <input
                  type="number"
                  value={settings.business_settings.max_categories}
                  onChange={(e) => setSettings({
                    ...settings,
                    business_settings: {
                      ...settings.business_settings,
                      max_categories: parseInt(e.target.value)
                    }
                  })}
                  className="w-full p-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                  min="1"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}