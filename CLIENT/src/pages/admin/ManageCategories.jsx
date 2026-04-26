import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import './AdminStyles.css';
import './ManageCategorys.css'; 

export default function ManageCategories() {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editId, setEditId] = useState(null);

    const fetchCategories = async () => {
        const res = await axiosClient.get('/categories');
        setCategories(res.data);
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await axiosClient.put(`/categories/${editId}`, formData);
                alert("Cập nhật thành công!");
            } else {
                await axiosClient.post('/categories', formData);
                alert("Thêm mới thành công!");
            }
            setFormData({ name: '', description: '' });
            setEditId(null);
            fetchCategories();
        } catch (error) { alert("Lỗi: " + error.message); }
    };

    const handleEdit = (cat) => {
        setFormData({ name: cat.name, description: cat.description || '' });
        setEditId(cat._id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa danh mục này?")) {
            await axiosClient.delete(`/categories/${id}`);
            fetchCategories();
        }
    };

    return (
        <div className="admin-page">
            <h2 className="admin-title">🏷️ Quản lý Danh Mục (Category)</h2>
            
            <form onSubmit={handleSubmit} className="admin-form category-form-container">
                <div className="form-group">
                    <label>Tên danh mục (VD: Tour Nghỉ Dưỡng)</label>
                    <input 
                        type="text" 
                        required 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="form-input" 
                    />
                </div>
                <div className="form-group category-form-group">
                    <label>Mô tả chi tiết</label>
                    <textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        className="form-input" 
                    />
                </div>
                
                <button type="submit" className="btn-submit-tour btn-submit-category">
                    {editId ? '💾 LƯU CẬP NHẬT' : '➕ THÊM MỚI'}
                </button>

                {editId && (
                    <button 
                        type="button" 
                        className="btn-cancel-category"
                        onClick={() => {
                            setEditId(null); 
                            setFormData({name:'', description:''});
                        }}
                    >
                        Hủy
                    </button>
                )}
            </form>

            <table className="admin-table category-table">
                <thead>
                    <tr>
                        <th>Tên Danh Mục</th>
                        <th>Mô tả</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat._id}>
                            <td><b>{cat.name}</b></td>
                            <td>{cat.description}</td>
                            <td>
                                <div className="action-buttons">
                                    <button onClick={() => handleEdit(cat)} className="btn-edit-category">
                                        ✏️ Sửa
                                    </button>
                                    <button onClick={() => handleDelete(cat._id)} className="btn-delete-category">
                                        🗑️ Xóa
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}