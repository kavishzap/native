import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import topupImg from '../../images/topup.png';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TopUpUser = () => {
     const dispatch = useDispatch();
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [topUpAmount, setTopUpAmount] = useState('');
    const [currentBalance, setCurrentBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Top up'));
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUserId) fetchCurrentBalance();
        else setCurrentBalance(null);
    }, [selectedUserId]);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('native_users')
            .select('id, fname, lname')
            .order('fname', { ascending: true });

        if (error) {
            console.error('Error fetching users:', error);
            Swal.fire('Error', 'Could not fetch users', 'error');
            return;
        }

        setUsers(data);
    };

    const fetchCurrentBalance = async () => {
        const { data, error } = await supabase
            .from('native_users')
            .select('amount')
            .eq('id', selectedUserId)
            .single();

        if (error) {
            console.error('Error fetching balance:', error);
            setCurrentBalance(null);
            return;
        }

        setCurrentBalance(parseFloat(data.amount));
    };

    const handleTopUp = async () => {
        if (!selectedUserId || !topUpAmount || isNaN(Number(topUpAmount))) {
            Swal.fire('Invalid Input', 'Please select a user and enter a valid amount.', 'warning');
            return;
        }

        const confirm = await Swal.fire({
            title: 'Confirm Top-Up',
            html: `Top up <strong>${topUpAmount}</strong> to this user's account?<br/>Current Balance: <strong>${currentBalance}</strong>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Top Up',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#ef4444',
        });

        if (!confirm.isConfirmed) return;

        setLoading(true);

        const updatedAmount = (currentBalance ?? 0) + parseFloat(topUpAmount);

        // 1. Update user balance
        const { error: updateError } = await supabase
            .from('native_users')
            .update({ amount: updatedAmount })
            .eq('id', selectedUserId);

        if (updateError) {
            setLoading(false);
            console.error('Top-up error:', updateError);
            Swal.fire('Error', 'Failed to top-up user.', 'error');
            return;
        }

        // 2. Log in transaction table
        const { error: insertError } = await supabase.from('native_transactions').insert([
            {
                user: selectedUserId,
                amount: parseFloat(topUpAmount),
                type: 'Top Up',
            },
        ]);

        setLoading(false);

        if (insertError) {
            console.error('Transaction log error:', insertError);
            Swal.fire('Partial Success', 'Top-up succeeded but transaction log failed.', 'warning');
            return;
        }

        Swal.fire('Success', `User account topped up successfully! New balance: ${updatedAmount}`, 'success');
        setTopUpAmount('');
        setSelectedUserId('');
        setCurrentBalance(null);
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mt-10">
            <h2 className="text-xl font-bold mb-4 text-center">Top-Up User</h2>
            {/* Image */}
            <div className="flex justify-center mb-6">
                <img src={topupImg} alt="Top Up" className="w-32 h-auto" />
            </div>
            <div className="mb-4">
                <label htmlFor="user" className="block mb-1 font-medium text-sm">Select User</label>
                <select
                    id="user"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="form-select w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="">-- Select a user --</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.fname} {user.lname}
                        </option>
                    ))}
                </select>
            </div>

            {currentBalance !== null && (
                <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Current Balance:</span> Rs {currentBalance.toFixed(2)}
                </div>
            )}

            <div className="mb-4">
                <label htmlFor="amount" className="block mb-1 font-medium text-sm">Top-Up Amount</label>
                <input
                    id="amount"
                    type="number"
                    placeholder="Enter amount to top-up"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="form-input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                />
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleTopUp}
                    disabled={loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? 'Processing...' : 'Top-Up'}
                </button>
            </div>
        </div>
    );
};

export default TopUpUser;
function dispatch(arg0: { payload: any; type: "auth/setPageTitle"; }) {
    throw new Error('Function not implemented.');
}

