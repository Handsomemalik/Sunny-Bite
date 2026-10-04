import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Lenis from 'lenis';
import { ContentProvider } from './context/ContentContext';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './admin/AdminAuthContext';
import { AdminProtectedRoute } from './admin/AdminProtectedRoute';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChatWidget } from './components/ChatWidget';
import { Toast } from './components/Toast';
import { ScrollProgress } from './components/ScrollProgress';
import { PageWrapper } from './components/PageWrapper';
import { CartDrawer } from './components/CartDrawer';
import { FlyingCartItems } from './components/FlyingCartItems';
import { CustomCursor } from './components/CustomCursor';

// Public Pages
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { NotFound } from './pages/NotFound';

// Lazy-loaded Admin Pages (Code-split to never impact public site performance)
const AdminLogin = lazy(() => import('./admin/pages/Login'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./admin/pages/Dashboard'));
const AdminMenuManager = lazy(() => import('./admin/pages/MenuManager'));
const AdminPageEditor = lazy(() => import('./admin/pages/PageEditor'));
const AdminMediaLibrary = lazy(() => import('./admin/pages/MediaLibrary'));
const AdminSiteSettings = lazy(() => import('./admin/pages/SiteSettings'));
const AdminAssistantManager = lazy(() => import('./admin/pages/AssistantManager'));
const AdminInbox = lazy(() => import('./admin/pages/Inbox'));
const AdminSeoManager = lazy(() => import('./admin/pages/SeoManager'));
const AdminBackupHistory = lazy(() => import('./admin/pages/BackupHistory'));
const AdminSecurityAccounts = lazy(() => import('./admin/pages/SecurityAccounts'));

// Brand-styled Admin Loader
function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FBF5EB] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-3 border-secondary/20 border-t-secondary animate-spin" />
      <p className="font-label-md text-xs text-on-surface-variant animate-pulse font-medium">
        Loading SunnyBite Admin...
      </p>
    </div>
  );
}

// Public Layout Wrapper: Holds Public Navbar, Footer, Cart, Custom Cursor, Floating Chat
function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden w-full max-w-full">
      {/* Desktop Custom Smooth Cursor */}
      <CustomCursor />

      {/* Animated Arc Clones Flying to Cart */}
      <FlyingCartItems />

      {/* Top Thin Scroll Progress Bar */}
      <ScrollProgress />

      {/* Floating Pill Glass Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer Component */}
      <Footer />

      {/* Cart Sliding Drawer */}
      <CartDrawer />

      {/* Interactive Shells: Toast & Chat Widget */}
      <Toast />
      <ChatWidget />
    </div>
  );
}

export function App() {
  useEffect(() => {
    // Respect user's motion preference and do not initialize Lenis on admin paths
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isAdminPath = window.location.pathname.startsWith('/admin');
    if (prefersReduced || isAdminPath) return;

    // Initialize Lenis smooth scroll for public browsing
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    let animationFrameId;
    function raf(time) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return (
    <ContentProvider>
      <CartProvider>
        <Router>
          <AdminAuthProvider>
            <Routes>
              {/* Public Pages Layout */}
              <Route element={<PublicLayout />}>
                <Route
                  path="/"
                  element={
                    <PageWrapper>
                      <Home />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/menu"
                  element={
                    <PageWrapper>
                      <Menu />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <PageWrapper>
                      <About />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <PageWrapper>
                      <Contact />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <PageWrapper>
                      <PrivacyPolicy />
                    </PageWrapper>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <PageWrapper>
                      <TermsOfService />
                    </PageWrapper>
                  }
                />
                <Route
                  path="*"
                  element={
                    <PageWrapper>
                      <NotFound />
                    </PageWrapper>
                  }
                />
              </Route>

              {/* Admin Login Route (Unprotected, standalone card) */}
              <Route
                path="/admin/login"
                element={
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminLogin />
                  </Suspense>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminLayout />
                    </Suspense>
                  </AdminProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="menu"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminMenuManager />
                    </Suspense>
                  }
                />
                <Route
                  path="pages"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminPageEditor />
                    </Suspense>
                  }
                />
                <Route
                  path="media"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminMediaLibrary />
                    </Suspense>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminSiteSettings />
                    </Suspense>
                  }
                />
                <Route
                  path="assistant"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminAssistantManager />
                    </Suspense>
                  }
                />
                <Route
                  path="inbox"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminInbox />
                    </Suspense>
                  }
                />
                <Route
                  path="seo"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminSeoManager />
                    </Suspense>
                  }
                />
                <Route
                  path="backup"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminBackupHistory />
                    </Suspense>
                  }
                />
                <Route
                  path="security"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <AdminSecurityAccounts />
                    </Suspense>
                  }
                />
                {/* Fallback inside /admin */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Routes>
          </AdminAuthProvider>
        </Router>
      </CartProvider>
    </ContentProvider>
  );
}

export default App;
