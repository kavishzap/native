import { useState, useEffect, Fragment, useCallback, useRef, forwardRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconSearch from '../../components/Icon/IconSearch';
import IconX from '../../components/Icon/IconX';
import IconPlus from '../../components/Icon/IconPlus';
import { Visibility, Delete, Share } from '@mui/icons-material';
import { createClient } from '@supabase/supabase-js';
import * as htmlToImage from 'html-to-image';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** -------- Share Card (Professional look) -------- */
interface ShareCardProps {
    user: {
        id: string;
        fname: string;
        lname: string;
        email: string;
        phone: string;
        nic: string;
    };
    qrPayload: string; // what to encode in QR (we use user.id)
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ user, qrPayload }, ref) => {
    const qrRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (qrRef.current) {
            QRCode.toCanvas(qrRef.current, qrPayload || String(user.id), {
                margin: 1,
                width: 240,
                errorCorrectionLevel: 'M',
            });
        }
    }, [qrPayload, user?.id]);

    return (
        <div
            ref={ref as any}
            style={{
                width: 1000,
                padding: 32,
                background: 'linear-gradient(135deg, #0b1020 0%, #121a33 60%, #101827 100%)',
                color: '#e5e7eb',
                fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, 'Helvetica Neue', Arial",
                borderRadius: 24,
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'linear-gradient(160deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 700,
                        letterSpacing: 1,
                    }}
                >
                    NL
                </div>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: '#fff' }}>Native Lodge — Activation Card</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Verified member pass</div>
                </div>
                <div style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 12 }}>ID: {user?.id}</div>
            </div>

            {/* Body */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 260px',
                    gap: 24,
                    alignItems: 'stretch',
                }}
            >
                {/* Left: details */}
                <div
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 20,
                        padding: 20,
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '180px 1fr',
                            rowGap: 12,
                            columnGap: 12,
                            fontSize: 15,
                        }}
                    >
                        <div style={{ opacity: 0.7 }}>First Name</div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{user.fname}</div>

                        <div style={{ opacity: 0.7 }}>Last Name</div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{user.lname}</div>

                        <div style={{ opacity: 0.7 }}>Email</div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{user.email}</div>

                        <div style={{ opacity: 0.7 }}>Phone</div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{user.phone}</div>

                        <div style={{ opacity: 0.7 }}>NIC Number</div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{user.nic || '—'}</div>
                    </div>

                    <div
                        style={{
                            marginTop: 20,
                            height: 1,
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.15), rgba(255,255,255,0.0))',
                        }}
                    />

                    <div
                        style={{
                            marginTop: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 12,
                            opacity: 0.85,
                        }}
                    >
                        <span>Issued by Native Lodge</span>
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '999px',
                                background: '#22c55e',
                            }}
                        />
                        <span>Valid for verification on site</span>
                    </div>
                </div>

                {/* Right: QR */}
                <div
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 20,
                        padding: 20,
                        display: 'grid',
                        alignContent: 'center',
                        justifyItems: 'center',
                        gap: 12,
                    }}
                >
                    <canvas
                        ref={qrRef}
                        style={{
                            width: 220,
                            height: 220,
                            background: '#fff',
                            borderRadius: 12,
                        }}
                    />
                    <div style={{ fontSize: 12, opacity: 0.8, textAlign: 'center' }}>Scan to identify user</div>
                </div>
            </div>
        </div>
    );
});
ShareCard.displayName = 'ShareCard';

/** -------------- Main Users Component -------------- */
const Users = () => {
    const dispatch = useDispatch();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<any>({
        id: null,
        fname: '',
        lname: '',
        phone: '',
        email: '',
        nic: '',
        amount: '',
        card_url: '', // 👈 add card_url to form for viewing
    });
    const [errors, setErrors] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [regenCard, setRegenCard] = useState(false);

    // For share card rendering
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [shareTarget, setShareTarget] = useState<any | null>(null);
    // Strong random password generator (12 chars, at least 1 of each class)
    const generatePassword = (length = 12) => {
        const lowers = 'abcdefghijklmnopqrstuvwxyz';
        const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const digits = '0123456789';
        const symbols = '!@#$%^&*()-_=+[]{};:,.?';

        const all = lowers + uppers + digits + symbols;

        const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

        // ensure at least one from each class
        let pwd = [pick(lowers), pick(uppers), pick(digits), pick(symbols)];

        // fill the rest
        for (let i = pwd.length; i < length; i++) {
            pwd.push(pick(all));
        }

        // shuffle
        for (let i = pwd.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
        }

        return pwd.join('');
    };

    useEffect(() => {
        dispatch(setPageTitle('Users'));
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Auth error:', error);
            return;
        }
        setUserEmail(data?.user?.email || null);
    };

    const fetchUsers = useCallback(async () => {
        if (!userEmail) return;
        setLoading(true);
        Swal.fire({ title: 'Loading users...', didOpen: () => Swal.showLoading() });

        const { data, error } = await supabase.from('native_users').select('*').order('created_at', { ascending: false });

        Swal.close();
        setLoading(false);

        if (error) {
            console.error('Fetch error:', error);
            Swal.fire('Error', 'Could not load users.', 'error');
            return;
        }

        setUsers(data || []);
        setFilteredUsers(data || []);
        setCurrentPage(1);
    }, [userEmail]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const filtered = users.filter(
            (user) => user.fname.toLowerCase().includes(search.toLowerCase()) || user.lname.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [search, users]);

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.id]: e.target.value });
        setErrors({ ...errors, [e.target.id]: null });
    };

    const uploadPngToSupabase = async (pngDataUrl: string, filename: string) => {
        const base64 = pngDataUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        const { error: upErr } = await supabase.storage.from('native').upload(filename, bytes, {
            contentType: 'image/png',
            upsert: true, // <-- overwrite same path
        });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from('native').getPublicUrl(filename);
        // cache-bust the public URL so the new image shows immediately
        const busted = `${pub.publicUrl}?v=${Date.now()}`;
        return busted;
    };

    const generateAndUploadCardFromForm = async (formData: any): Promise<string> => {
        if (!formData?.id) throw new Error('Missing user ID for card generation');

        setShareTarget({
            id: String(formData.id),
            fname: formData.fname,
            lname: formData.lname,
            email: formData.email,
            phone: formData.phone,
            nic: formData.nic,
        });

        await new Promise((r) => setTimeout(r, 50));
        if (!cardRef.current) throw new Error('Card not ready');

        const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 });

        // Use fixed path (deterministic) so we overwrite the same file
        const filename = `cards/user-${formData.id}.png`;
        const publicUrl = await uploadPngToSupabase(dataUrl, filename);

        setShareTarget(null);
        return publicUrl;
    };

    /** Save (create/update). On create -> generate card and save card_url. */
    const saveUser = async () => {
        const validationErrors: any = {};

        if (!form.fname) validationErrors.fname = 'First name is required.';
        if (!form.lname) validationErrors.lname = 'Last name is required.';

        if (!form.phone) {
            validationErrors.phone = 'Phone number is required.';
        } else if (!/^\d{8,}$/.test(form.phone)) {
            validationErrors.phone = 'Phone number must be at least 8 digits.';
        }

        if (!form.email) {
            validationErrors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            validationErrors.email = 'Invalid email format.';
        }

        if (!form.amount) {
            validationErrors.amount = 'Amount is required.';
        } else if (isNaN(Number(form.amount))) {
            validationErrors.amount = 'Amount must be a number.';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            // duplication checks only for create
            if (!form.id) {
                const { data: duplicates, error: dupError } = await supabase
                    .from('native_users')
                    .select('id, email, phone, nic')
                    .or(`email.eq.${form.email},phone.eq.${form.phone}${form.nic ? `,nic.eq.${form.nic}` : ''}`);

                if (dupError) {
                    console.error('Duplication check error:', dupError);
                    Swal.fire('Error', 'Failed to check for duplicates.', 'error');
                    return;
                }

                const dupErrors: any = {};
                if ((duplicates || []).some((u) => u.email === form.email)) dupErrors.email = 'Email already exists.';
                if ((duplicates || []).some((u) => u.phone === form.phone)) dupErrors.phone = 'Phone already exists.';
                // Only validate NIC if provided
                if (form.nic && (duplicates || []).some((u) => u.nic === form.nic)) dupErrors.nic = 'NIC already exists.';

                if (Object.keys(dupErrors).length > 0) {
                    setErrors(dupErrors);
                    return;
                }
            }

            const newUser = {
                fname: form.fname,
                lname: form.lname,
                phone: form.phone,
                email: form.email,
                nic: form.nic,
                amount: parseFloat(form.amount),
            };

            if (form.id) {
                const { error: upErr } = await supabase.from('native_users').update(newUser).eq('id', form.id);
                if (upErr) throw upErr;

                // If toggle is on, regenerate the image now
                if (regenCard) {
                    Swal.fire({ title: 'Updating card...', didOpen: () => Swal.showLoading() });
                    try {
                        const cardUrl = await generateAndUploadCardFromForm({ ...form, ...newUser, id: form.id });
                        const { error: updCardErr } = await supabase.from('native_users').update({ card_url: cardUrl }).eq('id', form.id);
                        if (updCardErr) console.warn('Card URL update failed:', updCardErr);

                        // update local state so the modal preview refreshes immediately
                        setForm((prev: any) => ({ ...prev, card_url: cardUrl }));
                    } finally {
                        Swal.close();
                    }
                }

                Swal.fire('Updated!', `User updated${regenCard ? ' and card regenerated' : ''}.`, 'success');
            } else {
                // CREATE + RETURN new row
                const tempPassword = generatePassword(12); // <-- new

                const { data: created, error: insErr } = await supabase
                    .from('native_users')
                    .insert([{ ...newUser, password: tempPassword }]) // <-- store it
                    .select('*')
                    .single();

                if (insErr) throw insErr;

                // Generate card and store URL
                Swal.fire({ title: 'Generating card...', didOpen: () => Swal.showLoading() });
                const cardUrl = await generateAndUploadCardFromForm(created);

                // Save card_url to row
                const { error: updErr } = await supabase.from('native_users').update({ card_url: cardUrl }).eq('id', created.id);

                if (updErr) {
                    console.warn('Card URL update failed:', updErr);
                }

                Swal.close();
                Swal.fire('Added!', 'User added and card generated.', 'success');
            }

            setModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            Swal.close();
            Swal.fire('Error', err?.message || 'Failed to save user.', 'error');
        }
    };

    const editUser = (user: any = null) => {
        if (user && typeof user === 'object') {
            // include card_url so we can preview it in modal
            setForm({ ...user, card_url: user.card_url || '' });
        } else {
            setForm({
                id: null,
                fname: '',
                lname: '',
                phone: '',
                email: '',
                nic: '',
                amount: '',
                card_url: '',
            });
        }
        setErrors({});
        setRegenCard(false);
        setModalOpen(true);
    };
    // --- helper: turn a public/signed Supabase Storage URL into a bucket path ---
    const extractStoragePath = (url: string, bucket = 'native'): string | null => {
        try {
            const u = new URL(url);
            // examples:
            // /storage/v1/object/public/native/cards/user-123.png
            // /storage/v1/object/sign/native/cards/user-123.png?token=...
            const pubPrefix = `/storage/v1/object/public/${bucket}/`;
            const signPrefix = `/storage/v1/object/sign/${bucket}/`;

            if (u.pathname.startsWith(pubPrefix)) return u.pathname.slice(pubPrefix.length);
            if (u.pathname.startsWith(signPrefix)) return u.pathname.slice(signPrefix.length);

            // fallback: old formats or CDN rewrites
            const idx = u.pathname.indexOf(`/object/`);
            if (idx !== -1) {
                const after = u.pathname.slice(idx + `/object/`.length); // e.g. "public/native/cards/.."
                const parts = after.split('/');
                if (parts.length >= 3 && parts[1] === bucket) {
                    return parts.slice(2).join('/'); // "cards/.."
                }
            }
            return null;
        } catch {
            return null;
        }
    };

    const deleteUser = async (user: any) => {
        const confirm = await Swal.fire({
            title: `Delete ${user.fname} ${user.lname}?`,
            text: 'This will also remove their activation card image.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
        });

        if (!confirm.isConfirmed) return;

        // 1) try to delete the stored card image (ignore errors so the row still deletes)
        try {
            let pathToDelete: string | null = null;

            if (user.card_url) {
                pathToDelete = extractStoragePath(user.card_url, 'native');
            }
            // fallback to deterministic filename you use when regenerating
            if (!pathToDelete && user?.id) {
                pathToDelete = `cards/user-${user.id}.png`;
            }

            if (pathToDelete) {
                const { error: remErr } = await supabase.storage.from('native').remove([pathToDelete]);
                if (remErr) console.warn('Storage remove failed:', remErr.message || remErr);
            }
        } catch (e: any) {
            console.warn('Card deletion skipped:', e?.message || e);
        }

        // 2) delete the database row
        const { error } = await supabase.from('native_users').delete().eq('id', user.id);
        if (error) {
            Swal.fire('Error', 'Failed to delete user.', 'error');
            return;
        }

        // 3) refresh UI
        fetchUsers();
        Swal.fire('Deleted', 'User and card (if any) deleted.', 'success');
    };

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginated = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    /** Share flow:
     * - If user has card_url, use it
     * - else generate, save card_url, then use it
     * - Open WhatsApp with message + image URL
     */
    const handleShare = async (user: any) => {
        try {
            Swal.fire({
                title: 'Preparing share...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            let cardUrl = user.card_url as string | undefined;

            if (!cardUrl) {
                // Generate, upload, and persist
                const freshUrl = await generateAndUploadCardFromForm(user);
                const { error: updErr } = await supabase.from('native_users').update({ card_url: freshUrl }).eq('id', user.id);
                if (updErr) console.warn('Failed to persist card_url:', updErr);
                cardUrl = freshUrl;
                // Also update local state so list shows it's present if you reload UI
                setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, card_url: freshUrl } : u)));
                setFilteredUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, card_url: freshUrl } : u)));
            }

            Swal.close();

            // WhatsApp
            const phone = user.phone.startsWith('+') ? user.phone : `+230${user.phone}`;
            const message =
                `Hi ${user.fname},\n\n` +
                `We’re pleased to inform you that your account with Native Lodge has been successfully activated.\n\n` +
                `Your activation card is available here:\n${cardUrl}\n\n` +
                `Please keep this card safe — scanning the QR code will identify your account instantly.`;

            // Note: Web cannot attach an image file directly to WhatsApp.
            // Including the URL lets WhatsApp show a preview (and the user can download it).
            window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        } catch (err: any) {
            console.error(err);
            Swal.close();
            Swal.fire('Error', err?.message || 'Failed to prepare share', 'error');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl">Users</h2>
                <div className="flex gap-3">
                    <button className="btn btn-primary" onClick={() => editUser()}>
                        <IconPlus className="mr-2" /> Add User
                    </button>
                    <div className="relative">
                        <input type="text" placeholder="Search by name or email" className="form-input py-2 pr-10" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            <div className="mt-5 panel p-0 border-0 overflow-x-auto">
                {loading ? (
                    <p className="text-center py-5">Loading...</p>
                ) : paginated.length === 0 ? (
                    <p className="text-center py-5">No users found.</p>
                ) : (
                    <table className="table-striped table-hover w-full">
                        <thead>
                            <tr>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>NIC Number</th>
                                <th>Amount</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.fname}</td>
                                    <td>{u.lname}</td>
                                    <td>{u.email}</td>
                                    <td>{u.phone}</td>
                                    <td>{u.nic}</td>
                                    <td>{u.amount}</td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => editUser(u)}>
                                                <Visibility />
                                            </button>
                                            <button className="btn btn-sm btn-outline-success" onClick={() => handleShare(u)}>
                                                <Share />
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(u)}>
                                                <Delete />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-4 flex justify-center gap-4">
                <button className="btn btn-sm btn-primary" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                    Prev
                </button>
                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>
                <button className="btn btn-sm btn-primary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                    Next
                </button>
            </div>

            {/* Add/Edit Modal */}
            <Transition appear show={modalOpen} as={Fragment}>
                <Dialog as="div" onClose={() => setModalOpen(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100">
                                <Dialog.Panel className="w-full max-w-lg rounded-xl overflow-hidden bg-white dark:bg-gray-900 text-black dark:text-white shadow-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold">{form.id ? 'Edit User' : 'Add User'}</h3>
                                        <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-red-500 transition">
                                            <IconX />
                                        </button>
                                    </div>
                                    {/* --- Modal Body (2-col when editing + card exists) --- */}
                                    <div className="px-6 py-5">
                                        {/** When editing and card exists, show 2 cols; otherwise single column */}
                                        {(() => {
                                            const hasCard = Boolean(form?.id && form?.card_url);
                                            return (
                                                <form>
                                                    <div className={`grid gap-6 ${hasCard ? 'md:grid-cols-2' : ''}`}>
                                                        {/* Left: Inputs */}
                                                        <div>
                                                            {[
                                                                { field: 'fname', label: 'First Name', placeholder: 'Enter first name' },
                                                                { field: 'lname', label: 'Last Name', placeholder: 'Enter last name' },
                                                                { field: 'email', label: 'Email', placeholder: 'Enter email address' },
                                                                { field: 'phone', label: 'Phone Number', placeholder: 'Enter phone number' },
                                                                { field: 'nic', label: 'National Identity Card Number', placeholder: 'Enter NIC number' },
                                                                { field: 'amount', label: 'Amount', placeholder: 'Enter amount (e.g. 100.00)' },
                                                            ].map(({ field, label, placeholder }) => (
                                                                <div key={field} className="mb-4 last:mb-0">
                                                                    <label htmlFor={field} className="block mb-1 text-sm font-medium">
                                                                        {label}
                                                                    </label>
                                                                    <input
                                                                        id={field}
                                                                        type={field === 'amount' ? 'number' : 'text'}
                                                                        placeholder={placeholder}
                                                                        value={form[field]}
                                                                        onChange={handleChange}
                                                                        className={`form-input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 ${
                                                                            errors[field] ? 'border-red-500' : ''
                                                                        }`}
                                                                    />
                                                                    {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Right: Card preview (only when editing and we have a card) */}
                                                        {hasCard && (
                                                            <div className="space-y-3">
                                                                <div className="text-sm opacity-80">Activation Card</div>
                                                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                                    <img src={form.card_url} alt="Activation Card" className="w-full h-auto block" />
                                                                </div>

                                                                <label className="flex items-center gap-2 text-sm">
                                                                    <input type="checkbox" className="form-checkbox" checked={regenCard} onChange={(e) => setRegenCard(e.target.checked)} />
                                                                    Regenerate card image on Update
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions (span full width) */}
                                                    <div className="flex justify-end gap-3 mt-6">
                                                        <button type="button" className="btn btn-outline-danger" onClick={() => setModalOpen(false)}>
                                                            Cancel
                                                        </button>
                                                        <button type="button" className="btn btn-primary" onClick={saveUser}>
                                                            {form.id ? 'Update' : 'Add'}
                                                        </button>
                                                    </div>
                                                </form>
                                            );
                                        })()}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Hidden offscreen renderer for the share card */}
            <div style={{ position: 'fixed', left: -9999, top: -9999 }}>
                {shareTarget && (
                    <ShareCard
                        ref={cardRef}
                        user={shareTarget}
                        qrPayload={String(shareTarget.id)} // QR encodes ONLY the user id
                    />
                )}
            </div>
        </div>
    );
};

export default Users;
