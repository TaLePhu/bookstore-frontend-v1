import { createElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { BookDetailPage } from './pages/BookDetailPage';
import { CartPage } from './pages/CartPage';
import { AccountPage } from './pages/AccountPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { BestSellersPage } from './pages/BestSellersPage';
import { CategoryPage } from './pages/CategoryPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { PromotionBooksPage } from './pages/PromotionBooksPage';
import { NewBooksPage } from './pages/NewBooksPage';
import { AIAdvisorPage } from './pages/AIAdvisorPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';

function AdminRoute() {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role?.toUpperCase();

  if (!isAuthenticated) {
    return createElement(Navigate, { to: '/login', replace: true });
  }

  if (role !== 'ADMIN' && role !== 'STAFF') {
    return createElement(Navigate, { to: '/', replace: true });
  }

  return createElement(AdminPage);
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'book/:id', Component: BookDetailPage },
      { path: 'cart', Component: CartPage },
      { path: 'account', Component: AccountPage },
      { path: 'checkout', Component: CheckoutPage },
      { path: 'track-order', Component: TrackOrderPage },
      { path: 'bestsellers', Component: BestSellersPage },
      { path: 'new-books', Component: NewBooksPage },
      { path: 'ai-advisor', Component: AIAdvisorPage },
      { path: 'category/:category', Component: CategoryPage },
      { path: 'promotions', Component: PromotionsPage },
      { path: 'promotions/books', Component: PromotionBooksPage },
    ],
  },
  {
    path: '/admin',
    Component: AdminRoute,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
]);
