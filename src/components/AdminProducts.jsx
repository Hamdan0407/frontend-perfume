import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import '../styles/AdminProducts.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Women',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    variants: []
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Try admin endpoint first, fall back to public products endpoint
      const response = await api.get('/admin/products?size=100').catch(async (err) => {
        // Fallback to public if admin fails
        return await api.get('/products?size=100');
      });

      if (response.data) {
        const data = response.data;
        setProducts(data.content || data || []);
      }
      else {
        console.warn('Failed to load products, using empty list');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    // HARD validation - do not proceed if fails
    if (!formData.name?.trim()) {
      toast.error('Product name required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price required');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) <= 0) {
      toast.error('Valid stock required');
      return;
    }
    if (!formData.description || formData.description.trim().length < 10) {
      toast.error(`Description: ${formData.description.length}/10 min characters`);
      return;
    }

    try {
      setSubmitting(true);

      const imageUrl = formData.image_url?.trim() || 'https://via.placeholder.com/300?text=Product';

      const payload = {
        name: formData.name.trim(),
        brand: formData.brand?.trim() || 'Unknown',
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description.trim(),
        imageUrl: imageUrl,
        variants: formData.variants.map(v => ({
          size: parseInt(v.size),
          price: parseFloat(v.price),
          discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : null,
          stock: parseInt(v.stock),
          sku: v.sku || null
        }))
      };

      console.log('Payload:', payload);

      const response = await api.post('/admin/products', payload);

      if (response.status === 200 || response.status === 201) {
        toast.success('Product added!');
        setShowModal(false);
        resetForm();
        fetchProducts();
      } else {
        const data = response.data;
        if (data?.errors) {
          data.errors.forEach((e, i) => setTimeout(() => toast.error(e), i * 300));
        } else {
          toast.error(data?.message || `Error ${response.status}`);
        }
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Not authenticated. Please login again.');
        return;
      }

      // Remove from UI immediately
      setProducts(prev => prev.filter(p => p.id !== id));

      const response = await api.delete(`/admin/products/${id}`);

      // Accept 200, 204, or any 2xx response
      if (response.status === 200 || response.status === 204) {
        console.log('Product deleted successfully');
        toast.success('Product deleted successfully');
      } else if (response.status === 401) {
        // Restore product if auth failed
        fetchProducts();
        toast.error('Unauthorized. Please login again.');
        setTimeout(() => window.location.href = '/login', 1500);
      } else if (response.status === 404) {
        toast.error('Product not found');
      } else {
        // Restore product on error
        fetchProducts();
        const errorData = response.data || {};
        toast.error(errorData.message || `Failed to delete product (${response.status})`);
      }
    } catch (error) {
      // Restore product on error
      fetchProducts();
      console.error('Error deleting product:', error);
      toast.error('Error: ' + (error.message || 'Failed to delete'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      category: 'Women',
      price: '',
      stock: '',
      description: '',
      image_url: '',
      variants: []
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Women', 'Men', 'Unisex'];

  return (
    <div className="products-container">
      <div className="products-header">
        <div className="header-left">
          <h2>Products Management</h2>
          <p>{filteredProducts.length} products</p>
        </div>
        <button className="btn-add-product" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="products-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search products by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <Filter size={18} />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="products-table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="loading">Loading...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="7" className="empty">No products found</td></tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="product-info">
                      <img src={product.image_url} alt={product.name} onError={(e) => e.target.src = 'https://via.placeholder.com/50'} />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{product.brand || 'N/A'}</td>
                  <td><span className="badge">{product.category}</span></td>
                  <td className="price">₹{product.price?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={`stock ${product.stock < 20 ? 'low' : ''}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <span className="rating">★ {product.rating || 0}</span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon delete"
                      title="Delete"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add New Product</h3>
            <form onSubmit={handleAddProduct}>
              <div className="form-grid">
                <div className="form-field">
                  <input
                    type="text"
                    placeholder="Product Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  {!formData.name && <span className="error-text">Product name is required</span>}
                </div>

                <div className="form-field">
                  <input
                    type="text"
                    placeholder="Brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                <div className="form-field">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price *"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                  {!formData.price && <span className="error-text">Price is required</span>}
                </div>

                <div className="form-field">
                  <input
                    type="number"
                    placeholder="Stock *"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                  {!formData.stock && <span className="error-text">Stock is required</span>}
                </div>

                <div className="form-field">
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <textarea
                    placeholder="Description (10-2000 characters) *"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                  <div className="field-info">
                    <span className={formData.description.length < 10 ? 'error-text' : formData.description.length > 2000 ? 'error-text' : 'success-text'}>
                      {formData.description.length}/2000 characters
                    </span>
                  </div>
                  {formData.description.length < 10 && <span className="error-text">Description must be at least 10 characters</span>}
                  {formData.description.length > 2000 && <span className="error-text">Description cannot exceed 2000 characters</span>}
                </div>

                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '600' }}>Product Variants (Optional)</h4>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Add size variants (3ml, 6ml, 10ml, 12ml) with individual pricing</p>

                  {formData.variants.map((variant, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 100px 1fr auto', gap: '10px', marginBottom: '10px', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                      <select
                        value={variant.size}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].size = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        style={{ padding: '8px' }}
                      >
                        <option value="">Size</option>
                        <option value="3">3ml</option>
                        <option value="6">6ml</option>
                        <option value="10">10ml</option>
                        <option value="12">12ml</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={variant.price}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].price = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Discount Price"
                        value={variant.discountPrice}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].discountPrice = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={variant.stock}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].stock = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="SKU (optional)"
                        value={variant.sku}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].sku = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = formData.variants.filter((_, i) => i !== index);
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        style={{ padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        variants: [...formData.variants, { size: '', price: '', discountPrice: '', stock: '', sku: '' }]
                      });
                    }}
                    style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                  >
                    + Add Variant
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || !formData.name || !formData.price || !formData.stock || formData.description.length < 10 || formData.description.length > 2000}
                >
                  {submitting ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
