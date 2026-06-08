
import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Banner } from '../../types';
import PhotoIcon from '../icons/PhotoIcon';
import ConfirmationModal from '../ConfirmationModal';
import UploadIcon from '../icons/UploadIcon';

const BannerManager: React.FC = () => {
    const { state, addBanner, updateBanner, removeBanner } = useContext(AppContext);
    const [imageUrl, setImageUrl] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleEdit = (banner: Banner) => {
        setImageUrl(banner.imageUrl);
        setLinkUrl(banner.linkUrl || '');
        setTitle(banner.title || '');
        setDescription(banner.description || '');
        setEditingId(banner.id);
        setError('');
    };

    const handleCancelEdit = () => {
        setImageUrl('');
        setLinkUrl('');
        setTitle('');
        setDescription('');
        setEditingId(null);
        setError('');
    };

    // Helper to convert Google Drive sharing links to direct image links
    const processImageUrl = (url: string) => {
        // Regex to extract file ID from standard Google Drive sharing URL
        // e.g., https://drive.google.com/file/d/1aBcD.../view?usp=sharing
        const driveRegex = /drive\.google\.com\/file\/d\/([-_\w]+)/;
        const match = url.match(driveRegex);
        
        if (match && match[1]) {
            // Return direct download/view URL
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
        return url;
    };

    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageUrl(processImageUrl(e.target.value));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Max dimension for banners (e.g. 1200px width)
                    const MAX_WIDTH = 1200; 
                    const MAX_HEIGHT = 600; 
                    let width = img.width;
                    let height = img.height;
                    
                    // Maintain aspect ratio
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                        setImageUrl(dataUrl);
                    }
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!imageUrl) {
            setError('Image URL is required.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const bannerData: Banner = {
                id: editingId || new Date().toISOString(),
                imageUrl,
                linkUrl: linkUrl || undefined,
                title: title || undefined,
                description: description || undefined,
                active: true
            };

            if (editingId) {
                await updateBanner(bannerData);
            } else {
                await addBanner(bannerData);
            }
            
            handleCancelEdit();
        } catch (err: any) {
            console.error("Failed to save banner:", err);
            if (err instanceof Error) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An unknown error occurred while saving the banner.');
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
            removeBanner(itemToDelete);
            setItemToDelete(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemove}
                title="Remove Banner"
                message="Are you sure you want to remove this banner? This action cannot be undone."
            />
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-green-400 border-b-2 border-green-400 pb-2 flex items-center space-x-2">
                    <PhotoIcon className="w-7 h-7" />
                    <span>{editingId ? 'Edit Banner' : 'Add New Banner'}</span>
                </h2>
                <div className="space-y-4">
                    {editingId && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">Editing Banner</span>
                            <button onClick={handleCancelEdit} className="text-sm text-green-400 hover:text-green-300">Cancel Edit</button>
                        </div>
                    )}
                    
                    <div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Image URL (Direct link or Google Drive link)"
                                value={imageUrl}
                                onChange={handleImageUrlChange}
                                className="flex-grow bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                            <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-center min-w-[50px] transition-colors" title="Upload Image">
                                <UploadIcon className="w-5 h-5 text-green-400" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 pl-1">
                            Tip: You can paste a Google Drive link or upload an image directly.
                        </p>
                    </div>
                    
                    <input
                        type="text"
                        placeholder="Link URL (Optional - where user goes on click)"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />

                    <input
                        type="text"
                        placeholder="Overlay Title (Optional - e.g., Welcome!)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />

                    <textarea
                        placeholder="Overlay Description (Optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none h-20 resize-none"
                    />

                    {imageUrl && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview:</p>
                            <div className="relative h-32 w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
                                <img 
                                    src={imageUrl} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML += '<span class="text-xs text-red-400">Failed to load image</span>';
                                    }}
                                />
                                {(title || description) && (
                                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-4">
                                        {title && <h3 className="text-white font-bold">{title}</h3>}
                                        {description && <p className="text-white text-xs">{description}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 flex items-center justify-center"
                    >
                         {isSubmitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Banner' : 'Add Banner')}
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl lg:max-h-[calc(100vh-15rem)]">
                <h2 className="text-2xl font-bold mb-4 text-green-400 border-b-2 border-green-400 pb-2">Manage Banners</h2>
                <div className="space-y-4 overflow-y-auto h-full pr-2">
                    {state.banners.map(banner => (
                        <div key={banner.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="h-24 w-full relative bg-gray-200 dark:bg-gray-900">
                                <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                                {(banner.title || banner.description) && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col justify-center p-2">
                                        {banner.title && <p className="text-white font-bold text-sm truncate">{banner.title}</p>}
                                    </div>
                                )}
                            </div>
                            <div className="p-3 flex justify-between items-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[60%]">
                                    {banner.linkUrl ? `Link: ${banner.linkUrl}` : 'No Link'}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(banner)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleRemoveClick(banner.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded transition"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {state.banners.length === 0 && <p className="text-gray-500 text-center mt-4">No banners available.</p>}
                </div>
            </div>
        </div>
    );
};

export default BannerManager;
