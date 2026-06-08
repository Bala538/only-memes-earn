import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import TokenIcon from './icons/TokenIcon';

const AdminPriceControl: React.FC = () => {
    const { state, adminUpdateUshaPrice } = useContext(AppContext);
    const [ushaPrice, setUshaPrice] = useState(state.ushaPrice || 1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setUshaPrice(state.ushaPrice || 1);
    }, [state.ushaPrice]);

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);
        try {
            await adminUpdateUshaPrice(Number(ushaPrice));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to update USHA price:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b-2 border-green-500 pb-2 flex items-center space-x-2">
                <TokenIcon token="USHA" className="w-7 h-7" />
                <span>USHA Price Configuration</span>
            </h2>
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="usha-price" className="block text-sm font-medium text-gray-400 mb-2">
                        Set USHA Price (in USD)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            id="usha-price"
                            type="number"
                            step="0.000001"
                            value={ushaPrice}
                            onChange={(e) => setUshaPrice(Number(e.target.value))}
                            className="w-full pl-7 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-600 shadow-lg"
                >
                    {loading ? 'Saving...' : 'Save Price'}
                </button>
            </div>
            {success && <p className="text-green-500 mt-3 font-medium">USHA price updated successfully!</p>}
        </div>
    );
};

export default AdminPriceControl;
