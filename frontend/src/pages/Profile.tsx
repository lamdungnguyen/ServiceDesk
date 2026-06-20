import React, { useState } from 'react';
import { useAuth } from '../context/auth';
import { User, Mail, Shield, Bell, Settings, Save, Smartphone, CheckCircle2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotif: true,
    pushNotif: true,
    smsNotif: false,
    language: 'vi',
    theme: 'system',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const tabs = [
    { id: 'personal', label: 'Thông tin cá nhân', icon: <User size={18} /> },
    { id: 'security', label: 'Bảo mật', icon: <Shield size={18} /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={18} /> },
    { id: 'preferences', label: 'Tùy chọn hiển thị', icon: <Settings size={18} /> },
  ];

  const roleColor: Record<string, string> = {
    ADMIN: '#f59e0b',
    AGENT: '#3b82f6',
    CUSTOMER: '#10b981',
  };
  const badgeColor = roleColor[user.role] || '#6366f1';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>Cài đặt tài khoản</h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: 15 }}>Quản lý thông tin, bảo mật và tùy chọn cá nhân của bạn.</p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* ─── LEFT SIDEBAR ─────────────────────────────────── */}
          <div style={{ width: 260, flexShrink: 0 }}>

            {/* User card */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 24, textAlign: 'center', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 auto 14px', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>{user.name}</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>@{user.username}</div>
              <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: `${badgeColor}15`, border: `1px solid ${badgeColor}30`, fontSize: 12, fontWeight: 700, color: badgeColor }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: badgeColor, display: 'inline-block' }}></span>
                {user.role}
              </div>
            </div>

            {/* Navigation */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '12px 16px',
                    borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: 14, marginBottom: 2, textAlign: 'left',
                    background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                    color: activeTab === tab.id ? '#2563eb' : '#475569',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}

              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: 'transparent', color: '#ef4444' }}
                >
                  <LogOut size={18} />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>

          {/* ─── RIGHT MAIN CONTENT ───────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

              {/* Banner */}
              <div style={{ height: 120, background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 60%, #8b5cf6 100%)', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
                <div style={{ position: 'absolute', top: 16, right: 20, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', padding: '4px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                  {user.role}
                </div>
              </div>

              {/* Form content */}
              <div style={{ padding: '32px 40px' }}>
                <form onSubmit={handleSave}>

                  {/* ── Personal Info ── */}
                  {activeTab === 'personal' && (
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Hồ sơ cá nhân</h2>
                      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Cập nhật tên và email liên lạc của bạn.</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                        <div>
                          <label style={labelStyle}>Họ và tên</label>
                          <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Địa chỉ Email</label>
                          <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Tên đăng nhập</label>
                        <input type="text" value={formData.username} disabled style={{ ...inputStyle, background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }} />
                        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Tên đăng nhập không thể thay đổi. Liên hệ Admin nếu cần hỗ trợ.</p>
                      </div>
                    </div>
                  )}

                  {/* ── Security ── */}
                  {activeTab === 'security' && (
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Bảo mật tài khoản</h2>
                      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Đổi mật khẩu để giữ an toàn cho tài khoản của bạn.</p>

                      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                          <label style={labelStyle}>Mật khẩu hiện tại</label>
                          <input type="password" placeholder="••••••••" value={formData.currentPassword} onChange={e => setFormData({ ...formData, currentPassword: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Mật khẩu mới</label>
                          <input type="password" placeholder="••••••••" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Xác nhận mật khẩu mới</label>
                          <input type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} style={inputStyle} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Notifications ── */}
                  {activeTab === 'notifications' && (
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Cài đặt thông báo</h2>
                      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Chọn cách bạn muốn nhận cập nhật từ hệ thống.</p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                          { key: 'emailNotif', icon: <Mail size={22} />, color: '#2563eb', bg: '#eff6ff', title: 'Thông báo Email', desc: 'Nhận email khi có cập nhật ticket hoặc sự kiện mới.' },
                          { key: 'pushNotif', icon: <Bell size={22} />, color: '#6366f1', bg: '#eef2ff', title: 'Thông báo Trình duyệt', desc: 'Cảnh báo popup ngay trên màn hình trình duyệt.' },
                          { key: 'smsNotif', icon: <Smartphone size={22} />, color: '#10b981', bg: '#ecfdf5', title: 'Tin nhắn SMS', desc: 'Nhận SMS cho các sự kiện khẩn cấp quan trọng.' },
                        ].map(item => {
                          const checked = formData[item.key as keyof typeof formData] as boolean;
                          return (
                            <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', border: '1.5px solid #e2e8f0', borderRadius: 14, cursor: 'pointer', background: '#fafafe', transition: 'border-color 0.2s' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>{item.icon}</div>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{item.title}</div>
                                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{item.desc}</div>
                                </div>
                              </div>
                              <div onClick={() => setFormData({ ...formData, [item.key]: !checked })} style={{ width: 48, height: 26, borderRadius: 99, background: checked ? item.color : '#cbd5e1', position: 'relative', flexShrink: 0, transition: 'background 0.3s', cursor: 'pointer' }}>
                                <div style={{ position: 'absolute', top: 3, left: checked ? 26 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s' }} />
                              </div>
                              <input type="checkbox" checked={checked} onChange={() => {}} style={{ display: 'none' }} />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Preferences ── */}
                  {activeTab === 'preferences' && (
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Tùy chọn hiển thị</h2>
                      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Cá nhân hóa ngôn ngữ và giao diện của ứng dụng.</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                          <label style={labelStyle}>Ngôn ngữ</label>
                          <select value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} style={inputStyle}>
                            <option value="vi">Tiếng Việt</option>
                            <option value="en">English</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Giao diện nền</label>
                          <select value={formData.theme} onChange={e => setFormData({ ...formData, theme: e.target.value })} style={inputStyle}>
                            <option value="system">Tự động (Hệ thống)</option>
                            <option value="light">Sáng (Light Mode)</option>
                            <option value="dark">Tối (Dark Mode)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Actions ── */}
                  <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                    {saveSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, fontSize: 14, marginRight: 'auto' }}>
                        <CheckCircle2 size={18} /> Đã lưu thành công!
                      </div>
                    )}
                    <button type="button" style={{ padding: '10px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                      Hủy bỏ
                    </button>
                    <button type="submit" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2563eb, #6366f1)', color: '#fff', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: 14, boxShadow: '0 4px 14px rgba(99,102,241,0.35)', opacity: isSaving ? 0.8 : 1 }}>
                      {isSaving ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
                      Lưu cài đặt
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); border-color: #6366f1 !important; }
      `}</style>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
  marginBottom: 8,
  letterSpacing: '0.03em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 16px',
  borderRadius: 12,
  border: '1.5px solid #e2e8f0',
  background: '#fff',
  fontSize: 14,
  color: '#0f172a',
  fontWeight: 500,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default Profile;
