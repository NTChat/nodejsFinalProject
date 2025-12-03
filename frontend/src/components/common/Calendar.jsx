import React from 'react';
import Flatpickr from 'react-flatpickr';
import "flatpickr/dist/themes/material_blue.css";
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Vietnamese } from "flatpickr/dist/l10n/vn.js";

const Calendar = ({
    value,
    onChange,
    disabled = false,
    label,
    enableTime = false,
    placeholder = "Chọn thời gian...",
    rightContent = null
}) => {
    return (
        <div className="space-y-2 w-full">
            {/* Label */}
            {label && (
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    {enableTime ? (
                        <Clock size={16} className="text-blue-600" />
                    ) : (
                        <CalendarIcon size={16} className="text-blue-600" />
                    )}
                    {label}
                </label>
            )}

            <div className="relative">
                <Flatpickr
                    value={value}
                    onChange={([date]) => {
                        onChange(date ? date.toISOString() : "");
                    }}
                    disabled={disabled}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 outline-none text-sm font-medium
                            ${disabled
                            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-200 text-gray-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer hover:border-blue-300'
                        }
                        `}
                    options={{
                        dateFormat: enableTime ? "d/m/Y H:i" : "d/m/Y",
                        enableTime: enableTime,
                        time_24hr: true,
                        disableMobile: "true",
                        allowInput: true,
                        locale: Vietnamese
                    }}
                    placeholder={placeholder}
                />

                {/* Icon bên phải - ẩn nếu có rightContent */}
                {!rightContent && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500 z-0">
                        {enableTime ? <Clock size={18} /> : <CalendarIcon size={18} />}
                    </div>
                )}

                {/* Content tùy chỉnh bên phải */}
                {rightContent && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-auto">
                        {rightContent}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calendar;