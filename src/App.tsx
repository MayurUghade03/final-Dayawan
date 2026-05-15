import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ApplicationProvider } from "@/contexts/ApplicationContext";
import { ServiceCatalogProvider } from "@/contexts/ServiceCatalogContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index.tsx";
import ServicesPage from "./pages/ServicesPage.tsx";
import ServiceDetailPage from "./pages/ServiceDetailPage.tsx";
import TrackPage from "./pages/TrackPage.tsx";
import FAQPage from "./pages/FAQPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.tsx";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <ServiceCatalogProvider>
            <ApplicationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
                    <Route path="/services/:id" element={<ProtectedRoute><ServiceDetailPage /></ProtectedRoute>} />
                    <Route path="/track" element={<ProtectedRoute><TrackPage /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ApplicationProvider>
          </ServiceCatalogProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
