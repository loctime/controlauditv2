import HomeIcon from '@mui/icons-material/Home';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ChecklistIcon from '@mui/icons-material/Checklist';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import PersonIcon from '@mui/icons-material/Person';

export const menuItems = [
    {
        id: "dashboard",
        path: "/dashboard",
        title: "Panel de Control",
        Icon: HomeIcon
    },
    {
        id: "home",
        path: "/",
        title: "Inicio",
        Icon: HomeIcon
    },
    {
        id: "auditoria",
        path: "/auditoria",
        title: "Auditoría",
        Icon: ChecklistIcon
    },
    {
        id: "formularios",
        path: "/formulario",
        title: "Formularios",
        Icon: FormatListBulletedOutlinedIcon
    },
    {
        id: "editar-formulario",
        path: "/editar",
        title: "Editar Formulario",
        Icon: FormatListBulletedOutlinedIcon
    },
    {
        id: "establecimiento",
        path: "/establecimiento",
        title: "Establecimientos",
        Icon: BusinessIcon
    },
    {
        id: "sucursal",
        path: "/sucursales",
        title: "Sucursales",
        Icon: BusinessIcon
    },
    {
        id: "reporte",
        path: "/reporte",
        title: "Reporte",
        Icon: PictureAsPdfIcon
    },
    {
        id: "usuarios",
        path: "/usuarios",
        title: "Usuarios",
        Icon: BadgeOutlinedIcon
    },
    {
        id: "perfil",
        path: "/perfil",
        title: "Mi Perfil",
        Icon: PersonIcon
    }
];
