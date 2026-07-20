
import React, { useState } from "react";
import { omcDebtors } from "../services/api";

interface DebtorForm {
  name: string;
  contact: string;
  amount: string;
}

const initialForm: DebtorForm = {
  name: "",
  contact: "",
  amount: "",
};

const AddDebtorPage: React.FC = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<DebtorForm>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = () => {
    const errs: Partial<DebtorForm> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.contact.trim()) errs.contact = "Contact is required";
    if (!form.amount.trim() || isNaN(Number(form.amount))) errs.amount = "Valid amount required";
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setSuccess(false);
      return;
    }
    setLoading(true);
    setApiError(null);
    const res = await omcDebtors.add({
      name: form.name,
      contact: form.contact,
      amount: Number(form.amount),
    });
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      setForm(initialForm);
    } else {
      setApiError(res.error || "Failed to add debtor");
      setSuccess(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Debtor</h2>
        {success && (
          <div className="mb-4 text-green-600 text-center">Debtor added successfully!</div>
        )}
        {apiError && (
          <div className="mb-4 text-red-600 text-center">{apiError}</div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Name
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.name ? 'border-red-500' : ''}`}
            id="name"
            name="name"
            type="text"
            placeholder="Debtor Name"
            value={form.name}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contact">
            Contact
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.contact ? 'border-red-500' : ''}`}
            id="contact"
            name="contact"
            type="text"
            placeholder="Contact Info"
            value={form.contact}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Amount
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.amount ? 'border-red-500' : ''}`}
            id="amount"
            name="amount"
            type="number"
            placeholder="Amount Owed"
            value={form.amount}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Debtor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDebtorPage;
