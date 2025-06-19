import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { createClient } from '@supabase/supabase-js';
import { ApexOptions } from 'apexcharts';

const supabase = createClient(
    import.meta.env.VITE_REACT_APP_SUPABASE_URL,
    import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY
);

interface Props {
    isDark: boolean;
    isRtl: boolean;
}

const TransactionChart: React.FC<Props> = ({ isDark, isRtl }) => {
    const [topUpData, setTopUpData] = useState<number[]>(Array(12).fill(0));
    const [debitData, setDebitData] = useState<number[]>(Array(12).fill(0));
    const [totalTopUps, setTotalTopUps] = useState<number>(0);
    const [totalDebits, setTotalDebits] = useState<number>(0);

    useEffect(() => {
        const fetchTransactions = async () => {
            const { data, error } = await supabase
                .from('native_transactions')
                .select('amount, type, created_at');

            if (error) {
                console.error('Error fetching transactions:', error);
                return;
            }

            const currentYear = new Date().getFullYear();
            const topUps = Array(12).fill(0);
            const debits = Array(12).fill(0);
            let totalUp = 0;
            let totalDown = 0;

            data.forEach((txn) => {
                const date = new Date(txn.created_at);
                if (date.getFullYear() !== currentYear) return;

                const month = date.getMonth();
                const amt = parseFloat(txn.amount || '0');

                if (txn.type === 'Top Up') {
                    topUps[month] += amt;
                    totalUp += amt;
                } else {
                    debits[month] += amt;
                    totalDown += amt;
                }
            });

            setTopUpData(topUps);
            setDebitData(debits);
            setTotalTopUps(totalUp);
            setTotalDebits(totalDown);
        };

        fetchTransactions();
    }, []);

    const chartOptions: ApexOptions = {
        chart: {
            height: 325,
            type: 'area',
            fontFamily: 'Nunito, sans-serif',
            zoom: { enabled: false },
            toolbar: { show: false },
        },
        colors: ['#28a745', '#dc3545'],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            labels: {
                style: {
                    fontSize: '12px',
                },
            },
        },
        yaxis: {
            labels: {
                formatter: (value: number) => `Rs ${value.toLocaleString()}`,
                style: {
                    fontSize: '12px',
                },
            },
            opposite: isRtl,
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '14px',
        },
        tooltip: {
            x: { show: false },
            y: {
                formatter: (value: number) => `Rs ${value.toLocaleString()}`,
            },
        },
        fill: {
            type: 'gradient',
            gradient: {
                opacityFrom: isDark ? 0.2 : 0.3,
                opacityTo: 0.05,
                stops: [0, 100],
            },
        },
        grid: {
            borderColor: isDark ? '#191E3A' : '#E0E6ED',
            strokeDashArray: 5,
        },
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold dark:text-[#32a8a4]">Top-Ups & Debits This Year</h2>
                <div className="text-right">
                    <p className="text-md font-bold text-green-600 dark:text-green-400">
                        Total Top-Ups: Rs {totalTopUps.toLocaleString()}
                    </p>
                    <p className="text-md font-bold text-red-600 dark:text-red-400">
                        Total Debits: Rs {totalDebits.toLocaleString()}
                    </p>
                </div>
            </div>
            <ReactApexChart
                type="area"
                height={325}
                options={chartOptions}
                series={[
                    { name: 'Top-Ups', data: topUpData },
                    { name: 'Debits', data: debitData },
                ]}
            />
        </div>
    );
};

export default TransactionChart;
