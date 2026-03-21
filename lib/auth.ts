export const AUTH_COOKIE_NAME = "nexu_session";

export function formatUserLabel(email: string) {
  const [name] = email.split("@");

  return name
    .split(".")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
