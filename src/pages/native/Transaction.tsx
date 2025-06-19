import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { Visibility } from '@mui/icons-material';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Transactions = () => {
    const dispatch = useDispatch();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [usersMap, setUsersMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filtered, setFiltered] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        dispatch(setPageTitle('Transactions'));
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        Swal.fire({ title: 'Loading...', didOpen: () => Swal.showLoading() });

        // 1. Get all users and build map
        const { data: users, error: userError } = await supabase
            .from('native_users')
            .select('id, fname, lname');

        if (userError || !users) {
            Swal.close();
            console.error('User fetch error:', userError);
            Swal.fire('Error', 'Could not load users.', 'error');
            return;
        }

        const userMap: Record<string, string> = {};
        users.forEach((u) => {
            userMap[u.id] = `${u.fname} ${u.lname}`;
        });

        setUsersMap(userMap);

        // 2. Get transactions
        const { data: txns, error: txnError } = await supabase
            .from('native_transactions')
            .select('id, amount, type, created_at, user')
            .order('created_at', { ascending: false });

        Swal.close();
        setLoading(false);

        if (txnError) {
            console.error('Transaction fetch error:', txnError);
            Swal.fire('Error', 'Could not load transactions.', 'error');
            return;
        }

        setTransactions(txns);
        setFiltered(txns);
    };

    useEffect(() => {
        const filteredData = transactions.filter((txn) =>
            (usersMap[txn.user] || '')
                .toLowerCase()
                .includes(search.toLowerCase())
        );
        setFiltered(filteredData);
        setCurrentPage(1);
    }, [search, transactions, usersMap]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl">Transactions</h2>
                <input
                    type="text"
                    placeholder="Search by user name"
                    className="form-input py-2 w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="mt-5 panel p-0 border-0 overflow-x-auto">
                {loading ? (
                    <p className="text-center py-5">Loading...</p>
                ) : paginated.length === 0 ? (
                    <p className="text-center py-5">No transactions found.</p>
                ) : (
                    <table className="table-striped table-hover w-full">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Type</th>
                                 <th>Amount</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((txn) => (
                                <tr key={txn.id}>
                                    <td>{usersMap[txn.user] || 'Unknown'}</td>
                                   
                                    <td>
                                        <button
                                            className={`
                        ${txn.type === 'Top Up' ? 'btn btn-sm btn-outline-success' : 'btn btn-sm btn-outline-danger'}`}
                                        >
                                            {txn.type}
                                        </button>
                                    </td>
                                     <td>Rs {txn.amount}</td>
                                    <td>{new Date(txn.created_at).toLocaleString()}</td>
                                    <td className="text-center">
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() =>
                                                Swal.fire({
                                                    title: 'Transaction Details',
                                                    html: `
                <strong>User:</strong> ${usersMap[txn.user] || 'Unknown'}<br/>
                <strong>Amount:</strong> Rs ${txn.amount}<br/>
                <strong>Type:</strong> ${txn.type}<br/>
                <strong>Date:</strong> ${new Date(txn.created_at).toLocaleString()}
            `,
                                                    icon: 'info',
                                                    confirmButtonColor: '#2563eb',
                                                })
                                            }
                                        >
                                            <Visibility fontSize="small" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                )}
            </div>

            <div className="mt-4 flex justify-center gap-4">
                <button
                    className="btn btn-sm btn-primary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    Prev
                </button>
                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    className="btn btn-sm btn-primary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Transactions;
