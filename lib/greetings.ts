/** Returns Good Morning / Afternoon / Evening based on the user's local time */
export function getTimeBasedGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
