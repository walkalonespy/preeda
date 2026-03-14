<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ปรีดาบริการซ่อมผ้า - ระบบจัดการงานซ่อมออนไลน์</title>
    <!-- React & ReactDOM -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <!-- Babel สำหรับแปลง JSX ให้เบราว์เซอร์อ่านออก -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&display=swap');
        body { 
            font-family: 'Anuphan', sans-serif;
            background-color: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useMemo } = React;

        // ส่วนประกอบสำหรับแสดงผลไอคอน Lucide ในเบราว์เซอร์
        const Icon = ({ name, size = 24, className = "" }) => {
            useEffect(() => {
                if (window.lucide) window.lucide.createIcons();
            }, [name]);
            return <i data-lucide={name} style={{ width: size, height: size }} className={`inline-block ${className}`}></i>;
        };

        const App = () => {
            const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyU4tL9fF-lEebc6T3kVRiklTY3jhlQyCHpR0FGXT19udcfrxl8DciTjBJBC1FoodJV/exec"; 

            const [activeTab, setActiveTab] = useState('order'); 
            const [cart, setCart] = useState([]);
            const [customName, setCustomName] = useState('');
            const [customPrice, setCustomPrice] = useState('');
            const [isPaymentStep, setIsPaymentStep] = useState(false);
            const [orderCompleted, setOrderCompleted] = useState(false);
            const [isSubmitting, setIsSubmitting] = useState(false);
            const [error, setError] = useState(null);
            const [searchPhone, setSearchPhone] = useState('');
            const [trackingResults, setTrackingResults] = useState([]);
            const [isSearching, setIsSearching] = useState(false);
            const [customer, setCustomer] = useState({ name: '', phone: '', notes: '' });

            const defaultServices = [
                { id: 1, category: 'งานเปลี่ยน', name: 'เปลี่ยนซิปทั่วไป', price: 120 },
                { id: 2, category: 'งานเปลี่ยน', name: 'เปลี่ยนซิปยีนส์', price: 150 },
                { id: 3, category: 'งานเปลี่ยน', name: 'เปลี่ยนยางยืดเอว', price: 120 },
                { id: 4, category: 'งานเย็บ/งานปะ', name: 'เย็บกระดุม', price: 40 },
                { id: 5, category: 'งานเย็บ/งานปะ', name: 'ปะกางเกง (จุดละ)', price: 120 },
                { id: 6, category: 'งานตัด', name: 'ตัดชายกระโปรง', price: 120 },
                { id: 7, category: 'งานตัด', name: 'ตัดขากางเกง', price: 120 },
                { id: 8, category: 'งานแก้ไขทรง', name: 'แก้ไขทรงเสื้อ', price: 150 },
                { id: 9, category: 'งานแก้ไขทรง', name: 'แก้ไขทรงกางเกง', price: 150 },
                { id: 10, category: 'งานแก้ไขทรง', name: 'เพิ่ม/ลด ขนาดเอว', price: 150 },
            ];

            const totalPrice = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

            const addToCart = (service) => {
                const existing = cart.find(item => item.id === service.id);
                if (existing) {
                    setCart(cart.map(item => item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item));
                } else {
                    setCart([...cart, { ...service, quantity: 1 }]);
                }
            };

            const updateQuantity = (id, delta) => {
                setCart(cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
            };

            const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

            const handleTrackStatus = async () => {
                if (!searchPhone || searchPhone.length < 9) {
                    setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
                    return;
                }
                setIsSearching(true);
                setError(null);
                setTrackingResults([]);
                
                try {
                    const response = await fetch(SCRIPT_URL);
                    if (!response.ok) throw new Error("Connection Error");
                    const data = await response.json();
                    const cleanSearch = searchPhone.replace(/[^0-9]/g, '');
                    const results = data.filter(item => {
                        const itemPhone = String(item["เบอร์โทร"] || "").replace(/[^0-9]/g, '');
                        return itemPhone.includes(cleanSearch);
                    });
                    setTrackingResults(results.reverse());
                    if (results.length === 0) setError("ไม่พบข้อมูลการซ่อมสำหรับเบอร์โทรศัพท์นี้");
                } catch (err) {
                    setError("เกิดข้อผิดพลาดในการดึงข้อมูล โปรดตรวจสอบอินเทอร์เน็ต");
                } finally {
                    setIsSearching(false);
                }
            };

            const handleSubmitOrder = async () => {
                if (!customer.name || !customer.phone) {
                    setError("กรุณากรอกข้อมูลชื่อและเบอร์โทรศัพท์ให้ครบถ้วน");
                    return;
                }
                setIsSubmitting(true);
                setError(null);
                try {
                    const payload = {
                        customerName: customer.name,
                        customerPhone: customer.phone,
                        totalPrice: totalPrice,
                        items: cart,
                        timestamp: new Date().toISOString()
                    };
                    await fetch(SCRIPT_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    setOrderCompleted(true);
                } catch (err) {
                    setError("ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
                } finally {
                    setIsSubmitting(false);
                }
            };

            const renderTrackingView = () => (
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
                        <h2 className="text-2xl font-bold mb-2">เช็คสถานะการซ่อม</h2>
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <div className="relative flex-1">
                                <Icon name="phone" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="tel" placeholder="08X-XXX-XXXX" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition" />
                            </div>
                            <button onClick={handleTrackStatus} disabled={isSearching} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                {isSearching ? <Icon name="loader-2" className="animate-spin" /> : <Icon name="search" size={20} />}
                                ค้นหา
                            </button>
                        </div>
                        {error && <p className="mt-4 text-red-500 font-medium">{error}</p>}
                    </div>

                    <div className="space-y-4">
                        {trackingResults.map((order, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">วันที่แจ้งซ่อม</span>
                                        <p className="font-semibold text-gray-700">{order["วันที่"] ? new Date(order["วันที่"]).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${order["สถานะการซ่อม"] === "ซ่อมเสร็จแล้ว" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                            <Icon name={order["สถานะการซ่อม"] === "ซ่อมเสร็จแล้ว" ? "check-circle-2" : "clock"} size={14}/>
                                            {order["สถานะการซ่อม"] || "รับงานแล้ว"}
                                        </span>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${order["สถานะการชำระเงิน"] === "ชำระแล้ว" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                            <Icon name="credit-card" size={14}/>
                                            {order["สถานะการชำระเงิน"] || "รอยืนยันสลิป"}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100 text-sm font-medium">{order["รายการซ่อม"]}</div>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                    <span className="text-gray-500 font-medium">ยอดเงินรวม</span>
                                    <span className="text-xl font-bold text-blue-600">฿{Number(order["ยอดรวม"]).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );

            if (orderCompleted) {
                return (
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-green-50">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><Icon name="check-circle" size={56} /></div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-3">ส่งรายการสำเร็จ!</h2>
                            <p className="text-gray-600 mb-8 leading-relaxed">ข้อมูลถูกบันทึกเรียบร้อยแล้วครับ</p>
                            <button onClick={() => { setOrderCompleted(false); setActiveTab('track'); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition">ไปหน้าเช็คสถานะงานซ่อม</button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="min-h-screen pb-24 font-sans">
                    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
                        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100"><Icon name="clipboard-list" size={22} /></div>
                                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">ปรีดาบริการซ่อมผ้า</h1>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
                                <button onClick={() => {setActiveTab('order'); setIsPaymentStep(false);}} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'order' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>สั่งซ่อม</button>
                                <button onClick={() => setActiveTab('track')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'track' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>เช็คสถานะ</button>
                            </div>
                        </div>
                    </header>

                    <main className="max-w-5xl mx-auto px-4 py-8">
                        {activeTab === 'track' ? renderTrackingView() : (
                            !isPaymentStep ? (
                                <div className="grid lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {defaultServices.map(item => (
                                                <button key={item.id} onClick={() => addToCart(item)} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left flex justify-between items-center group">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{item.category}</p>
                                                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                                                        <p className="text-blue-600 font-bold text-lg">฿{item.price.toLocaleString()}</p>
                                                    </div>
                                                    <div className="bg-gray-50 p-2.5 rounded-full text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Icon name="plus" size={20} /></div>
                                                </button>
                                            ))}
                                        </div>
                                        <section className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                                            <h3 className="font-bold mb-5 flex items-center gap-2 text-xl"><Icon name="plus" size={24} className="bg-white/20 p-1 rounded-lg" /> รายการสั่งซ่อมพิเศษ</h3>
                                            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                                                <input type="text" placeholder="ระบุชื่อรายการ..." value={customName} onChange={e=>setCustomName(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 placeholder:text-blue-100 outline-none focus:ring-2 ring-white/50 transition" />
                                                <div className="flex gap-2">
                                                    <input type="number" placeholder="ราคา" value={customPrice} onChange={e=>setCustomPrice(e.target.value)} className="w-28 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-white/50" />
                                                    <button onClick={() => { if(customName && customPrice) {setCart([...cart, {id:Date.now(), name:customName, price:Number(customPrice), quantity:1}]); setCustomName(''); setCustomPrice(''); }}} className="bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl active:scale-95 transition shadow-xl">เพิ่ม</button>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 sticky top-28">
                                            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 font-bold"><Icon name="shopping-cart" size={22} className="text-blue-600" /> ตะกร้าซ่อมผ้า</h2>
                                            {cart.length === 0 ? <p className="text-center text-gray-400 py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-gray-100 text-sm font-medium">กรุณาเลือกรายการซ่อม</p> : (
                                                <div className="space-y-6">
                                                    <div className="max-h-[350px] overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                                                        {cart.map(item => (
                                                            <div key={item.id} className="flex justify-between items-start pb-5 border-b border-gray-50 last:border-0">
                                                                <div className="flex-1">
                                                                    <h4 className="text-sm font-bold text-gray-800 mb-2">{item.name}</h4>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                                                            <button onClick={()=>updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-blue-600 font-bold">-</button>
                                                                            <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                                                            <button onClick={()=>updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-blue-600 font-bold">+</button>
                                                                        </div>
                                                                        <span className="text-blue-600 text-sm font-black ml-auto">฿{(item.price * item.quantity).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                                <button onClick={()=>removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 ml-4 transition p-1"><Icon name="trash-2" size={18}/></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="pt-6 border-t-2 border-slate-50">
                                                        <div className="flex justify-between items-center text-2xl font-black">
                                                            <span className="text-gray-800">ยอดรวม</span>
                                                            <span className="text-blue-600">฿{totalPrice.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={()=>setIsPaymentStep(true)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black mt-6 shadow-xl active:scale-95 transition text-lg flex items-center justify-center gap-2">ถัดไป <Icon name="chevron-right" size={22} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <button onClick={() => setIsPaymentStep(false)} className="text-gray-500 flex items-center gap-2 hover:text-blue-600 transition font-bold">← ย้อนกลับ</button>
                                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                                            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-800"><Icon name="user" size={24} className="text-blue-600"/> ข้อมูลผู้รับบริการ</h3>
                                            <input type="text" placeholder="ชื่อ-นามสกุล" value={customer.name} onChange={e=>setCustomer({...customer, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 mb-4 outline-none focus:ring-2 ring-blue-500 transition shadow-inner" />
                                            <input type="tel" placeholder="เบอร์โทรศัพท์" value={customer.phone} onChange={e=>setCustomer({...customer, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-blue-500 transition shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-blue-50 text-center flex flex-col items-center">
                                        <h3 className="text-2xl font-black mb-1">ชำระเงิน</h3>
                                        <p className="text-gray-400 text-sm mb-8">สแกนจ่ายผ่านแอปธนาคาร</p>
                                        <div className="bg-slate-50 p-6 rounded-[2rem] mb-8 w-full max-w-[280px] border border-slate-100 shadow-inner">
                                            <div className="bg-white p-3 rounded-2xl shadow-sm">
                                                <img src={`https://promptpay.io/1819900114907/${totalPrice}.png`} className="w-full rounded-xl" alt="QR Code" />
                                            </div>
                                            <div className="pt-5 mt-5 border-t border-slate-200 text-center">
                                                <p className="text-xl font-black text-slate-800 leading-none">181-9900114-907</p>
                                                <p className="text-xs text-blue-700 font-black uppercase tracking-widest mt-2">ปรีดาบริการซ่อมผ้า</p>
                                            </div>
                                        </div>
                                        <button onClick={handleSubmitOrder} disabled={isSubmitting} className="w-full py-5 rounded-2xl font-black bg-green-600 text-white shadow-xl active:scale-95 transition text-lg flex items-center justify-center gap-2">
                                            {isSubmitting ? "กำลังบันทึก..." : "แจ้งโอนและส่งรายการซ่อม"}
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </main>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
