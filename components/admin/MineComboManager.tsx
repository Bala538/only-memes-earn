
import { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { MineUpgrade } from '../../types';
import PickaxeIcon from '../icons/PickaxeIcon';
import ConfirmationModal from '../ConfirmationModal';

const MineComboManager: React.FC = () => {
    const { state, addMineUpgrade, updateMineUpgrade, removeMineUpgrade, updateDailySchedule } = useContext(AppContext);
    const { mineUpgrades, dailySchedule } = state;

    // Upgrade Form State
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('PR&Team');
    const [baseCost, setBaseCost] = useState('');
    const [baseProfit, setBaseProfit] = useState('');
    const [icon, setIcon] = useState('');
    const [description, setDescription] = useState('');
    const [costMultiplier, setCostMultiplier] = useState('1.15');
    const [maxLevel, setMaxLevel] = useState('');
    const [dependencyId, setDependencyId] = useState('');
    const [dependencyLevel, setDependencyLevel] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Schedule State
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [cipherInput, setCipherInput] = useState('');
    const [cipherRewardInput, setCipherRewardInput] = useState('1000000');
    const [comboRewardInput, setComboRewardInput] = useState('5000000');
    const [combo1, setCombo1] = useState('');
    const [combo2, setCombo2] = useState('');
    const [combo3, setCombo3] = useState('');
    const [scheduleStatus, setScheduleStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Get next 7 days
    const next7Days = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    }, []);

    // Load schedule for selected date
    useEffect(() => {
        const config = dailySchedule[selectedDate];
        if (config) {
            setCipherInput(config.cipher);
            setCipherRewardInput(config.cipherReward?.toString() || '1000000');
            setComboRewardInput(config.comboReward?.toString() || '5000000');
            setCombo1(config.combo[0] || '');
            setCombo2(config.combo[1] || '');
            setCombo3(config.combo[2] || '');
        } else {
            setCipherInput('');
            setCipherRewardInput('1000000');
            setComboRewardInput('5000000');
            setCombo1('');
            setCombo2('');
            setCombo3('');
        }
    }, [selectedDate, dailySchedule]);

    const handleSaveSchedule = () => {
        if (!cipherInput) {
            alert("Please set a Cipher code.");
            return;
        }
        const combo = [combo1, combo2, combo3].filter(c => c !== '');
        
        if (combo.length > 0 && new Set(combo).size !== combo.length) {
            alert("Please select distinct combo cards.");
            return;
        }

        setScheduleStatus('saving');
        updateDailySchedule(
            selectedDate, 
            cipherInput.toUpperCase(), 
            combo, 
            parseInt(cipherRewardInput) || 1000000, 
            parseInt(comboRewardInput) || 5000000
        );
        setScheduleStatus('saved');
        setTimeout(() => setScheduleStatus('idle'), 2000);
    };

    const handleEdit = (upgrade: MineUpgrade) => {
        setId(upgrade.id);
        setName(upgrade.name);
        setCategory(upgrade.category);
        setBaseCost(upgrade.baseCost.toString());
        setBaseProfit(upgrade.baseProfit.toString());
        setIcon(upgrade.icon);
        setDescription(upgrade.description || '');
        setCostMultiplier(upgrade.costMultiplier ? upgrade.costMultiplier.toString() : '1.15');
        setMaxLevel(upgrade.maxLevel ? upgrade.maxLevel.toString() : '');
        setDependencyId(upgrade.dependency ? upgrade.dependency.id : '');
        setDependencyLevel(upgrade.dependency ? upgrade.dependency.level.toString() : '');
        setEditingId(upgrade.id);
        setError('');
    };

    const handleCancelEdit = () => {
        setId('');
        setName('');
        setCategory('PR&Team');
        setBaseCost('');
        setBaseProfit('');
        setIcon('');
        setDescription('');
        setCostMultiplier('1.15');
        setMaxLevel('');
        setDependencyId('');
        setDependencyLevel('');
        setEditingId(null);
        setError('');
    };

    const handleSubmit = () => {
        if (!id || !name || !baseCost || !baseProfit) {
            setError('ID, Name, Base Cost, and Base Profit are required.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const upgrade: MineUpgrade = {
                id: id.trim(),
                name,
                category,
                baseCost: parseInt(baseCost),
                baseProfit: parseInt(baseProfit),
                icon,
                description,
                costMultiplier: parseFloat(costMultiplier) || 1.15,
                maxLevel: maxLevel ? parseInt(maxLevel) : undefined,
                dependency: dependencyId && dependencyLevel ? {
                    id: dependencyId,
                    level: parseInt(dependencyLevel)
                } : undefined
            };

            if (editingId) {
                updateMineUpgrade(upgrade);
            } else {
                if (mineUpgrades.find(u => u.id === upgrade.id)) {
                    throw new Error("ID already exists.");
                }
                addMineUpgrade(upgrade);
            }
            handleCancelEdit();
        } catch (err: any) {
            console.error("Failed to save mine upgrade:", err);
            if (err instanceof Error) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An unknown error occurred while saving the upgrade.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveClick = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmRemove = () => {
        if (itemToDelete) {
            removeMineUpgrade(itemToDelete);
            setItemToDelete(null);
        }
    };

    const formatDateDisplay = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date().toISOString().split('T')[0];
        if (dateStr === today) return "Today";
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemove}
                title="Remove Upgrade"
                message="Are you sure you want to remove this upgrade? It will disappear from the user's game."
            />

            {/* Left Column: Schedule & Add Upgrade */}
            <div className="space-y-8">
                
                {/* 7-Day Schedule Config */}
                <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl border border-gray-200 dark:border-purple-500/30">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-purple-400 flex items-center space-x-2">
                            <span className="text-2xl">📅</span>
                            <span>Daily Schedule</span>
                        </h2>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">7-Day Planner</span>
                    </div>
                    
                    {/* Date Selector */}
                    <div className="flex space-x-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                        {next7Days.map(day => {
                            const isConfigured = !!dailySchedule[day];
                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(day)}
                                    className={`relative px-4 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                                        selectedDate === day 
                                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/50' 
                                        : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {formatDateDisplay(day)}
                                    {isConfigured && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-sm"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2 flex justify-between items-center">
                            <span>Config for {selectedDate}</span>
                            {dailySchedule[selectedDate] && <span className="text-xs text-green-400">● Live</span>}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Daily Cipher Code</label>
                                <input 
                                    type="text" 
                                    value={cipherInput}
                                    onChange={(e) => setCipherInput(e.target.value)}
                                    placeholder="e.g. BTC"
                                    className="w-full bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none uppercase font-mono tracking-[0.2em] placeholder-gray-400 dark:placeholder-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Cipher Reward</label>
                                <input 
                                    type="number" 
                                    value={cipherRewardInput}
                                    onChange={(e) => setCipherRewardInput(e.target.value)}
                                    placeholder="1,000,000"
                                    className="w-full bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider">Daily Combo (3 Cards)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Reward:</span>
                                    <input 
                                        type="number" 
                                        value={comboRewardInput}
                                        onChange={(e) => setComboRewardInput(e.target.value)}
                                        className="bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white text-[10px] w-20 p-1 rounded border border-gray-200 dark:border-gray-700 text-center font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                {[combo1, combo2, combo3].map((val, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="text-gray-500 text-xs w-4 font-mono">{idx + 1}.</span>
                                        <select 
                                            value={val} 
                                            onChange={(e) => {
                                                if (idx === 0) setCombo1(e.target.value);
                                                if (idx === 1) setCombo2(e.target.value);
                                                if (idx === 2) setCombo3(e.target.value);
                                            }}
                                            className="flex-grow bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white text-sm p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="">Select Card...</option>
                                            {mineUpgrades.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveSchedule} 
                            disabled={scheduleStatus === 'saving'}
                            className={`w-full py-3.5 rounded-lg font-bold transition-all shadow-lg transform active:scale-[0.98] ${scheduleStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/20'}`}
                        >
                            {scheduleStatus === 'saving' ? 'Saving...' : scheduleStatus === 'saved' ? 'Saved Successfully!' : `Save Schedule`}
                        </button>
                    </div>
                </div>

                {/* Add/Edit Upgrade Form */}
                <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold mb-4 text-orange-400 border-b-2 border-orange-400 pb-2 flex items-center space-x-2">
                        <PickaxeIcon className="w-7 h-7" />
                        <span>{editingId ? 'Edit Upgrade' : 'Add Upgrade'}</span>
                    </h2>
                    
                    <div className="space-y-4">
                        {editingId && (
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-400">Editing: {name}</span>
                                <button onClick={handleCancelEdit} className="text-sm text-orange-400 hover:text-orange-300">Cancel</button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">ID (Unique)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. ceo" 
                                    value={id} 
                                    onChange={(e) => setId(e.target.value)}
                                    disabled={!!editingId} 
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600 disabled:opacity-50" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. CEO" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Category</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600"
                                >
                                    {['PR&Team', 'Markets', 'Legal', 'Web3', 'Specials'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Sticker URL (Optional)</label>
                                <input 
                                    type="text" 
                                    placeholder="https://.../sticker.png" 
                                    value={icon} 
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Base Cost</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 500" 
                                    value={baseCost} 
                                    onChange={(e) => setBaseCost(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Base Profit / Hr</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 100" 
                                    value={baseProfit} 
                                    onChange={(e) => setBaseProfit(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Cost Multiplier</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 1.15" 
                                    value={costMultiplier} 
                                    onChange={(e) => setCostMultiplier(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Max Level (0 = Unlimited)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 20" 
                                    value={maxLevel} 
                                    onChange={(e) => setMaxLevel(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600" 
                                />
                            </div>
                        </div>

                        {/* Dependency Section */}
                        <div className="border-t border-gray-700 pt-3 mt-1">
                            <p className="text-xs font-bold text-gray-400 mb-2">Dependency (Optional)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Required Upgrade</label>
                                    <select 
                                        value={dependencyId} 
                                        onChange={(e) => setDependencyId(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600 text-xs"
                                    >
                                        <option value="">None</option>
                                        {mineUpgrades.filter(u => u.id !== id).map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Required Level</label>
                                    <input 
                                        type="number" 
                                        placeholder="e.g. 5" 
                                        value={dependencyLevel} 
                                        onChange={(e) => setDependencyLevel(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600 text-xs" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Description</label>
                            <textarea 
                                placeholder="e.g. Lead the company to success..." 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-gray-200 dark:border-gray-600 h-16 resize-none" 
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-500"
                        >
                            {isSubmitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Upgrade' : 'Add Upgrade')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: List of Upgrades */}
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl lg:max-h-[calc(100vh-15rem)] flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-300 border-b border-gray-600 pb-2">Manage Upgrades ({mineUpgrades.length})</h2>
                <div className="space-y-2 overflow-y-auto pr-2 flex-grow">
                    {mineUpgrades.map(upgrade => {
                        const dep = upgrade.dependency ? mineUpgrades.find(u => u.id === upgrade.dependency!.id) : null;
                        
                        return (
                            <div key={upgrade.id} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center">
                                        {upgrade.icon && (upgrade.icon.startsWith('http') || upgrade.icon.startsWith('https://'))
                                            ? <img src={upgrade.icon} alt={upgrade.name} className="w-8 h-8 object-contain" />
                                            : <span className="text-2xl">{upgrade.icon}</span>
                                        }
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{upgrade.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span className="bg-gray-700 px-1.5 rounded">{upgrade.category}</span>
                                            <span>Base: {upgrade.baseCost}</span>
                                            <span className="text-yellow-500">+{upgrade.baseProfit}/h</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5 flex flex-wrap gap-2">
                                            <span>Mult: {upgrade.costMultiplier || 1.15}x</span>
                                            {upgrade.maxLevel ? <span>• Max: {upgrade.maxLevel}</span> : null}
                                            {dep ? <span className="text-orange-400">• Req: {dep.name} lvl {upgrade.dependency!.level}</span> : null}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(upgrade)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded transition">
                                        Edit
                                    </button>
                                    <button onClick={() => handleRemoveClick(upgrade.id)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded transition">
                                        Del
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {mineUpgrades.length === 0 && <p className="text-gray-500 text-center mt-4">No upgrades available.</p>}
                </div>
            </div>
        </div>
    );
};

export default MineComboManager;
