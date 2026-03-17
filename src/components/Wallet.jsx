import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { walletService } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet as WalletIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Building,
    CreditCard,
    ChevronRight,
    DollarSign
} from 'lucide-react';

const Wallet = () => {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showWithdrawForm, setShowWithdrawForm] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', accountName: '' });
    const [withdrawing, setWithdrawing] = useState(false);
    const auth = getAuth();

    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubscribe = walletService.getWallet(auth.currentUser.uid, (data) => {
            setWallet(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth.currentUser]);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
        if (Number(withdrawAmount) > wallet.availableBalance) {
            alert("Insufficient balance");
            return;
        }

        setWithdrawing(true);
        try {
            await walletService.requestWithdrawal(auth.currentUser.uid, Number(withdrawAmount), bankDetails);
            alert("Withdrawal request submitted successfully!");
            setShowWithdrawForm(false);
            setWithdrawAmount('');
        } catch (error) {
            alert(error.message || "Withdrawal failed");
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) return (
        <div className="p-12 text-center">
            <div className="loading-spinner mx-auto mb-4" />
            <p className="text-light">Loading your wallet...</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-8">
            {/* Top Row: Balance Cards */}
            <div className="grid gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

                {/* Available Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
                        color: 'white',
                        border: 'none',
                        borderRadius: '24px',
                        padding: '1.5rem'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                            <WalletIcon size={24} />
                        </div>
                        <span className="text-xs fw-bold uppercase tracking-widest opacity-80">Available to Withdraw</span>
                    </div>
                    <h1 className="m-0 mb-2">₦{Number(wallet.availableBalance || 0).toLocaleString()}</h1>
                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={() => setShowWithdrawForm(true)}
                            className="btn bg-white text-primary border-none fw-bold px-6 py-2 shadow-sm hover:shadow-md transition-all"
                            style={{ borderRadius: '12px' }}
                        >
                            Withdraw Funds
                        </button>
                        <div className="text-[10px] opacity-70 flex flex-col items-end">
                            <span className="fw-bold uppercase">SafeRent Escrow</span>
                            <span>Verified Earnings</span>
                        </div>
                    </div>
                </motion.div>

                {/* Pending & Total */}
                <div className="grid gap-4" style={{ display: 'grid', gridTemplateRows: '1fr 1fr' }}>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card shadow-sm border"
                        style={{ borderRadius: '16px', padding: '1.25rem' }}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-light fw-bold uppercase mb-1">Pending Escrow</p>
                                <h3 className="m-0 text-amber-500">₦{Number(wallet.pendingEscrow || 0).toLocaleString()}</h3>
                            </div>
                            <Clock className="text-amber-500 opacity-20" size={32} />
                        </div>
                        <p className="text-[10px] text-light mt-2 italic">Funds held until student move-in is confirmed.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card shadow-sm border"
                        style={{ borderRadius: '16px', padding: '1.25rem' }}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-light fw-bold uppercase mb-1">Total Lifetime Earnings</p>
                                <h3 className="m-0 text-green-600">₦{Number(wallet.totalEarned || 0).toLocaleString()}</h3>
                            </div>
                            <TrendingUp className="text-green-600 opacity-20" size={32} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Withdrawal Form Modal */}
            <AnimatePresence>
                {showWithdrawForm && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zLayer: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="m-0">Withdraw Funds</h3>
                                <button onClick={() => setShowWithdrawForm(false)} className="btn-close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                            </div>

                            <form onSubmit={handleWithdraw}>
                                <div className="mb-4">
                                    <label className="text-xs fw-bold text-light uppercase mb-2 d-block">Amount to Withdraw</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 fw-bold text-dark">₦</span>
                                        <input
                                            type="number"
                                            className="form-input ps-8"
                                            placeholder="0.00"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-light mt-1">Available: ₦{Number(wallet.availableBalance).toLocaleString()}</p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl border mb-6">
                                    <h5 className="text-xs fw-bold mb-4 flex items-center gap-2"><Building size={14} /> Bank Destination</h5>
                                    <input
                                        type="text"
                                        className="form-input text-sm mb-3"
                                        placeholder="Bank Name (e.g. Zenith Bank)"
                                        value={bankDetails.bankName}
                                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        className="form-input text-sm mb-3"
                                        placeholder="Account Number"
                                        value={bankDetails.accountNumber}
                                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        className="form-input text-sm"
                                        placeholder="Account Name"
                                        value={bankDetails.accountName}
                                        onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-full py-4 text-lg shadow-lg"
                                    disabled={withdrawing}
                                >
                                    {withdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                                </button>
                                <p className="text-center text-[10px] text-light mt-4">
                                    Payouts are processed within 24 hours to your linked bank account.
                                </p>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Transaction History */}
            <div className="flex flex-col gap-4">
                <h4 className="flex items-center gap-2 m-0 mt-4"><ArrowUpRight className="text-primary" /> Recent Activity</h4>
                <div className="card shadow-sm border" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
                    {(!wallet.withdrawals || wallet.withdrawals.length === 0) && wallet.totalEarned === 0 ? (
                        <div className="p-12 text-center text-light">
                            <CreditCard size={48} className="mx-auto opacity-10 mb-4" />
                            <p>No transaction history found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-color)' }}>
                                    <tr>
                                        <th className="p-4 text-xs text-light uppercase fw-bold tracking-wider">Type</th>
                                        <th className="p-4 text-xs text-light uppercase fw-bold tracking-wider">Details</th>
                                        <th className="p-4 text-xs text-light uppercase fw-bold tracking-wider">Amount</th>
                                        <th className="p-4 text-xs text-light uppercase fw-bold tracking-wider">Status</th>
                                        <th className="p-4 text-xs text-light uppercase fw-bold tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(wallet.withdrawals || []).map((wd) => (
                                        <tr key={wd.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-red-500">
                                                    <ArrowUpRight size={16} />
                                                    <span className="text-sm fw-bold">Withdrawal</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs fw-bold">{wd.bankDetails.bankName}</div>
                                                <div className="text-[10px] text-light">{wd.bankDetails.accountNumber}</div>
                                            </td>
                                            <td className="p-4 text-sm fw-bold">-₦{wd.amount.toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className={`text-[10px] fw-bold uppercase px-2 py-1 rounded-full ${wd.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {wd.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-light">
                                                {new Date(wd.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Simplified: Also show some income entries if earnings > 0 */}
                                    {wallet.totalEarned > 0 && (
                                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <ArrowDownLeft size={16} />
                                                    <span className="text-sm fw-bold">Escrow Release</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs fw-bold">Property Booking confirmed</td>
                                            <td className="p-4 text-sm fw-bold text-green-600">+₦{wallet.totalEarned.toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className="text-[10px] fw-bold uppercase px-2 py-1 rounded-full bg-green-100 text-green-700">Completed</span>
                                            </td>
                                            <td className="p-4 text-xs text-light">Lifetime</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wallet;
