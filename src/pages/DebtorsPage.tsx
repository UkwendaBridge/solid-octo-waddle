
import React, { useEffect, useState } from "react";
import { omcDebtors } from "../services/api";

interface Debtor {
  id: number;
  name: string;
  contact: string;
  amount: number;
}

const DebtorsPage: React.FC = () => {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    omcDebtors.getAll()
      .then(res => {
        if (res.success && res.data) setDebtors(res.data);
        else setError(res.error || "Failed to fetch debtors");
      })
      .catch(() => setError("Failed to fetch debtors"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debtors List</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Contact</th>
              <th className="py-2 px-4 border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            {debtors.map((debtor) => (
              <tr key={debtor.id}>
                <td className="py-2 px-4 border-b">{debtor.name}</td>
                <td className="py-2 px-4 border-b">{debtor.contact}</td>
                <td className="py-2 px-4 border-b">{debtor.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DebtorsPage;
