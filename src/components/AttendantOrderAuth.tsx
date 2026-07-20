import { useState } from 'react';
import AttendantLoginPage from '../pages/AttendantLoginPage';

export default function AttendantOrderAuth({ onAuthenticated }: { onAuthenticated: (attendantId: string) => void }) {
  const [authenticated, setAuthenticated] = useState(false);

  // Simulate login flow
  const handleLogin = (id: string) => {
    setAuthenticated(true);
    onAuthenticated(id);
  };

  return !authenticated ? (
    <AttendantLoginPage onLogin={handleLogin} />
  ) : null;
}
