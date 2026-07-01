export const fmt = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;
export const fmtNum = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));
export const formatDateDisplay = (date: string) => date.split("-").reverse().join("/");
