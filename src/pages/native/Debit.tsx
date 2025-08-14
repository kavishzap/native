import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import debitImg from '../../images/debit.png';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DebitUser = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Scanner UI state
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState('');

  // html5-qrcode refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false); // lock so we handle only once

  useEffect(() => {
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
    setUsers(data || []);
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

  const handleDebit = async () => {
    if (!selectedUserId || !debitAmount || isNaN(Number(debitAmount))) {
      Swal.fire('Invalid Input', 'Please select a user and enter a valid amount.', 'warning');
      return;
    }

    const amountToDebit = parseFloat(debitAmount);
    if ((currentBalance ?? 0) < amountToDebit) {
      Swal.fire('Insufficient Balance', 'Cannot debit more than current balance.', 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Confirm Debit',
      html: `Debit <strong>${debitAmount}</strong> from this user's account?<br/>Current Balance: <strong>${currentBalance}</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Debit',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    const updatedAmount = (currentBalance ?? 0) - amountToDebit;

    // 1. Update user balance
    const { error: updateError } = await supabase
      .from('native_users')
      .update({ amount: updatedAmount })
      .eq('id', selectedUserId);

    if (updateError) {
      setLoading(false);
      console.error('Debit error:', updateError);
      Swal.fire('Error', 'Failed to debit user.', 'error');
      return;
    }

    // 2. Log the transaction
    const { error: insertError } = await supabase.from('native_transactions').insert([
      {
        user: selectedUserId,
        amount: amountToDebit,
        type: 'Debit',
      },
    ]);

    setLoading(false);

    if (insertError) {
      console.error('Transaction log error:', insertError);
      Swal.fire('Partial Success', 'Debit succeeded but transaction log failed.', 'warning');
      return;
    }

    Swal.fire('Success', `User account debited successfully. New balance: ${updatedAmount}`, 'success');
    setDebitAmount('');
    setSelectedUserId('');
    setCurrentBalance(null);
  };

  // ---- QR Scanner control ----
  const startScanner = async () => {
    // Full reset so old info doesn't stick around
    setSelectedUserId('');
    setCurrentBalance(null);
    setScanError('');
    isScanningRef.current = false;

    try {
      const elementId = 'qr-reader';
      // Ensure any previous instance is stopped/cleared
      await stopScanner();

      scannerRef.current = new Html5Qrcode(elementId, /* verbose= */ false);

      // Prefer back camera; fallback to first camera
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setScanError('No camera found.');
        return;
      }
      const backCam =
        devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[0];

      const config = {
        fps: 20,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        disableFlip: false,
      } as any;

      await scannerRef.current.start(
        { deviceId: { exact: backCam.id } },
        config,
        onScanSuccess,
        onScanError
      );
    } catch (err: any) {
      console.error(err);
      setScanError(err?.message || 'Failed to start scanner.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // ignore
      } finally {
        scannerRef.current = null;
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isScanningRef.current) return; // lock
    isScanningRef.current = true;

    try {
      const scannedId = (decodedText || '').trim();
      if (!scannedId) {
        setScanError('Empty QR.');
        return;
      }

      // Stop camera immediately for speed and to avoid duplicate events
      await stopScanner();
      setShowScanner(false);

      const { data, error } = await supabase
        .from('native_users')
        .select('id, fname, lname')
        .eq('id', scannedId)
        .single();

      if (error || !data) {
        setScanError('User not found for scanned QR code.');
        await Swal.fire('Error', 'User not found for scanned QR code.', 'error');
        return;
      }

      setSelectedUserId(data.id);
      await Swal.fire('User Selected', `Scanned user: ${data.fname} ${data.lname}`, 'success');
    } catch (err) {
      console.error(err);
      setScanError('Failed to process QR.');
    } finally {
      // release for next open
      isScanningRef.current = false;
    }
  };

  const onScanError = (_errorMessage: string) => {
    // Ignore continuous decode errors; only surface fatal issues via setScanError when starting
  };

  useEffect(() => {
    // When toggling scanner on/off, manage lifecycle
    if (showScanner) {
      startScanner();
    } else {
      stopScanner();
    }
    // Cleanup on unmount
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScanner]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mt-10">
      <h2 className="text-xl font-bold mb-4 text-center">Debit User Account</h2>

      {/* Image */}
      <div className="flex justify-center mb-6">
        <img src={debitImg} alt="Debit" className="w-32 h-auto" />
      </div>

      {/* Mode selection */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          className={`btn ${!showScanner ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setShowScanner(false)}
        >
          Select User
        </button>
        <button
          className={`btn ${showScanner ? 'btn-secondary' : 'btn-outline-secondary'}`}
          onClick={() => setShowScanner(true)}
        >
          Scan QR Code
        </button>
      </div>

      {/* QR Scanner */}
      {showScanner && (
        <div className="mb-4">
          <div id="qr-reader" className="w-full rounded-md overflow-hidden border border-gray-300 dark:border-gray-700" />
          {scanError && <p className="text-red-500 text-sm mt-2">{scanError}</p>}
          <div className="mt-3 flex gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={async () => {
                // Manual rescan: clear and restart immediately (no stale info)
                await stopScanner();
                await startScanner();
              }}
            >
              Rescan
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={() => setShowScanner(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Manual selection */}
      {!showScanner && (
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
      )}

      {currentBalance !== null && (
        <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Current Balance:</span> Rs {currentBalance.toFixed(2)}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="amount" className="block mb-1 font-medium text-sm">Debit Amount</label>
        <input
          id="amount"
          type="number"
          placeholder="Enter amount to debit"
          value={debitAmount}
          onChange={(e) => setDebitAmount(e.target.value)}
          className="form-input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleDebit}
          disabled={loading}
          className="btn btn-danger w-full"
        >
          {loading ? 'Processing...' : 'Debit'}
        </button>
      </div>
    </div>
  );
};

export default DebitUser;
