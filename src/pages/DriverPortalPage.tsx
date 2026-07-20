import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import OrderCard from '../components/OrderCard';
import { KeyRound, CheckCircle2, Copy, Loader2, AlertCircle, Send } from 'lucide-react';

export default function DriverPortalPage() {
  const { user } = useAuth();
  const { orders, generateOtpForOrder, isLoading, error } = useOrders();
  const [generatedOtps, setGeneratedOtps] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [smsSuccess, setSmsSuccess] = useState<string | null>(null);

  // Driver user - filter orders assigned to this driver
  const driverProfile = user;

  if (!driverProfile) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Driver Portal</h1>
        </div>
        <p>No driver profile is linked to this account.</p>
      </div>
    );
  }

  // Orders are already filtered by backend for driver role
  const myOrders = orders;
  const activeOrders = myOrders.filter(o => ['pending', 'approved', 'dispensing'].includes(o.status));

  // Orders with status "approved" are "Active" — driver can generate OTP
  const approvedOrders = activeOrders.filter(o => o.status === 'approved');
  const pendingOrders = activeOrders.filter(o => o.status === 'pending');

  const handleGenerateOtp = async (orderId: string) => {
    setGeneratingId(orderId);
    setOtpError(null);
    setSmsSuccess(null);
    try {
      const result = await generateOtpForOrder(orderId, true); // Always send SMS
      if (result) {
        setGeneratedOtps(prev => ({ ...prev, [orderId]: result.otp }));
        setSmsSuccess('OTP sent via SMS!');
        setTimeout(() => setSmsSuccess(null), 3000);
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to generate OTP');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleResendSms = async (orderId: string) => {
    setResendingId(orderId);
    setOtpError(null);
    setSmsSuccess(null);
    try {
      const result = await generateOtpForOrder(orderId, true);
      if (result) {
        setSmsSuccess('SMS resent successfully!');
        setTimeout(() => setSmsSuccess(null), 3000);
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to resend SMS');
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyOtp = (orderId: string, otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome, {driverProfile.name || 'Driver'}</h1>
          <p className="text-muted">Your fuel orders and OTP generation</p>
        </div>
      </div>

      {(error || otpError) && (
        <div className="error-message" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          {error || otpError}
        </div>
      )}

      {smsSuccess && (
        <div className="success-message" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-success-bg, #d4edda)', color: 'var(--color-success, #155724)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
          <CheckCircle2 size={16} />
          {smsSuccess}
        </div>
      )}

      {isLoading ? (
        <div className="loading-state" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <>
          {/* Active Orders (approved) — can generate OTP */}
          {approvedOrders.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 style={{ color: 'var(--color-success)' }}>Active Orders — Ready for OTP</h2>
              </div>
              <div className="orders-list">
                {approvedOrders.map(order => {
                  const existingOtp = order.otp || generatedOtps[order.id];
                  const hasOtp = !!existingOtp && order.otpActive;
                  const isGenerating = generatingId === order.id;
                  const isResending = resendingId === order.id;

                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      showOtp={hasOtp}
                      actions={
                        <div className="manager-actions">
                          {hasOtp ? (
                            <div style={{ width: '100%' }}>
                              <div className="otp-display" style={{ width: '100%', marginBottom: '0.5rem' }}>
                                <KeyRound size={24} />
                                <div>
                                  <span className="otp-display-label">Your OTP Code</span>
                                  <span className="otp-display-value">{existingOtp}</span>
                                </div>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleCopyOtp(order.id, existingOtp!)}
                                >
                                  {copiedId === order.id ? <><CheckCircle2 size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                                </button>
                              </div>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleResendSms(order.id)}
                                disabled={isResending}
                                style={{ width: '100%' }}
                              >
                                {isResending ? (
                                  <><Loader2 size={14} className="animate-spin" /> Sending...</>
                                ) : (
                                  <><Send size={14} /> Resend SMS</>
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-primary btn-lg"
                              onClick={() => handleGenerateOtp(order.id)}
                              disabled={isGenerating}
                              style={{ width: '100%' }}
                            >
                              {isGenerating ? (
                                <><Loader2 size={18} className="animate-spin" /> Generating...</>
                              ) : (
                                <><KeyRound size={18} /> Generate OTP</>
                              )}
                            </button>
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2>Pending Orders</h2>
              </div>
              <p className="text-muted" style={{ marginBottom: '1rem' }}>
                These orders are awaiting OMC approval. OTP generation will be available once approved.
              </p>
              <div className="orders-list">
                {pendingOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {activeOrders.length === 0 && (
            <div className="empty-state">
              <KeyRound size={48} />
              <h3>No Active Orders</h3>
              <p>You don't have any active orders assigned to you.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
