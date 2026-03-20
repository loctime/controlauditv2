import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/components/context/AuthContext";
import { hasAccess } from "../utils/accessControl";

const RouteGuard = ({ roles = [], children }) => {
  const { isLogged, loading, role, userProfile } = useAuth();
  const hasOfflineUser =
    localStorage.getItem("isLogged") === "true" && localStorage.getItem("userInfo");

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (!isLogged && !hasOfflineUser) {
    return <Navigate to="/login" replace />;
  }

  // Caso offline: hay sesión previa en localStorage pero el rol todavía
  // no fue restaurado desde cache (evita loop de redirección a "/").
  if (hasOfflineUser && !role && typeof navigator !== "undefined" && !navigator.onLine) {
    return children;
  }

  if (!hasAccess({ role, superdev: userProfile?.superdev }, roles)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RouteGuard;
