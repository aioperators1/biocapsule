"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";


const PRICE_PER_ORDER = 249;

type Order = {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  status: string;
  date: string;
  confirmedBy?: string;
};

type User = {
  username: string;
  name: string;
  role: 'admin' | 'staff';
  commissionRate?: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isMounted, setIsMounted] = useState(false);
  const [pageViews, setPageViews] = useState({ total: 0, today: 0, week: 0, month: 0 });

  // Selection state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Staff management state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ username: '', password: '', name: '', role: 'staff', commissionRate: 0 });
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Marketing Settings State
  const [showMarketing, setShowMarketing] = useState(false);
  const [marketingSettings, setMarketingSettings] = useState({ facebookPixelId: '', facebookAccessToken: '', snapchatPixelId: '', tiktokPixelId: '' });

  // Inline editing state: { orderId, field, value }
  const [editingCell, setEditingCell] = useState<{ orderId: string; field: string; value: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/check");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setAuthenticated(true);
        } else {
          router.replace("/dashboard/login");
        }
      } catch {
        router.replace("/dashboard/login");
      }
    };
    checkAuth();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setStaffList(data.filter((u: User) => u.role === 'staff'));
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchViews = async () => {
    try {
      const res = await fetch("/api/views");
      const data = await res.json();
      setPageViews(data);
    } catch (error) {
      console.error("Failed to fetch views", error);
    }
  };

  const fetchMarketingSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setMarketingSettings({
          facebookPixelId: data.facebookPixelId || '',
          facebookAccessToken: data.facebookAccessToken || '',
          snapchatPixelId: data.snapchatPixelId || '',
          tiktokPixelId: data.tiktokPixelId || ''
        });
      }
    } catch (error) {
      console.error("Failed to fetch marketing settings", error);
    }
  };

  const clearDailyViews = async () => {
    const key = prompt(`مسح ${pageViews.today} زيارة اليوم؟ سيتم طرحها من الإجمالي والأسبوع. أدخل الكود السري:`);
    if (key === "fuckit1") {
      try {
        const res = await fetch("/api/views", { method: "DELETE" });
        if (res.ok) {
          await fetchViews();
        }
      } catch (error) {
        console.error("Failed to clear daily views", error);
      }
    } else if (key !== null) {
      alert("الكود السري غير صحيح!");
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchOrders();
      fetchUsers();
      fetchViews();
      if (currentUser?.role === 'admin') {
        fetchMarketingSettings();
      }
    }
  }, [authenticated, currentUser]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleConfirmedByChange = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmedBy: name }),
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, confirmedBy: name } : o));
      }
    } catch (error) {
      console.error("Failed to update confirmedBy", error);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });
      if (res.ok) {
        alert("تم إضافة الموظفة بنجاح");
        setNewStaff({ username: '', password: '', name: '', role: 'staff', commissionRate: 0 });
        fetchUsers();
      } else {
        alert("خطأ في إضافة الموظفة");
      }
    } catch {
      alert("حدث خطأ");
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStaff),
      });
      if (res.ok) {
        alert("تم تحديث بيانات الموظفة");
        setEditingStaff(null);
        fetchUsers();
      }
    } catch {
      alert("حدث خطأ");
    }
  };

  const handleDeleteStaff = async (username: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الموظفة؟")) {
      try {
        await fetch("/api/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        fetchUsers();
      } catch {
        alert("فشل الحذف");
      }
    }
  };

  const [isSavingMarketing, setIsSavingMarketing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateMarketingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMarketing(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(marketingSettings),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("خطأ في حفظ الإعدادات");
      }
    } catch {
      alert("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setIsSavingMarketing(false);
    }
  };

  const handleBulkDelete = async () => {
    const key = prompt(`أنت على وشك حذف ${selectedOrders.length} طلبات. أدخل الكود السري للتأكيد:`);
    if (key === "fuckit") {
      try {
        await Promise.all(selectedOrders.map(id => fetch(`/api/orders/${id}`, { method: "DELETE" })));
        setOrders(orders.filter(o => !selectedOrders.includes(o.id)));
        setSelectedOrders([]);
        alert("تم حذف الطلبات بنجاح");
      } catch (error) {
        console.error("Bulk delete failed", error);
      }
    } else if (key !== null) {
      alert("الكود السري غير صحيح!");
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    const key = prompt("أدخل الكود السري لحذف الطلب:");
    if (key === "fuckit") {
      try {
        const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
        if (res.ok) {
          setOrders(orders.filter(o => o.id !== id));
        }
      } catch (error) {
        console.error("Failed to delete order", error);
      }
    } else if (key !== null) {
      alert("الكود السري غير صحيح!");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/dashboard/login");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("تم نسخ الرقم: " + text);
  };

  const handleEditCell = (orderId: string, field: string, value: string) => {
    setEditingCell({ orderId, field, value });
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;
    const { orderId, field, value } = editingCell;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, [field]: value } : o));
      }
    } catch (error) {
      console.error("Failed to update field", error);
    }
    setEditingCell(null);
  };

  // ===== Calculations =====
  const salesStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayOrders = 0, weekOrders = 0, monthOrders = 0, activeOrders = 0;
    let cancelledOrders = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.date);
      if (order.status !== "Cancelled") {
        activeOrders++;
        if (orderDate >= todayStart) todayOrders++;
        if (orderDate >= weekStart) weekOrders++;
        if (orderDate >= monthStart) monthOrders++;
      } else {
        cancelledOrders++;
      }
    });

    return {
      total: { orders: activeOrders, revenue: activeOrders * PRICE_PER_ORDER },
      month: { orders: monthOrders, revenue: monthOrders * PRICE_PER_ORDER },
      week: { orders: weekOrders, revenue: weekOrders * PRICE_PER_ORDER },
      today: { orders: todayOrders, revenue: todayOrders * PRICE_PER_ORDER },
      cancelled: { orders: cancelledOrders, revenue: cancelledOrders * PRICE_PER_ORDER },
    };
  }, [orders]);

  // ===== Conversion Rate Stats =====
  const conversionStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    let allTodayOrders = 0;
    let allWeekOrders = 0;
    const allTotalOrders = orders.length;

    orders.forEach(order => {
      const orderDate = new Date(order.date);
      if (orderDate >= todayStart) allTodayOrders++;
      if (orderDate >= weekStart) allWeekOrders++;
    });

    const calcRate = (ordersCount: number, viewsCount: number) => {
      if (viewsCount === 0) return 0;
      return Math.round((ordersCount / viewsCount) * 10000) / 100;
    };

    return {
      total: calcRate(allTotalOrders, pageViews.total),
      totalOrders: allTotalOrders,
      totalViews: pageViews.total,
      weekly: calcRate(allWeekOrders, pageViews.week),
      weekOrders: allWeekOrders,
      weekViews: pageViews.week,
      daily: calcRate(allTodayOrders, pageViews.today),
      dayOrders: allTodayOrders,
      dayViews: pageViews.today,
    };
  }, [orders, pageViews]);

  // ===== Staff Performance =====
  const staffPerformance = useMemo(() => {
    const perf: Record<string, { confirmed: number, delivered: number }> = {};
    orders.forEach(order => {
      if (order.confirmedBy) {
        if (!perf[order.confirmedBy]) {
          perf[order.confirmedBy] = { confirmed: 0, delivered: 0 };
        }
        if (order.status === 'Confirmed' || order.status === 'Delivered') {
          perf[order.confirmedBy].confirmed++;
        }
        if (order.status === 'Delivered') {
          perf[order.confirmedBy].delivered++;
        }
      }
    });
    return perf;
  }, [orders]);

  const totalPayableCommission = useMemo(() => {
    return staffList.reduce((acc, staff) => {
      const deliveredCount = staffPerformance[staff.name]?.delivered || 0;
      return acc + (deliveredCount * (staff.commissionRate || 0));
    }, 0);
  }, [staffList, staffPerformance]);

  const pendingOrders = orders.filter(o => o.status === "Pending").length;
  const confirmedOrders = orders.filter(o => o.status === "Confirmed").length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const cancelledCount = orders.filter(o => o.status === "Cancelled").length;
  const noAnswerCount = orders.filter(o => o.status === "NoAnswer").length;
  const returnedCount = orders.filter(o => o.status === "Returned").length;

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        if (filterStatus !== "all" && o.status !== filterStatus) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            o.name.toLowerCase().includes(q) ||
            o.phone.includes(q) ||
            o.city.toLowerCase().includes(q) ||
            o.id.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, filterStatus, searchQuery]);

  if (!isMounted || !authenticated || !currentUser) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>جاري التحقق...</p>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className={styles.dashboard}>
      {/* ===== Header ===== */}
      <header className={styles.header}>
        <div className={styles.headerRight}>
          <h1 className={styles.title}>🧬 BIO CAPSULE</h1>
          <span className={styles.subtitle}>أهلاً، {currentUser.name} ({isAdmin ? 'مدير' : 'موظفة تأكيد'})</span>
        </div>
        <div className={styles.headerLeft}>
          {isAdmin && (
            <>
              <button onClick={() => {setShowMarketing(!showMarketing); setShowAddStaff(false);}} className={styles.addStaffBtn} style={{background: '#3b82f6'}}>
                📊 إعدادات التسويق
              </button>
              <button onClick={() => {setShowAddStaff(!showAddStaff); setShowMarketing(false);}} className={styles.addStaffBtn}>
                👥 إدارة فريق العمل
              </button>
            </>
          )}
          <Link href="/" className={styles.backLink}>← العودة للمتجر</Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>تسجيل الخروج</button>
        </div>
      </header>

      {/* ===== Marketing Settings Section ===== */}
      {isAdmin && showMarketing && (
        <div className={styles.adminSection}>
          <div className={styles.marketingControlPanel}>
            <div className={styles.marketingHeader}>
              <h3>🎯 إعدادات بيكسل التتبع (Tracking Pixels)</h3>
              <p>أدخل معرفات البيكسل والتوكن الخاص بك لتتبع الزوار والمبيعات. التغييرات تتفعل فوراً.</p>
            </div>
            <form onSubmit={handleUpdateMarketingSettings} className={styles.marketingForm}>
              <div className={styles.marketingGrid}>
                {/* Meta Pixel */}
                <div className={styles.marketingCard}>
                  <div className={styles.marketingCardIcon} style={{background: '#eff6ff', color: '#3b82f6'}}>📘</div>
                  <div className={styles.marketingCardContent}>
                    <label>Facebook Pixel ID</label>
                    <input 
                      type="text" 
                      placeholder="مثال: 123456789012345" 
                      value={marketingSettings.facebookPixelId} 
                      onChange={e => setMarketingSettings({...marketingSettings, facebookPixelId: e.target.value})} 
                    />
                  </div>
                </div>
                {/* Meta CAPI */}
                <div className={styles.marketingCard}>
                  <div className={styles.marketingCardIcon} style={{background: '#f5f3ff', color: '#8b5cf6'}}>⚙️</div>
                  <div className={styles.marketingCardContent}>
                    <label>Facebook Conversions API Token</label>
                    <input 
                      type="password" 
                      placeholder="الصق الـ Access Token..." 
                      value={marketingSettings.facebookAccessToken} 
                      onChange={e => setMarketingSettings({...marketingSettings, facebookAccessToken: e.target.value})} 
                    />
                  </div>
                </div>
                {/* Snapchat Pixel */}
                <div className={styles.marketingCard}>
                  <div className={styles.marketingCardIcon} style={{background: '#fefce8', color: '#eab308'}}>👻</div>
                  <div className={styles.marketingCardContent}>
                    <label>Snapchat Pixel ID</label>
                    <input 
                      type="text" 
                      placeholder="مثال: 1234abcd-..." 
                      value={marketingSettings.snapchatPixelId} 
                      onChange={e => setMarketingSettings({...marketingSettings, snapchatPixelId: e.target.value})} 
                    />
                  </div>
                </div>
                {/* TikTok Pixel */}
                <div className={styles.marketingCard}>
                  <div className={styles.marketingCardIcon} style={{background: '#f8fafc', color: '#0f172a'}}>🎵</div>
                  <div className={styles.marketingCardContent}>
                    <label>TikTok Pixel ID</label>
                    <input 
                      type="text" 
                      placeholder="مثال: C..." 
                      value={marketingSettings.tiktokPixelId} 
                      onChange={e => setMarketingSettings({...marketingSettings, tiktokPixelId: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
              <div className={styles.marketingActions}>
                <button type="submit" className={styles.marketingSaveBtn} disabled={isSavingMarketing}>
                  {isSavingMarketing ? (
                    <>
                      <div className={styles.miniSpinner} /> جاري الحفظ...
                    </>
                  ) : saveSuccess ? (
                    <>✅ تم الحفظ بنجاح!</>
                  ) : (
                    <>💾 حفظ إعدادات التتبع</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Staff Management Section ===== */}
      {isAdmin && showAddStaff && (
        <div className={styles.adminSection}>
          <div className={styles.staffControlPanel}>
            {/* Form Column */}
            <div className={styles.addStaffForm}>
              <h3>{editingStaff ? '✏️ تعديل بيانات الموظفة' : '➕ إضافة موظفة جديدة'}</h3>
              <form onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff}>
                <input 
                  type="text" 
                  placeholder="الاسم الكامل" 
                  value={editingStaff ? editingStaff.name : newStaff.name} 
                  onChange={e => editingStaff ? setEditingStaff({...editingStaff, name: e.target.value}) : setNewStaff({...newStaff, name: e.target.value})} 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="اسم المستخدم" 
                  value={editingStaff ? editingStaff.username : newStaff.username} 
                  onChange={e => editingStaff ? null : setNewStaff({...newStaff, username: e.target.value})} 
                  disabled={!!editingStaff}
                  required 
                />
                <input 
                  type="password" 
                  placeholder={editingStaff ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"} 
                  value={editingStaff ? editingStaff.password || '' : newStaff.password} 
                  onChange={e => editingStaff ? setEditingStaff({...editingStaff, password: e.target.value}) : setNewStaff({...newStaff, password: e.target.value})} 
                  required={!editingStaff} 
                />
                <div className={styles.inputGroup}>
                  <label>العمولة لكل طلب وصل (درهم):</label>
                  <input 
                    type="number" 
                    placeholder="العمولة" 
                    value={editingStaff ? editingStaff.commissionRate : newStaff.commissionRate} 
                    onChange={e => editingStaff ? setEditingStaff({...editingStaff, commissionRate: Number(e.target.value)}) : setNewStaff({...newStaff, commissionRate: Number(e.target.value)})} 
                    required 
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveBtn}>
                    {editingStaff ? 'تحديث البيانات' : 'إضافة الموظفة'}
                  </button>
                  {editingStaff && (
                    <button type="button" onClick={() => setEditingStaff(null)} className={styles.cancelBtn}>إلغاء</button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className={styles.staffPerformanceBoard}>
              <h3>🏆 أداء وعمولات الفريق</h3>
              <div className={styles.perfGrid}>
                {staffList.map(staff => {
                  const deliveredCount = staffPerformance[staff.name]?.delivered || 0;
                  const totalComm = deliveredCount * (staff.commissionRate || 0);
                  
                  return (
                    <div key={staff.username} className={styles.perfCard}>
                      <div className={styles.perfHeader}>
                        <span className={styles.perfName}>{staff.name}</span>
                        <div className={styles.miniActions}>
                          <button onClick={() => setEditingStaff(staff)} title="تعديل">✏️</button>
                          <button onClick={() => handleDeleteStaff(staff.username)} title="حذف" style={{color: '#ef4444'}}>🗑️</button>
                        </div>
                      </div>
                      <div className={styles.perfStats}>
                        <span className={styles.perfConfirmed}>{staffPerformance[staff.name]?.confirmed || 0} مؤكد</span>
                        <span className={styles.perfDelivered}>{deliveredCount} تم التوصيل</span>
                        <span className={styles.perfCommission}>💰 العمولات: {totalComm.toLocaleString()} د.م</span>
                      </div>
                      <div className={styles.rateBadge}>النسبة: {staff.commissionRate}د.م</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Revenue Cards (ADMIN ONLY) ===== */}
      {isAdmin && (
        <>
        {/* Views Card - Full Width */}
        <div className={styles.viewsCardWrapper}>
          <div className={`${styles.revenueCard} ${styles.revenueViews}`}>
            <div className={styles.revenueIcon}>👁️</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>إجمالي زوار صفحة المنتج (Landing Page)</span>
              <span className={styles.revenueValue} style={{color: '#0ea5e9'}}>
                {pageViews.total.toLocaleString()} <small>زيارة</small>
              </span>
              <div className={styles.viewsBreakdown}>
                <span className={styles.viewsDailyTag}>
                  اليوم: <strong>{pageViews.today.toLocaleString()}</strong>
                  <button onClick={clearDailyViews} className={styles.clearDailyBtn} title="مسح زيارات اليوم">✕</button>
                </span>
                <span>الأسبوع: <strong>{pageViews.week.toLocaleString()}</strong></span>
                <span>الشهر: <strong>{pageViews.month.toLocaleString()}</strong></span>
              </div>
            </div>
            <button onClick={fetchViews} className={styles.viewsRefreshBtn} title="تحديث الزيارات">🔄</button>
          </div>
        </div>

        {/* Conversion Rate Cards */}
        <div className={styles.conversionGrid}>
          <div className={`${styles.conversionCard} ${styles.conversionTotal}`}>
            <div className={styles.conversionHeader}>
              <span className={styles.conversionIcon}>📈</span>
              <span className={styles.conversionTitle}>Total Conversion Rate</span>
            </div>
            <div className={styles.conversionRate}>
              {conversionStats.total}%
            </div>
            <div className={styles.conversionMeta}>
              <span>{conversionStats.totalOrders} طلب</span>
              <span className={styles.conversionDivider}>من أصل</span>
              <span>{conversionStats.totalViews} زيارة</span>
            </div>
            <div className={styles.conversionBar}>
              <div className={styles.conversionBarFill} style={{ width: `${Math.min(conversionStats.total, 100)}%` }} />
            </div>
          </div>

          <div className={`${styles.conversionCard} ${styles.conversionWeek}`}>
            <div className={styles.conversionHeader}>
              <span className={styles.conversionIcon}>📊</span>
              <span className={styles.conversionTitle}>Weekly Conversion</span>
            </div>
            <div className={styles.conversionRate}>
              {conversionStats.weekly}%
            </div>
            <div className={styles.conversionMeta}>
              <span>{conversionStats.weekOrders} طلب</span>
              <span className={styles.conversionDivider}>من أصل</span>
              <span>{conversionStats.weekViews} زيارة</span>
            </div>
            <div className={styles.conversionBar}>
              <div className={`${styles.conversionBarFill} ${styles.conversionBarWeek}`} style={{ width: `${Math.min(conversionStats.weekly, 100)}%` }} />
            </div>
          </div>

          <div className={`${styles.conversionCard} ${styles.conversionDay}`}>
            <div className={styles.conversionHeader}>
              <span className={styles.conversionIcon}>⚡</span>
              <span className={styles.conversionTitle}>Daily Conversion</span>
            </div>
            <div className={styles.conversionRate}>
              {conversionStats.daily}%
            </div>
            <div className={styles.conversionMeta}>
              <span>{conversionStats.dayOrders} طلب</span>
              <span className={styles.conversionDivider}>من أصل</span>
              <span>{conversionStats.dayViews} زيارة</span>
            </div>
            <div className={styles.conversionBar}>
              <div className={`${styles.conversionBarFill} ${styles.conversionBarDay}`} style={{ width: `${Math.min(conversionStats.daily, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.revenueGrid6}>
          <div className={`${styles.revenueCard} ${styles.revenueTotal}`}>
            <div className={styles.revenueIcon}>💰</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>إجمالي المبيعات</span>
              <span className={styles.revenueValue}>{salesStats.total.revenue.toLocaleString()} <small>درهم</small></span>
              <span className={styles.revenueOrders}>{salesStats.total.orders} طلب</span>
            </div>
          </div>
          <div className={`${styles.revenueCard} ${styles.revenueMonth}`}>
            <div className={styles.revenueIcon}>📅</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>مبيعات الشهر</span>
              <span className={styles.revenueValue}>{salesStats.month.revenue.toLocaleString()} <small>درهم</small></span>
              <span className={styles.revenueOrders}>{salesStats.month.orders} طلب</span>
            </div>
          </div>
          <div className={`${styles.revenueCard} ${styles.revenueWeek}`}>
            <div className={styles.revenueIcon}>📊</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>مبيعات الأسبوع</span>
              <span className={styles.revenueValue}>{salesStats.week.revenue.toLocaleString()} <small>درهم</small></span>
              <span className={styles.revenueOrders}>{salesStats.week.orders} طلب</span>
            </div>
          </div>
          <div className={`${styles.revenueCard} ${styles.revenueToday}`}>
            <div className={styles.revenueIcon}>⚡</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>مبيعات اليوم</span>
              <span className={styles.revenueValue}>{salesStats.today.revenue.toLocaleString()} <small>درهم</small></span>
              <span className={styles.revenueOrders}>{salesStats.today.orders} طلب</span>
            </div>
          </div>
          <div className={`${styles.revenueCard} ${styles.revenueCancelled}`}>
            <div className={styles.revenueIcon}>🚫</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>إجمالي مبيعات الملغية</span>
              <span className={styles.revenueValue}>{salesStats.cancelled.revenue.toLocaleString()} <small>درهم</small></span>
              <span className={styles.revenueOrders}>{salesStats.cancelled.orders} طلب ملغي</span>
            </div>
          </div>
          <div className={`${styles.revenueCard} ${styles.revenueCommissionTotal}`}>
            <div className={styles.revenueIcon}>💸</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>إجمالي عمولات الموظفين</span>
              <span className={styles.revenueValue} style={{color: '#7c3aed'}}>
                {totalPayableCommission.toLocaleString()} <small>درهم</small>
              </span>
              <span className={styles.revenueOrders}>يجب دفعها للفريق</span>
            </div>
          </div>
        </div>
        </>
      )}

      {/* ===== Personal Stats (FOR STAFF ONLY) ===== */}
      {!isAdmin && (
        <div className={styles.revenueGrid}>
          <div className={`${styles.revenueCard} ${styles.revenueMonth}`}>
            <div className={styles.revenueIcon}>📊</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>إجمالي التأكيدات</span>
              <span className={styles.revenueValue}>{staffPerformance[currentUser.name]?.confirmed || 0}</span>
              <span className={styles.revenueOrders}>طلبات قمت بتأكيدها</span>
            </div>
          </div>
          <div className={`${styles.revenueCard} ${styles.revenueToday}`}>
            <div className={styles.revenueIcon}>🚚</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>طلبات تم توصيلها</span>
              <span className={styles.revenueValue}>{staffPerformance[currentUser.name]?.delivered || 0}</span>
              <span className={styles.revenueOrders}>طلبات مكتملة وناجحة</span>
            </div>
          </div>
          <div className={`${styles.revenueCard} ${styles.revenueTotal}`}>
            <div className={styles.revenueIcon}>💎</div>
            <div className={styles.revenueInfo}>
              <span className={styles.revenueLabel}>أرباح العمولات المستحقة</span>
              <span className={styles.revenueValue} style={{color: '#059669'}}>
                {((staffPerformance[currentUser.name]?.delivered || 0) * (currentUser.commissionRate || 0)).toLocaleString()} <small>درهم</small>
              </span>
              <div className={styles.commissionBadge}>
                عمولتك: <span>{currentUser.commissionRate || 0} درهم</span> لكل طلب
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Order Stats (SHOWN TO ALL) ===== */}
      <div className={styles.orderStatsGrid}>
        <div className={styles.orderStat}>
          <span className={styles.orderStatDot} style={{ background: '#f59e0b' }} />
          <span className={styles.orderStatLabel}>قيد الانتظار</span>
          <span className={styles.orderStatValue}>{pendingOrders}</span>
        </div>
        <div className={styles.orderStat}>
          <span className={styles.orderStatDot} style={{ background: '#3b82f6' }} />
          <span className={styles.orderStatLabel}>مؤكد</span>
          <span className={styles.orderStatValue}>{confirmedOrders}</span>
        </div>
        <div className={styles.orderStat}>
          <span className={styles.orderStatDot} style={{ background: '#10b981' }} />
          <span className={styles.orderStatLabel}>تم التوصيل</span>
          <span className={styles.orderStatValue}>{deliveredOrders}</span>
        </div>
        <div className={styles.orderStat}>
          <span className={styles.orderStatDot} style={{ background: '#ef4444' }} />
          <span className={styles.orderStatLabel}>ملغي</span>
          <span className={styles.orderStatValue}>{cancelledCount}</span>
        </div>
        <div className={styles.orderStat}>
          <span className={styles.orderStatDot} style={{ background: '#6366f1' }} />
          <span className={styles.orderStatLabel}>لم يرد</span>
          <span className={styles.orderStatValue}>{noAnswerCount}</span>
        </div>
        <div className={styles.orderStat}>
          <span className={styles.orderStatDot} style={{ background: '#ec4899' }} />
          <span className={styles.orderStatLabel}>رجوع</span>
          <span className={styles.orderStatValue}>{returnedCount}</span>
        </div>
      </div>

      {/* ===== Table Section ===== */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderInfo}>
            <h2 className={styles.tableTitle}>📋 الطلبات ({filteredOrders.length})</h2>
            {selectedOrders.length > 0 && (
              <div className={styles.bulkActions}>
                <span>تم اختيار {selectedOrders.length} طلب</span>
                <button onClick={handleBulkDelete} className={styles.bulkDeleteBtn}>🗑️ حذف المحدد</button>
              </div>
            )}
          </div>
          <div className={styles.tableControls}>
            <input
              type="text"
              placeholder="🔍 بحث بالاسم، الهاتف، المدينة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={styles.filterSelect}>
              <option value="all">جميع الحالات</option>
              <option value="Pending">قيد الانتظار</option>
              <option value="Confirmed">مؤكد</option>
              <option value="Delivered">تم التوصيل</option>
              <option value="Cancelled">ملغي</option>
              <option value="NoAnswer">لم يرد</option>
              <option value="Returned">رجوع</option>
            </select>
            <button onClick={fetchOrders} className={styles.refreshBtn}>🔄 تحديث</button>
          </div>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.tableEmpty}><div className={styles.loadingSpinner} /><p>جاري تحميل الطلبات...</p></div>
          ) : filteredOrders.length === 0 ? (
            <div className={styles.tableEmpty}><span style={{ fontSize: '3rem' }}>📭</span><p>لا توجد طلبات</p></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>#</th>
                  <th>التاريخ</th>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>المدينة</th>
                  <th>العنوان</th>
                  {isAdmin && <th>المبلغ</th>}
                  <th>الحالة</th>
                  <th>اسم المؤكد</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr key={order.id} className={selectedOrders.includes(order.id) ? styles.selectedRow : ""}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                      />
                    </td>
                    <td className={styles.cellId}>{filteredOrders.length - index}</td>
                    <td className={styles.cellDate}>
                      <div className={styles.dateMain}>{new Date(order.date).toLocaleDateString('ar-MA', { day: '2-digit', month: 'short' })}</div>
                      <div className={styles.timeSub}>{new Date(order.date).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Casablanca' })}</div>
                    </td>
                    <td className={styles.cellName} onClick={() => handleEditCell(order.id, 'name', order.name)} style={{cursor:'pointer'}}>
                      {editingCell?.orderId === order.id && editingCell?.field === 'name' ? (
                        <input
                          autoFocus
                          className={styles.inlineEdit}
                          value={editingCell.value}
                          onChange={e => setEditingCell({...editingCell, value: e.target.value})}
                          onBlur={handleSaveCell}
                          onKeyDown={e => e.key === 'Enter' && handleSaveCell()}
                        />
                      ) : order.name}
                    </td>
                    <td dir="ltr" className={styles.cellPhone}>
                      <div className={styles.phoneWrapper}>
                        <span onClick={() => handleEditCell(order.id, 'phone', order.phone)} style={{cursor:'pointer',flex:1}}>
                          {editingCell?.orderId === order.id && editingCell?.field === 'phone' ? (
                            <input
                              autoFocus
                              className={styles.inlineEdit}
                              value={editingCell.value}
                              onChange={e => setEditingCell({...editingCell, value: e.target.value})}
                              onBlur={handleSaveCell}
                              onKeyDown={e => e.key === 'Enter' && handleSaveCell()}
                            />
                          ) : order.phone}
                        </span>
                        <button onClick={() => copyToClipboard(order.phone)} className={styles.copyBtn} title="نسخ الرقم">📋</button>
                      </div>
                    </td>
                    <td className={styles.cellCity} onClick={() => handleEditCell(order.id, 'city', order.city)} style={{cursor:'pointer'}}>
                      {editingCell?.orderId === order.id && editingCell?.field === 'city' ? (
                        <input
                          autoFocus
                          className={styles.inlineEdit}
                          value={editingCell.value}
                          onChange={e => setEditingCell({...editingCell, value: e.target.value})}
                          onBlur={handleSaveCell}
                          onKeyDown={e => e.key === 'Enter' && handleSaveCell()}
                        />
                      ) : order.city}
                    </td>
                    <td className={styles.cellAddress} title={order.address} onClick={() => handleEditCell(order.id, 'address', order.address)} style={{cursor:'pointer'}}>
                      {editingCell?.orderId === order.id && editingCell?.field === 'address' ? (
                        <input
                          autoFocus
                          className={styles.inlineEdit}
                          value={editingCell.value}
                          onChange={e => setEditingCell({...editingCell, value: e.target.value})}
                          onBlur={handleSaveCell}
                          onKeyDown={e => e.key === 'Enter' && handleSaveCell()}
                        />
                      ) : order.address}
                    </td>
                    {isAdmin && <td className={styles.cellPrice}>{PRICE_PER_ORDER} د.م</td>}
                    <td className={styles.cellStatus}>
                      <span className={`${styles.statusBadge} ${styles[`status${order.status}`]}`}>
                        {order.status === 'Pending' ? '⏳ انتظار' :
                         order.status === 'Confirmed' ? '✅ مؤكد' : 
                         order.status === 'Cancelled' ? '🚫 ملغي' : 
                         order.status === 'NoAnswer' ? '📵 لم يرد' :
                         order.status === 'Returned' ? '🔄 رجوع' : '🚚 تم التوصيل'}
                      </span>
                    </td>
                    <td className={styles.confirmedByCell}>
                      <select
                        className={styles.miniSelect}
                        value={order.confirmedBy || ""}
                        onChange={(e) => handleConfirmedByChange(order.id, e.target.value)}
                      >
                        <option value="">— اختيار —</option>
                        <option value="Admin">Admin</option>
                        {staffList.map(s => (
                          <option key={s.username} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <select
                          className={styles.statusSelect}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="Pending">قيد الانتظار</option>
                          <option value="Confirmed">تأكيد</option>
                          <option value="Delivered">تم التوصيل</option>
                          <option value="Cancelled">ملغي</option>
                          <option value="NoAnswer">لم يرد</option>
                          <option value="Returned">رجوع</option>
                        </select>
                        {isAdmin && (
                          <button onClick={() => handleDelete(order.id)} className={styles.deleteBtn} title="حذف الطلب">🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
