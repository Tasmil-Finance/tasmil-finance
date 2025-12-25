type User = {
  name: string;
  email: string;
  avatar: string;
};

type Header = {
  logo_url: string;
  brand_name: string;
  tagline: string;
};

type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
};

type NavLink = BaseNavItem & {
  url: string;
  items?: never;
};

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: string })[];
  url?: never;
};

type NavItem = NavCollapsible | NavLink;

type NavGroup = {
  title?: string;
  items: NavItem[];
};

type SidebarData = {
  user: User;
  header: Header;
  navGroups: NavGroup[];
};

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink };
