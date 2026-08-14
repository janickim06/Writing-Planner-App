import { Route, Router, Routes } from "@adamjanicki/ui";
import Alert from "src/components/Alert";
import RequireAuth from "src/components/RequireAuth";
import Dashboard from "src/pages/Dashboard";
import Landing from "src/pages/Landing";
import NotFound from "src/pages/NotFound";

export default function App() {
  return (
    <Router>
      <Routes fallback={<NotFound />}>
        <Route path="/" element={<Landing />} />
        <Route
          path="/app/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/app/:itemId"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
      </Routes>
      <Alert />
    </Router>
  );
}
