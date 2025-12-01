import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, FileText, Plus, Trash2, X } from 'lucide-react';
import { useProduct } from '@/contexts/ProductContext';

interface ProductModalProps {
  product: any;
  onSave: (product: any) => void;
  onClose: () => void;
  loading: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onSave, onClose, loading }) => {
  const { categories, products } = useProduct();

  const [formData, setFormData] = useState(product || {
    name: '',
    price: '',
    stock: '',
    category: '',
    subcategory: '',
    image: '',
    images: [],
    description: '',
    options: []
  });

  // Derive subcategories for the selected category
  const availableSubcategories = React.useMemo(() => {
    if (!formData.category) return [];
    const relevantProducts = products.filter(p => p.category === formData.category);
    return Array.from(new Set(relevantProducts.map(p => p.subcategory).filter(Boolean))) as string[];
  }, [products, formData.category]);

  const [descriptionTab, setDescriptionTab] = useState<'write' | 'preview'>('write');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Convert to Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;

      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();

        if (data.success) {
          setUrl(data.url);
        } else {
          alert('Upload failed');
        }
      } catch (err) {
        console.error(err);
        alert('Error uploading image');
      } finally {
        setUploading(false);
      }
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hasMainImage = formData.image && formData.image.trim().length > 0;
    const hasOptionImage = formData.options?.some((opt: any) => opt.values.some((val: any) => val.image && val.image.trim().length > 0));

    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    if (!hasMainImage && !hasOptionImage) {
      alert('Please provide either a main product image or at least one image in product options.');
      return;
    }

    // Extract image URL from HTML code if needed
    let imageUrl = formData.image;
    if (imageUrl && imageUrl.includes('src="')) {
      const match = imageUrl.match(/src="([^"]+)"/);
      if (match) {
        imageUrl = match[1];
      }
    }

    const productData = {
      ...formData,
      image: imageUrl,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      subcategory: formData.subcategory || null,
      images: Array.isArray(formData.images) ? formData.images : [],
      options: formData.options || []
    };

    onSave(productData);
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...(formData.options || []), { name: '', values: [] }]
    });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(formData.options || [])];
    newOptions.splice(index, 1);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOptionName = (index: number, name: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index].name = name;
    setFormData({ ...formData, options: newOptions });
  };

  const addOptionValue = (optionIndex: number) => {
    const newOptions = [...(formData.options || [])];
    newOptions[optionIndex].values.push({ name: '', image: '' });
    setFormData({ ...formData, options: newOptions });
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...(formData.options || [])];
    newOptions[optionIndex].values.splice(valueIndex, 1);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOptionValue = (optionIndex: number, valueIndex: number, field: 'name' | 'image', value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[optionIndex].values[valueIndex][field] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Electronics, Accessories"
                  required
                  list="category-list"
                />
                <datalist id="category-list">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  value={formData.subcategory || ''}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Phones, Headphones"
                  list="subcategory-list"
                />
                <datalist id="subcategory-list">
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (৳) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Images</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Product Image URL {formData.options && formData.options.length > 0 ? '(Optional if options have images)' : '*'}
              </label>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Auto-fills URL)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, (url) => setFormData({ ...formData, image: url }))}
                  disabled={uploading}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <input
                type="text"
                value={formData.image || ''}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Paste image URL"
                required={!formData.options || formData.options.length === 0}
              />
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={formData.image.includes('src="') ? formData.image.match(/src="([^"]+)"/)?.[1] : formData.image}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Images (comma-separated URLs)
              </label>
              <textarea
                value={Array.isArray(formData.images) ? formData.images.join(', ') : ''}
                onChange={(e) => {
                  const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url);
                  setFormData({ ...formData, images: urls });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image2.jpg, https://example.com/image3.jpg"
                rows={3}
              />
            </div>
          </div>

          {/* Product Options Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Product Options</h4>
              <button
                type="button"
                onClick={addOption}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>
            </div>
            
            {formData.options?.length === 0 && (
              <p className="text-sm text-gray-500 italic">No options added yet (e.g. Size, Color).</p>
            )}

            <div className="space-y-4">
              {formData.options?.map((option: any, optIdx: number) => (
                <div key={optIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Option Name (e.g. Color)</label>
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) => updateOptionName(optIdx, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Size, Color"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(optIdx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-5"
                      title="Remove Option"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Option Values */}
                  <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                    {option.values?.map((value: any, valIdx: number) => (
                      <div key={valIdx} className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={value.name}
                            onChange={(e) => updateOptionValue(optIdx, valIdx, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Value (e.g. Red, XL)"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={value.image || ''}
                              onChange={(e) => updateOptionValue(optIdx, valIdx, 'image', e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-600"
                              placeholder="Image URL (optional)"
                            />
                            <label className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-xs cursor-pointer hover:bg-gray-300">
                              Upload
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, (url) => updateOptionValue(optIdx, valIdx, 'image', url))}
                              />
                            </label>
                          </div>
                        </div>
                         {value.image && (
                            <img src={value.image} alt="val" className="w-10 h-10 rounded object-cover border" />
                         )}
                        <button
                          type="button"
                          onClick={() => removeOptionValue(optIdx, valIdx)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOptionValue(optIdx)}
                      className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mt-2"
                    >
                      <Plus className="w-3 h-3" /> Add Value
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description Section */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Markdown supported)
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setDescriptionTab('write')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${descriptionTab === 'write'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <FileText className="w-4 h-4" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setDescriptionTab('preview')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${descriptionTab === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>
            {descriptionTab === 'write' ? (
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter product description..."
                rows={8}
              />
            ) : (
              <div className="w-full min-h-[200px] max-h-[400px] overflow-y-auto px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                {formData.description ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.description}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No description.</p>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Fixed Footer with Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                const form = e.currentTarget.closest('.flex.flex-col')?.querySelector('form');
                if (form) {
                  const event = new Event('submit', { bubbles: true, cancelable: true });
                  form.dispatchEvent(event);
                }
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};