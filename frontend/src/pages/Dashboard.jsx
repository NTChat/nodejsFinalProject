import { Outlet } from "react-router-dom";
import { useState } from "react";
import SideBar from "../components/Dashboard/SideBar";
import { Menu, X } from "lucide-react";

const Dashboard = () => {
  const [isCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <SideBar 
        onToggle={setSidebarCollapsed} 
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Nội dung chính */}
      <div
        className={`flex flex-col transition-all duration-300 ease-in-out
          ${isCollapsed ? "lg:ml-20" : "lg:ml-72"}
          ml-0
        `}
      >
        <main className="p-4 md:p-6 w-full pt-16 lg:pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Dashboard;
