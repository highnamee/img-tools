import { useEffect } from "react";
import { useLocation, Outlet, ScrollRestoration } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    const ogUrlMetaTag = document.querySelector('meta[property="og:url"]');
    if (ogUrlMetaTag) {
      ogUrlMetaTag.setAttribute("content", window.location.origin + location.pathname);
    }
  }, [location]);

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-grow px-4 py-8">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
