export const SIDEBAR_COLLAPSE_STORAGE_KEY = "enquiva.sidebar.collapsed";
export const SIDEBAR_WIDTH_EXPANDED = "16rem";
export const SIDEBAR_WIDTH_COLLAPSED = "4.5rem";
export const SIDEBAR_WIDTH_CSS_VAR = "--dashboard-sidebar-width";

export const SIDEBAR_COLLAPSE_BOOT_SCRIPT = `try{var c=localStorage.getItem("${SIDEBAR_COLLAPSE_STORAGE_KEY}")==="true";document.documentElement.style.setProperty("${SIDEBAR_WIDTH_CSS_VAR}",c?"${SIDEBAR_WIDTH_COLLAPSED}":"${SIDEBAR_WIDTH_EXPANDED}");document.documentElement.dataset.sidebarCollapsed=c?"true":"false";}catch(e){}`;

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(collapsed));
  } catch {
    // ignore quota / private mode
  }
}

export function applySidebarCollapsedWidth(collapsed: boolean): void {
  const root = document.documentElement;
  root.style.setProperty(
    SIDEBAR_WIDTH_CSS_VAR,
    collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
  );
  root.dataset.sidebarCollapsed = collapsed ? "true" : "false";
}
