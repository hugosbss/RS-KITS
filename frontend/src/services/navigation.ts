/** Native navigation is used where the desktop must reload its local page. */
export function navigateTo(path: string) {
  window.location.assign(path);
}
export function replaceLocation(path: string) {
  window.location.replace(path);
}
