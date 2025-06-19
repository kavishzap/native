import { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconSearch from '../../components/Icon/IconSearch';
import IconX from '../../components/Icon/IconX';
import IconPlus from '../../components/Icon/IconPlus';
import { Visibility, Delete, Share } from '@mui/icons-material';
import { createClient } from '@supabase/supabase-js';
import BannerImg from '../../images/banner.png';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    });
    const [errors, setErrors] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

        const { data, error } = await supabase
            .from('native_users')
            .select('*')
            .order('created_at', { ascending: false });

        Swal.close();
        setLoading(false);

        if (error) {
            console.error('Fetch error:', error);
            Swal.fire('Error', 'Could not load users.', 'error');
            return;
        }

        setUsers(data);
        setFilteredUsers(data);
        setCurrentPage(1);
    }, [userEmail]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const filtered = users.filter((user) =>
            user.fname.toLowerCase().includes(search.toLowerCase()) ||
            user.lname.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [search, users]);

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.id]: e.target.value });
        setErrors({ ...errors, [e.target.id]: null });
    };

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

        if (!form.nic) validationErrors.nic = 'NIC is required.';

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
            if (!form.id) {
                const { data: duplicates, error: dupError } = await supabase
                    .from('native_users')
                    .select('id, email, phone, nic')
                    .or(`email.eq.${form.email},phone.eq.${form.phone},nic.eq.${form.nic}`);

                if (dupError) {
                    console.error('Duplication check error:', dupError);
                    Swal.fire('Error', 'Failed to check for duplicates.', 'error');
                    return;
                }

                const dupErrors: any = {};
                if (duplicates.some((u) => u.email === form.email)) dupErrors.email = 'Email already exists.';
                if (duplicates.some((u) => u.phone === form.phone)) dupErrors.phone = 'Phone already exists.';
                if (duplicates.some((u) => u.nic === form.nic)) dupErrors.nic = 'NIC already exists.';

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
                await supabase.from('native_users').update(newUser).eq('id', form.id);
                Swal.fire('Updated!', 'User updated successfully.', 'success');
            } else {
                await supabase.from('native_users').insert([newUser]);
                Swal.fire('Added!', 'User added successfully.', 'success');
            }

            setModalOpen(false);
            fetchUsers();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to save user.', 'error');
        }
    };


    const editUser = (user: any = null) => {
        if (user && typeof user === 'object') {
            setForm({ ...user });
        } else {
            setForm({ id: null, fname: '', lname: '', phone: '', email: '', nic: '', amount: '' });
        }
        setErrors({});
        setModalOpen(true);
    };

    const deleteUser = async (user: any) => {
        const confirm = await Swal.fire({
            title: `Delete ${user.fname} ${user.lname}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
        });

        if (confirm.isConfirmed) {
            await supabase.from('native_users').delete().eq('id', user.id);
            fetchUsers();
            Swal.fire('Deleted', 'User deleted.', 'success');
        }
    };

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginated = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleShare = async (user: any) => {
    const result = await Swal.fire({
        title: `Send WhatsApp to ${user.fname}?`,
        text: 'This will open WhatsApp with a pre-filled message and image link.',
        icon: 'question',
        confirmButtonText: 'Send WhatsApp',
        showCancelButton: true,
        customClass: {
            confirmButton: 'btn btn-success mx-2',
            cancelButton: 'btn btn-outline-secondary mx-2',
        },
        buttonsStyling: false,
    });

    if (result.isConfirmed) {
        const phone = user.phone.startsWith('+') ? user.phone : `+230${user.phone}`;
        const imageUrl = 'https://ibb.co/MDwDVzV6'; // 🔁 Replace this with your actual image URL
        const message = `Hi ${user.fname}, your account at Native Lodge has been successfully activated.\n\n📎 View your activation card:\n${imageUrl}`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
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
                        <input
                            type="text"
                            placeholder="Search by name or email"
                            className="form-input py-2 pr-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
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
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
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
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                            >
                                <Dialog.Panel
                                    className="w-full max-w-lg rounded-xl overflow-hidden bg-white dark:bg-gray-900 text-black dark:text-white shadow-xl border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold">
                                            {form.id ? 'Edit User' : 'Add User'}
                                        </h3>
                                        <button
                                            onClick={() => setModalOpen(false)}
                                            className="text-gray-500 hover:text-red-500 transition"
                                        >
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="px-6 py-5">
                                        <form>
                                            {[
                                                { field: 'fname', label: 'First Name', placeholder: 'Enter first name' },
                                                { field: 'lname', label: 'Last Name', placeholder: 'Enter last name' },
                                                { field: 'email', label: 'Email', placeholder: 'Enter email address' },
                                                { field: 'phone', label: 'Phone Number', placeholder: 'Enter phone number' },
                                                { field: 'nic', label: 'National Identity Card Number', placeholder: 'Enter NIC number' },
                                                { field: 'amount', label: 'Amount', placeholder: 'Enter amount (e.g. 100.00)' },
                                            ].map(({ field, label, placeholder }) => (
                                                <div key={field} className="mb-4">
                                                    <label htmlFor={field} className="block mb-1 text-sm font-medium">
                                                        {label}
                                                    </label>
                                                    <input
                                                        id={field}
                                                        type={field === 'amount' ? 'number' : 'text'}
                                                        placeholder={placeholder}
                                                        value={form[field]}
                                                        onChange={handleChange}
                                                        className={`form-input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 ${errors[field] ? 'border-red-500' : ''
                                                            }`}
                                                    />
                                                    {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
                                                </div>
                                            ))}

                                            <div className="flex justify-end gap-3 mt-6">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => setModalOpen(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button type="button" className="btn btn-primary" onClick={saveUser}>
                                                    {form.id ? 'Update' : 'Add'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>

                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default Users;
