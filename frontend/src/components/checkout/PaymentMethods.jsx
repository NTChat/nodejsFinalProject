import React from 'react';
import { CreditCard, Truck, Landmark, CheckCircle } from 'lucide-react';

const PaymentMethodItem = ({ id, title, desc, icon, selected, onSelect }) => (
    <div 
        onClick={() => onSelect(id)}
        className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected === id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
    >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected === id ? 'border-blue-600' : 'border-gray-300'}`}>
            {selected === id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
        </div>
        <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-blue-600">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
            {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
        </div>
        {id === 'vnpay' && <span className="absolute top-2 right-2 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">GIẢM 5%</span>}
    </div>
);

const PaymentMethods = ({ selected, onSelect }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <CreditCard className="text-green-600" size={20} /> Phương thức thanh toán
            </h3>
            <div className="grid grid-cols-1 gap-3">
                <PaymentMethodItem 
                    id="vnpay" 
                    title="Thanh toán VNPAY-QR" 
                    desc="Quét mã QR qua ứng dụng ngân hàng"
                    icon={<CheckCircle size={20}/>}
                    selected={selected} onSelect={onSelect}
                />
                <PaymentMethodItem 
                    id="banking" 
                    title="Chuyển khoản ngân hàng" 
                    desc="Vietcombank, Techcombank,..."
                    icon={<Landmark size={20}/>}
                    selected={selected} onSelect={onSelect}
                />
                <PaymentMethodItem 
                    id="cod" 
                    title="Thanh toán khi nhận hàng (COD)" 
                    desc="Thanh toán tiền mặt cho shipper"
                    icon={<Truck size={20}/>}
                    selected={selected} onSelect={onSelect}
                />
            </div>
        </div>
    );
};

export default PaymentMethods;