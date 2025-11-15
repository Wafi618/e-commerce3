import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, FileText } from 'lucide-react';

interface ProductModalProps {
  product: any;
  onSave: (product: any) => void;
  onClose: () => void;
  loading: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState(product || {
    name: '',
    price: '',
    stock: '',
    category: '',
    subcategory: '',
    image: '',
    images: [],
    description: ''
  });
  const [descriptionTab, setDescriptionTab] = useState<'write' | 'preview'>('write');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    // Extract image URL from HTML code if needed
    let imageUrl = formData.image;
    if (imageUrl.includes('src="')) {
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
      images: Array.isArray(formData.images) ? formData.images : []
    };

    onSave(productData);
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
              />
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
              />
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image URL *
            </label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Paste image URL or HTML code (e.g., https://iili.io/image.jpg)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: If pasting HTML code like &lt;img src="URL"&gt;, we'll extract the URL automatically
            </p>
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image.includes('src="') ? formData.image.match(/src="([^"]+)"/)?.[1] : formData.image}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
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

          {/* Description with Markdown Support */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Markdown supported)
            </label>

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setDescriptionTab('write')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${
                  descriptionTab === 'write'
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
                className={`flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${
                  descriptionTab === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>

            {/* Content Area */}
            {descriptionTab === 'write' ? (
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter product description in Markdown format...&#10;&#10;Examples:&#10;# Heading&#10;**Bold text**&#10;- List item&#10;&#10;| Column 1 | Column 2 |&#10;|----------|----------|&#10;| Data 1   | Data 2   |"
                rows={8}
              />
            ) : (
              <div className="w-full min-h-[200px] max-h-[400px] overflow-y-auto px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                {formData.description ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-2">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 text-sm" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => (
                          <thead className="bg-gray-50" {...props} />
                        ),
                        th: ({node, ...props}) => (
                          <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-900" {...props} />
                        ),
                        td: ({node, ...props}) => (
                          <td className="px-3 py-1.5 text-xs text-gray-700 border-t border-gray-200" {...props} />
                        ),
                        h1: ({node, ...props}) => (
                          <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900" {...props} />
                        ),
                        h2: ({node, ...props}) => (
                          <h2 className="text-lg font-bold mt-3 mb-2 text-gray-900" {...props} />
                        ),
                        h3: ({node, ...props}) => (
                          <h3 className="text-base font-semibold mt-2 mb-1 text-gray-900" {...props} />
                        ),
                        p: ({node, ...props}) => (
                          <p className="mb-2 text-gray-600" {...props} />
                        ),
                        ul: ({node, ...props}) => (
                          <ul className="list-disc list-inside mb-2 text-gray-600" {...props} />
                        ),
                        ol: ({node, ...props}) => (
                          <ol className="list-decimal list-inside mb-2 text-gray-600" {...props} />
                        ),
                        code: ({node, inline, ...props}: any) => (
                          inline ?
                            <code className="px-1 py-0.5 rounded text-xs font-mono bg-gray-200 text-blue-600" {...props} /> :
                            <code className="block p-2 rounded text-xs font-mono bg-gray-200 text-gray-800 overflow-x-auto" {...props} />
                        ),
                        a: ({node, ...props}) => (
                          <a className="text-blue-600 hover:text-blue-700 underline" {...props} />
                        ),
                      }}
                    >
                      {formData.description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No description to preview. Switch to Write tab to add content.</p>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              💡 Supports Markdown: headings, bold, italic, lists, tables, code, links, etc.
            </p>
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
