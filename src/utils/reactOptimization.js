// Optimización de importaciones de React
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar React de forma lazy
export const loadReact = async () => {
  const React = await import('react');
  return React.default;
};

// Función para cargar React DOM de forma lazy
export const loadReactDOM = async () => {
  const ReactDOM = await import('react-dom');
  return ReactDOM.default;
};

// Configuración optimizada para React
export const getReactConfig = async (options = {}) => {
  const React = await loadReact();
  
  const defaultConfig = {
    strictMode: true,
    concurrentMode: false,
    ...options
  };
  
  return { React, config: defaultConfig };
};

// Configuración optimizada para React DOM
export const getReactDOMConfig = async (options = {}) => {
  const ReactDOM = await loadReactDOM();
  
  const defaultConfig = {
    container: document.getElementById('root'),
    ...options
  };
  
  return { ReactDOM, config: defaultConfig };
};

// Utilidades para React
export const reactUtils = {
  // Crear elemento con lazy loading
  createLazyElement: async (component, props = {}) => {
    const React = await loadReact();
    const LazyComponent = React.lazy(component);
    
    return React.createElement(React.Suspense, {
      fallback: React.createElement('div', null, 'Cargando...')
    }, React.createElement(LazyComponent, props));
  },
  
  // Crear componente con memo
  createMemoizedComponent: async (component, propsAreEqual = null) => {
    const React = await loadReact();
    return React.memo(component, propsAreEqual);
  },
  
  // Crear componente con forwardRef
  createForwardRefComponent: async (component) => {
    const React = await loadReact();
    return React.forwardRef(component);
  },
  
  // Crear contexto optimizado
  createOptimizedContext: async (defaultValue) => {
    const React = await loadReact();
    const Context = React.createContext(defaultValue);
    
    // Optimizar el contexto para evitar re-renders innecesarios
    const Provider = ({ value, children }) => {
      const memoizedValue = React.useMemo(() => value, [JSON.stringify(value)]);
      return React.createElement(Context.Provider, { value: memoizedValue }, children);
    };
    
    return { Context, Provider };
  },
  
  // Crear hook personalizado optimizado
  createOptimizedHook: (hookFunction) => {
    return (...args) => {
      const React = require('react');
      return React.useMemo(() => hookFunction(...args), args);
    };
  },
  
  // Crear componente con error boundary
  createErrorBoundary: async (fallback = null) => {
    const React = await loadReact();
    
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      
      componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
      }
      
      render() {
        if (this.state.hasError) {
          return fallback || React.createElement('div', null, 'Algo salió mal.');
        }
        
        return this.props.children;
      }
    }
    
    return ErrorBoundary;
  },
  
  // Crear componente con loading state
  createLoadingComponent: async (loadingComponent = null) => {
    const React = await loadReact();
    
    return ({ isLoading, children, ...props }) => {
      if (isLoading) {
        return loadingComponent || React.createElement('div', null, 'Cargando...');
      }
      
      return React.cloneElement(children, props);
    };
  },
  
  // Crear componente con retry logic
  createRetryComponent: async (maxRetries = 3) => {
    const React = await loadReact();
    
    return ({ onRetry, children, ...props }) => {
      const [retryCount, setRetryCount] = React.useState(0);
      const [error, setError] = React.useState(null);
      
      const handleRetry = () => {
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setError(null);
          onRetry && onRetry();
        }
      };
      
      if (error) {
        return React.createElement('div', null, 
          React.createElement('p', null, 'Error: ', error.message),
          React.createElement('button', { onClick: handleRetry }, 'Reintentar')
        );
      }
      
      return React.cloneElement(children, { ...props, onError: setError });
    };
  }
};

// Utilidades para hooks optimizados
export const hookUtils = {
  // Hook para debounce
  useDebounce: (value, delay) => {
    const React = require('react');
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    
    React.useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    
    return debouncedValue;
  },
  
  // Hook para throttle
  useThrottle: (value, delay) => {
    const React = require('react');
    const [throttledValue, setThrottledValue] = React.useState(value);
    const lastRan = React.useRef(Date.now());
    
    React.useEffect(() => {
      const handler = setTimeout(() => {
        if (Date.now() - lastRan.current >= delay) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      }, delay - (Date.now() - lastRan.current));
      
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    
    return throttledValue;
  },
  
  // Hook para localStorage
  useLocalStorage: (key, initialValue) => {
    const React = require('react');
    
    const [storedValue, setStoredValue] = React.useState(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    });
    
    const setValue = (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(error);
      }
    };
    
    return [storedValue, setValue];
  },
  
  // Hook para sessionStorage
  useSessionStorage: (key, initialValue) => {
    const React = require('react');
    
    const [storedValue, setStoredValue] = React.useState(() => {
      try {
        const item = window.sessionStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    });
    
    const setValue = (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(error);
      }
    };
    
    return [storedValue, setValue];
  },
  
  // Hook para media queries
  useMediaQuery: (query) => {
    const React = require('react');
    const [matches, setMatches] = React.useState(false);
    
    React.useEffect(() => {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      
      const listener = () => setMatches(media.matches);
      media.addListener(listener);
      
      return () => media.removeListener(listener);
    }, [matches, query]);
    
    return matches;
  },
  
  // Hook para intersection observer
  useIntersectionObserver: (ref, options = {}) => {
    const React = require('react');
    const [isIntersecting, setIsIntersecting] = React.useState(false);
    
    React.useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      }, options);
      
      if (ref.current) {
        observer.observe(ref.current);
      }
      
      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [ref, options]);
    
    return isIntersecting;
  },
  
  // Hook para resize observer
  useResizeObserver: (ref) => {
    const React = require('react');
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
    
    React.useEffect(() => {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      });
      
      if (ref.current) {
        observer.observe(ref.current);
      }
      
      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [ref]);
    
    return dimensions;
  },
  
  // Hook para fetch con cache
  useFetch: (url, options = {}) => {
    const React = require('react');
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    React.useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const response = await fetch(url, options);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          setData(result);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [url, JSON.stringify(options)]);
    
    return { data, loading, error };
  },
  
  // Hook para interval
  useInterval: (callback, delay) => {
    const React = require('react');
    const savedCallback = React.useRef();
    
    React.useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
    
    React.useEffect(() => {
      if (delay !== null) {
        const id = setInterval(() => savedCallback.current(), delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  },
  
  // Hook para timeout
  useTimeout: (callback, delay) => {
    const React = require('react');
    const savedCallback = React.useRef();
    
    React.useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
    
    React.useEffect(() => {
      if (delay !== null) {
        const id = setTimeout(() => savedCallback.current(), delay);
        return () => clearTimeout(id);
      }
    }, [delay]);
  }
};

// Utilidades para renderizado optimizado
export const renderUtils = {
  // Renderizar con React 18
  renderWithReact18: async (element, container) => {
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);
    root.render(element);
    return root;
  },
  
  // Renderizar con React 17
  renderWithReact17: async (element, container) => {
    const ReactDOM = await loadReactDOM();
    return ReactDOM.render(element, container);
  },
  
  // Renderizar con hydrate
  renderWithHydrate: async (element, container) => {
    const ReactDOM = await loadReactDOM();
    return ReactDOM.hydrate(element, container);
  },
  
  // Renderizar con portal
  renderWithPortal: async (element, container) => {
    const ReactDOM = await loadReactDOM();
    return ReactDOM.createPortal(element, container);
  }
};

// Hook personalizado para React
export const useReactUtils = () => {
  const createLazyElement = async (component, props) => {
    return await reactUtils.createLazyElement(component, props);
  };
  
  const createMemoizedComponent = async (component, propsAreEqual) => {
    return await reactUtils.createMemoizedComponent(component, propsAreEqual);
  };
  
  const createForwardRefComponent = async (component) => {
    return await reactUtils.createForwardRefComponent(component);
  };
  
  const createOptimizedContext = async (defaultValue) => {
    return await reactUtils.createOptimizedContext(defaultValue);
  };
  
  const createOptimizedHook = (hookFunction) => {
    return reactUtils.createOptimizedHook(hookFunction);
  };
  
  const createErrorBoundary = async (fallback) => {
    return await reactUtils.createErrorBoundary(fallback);
  };
  
  const createLoadingComponent = async (loadingComponent) => {
    return await reactUtils.createLoadingComponent(loadingComponent);
  };
  
  const createRetryComponent = async (maxRetries) => {
    return await reactUtils.createRetryComponent(maxRetries);
  };
  
  return {
    createLazyElement,
    createMemoizedComponent,
    createForwardRefComponent,
    createOptimizedContext,
    createOptimizedHook,
    createErrorBoundary,
    createLoadingComponent,
    createRetryComponent,
    hooks: hookUtils,
    render: renderUtils
  };
};
