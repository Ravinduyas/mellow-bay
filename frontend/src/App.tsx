import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Rooms } from './pages/Rooms';
import { EatAndWork } from './pages/EatAndWork';
import { About } from './pages/About';
import { Contact } from './pages/Contact';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/eat-and-work" element={<EatAndWork />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* The two pages these replaced, kept so old links still resolve */}
          <Route path="/restaurant" element={<Navigate to="/eat-and-work#eat" replace />} />
          <Route path="/coworking" element={<Navigate to="/eat-and-work#work" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
