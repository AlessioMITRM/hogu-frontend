import React from "react";
// 1. Aggiungo useSearchParams agli import
import { Routes, Route, useParams, useSearchParams } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n"; 
import { useAuth } from "./components/context/AuthContext.jsx";

// Common
import CookieConsent from "./components/common/CookieConsent.jsx";

// Layout
import Header from "./components/layout/Header.jsx";
import { Footer } from "./components/layout/Footer.jsx";
import LoadingScreen from "./components/ui/LoadingScreen.jsx";

// Principal pages
import { HomePage } from "./components/pages/HomePage.jsx";
import { AuthForm } from "./components/pages/auth/AuthForm.jsx";
import { AdminAuth } from "./components/pages/auth/AdminAuth.jsx";
import PasswordResetAuth from "./components/pages/auth/PasswordReset.jsx";
import { ProfileSecurityPage } from "./components/pages/auth/ProfileSecurityPage.jsx";
import   UnauthorizedPage  from "./components/pages/auth/UnauthorizedPage.jsx";
import PaymentSummary from "./components/pages/payment/PaymentSummary.jsx";
import PaymentSuccess from "./components/pages/payment/PaymentSuccess.jsx";
import PaymentFailed from "./components/pages/payment/PaymentFailed.jsx";

// Common pages
import NotFoundPage from "./components/pages/NotFoundPage.jsx";

// Catalog pages
import ServiceListingLuggage from "./components/pages/service/ServiceListingLuggage.jsx";
import { ServiceListingRestaurant } from "./components/pages/service/ServiceListingRestaurant.jsx";
import { ServiceListingBnB } from "./components/pages/service/ServiceListingBnB.jsx";
import { ServiceListingClub } from "./components/pages/service/ServiceListingClub.jsx";
import { ServiceListingNCC } from "./components/pages/service/ServiceListingNCC.jsx";

// Detail pages
import { ServiceDetailPageRestaurant } from "./components/pages/detail/ServiceDetailPageRestaurant.jsx";
import { ServiceDetailPageClub } from "./components/pages/detail/ServiceDetailPageClub.jsx";
import { ServiceDetailPageNCC } from "./components/pages/detail/ServiceDetailPageNCC.jsx";
import ServiceDetailPageLuggage from "./components/pages/detail/ServiceDetailPageLuggage.jsx";
import ServiceDetailPageBnB from "./components/pages/detail/ServiceDetailPageBnB.jsx";

// Provider Dashboard
import { CoreDashboard } from "./components/pages/dashboard/provider/principal/CoreDashboard.jsx";
import { RestaurantServiceEditPage } from "./components/pages/dashboard/provider/RestaurantServiceEditPage.jsx";
import ClubServiceEditPage from "./components/pages/dashboard/provider/ClubServiceEditPage.jsx";
import EventServiceEditPage from "./components/pages/dashboard/provider/EventServiceEditPage.jsx";
import { LuggageServiceEditPage } from "./components/pages/dashboard/provider/LuggageServiceEditPage.jsx";
import { NCCServiceEditPage } from "./components/pages/dashboard/provider/NCCServiceEditPage.jsx";
import { ServiceEditPageBnB } from "./components/pages/dashboard/provider/ServiceEditPageBnB.jsx";
import QRValidatorPage from "./components/pages/dashboard/provider/QRValidatorPage.jsx";

// Customer Dashboard
import { CustomerDashboard } from "./components/pages/dashboard/customer/CustomerDashboard.jsx";

// Admin Dashboard
import { AdminDashboard } from "./components/pages/dashboard/admin/AdminDashboard.jsx";
import { AdminCommissions } from "./components/pages/dashboard/admin/AdminCommissions.jsx";
import { AdminBillings } from "./components/pages/dashboard/admin/AdminBillings.jsx";

// Legal Dashboard
import { PrivacyPolicyPage } from "./components/pages/legal/PrivacyPolicyPage.jsx";
import { TermsPage } from "./components/pages/legal/TermsPage.jsx";

import { slugify } from "./utils/slugify.js";

export const App = () => (
  <I18nextProvider i18n={i18n}>
    <AppRouter />
  </I18nextProvider>
);

const AppRouter = () => {
  const { isAuthenticated, role, user, isLoading } = useAuth();

  // Nota: Questa funzione navigateTo è definita ma non passata/usata nel return di questo snippet.
  // Se la usi altrove tramite context, ricorda di aggiornare anche lì la logica per includere i parametri dateFrom/dateTo.
  const navigateTo = (page, serviceType = null, params = null, item = null) => {
    if (item && item.id && item.name && serviceType) {
      const slug = slugify(item.name);
      // Esempio logica futura: se in params hai date, aggiungile qui alla stringa navigate
      navigate(`/${serviceType.toLowerCase()}/${slug}-${item.id}`);
      return;
    }
    navigate("/" + page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header key={`header-${isAuthenticated}`} /> 

      <Routes>
        {/* Principal pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthForm type="login" />} />
        <Route path="/register" element={<AuthForm type="register" />} />
        <Route path="/adminpanel-secure" element={<AdminAuth type="login" />} />
        <Route path="/password-reset" element={<PasswordResetAuth />} />
        <Route path="/payment/summary" element={<PaymentSummary />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="/unauthorized-page" element={<UnauthorizedPage />} />

        {/* COMMON PAGE */}
        <Route path="/not-found" element={<NotFoundPage />} />

        {/* SERVICE */}
        <Route path="/service/club" element={<ServiceListingClub />} />
        <Route path="/service/restaurant" element={<ServiceListingRestaurant />} />
        <Route path="/service/bnb" element={<ServiceListingBnB />} />
        <Route path="/service/ncc" element={<ServiceListingNCC />} />
        <Route path="/service/luggage" element={<ServiceListingLuggage />} />

        {/* DETAIL SEO */}
        <Route path="/:serviceType/:slugAndId" element={<DetailRouter />} />

        {/* PROVIDER ACCESS */}
        <Route path="/provider/dashboard" element={<CoreDashboard />} />
        <Route path="/provider/edit/ncc/:id" element={<NCCServiceEditPage />} />
        <Route path="/provider/edit/bnb/:id" element={<ServiceEditPageBnB />} />
        <Route path="/provider/edit/club/event/:id" element={<EventServiceEditPage />} />
        <Route path="/provider/edit/luggage/:id" element={<LuggageServiceEditPage />} />
        <Route path="/provider/edit/restaurant/:id" element={<RestaurantServiceEditPage />} />
        <Route path="/provider/qr-validator" element={<QRValidatorPage />} />
        <Route path="/provider/credential-reset" element={<ProfileSecurityPage />} />

        {/* CUSTOMER DASHBOARD */}
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/credential-reset" element={<ProfileSecurityPage />} />

        {/* ADMIN DASHBOARD */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/commision" element={<AdminCommissions />} />
        <Route path="/admin/billing" element={<AdminBillings />} />

        {/* LEGAL */}
        <Route path="/legal/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/legal/terms" element={<TermsPage />} />

        {/* Catch-all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Footer />
      <LoadingScreen isLoading={isLoading} />
    </div>
  );
};

const DetailRouter = () => {
  const { serviceType, slugAndId } = useParams();
  
  const [searchParams] = useSearchParams();
  
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const timeFrom = searchParams.get("timeFrom");
  const timeTo = searchParams.get("timeTo");
  const totalPersons = searchParams.get("totalPersons");

  // Sicurezza: se manca lo slug, mostra 404
  if (!slugAndId) return <NotFoundPage />;

  const id = slugAndId.split("-").pop();

  // 3. Passaggio delle props ai componenti di dettaglio
  switch (serviceType.toLowerCase()) {
    case "restaurant": 
      return <ServiceDetailPageRestaurant id={id} dateFrom={dateFrom} timeFrom={timeFrom} totalPersons={totalPersons} />;
    
    case "club": 
      const table = searchParams.get("table");

      return <ServiceDetailPageClub id={id} table={table} />;
    
    case "bnb": 
      return <ServiceDetailPageBnB id={id} dateFrom={dateFrom} dateTo={dateTo} />;
    
    case "ncc": 
      const nccParams = {
          from: searchParams.get("fromCity"), // URL usa 'fromCity', componente vuole 'from'
          fromAddress: searchParams.get("fromAddress"),
          to: searchParams.get("toCity"),     // URL usa 'toCity', componente vuole 'to'
          toAddress: searchParams.get("toAddress"),
          date: dateFrom,                     // URL usa 'dateFrom', componente vuole 'date'
          time: timeFrom,                     // URL usa 'timeFrom', componente vuole 'time'
          passengers: totalPersons,           // URL usa 'totalPersons', componente vuole 'passengers'
          tripType: "oneway",                 // Default o da recuperare se presente nell'URL
          distanceKm: searchParams.get("distanceKm")
      };
      
      return <ServiceDetailPageNCC id={id} searchParams={nccParams} />;
    
    case "luggage": 
      return <ServiceDetailPageLuggage id={id} dateFrom={dateFrom} dateTo={dateTo} />;
    
    default: return <NotFoundPage />;
  }
};