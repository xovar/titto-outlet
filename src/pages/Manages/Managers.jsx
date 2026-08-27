import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOutlets } from "../../store/slices/outletSlice"; 
import { 
  fetchManagers, 
  createManager, 
  updateManager, 
  deleteManager 
} from "../../store/slices/managerSlice";
import { UserPlus, Edit2, Trash2, Store, Mail, User, Lock, Loader2, X } from "lucide-react";

export default function Managers() {
  const dispatch = useDispatch();

  const { items: outlets, loading: outletsLoading } = useSelector((state) => state.outlets);
  const { 
    items: managers, 
    loading: managersLoading, 
    updating: managerUpdating, 
    error: reduxError 
  } = useSelector((state) => state.managers);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [localError, setLocalError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    outletId: "",
  });

  useEffect(() => {
    dispatch(fetchOutlets());
    dispatch(fetchManagers());
  }, [dispatch]);

  const handleOpenModal = (manager = null) => {
    setLocalError("");
    if (manager) {
      setEditingManager(manager);
      setFormData({
        name: manager.name || "",
        email: manager.email || "",
        password: "", // এডিটের সময় খালি থাকবে
        outletId: manager.outlet_id || manager.outletId || "",
      });
    } else {
      setEditingManager(null);
      setFormData({ name: "", email: "", password: "", outletId: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingManager(null);
    setFormData({ name: "", email: "", password: "", outletId: "" });
    setLocalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    // Front-end Password Validation (কমপক্ষে ৬ ক্যারেক্টার হতে হবে)
    if (formData.password.trim() !== "" && formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters long");
      return;
    }

    if (editingManager) {
      // ⚡ Update Manager Payload
      const updatePayload = {
        id: editingManager.id,
        name: formData.name,
      };

      // নতুন পাসওয়ার্ড ফিল্ডে কিছু লিখলেই কেবল ব্যাকএন্ডে পাঠানো হবে
      if (formData.password.trim() !== "") {
        updatePayload.password = formData.password;
      }

      const resultAction = await dispatch(updateManager(updatePayload));
      if (updateManager.fulfilled.match(resultAction)) {
        handleCloseModal();
      }
    } else {
      // ⚡ Create Manager Action
      const resultAction = await dispatch(
        createManager({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          outletId: formData.outletId,
        })
      );
      if (createManager.fulfilled.match(resultAction)) {
        handleCloseModal();
      }
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this manager?")) {
      dispatch(deleteManager(id));
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Manager Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Create and assign managers to specific outlets.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm active:scale-95"
          >
            <UserPlus size={18} />
            <span>Add New Manager</span>
          </button>
        </div>

        {/* Managers Table */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          {managersLoading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-sm text-slate-500">Loading managers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Manager</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Assigned Outlet</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {managers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-500">
                        No managers found.
                      </td>
                    </tr>
                  ) : (
                    managers.map((m) => {
                      const assignedOutlet = outlets.find(
                        (o) => String(o.outlet_id || o.id) === String(m.outlet_id || m.outletId)
                      );

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                              <User size={16} />
                            </div>
                            {m.name}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{m.email}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                              <Store size={13} />
                              {m.outlet_name || m.outletName || assignedOutlet?.outlet_name || assignedOutlet?.name || "Unassigned"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenModal(m)}
                                className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modal - React Portal */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={handleCloseModal}
            />

            <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700/70 z-10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingManager ? "Edit Manager" : "Create New Manager"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {(reduxError || localError) && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
                  {localError || reduxError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 dark:text-white transition"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {!editingManager && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 dark:text-white transition"
                        placeholder="manager@example.com"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {editingManager ? "New Password (Leave blank to keep current)" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <input
                      type="password"
                      required={!editingManager}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 dark:text-white transition"
                      placeholder={editingManager ? "Enter new password" : "••••••••"}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Assign Outlet
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <select
                      required
                      disabled={Boolean(editingManager)}
                      value={formData.outletId}
                      onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm transition ${
                        editingManager 
                          ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-500" 
                          : "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white cursor-pointer"
                      }`}
                    >
                      <option value="">
                        {outletsLoading ? "Loading Outlets..." : "Select Outlet"}
                      </option>
                      {outlets && outlets.map((o) => (
                        <option key={o.outlet_id || o.id} value={o.outlet_id || o.id}>
                          {o.outlet_name || o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 cursor-pointer py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={managerUpdating}
                    className="flex cursor-pointer items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50 transition shadow-sm active:scale-95"
                  >
                    {managerUpdating && <Loader2 className="animate-spin" size={16} />}
                    <span>{editingManager ? "Save Changes" : "Create"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}