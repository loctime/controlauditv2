// Optimización de importaciones de React Router
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar React Router de forma lazy
export const loadReactRouter = async () => {
  const {
    BrowserRouter,
    HashRouter,
    MemoryRouter,
    Routes,
    Route,
    Navigate,
    Outlet,
    useParams,
    useNavigate,
    useLocation,
    useSearchParams,
    Link,
    NavLink,
    useOutlet,
    useOutletContext,
    useResolvedPath,
    useHref,
    useMatch,
    useRoutes,
    createRoutesFromElements,
    createBrowserRouter,
    createHashRouter,
    createMemoryRouter,
    RouterProvider,
    UNSAFE_enhanceManualRouteObjects,
    UNSAFE_DataRouterContext,
    UNSAFE_DataRouterStateContext,
    UNSAFE_NavigationContext,
    UNSAFE_RouteContext,
    UNSAFE_useRouteId,
    UNSAFE_useRoutesImpl
  } = await import('react-router-dom');

  return {
    BrowserRouter,
    HashRouter,
    MemoryRouter,
    Routes,
    Route,
    Navigate,
    Outlet,
    useParams,
    useNavigate,
    useLocation,
    useSearchParams,
    Link,
    NavLink,
    useOutlet,
    useOutletContext,
    useResolvedPath,
    useHref,
    useMatch,
    useRoutes,
    createRoutesFromElements,
    createBrowserRouter,
    createHashRouter,
    createMemoryRouter,
    RouterProvider,
    UNSAFE_enhanceManualRouteObjects,
    UNSAFE_DataRouterContext,
    UNSAFE_DataRouterStateContext,
    UNSAFE_NavigationContext,
    UNSAFE_RouteContext,
    UNSAFE_useRouteId,
    UNSAFE_useRoutesImpl
  };
};

// Configuración optimizada para React Router
export const getRouterConfig = async (options = {}) => {
  const router = await loadReactRouter();
  
  const defaultConfig = {
    basename: '',
    window: undefined,
    ...options
  };
  
  return { router, config: defaultConfig };
};

// Utilidades para rutas
export const routeUtils = {
  // Crear rutas dinámicamente
  createDynamicRoutes: (routeConfigs) => {
    return routeConfigs.map(config => ({
      path: config.path,
      element: config.element,
      children: config.children ? routeUtils.createDynamicRoutes(config.children) : undefined,
      index: config.index || false,
      caseSensitive: config.caseSensitive || false
    }));
  },
  
  // Validar rutas
  validateRoutes: (routes) => {
    const errors = [];
    
    routes.forEach((route, index) => {
      if (!route.path && !route.index) {
        errors.push(`Route at index ${index} must have either a path or be an index route`);
      }
      
      if (route.children) {
        const childErrors = routeUtils.validateRoutes(route.children);
        errors.push(...childErrors);
      }
    });
    
    return errors;
  },
  
  // Flatten rutas anidadas
  flattenRoutes: (routes, parentPath = '') => {
    const flattened = [];
    
    routes.forEach(route => {
      const fullPath = parentPath + route.path;
      flattened.push({
        ...route,
        path: fullPath
      });
      
      if (route.children) {
        const childRoutes = routeUtils.flattenRoutes(route.children, fullPath);
        flattened.push(...childRoutes);
      }
    });
    
    return flattened;
  },
  
  // Encontrar ruta por path
  findRouteByPath: (routes, targetPath) => {
    for (const route of routes) {
      if (route.path === targetPath) {
        return route;
      }
      
      if (route.children) {
        const found = routeUtils.findRouteByPath(route.children, targetPath);
        if (found) return found;
      }
    }
    
    return null;
  },
  
  // Obtener rutas activas
  getActiveRoutes: (routes, currentPath) => {
    const activeRoutes = [];
    
    routes.forEach(route => {
      if (route.path && currentPath.startsWith(route.path)) {
        activeRoutes.push(route);
      }
      
      if (route.children) {
        const childActiveRoutes = routeUtils.getActiveRoutes(route.children, currentPath);
        activeRoutes.push(...childActiveRoutes);
      }
    });
    
    return activeRoutes;
  },
  
  // Generar breadcrumbs
  generateBreadcrumbs: (routes, currentPath) => {
    const breadcrumbs = [];
    const pathSegments = currentPath.split('/').filter(Boolean);
    
    let currentRoute = '';
    pathSegments.forEach(segment => {
      currentRoute += `/${segment}`;
      const route = routeUtils.findRouteByPath(routes, currentRoute);
      if (route) {
        breadcrumbs.push({
          path: currentRoute,
          label: route.label || segment,
          element: route.element
        });
      }
    });
    
    return breadcrumbs;
  }
};

// Utilidades para navegación
export const navigationUtils = {
  // Navegar programáticamente
  navigate: async (to, options = {}) => {
    const { useNavigate } = await loadReactRouter();
    const navigate = useNavigate();
    return navigate(to, options);
  },
  
  // Obtener parámetros de URL
  getParams: async () => {
    const { useParams } = await loadReactRouter();
    return useParams();
  },
  
  // Obtener ubicación actual
  getLocation: async () => {
    const { useLocation } = await loadReactRouter();
    return useLocation();
  },
  
  // Obtener parámetros de búsqueda
  getSearchParams: async () => {
    const { useSearchParams } = await loadReactRouter();
    return useSearchParams();
  },
  
  // Construir URL con parámetros
  buildUrl: (path, params = {}, searchParams = {}) => {
    let url = path;
    
    // Agregar parámetros de ruta
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });
    
    // Agregar parámetros de búsqueda
    const searchParamsString = new URLSearchParams(searchParams).toString();
    if (searchParamsString) {
      url += `?${searchParamsString}`;
    }
    
    return url;
  },
  
  // Parsear URL
  parseUrl: (url) => {
    try {
      const urlObj = new URL(url, window.location.origin);
      return {
        pathname: urlObj.pathname,
        search: urlObj.search,
        hash: urlObj.hash,
        searchParams: Object.fromEntries(urlObj.searchParams)
      };
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  },
  
  // Verificar si una ruta está activa
  isRouteActive: (currentPath, targetPath, exact = false) => {
    if (exact) {
      return currentPath === targetPath;
    }
    return currentPath.startsWith(targetPath);
  },
  
  // Obtener rutas hermanas
  getSiblingRoutes: (routes, currentPath) => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    const parentRoute = routeUtils.findRouteByPath(routes, parentPath);
    
    if (parentRoute && parentRoute.children) {
      return parentRoute.children.filter(route => route.path !== currentPath);
    }
    
    return [];
  }
};

// Utilidades para guardado de rutas
export const routeGuardUtils = {
  // Verificar si el usuario puede acceder a una ruta
  canAccessRoute: (route, user) => {
    if (!route.requiresAuth) {
      return true;
    }
    
    if (!user) {
      return false;
    }
    
    if (route.roles && route.roles.length > 0) {
      return route.roles.includes(user.role);
    }
    
    return true;
  },
  
  // Obtener rutas accesibles
  getAccessibleRoutes: (routes, user) => {
    return routes.filter(route => routeGuardUtils.canAccessRoute(route, user));
  },
  
  // Redirigir si no tiene acceso
  redirectIfNoAccess: async (route, user, redirectTo = '/login') => {
    if (!routeGuardUtils.canAccessRoute(route, user)) {
      const { useNavigate } = await loadReactRouter();
      const navigate = useNavigate();
      navigate(redirectTo);
      return false;
    }
    return true;
  }
};

// Utilidades para lazy loading de rutas
export const lazyRouteUtils = {
  // Crear componente lazy
  createLazyComponent: (importFn, fallback = null) => {
    const LazyComponent = React.lazy(importFn);
    
    return (props) => (
      <React.Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  },
  
  // Crear ruta lazy
  createLazyRoute: (path, importFn, options = {}) => {
    const LazyComponent = lazyRouteUtils.createLazyComponent(importFn, options.fallback);
    
    return {
      path,
      element: <LazyComponent />,
      ...options
    };
  },
  
  // Crear múltiples rutas lazy
  createLazyRoutes: (routeConfigs) => {
    return routeConfigs.map(config => 
      lazyRouteUtils.createLazyRoute(
        config.path,
        config.importFn,
        config.options
      )
    );
  }
};

// Hook personalizado para rutas
export const useRouteUtils = () => {
  const navigate = async (to, options) => {
    return await navigationUtils.navigate(to, options);
  };
  
  const getParams = async () => {
    return await navigationUtils.getParams();
  };
  
  const getLocation = async () => {
    return await navigationUtils.getLocation();
  };
  
  const getSearchParams = async () => {
    return await navigationUtils.getSearchParams();
  };
  
  const buildUrl = (path, params, searchParams) => {
    return navigationUtils.buildUrl(path, params, searchParams);
  };
  
  const parseUrl = (url) => {
    return navigationUtils.parseUrl(url);
  };
  
  const isRouteActive = (currentPath, targetPath, exact) => {
    return navigationUtils.isRouteActive(currentPath, targetPath, exact);
  };
  
  const getSiblingRoutes = (routes, currentPath) => {
    return navigationUtils.getSiblingRoutes(routes, currentPath);
  };
  
  const canAccessRoute = (route, user) => {
    return routeGuardUtils.canAccessRoute(route, user);
  };
  
  const getAccessibleRoutes = (routes, user) => {
    return routeGuardUtils.getAccessibleRoutes(routes, user);
  };
  
  const redirectIfNoAccess = async (route, user, redirectTo) => {
    return await routeGuardUtils.redirectIfNoAccess(route, user, redirectTo);
  };
  
  const createLazyComponent = (importFn, fallback) => {
    return lazyRouteUtils.createLazyComponent(importFn, fallback);
  };
  
  const createLazyRoute = (path, importFn, options) => {
    return lazyRouteUtils.createLazyRoute(path, importFn, options);
  };
  
  const createLazyRoutes = (routeConfigs) => {
    return lazyRouteUtils.createLazyRoutes(routeConfigs);
  };
  
  return {
    navigate,
    getParams,
    getLocation,
    getSearchParams,
    buildUrl,
    parseUrl,
    isRouteActive,
    getSiblingRoutes,
    canAccessRoute,
    getAccessibleRoutes,
    redirectIfNoAccess,
    createLazyComponent,
    createLazyRoute,
    createLazyRoutes
  };
};
