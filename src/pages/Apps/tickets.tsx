import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { createClient } from '@supabase/supabase-js';
import { Edit, Delete } from '@mui/icons-material';

const supabase = createClient(
    import.meta.env.VITE_REACT_APP_SUPABASE_URL,
    import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY
);

const ConcertTicketManagement = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [concerts, setConcerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        concert_id: '',
        ticket_name: '',
        price: '',
        quantity: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [ticketRes, concertRes] = await Promise.all([
            supabase.from('concert_ticket_prices').select('*, concerts(concert_name)'),
            supabase.from('concerts').select('id, concert_name')
        ]);

        if (!ticketRes.error && !concertRes.error) {
            setTickets(ticketRes.data);
            setConcerts(concertRes.data);
        } else {
            Swal.fire('Error', 'Failed to load data', 'error');
        }
        setLoading(false);
    };

    const openModal = (ticket: any = null) => {
        if (ticket) {
            setFormData({
                concert_id: ticket.concert_id,
                ticket_name: ticket.ticket_name,
                price: ticket.price,
                quantity: ticket.quantity
            });
            setEditingId(ticket.id);
        } else {
            setFormData({ concert_id: '', ticket_name: '', price: '', quantity: '' });
            setEditingId(null);
        }
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        const { concert_id, ticket_name, price, quantity } = formData;
        if (!concert_id || !ticket_name || !price || !quantity) {
            Swal.fire('Validation Error', 'All fields are required', 'warning');
            return;
        }

        const payload = {
            concert_id: parseInt(concert_id),
            ticket_name,
            price: parseFloat(price),
            quantity: parseInt(quantity)
        };

        let error;
        if (editingId) {
            ({ error } = await supabase.from('concert_ticket_prices').update(payload).eq('id', editingId));
        } else {
            ({ error } = await supabase.from('concert_ticket_prices').insert([payload]));
        }

        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            Swal.fire('Success', `Ticket ${editingId ? 'updated' : 'added'} successfully`, 'success');
            fetchData();
            setModalOpen(false);
        }
    };

    const deleteTicket = async (id: number) => {
        const confirm = await Swal.fire({
            title: 'Delete this ticket?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Delete'
        });

        if (confirm.isConfirmed) {
            const { error } = await supabase.from('concert_ticket_prices').delete().eq('id', id);
            if (!error) fetchData();
        }
    };

    const filteredTickets = tickets.filter(ticket =>
        ticket.concerts?.concert_name?.toLowerCase().includes(search.toLowerCase())
    );
    

    return (
        <div>
            <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold">Concert Ticket Management</h2>
                <button className="btn btn-primary" onClick={() => openModal()}>Add Ticket</button>
            </div>

            <input
                type="text"
                className="form-input mb-4 w-full"
                placeholder="Search by ticket name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? <p>Loading...</p> : (
                <table className="table table-striped w-full">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Concert</th>
                            <th>Ticket</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.map(ticket => (
                            <tr key={ticket.id}>
                                <td>{ticket.id}</td>
                                <td>{ticket.concerts?.concert_name || 'N/A'}</td>
                                <td>{ticket.ticket_name}</td>
                                <td>{ticket.price}</td>
                                <td>{ticket.quantity}</td>
                                <td className="flex gap-2">
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => openModal(ticket)}>
                                        <Edit fontSize="small" />
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteTicket(ticket.id)}>
                                        <Delete fontSize="small" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal */}
            <Transition appear show={modalOpen} as={Fragment}>
                <Dialog as="div" onClose={() => setModalOpen(false)} className="relative z-[51]">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Dialog.Panel className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-md p-6">
                                <Dialog.Title className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                                    {editingId ? 'Edit Ticket' : 'Add Ticket'}
                                </Dialog.Title>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Concert</label>
                                        <select
                                            className="form-select w-full"
                                            value={formData.concert_id}
                                            onChange={(e) => setFormData({ ...formData, concert_id: e.target.value })}
                                        >
                                            <option value="">Select concert</option>
                                            {concerts.map((c) => (
                                                <option key={c.id} value={c.id}>{c.concert_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Ticket Name</label>
                                        <input
                                            className="form-input w-full"
                                            value={formData.ticket_name}
                                            onChange={(e) => setFormData({ ...formData, ticket_name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Price</label>
                                        <input
                                            type="number"
                                            className="form-input w-full"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Quantity</label>
                                        <input
                                            type="number"
                                            className="form-input w-full"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSubmit}>
                                        {editingId ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ConcertTicketManagement;
