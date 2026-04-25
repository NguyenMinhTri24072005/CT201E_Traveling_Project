import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CustomerLayout from "../components/common/CustomerLayout";
import AdminLayout from "../components/admin/AdminLayout";
import About from '../pages/customer/About';
import Contact from '../pages/customer/Contact';
import Home from "../pages/customer/Home";
import TourDetail from "../pages/customer/TourDetail";
import Checkout from "../pages/customer/Checkout";
import Dashboard from "../pages/admin/Dashboard";
import Login from "../pages/customer/Login";
import BookingHistory from "../pages/customer/BookingHistory";
import TourList from "../pages/customer/TourList";
import BookingManagement from "../pages/admin/BookingManagement";
import Register from '../pages/customer/Register';
import AddTour from '../pages/admin/AddTour';
import TourManagement from '../pages/admin/TourManagement';
import UserManagement from '../pages/admin/UserManagement';
import EditTour from '../pages/admin/EditTour';
import AdminProfile from "../pages/admin/AdminProfile";
import Profile from '../pages/customer/Profile';
import Chat from '../pages/chat/Chat';
import NotificationManagement from '../pages/admin/NotificationManagement';
import ShopSettings from '../pages/admin/ShopSettings';
import PartnerShop from '../pages/customer/PartnerShop';
import ManageLocations from '../pages/admin/ManageLocations'
import ManageCategories from '../pages/admin/ManageCategories'

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* nhánh 1: dành cho khách hàng */}
                <Route path="/" element={<CustomerLayout />}>
                    <Route index element={<Home />} />
                    <Route path="/tour/:id" element={<TourDetail />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/history" element={<BookingHistory />} />
                    <Route path="/tours" element={<TourList />} />
                    <Route path="register" element={<Register />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/shop/:id" element={<PartnerShop />} />
                    <Route path="/chat" element={<Chat />} />
                </Route>

                {/* nhánh 2: dành cho admin */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="bookings" element={<BookingManagement />} />
                    <Route path="tours" element={<TourManagement />} />
                    <Route path="tours/add" element={<AddTour />} />
                    <Route path="tours/edit/:id" element={<EditTour />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="notifications" element={<NotificationManagement />} />
                    <Route path="shop-settings" element={<ShopSettings />} />
                    <Route path="/admin/locations" element={<ManageLocations />} />
                    <Route path="/admin/categories" element={<ManageCategories />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}