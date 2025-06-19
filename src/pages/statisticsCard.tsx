import React, { useEffect, useState } from 'react';
import IconNotes from '../components/Icon/IconUsers';
import { createClient } from '@supabase/supabase-js';
import { Download } from '@mui/icons-material';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DashboardSummary: React.FC = () => {
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData?.user?.email) {
                    console.error('User not authenticated:', authError);
                    return;
                }

                const { data: users, error } = await supabase.from('native_users').select('amount');

                if (error) {
                    console.error('Error fetching users:', error);
                    return;
                }

                setTotalUsers(users.length);
                const total = users.reduce((acc, user) => acc + parseFloat(user.amount || 0), 0);
                setTotalAmount(total);
            } catch (err) {
                console.error('Fetch error:', err);
            }
        };

        fetchSummary();
    }, []);

    const handleExportTransactions = async () => {
        try {
            const { data: txns, error } = await supabase
                .from('native_transactions')
                .select('id, amount, type, created_at, user');

            if (error) {
                console.error('Error fetching transactions:', error);
                Swal.fire('Error', 'Could not load transactions.', 'error');
                return;
            }

            const { data: users, error: userError } = await supabase
                .from('native_users')
                .select('id, fname, lname');

            if (userError) {
                console.error('Error fetching users:', userError);
                Swal.fire('Error', 'Could not load user info.', 'error');
                return;
            }

            const userMap: Record<string, string> = {};
            users.forEach(u => {
                userMap[u.id] = `${u.fname} ${u.lname}`;
            });

            const doc = new jsPDF();

            doc.text('Transaction Report', 14, 15);
            doc.setFontSize(11);

            const tableData = txns.map((txn, index) => [
                index + 1,
                userMap[txn.user] || 'Unknown',
                `Rs ${txn.amount}`,
                txn.type,
                new Date(txn.created_at).toLocaleString(),
            ]);

            (doc as any).autoTable({
                startY: 20,
                head: [['#', 'User', 'Amount', 'Type', 'Date']],
                body: tableData,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [50, 168, 164] },
            });

            doc.save('transaction_report.pdf');
        } catch (err) {
            console.error('Export error:', err);
            Swal.fire('Error', 'Failed to export transactions.', 'error');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            {/* Total Users */}
            <div className="panel flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                    <div className="text-lg font-bold mb-2 dark:text-[#32a8a4]">Total Users</div>
                    <div className="dark:text-[#32a8a4] text-4xl">{totalUsers}</div>
                </div>
                <IconNotes className="dark:text-[#32a8a4] opacity-80 w-24 h-24" />
            </div>

            {/* Total Amount in System */}
            <div className="panel flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                    <div className="text-lg font-bold mb-2 dark:text-[#32a8a4]">Total Amount in System</div>
                    <div className="dark:text-[#32a8a4] text-4xl">Rs {totalAmount.toFixed(2)}</div>
                </div>
                <div className="dark:text-[#32a8a4] opacity-80 text-6xl">RS</div>
            </div>
            {/* Export Transactions */}
            <div className="panel flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <div>
                    <div className="text-lg font-bold mb-4 dark:text-[#32a8a4]">Transaction Report</div>
                    <button
                        className="btn btn-outline-primary flex items-center gap-2 mx-auto"
                        onClick={handleExportTransactions}
                    >
                        <Download />
                        Export
                    </button>
                </div>
            </div>

        </div>
    );
};

export default DashboardSummary;
