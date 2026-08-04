import { Route, Router, Routes } from "@adamjanicki/ui";
import Alert from "src/components/Alert";
import Footer from "src/components/Footer";
import Nav from "src/components/Nav";
import About from "src/pages/About";
import ApiTest from "src/pages/ApiTest";
import Home from "src/pages/Home";
import Login from "src/pages/Login";
import NotFound from "src/pages/NotFound";

export default function App() {
  return (
    <Router>
      <Nav />
      <Routes fallback={<NotFound />}>
        <Route path="/" element={<Home />} />
        <Route path="/about/" element={<About />} />
        <Route path="/api-test/" element={<ApiTest />} />
        <Route path="/login/" element={<Login />} />
      </Routes>
      <Alert />
      <Footer />
    </Router>
  );
}
