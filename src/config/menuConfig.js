    import HomeIcon from '@mui/icons-material/Home';
    import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
    import ChecklistIcon from '@mui/icons-material/Checklist';
    import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
    import BusinessIcon from '@mui/icons-material/Business';
    import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
    import PersonIcon from '@mui/icons-material/Person';
    import SettingsIcon from '@mui/icons-material/Settings';
    import AnalyticsIcon from '@mui/icons-material/Analytics';
    import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
    import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
    import PeopleIcon from '@mui/icons-material/People';
    import SchoolIcon from '@mui/icons-material/School';
    import ReportProblemIcon from '@mui/icons-material/ReportProblem';
    import HealingIcon from '@mui/icons-material/Healing';

    export const MENU_ITEMS = [
    {
        id: "dashboard",
        label: "Panel de Control",
        path: "/dashboard",
        icon: HomeIcon,
        rolesPermitidos: ['supermax'],
        location: 'sidebar',
    },
    {
        id: "cliente-dashboard",
        label: "Calendario",
        path: "/cliente-dashboard",
        icon: CalendarTodayIcon,
        rolesPermitidos: ['admin'],
        location: 'navbar',
    },
    {
        id: "operario-dashboard",
        label: "Mi Dashboard",
        path: "/operario-dashboard",
        icon: HomeIcon,
        rolesPermitidos: ['operario'],
        location: 'navbar',
    },
    {
        id: "auditoria",
        label: "Auditoría",
        path: "/auditoria",
        icon: ChecklistIcon,
        rolesPermitidos: ['supermax', 'admin', 'operario'],
        permisoRequerido: 'puedeCrearAuditorias',
        location: 'navbar',
    },
    {
        id: "reporte",
        label: "Reporte",
        path: "/reporte",
        icon: PictureAsPdfIcon,
        rolesPermitidos: ['supermax', 'admin', 'operario'],
        permisoRequerido: 'puedeCrearAuditorias',
        location: 'navbar',
    },
    {
        id: "dashboard-seguridad",
        label: "Dashboard",
        path: "/dashboard-seguridad",
        icon: HealthAndSafetyIcon,
        rolesPermitidos: ['supermax', 'admin'],
        grupo: 'higiene',
        location: 'navbar',
    },
    {
        id: "capacitaciones",
        label: "Capacitaciones",
        path: "/capacitaciones",
        icon: SchoolIcon,
        rolesPermitidos: ['supermax', 'admin'],
        grupo: 'higiene',
        location: 'navbar',
    },
    {
        id: "accidentes",
        label: "Accidentes",
        path: "/accidentes",
        icon: ReportProblemIcon,
        rolesPermitidos: ['supermax', 'admin'],
        grupo: 'higiene',
        location: 'navbar',
    },
    {
        id: "salud-ocupacional",
        label: "Salud ocupacional",
        path: "/salud-ocupacional",
        icon: HealingIcon,
        rolesPermitidos: ['supermax', 'admin'],
        grupo: 'higiene',
        location: 'navbar',
    },
    {
        id: "establecimiento",
        label: "Establecimiento",
        path: "/establecimiento",
        icon: BusinessIcon,
        rolesPermitidos: ['supermax', 'admin'],
        permisoRequerido: 'puedeCrearEmpresas',
        grupo: 'empresarial',
        location: 'navbar',
    },
    {
        id: "empleados",
        label: "Empleados",
        path: "/empleados",
        icon: PeopleIcon,
        rolesPermitidos: ['supermax', 'admin'],
        grupo: 'empresarial',
        location: 'navbar',
    },
    {
        id: "formularios",
        label: "Formularios",
        path: "/editar",
        icon: FormatListBulletedOutlinedIcon,
        rolesPermitidos: ['supermax', 'admin'],
        location: 'sidebar',
    },
    {
        id: "usuarios",
        label: "Logs de Usuarios",
        path: "/usuarios/logs",
        icon: BadgeOutlinedIcon,
        rolesPermitidos: ['supermax', 'admin'],
        permisoRequerido: 'puedeGestionarUsuarios',
        location: 'sidebar',
    },
    {
        id: "configuracion",
        label: "Configuración",
        path: "/configuracion",
        icon: SettingsIcon,
        rolesPermitidos: ['supermax'],
        permisoRequerido: 'puedeGestionarSistema',
        location: 'sidebar',
    },
    {
        id: "perfil",
        label: "Perfil",
        path: "/perfil",
        icon: PersonIcon,
        rolesPermitidos: ['supermax', 'admin', 'operario'],
        location: 'sidebar',
    },
    ];

    export const getMenuItemsForRole = (role, permisos = {}) => {
    if (!role) return [];
    
    return MENU_ITEMS.filter(item => {
        if (!item.rolesPermitidos.includes(role)) {
        return false;
        }
        
        if (item.permisoRequerido) {
        const tienePermiso = permisos[item.permisoRequerido] === true;
        const esSupermax = role === 'supermax';
        const esAdmin = role === 'admin';
        
        if (item.permisoRequerido === 'puedeCrearAuditorias') {
            return tienePermiso || esAdmin || esSupermax;
        }
        if (item.permisoRequerido === 'puedeCrearEmpresas') {
            return tienePermiso || esAdmin || esSupermax;
        }
        if (item.permisoRequerido === 'puedeGestionarUsuarios') {
            return tienePermiso || esAdmin || esSupermax;
        }
        if (item.permisoRequerido === 'puedeGestionarSistema') {
            return tienePermiso || esSupermax;
        }
        
        return tienePermiso;
        }
        
        return true;
    });
    };

    export const getMenuItemsGrouped = (role, permisos = {}) => {
    const items = getMenuItemsForRole(role, permisos);
    const grupos = {
        higiene: [],
        empresarial: [],
        otros: []
    };
    
    items.forEach(item => {
        if (item.grupo === 'higiene') {
        grupos.higiene.push(item);
        } else if (item.grupo === 'empresarial') {
        grupos.empresarial.push(item);
        } else {
        grupos.otros.push(item);
        }
    });
    
    return grupos;
    };

    export const getNavbarItems = (role, permisos = {}) => {
    const items = getMenuItemsForRole(role, permisos);
    const navbarItems = {
        simple: [],
        higiene: [],
        empresarial: []
    };
    
    items.forEach(item => {
        if (item.location === 'navbar') {
        if (item.grupo === 'higiene') {
            navbarItems.higiene.push(item);
        } else if (item.grupo === 'empresarial') {
            navbarItems.empresarial.push(item);
        } else {
            navbarItems.simple.push(item);
        }
        }
    });
    
    return navbarItems;
    };

    export const getSidebarItems = (role, permisos = {}) => {
    const items = getMenuItemsForRole(role, permisos);
    return items.filter(item => item.location === 'sidebar');
    };
