import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import AdminLayout from "@/pages/Admin/Layout";
import AdminCategories from "@/pages/Admin/Categories";
import AdminLinks from "@/pages/Admin/Links";
import AdminSettings from "@/pages/Admin/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminSettings />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="links" element={<AdminLinks />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}
