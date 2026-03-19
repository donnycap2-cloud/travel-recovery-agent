// /lib/time.ts

export function parseLocalTime(time: string | null): number | null {
    if (!time) return null;
  
    const d = new Date(time);
    if (Number.isNaN(d.getTime())) return null;
  
    // 🔥 undo incorrect UTC shift from API
    return d.getTime() + d.getTimezoneOffset() * 60000;
  }
