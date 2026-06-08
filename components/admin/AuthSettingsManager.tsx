
import { useState, useContext, useEffect, ChangeEvent } from 'react';
import { AppContext } from '../../context/AppContext';
import FacebookIcon from '../icons/FacebookIcon';
import GoogleIcon from '../icons/GoogleIcon';
import UploadIcon from '../icons/UploadIcon';

const AuthSettingsManager: React.FC = () => {
    const { state, adminUpdateAuthConfig } = useContext(AppContext);
    const { authConfig } = state;

    const [imageUrl, setImageUrl] = useState(authConfig.imageUrl);
    const [authImageUrl, setAuthImageUrl] = useState(authConfig.authImageUrl || authConfig.imageUrl);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState(authConfig.backgroundImageUrl || '');
    const [welcomeTitle, setWelcomeTitle] = useState(authConfig.welcomeTitle || 'RideCab');
    const [welcomeHeadline, setWelcomeHeadline] = useState(authConfig.welcomeHeadline || 'Find your dream taxi to start your journey');
    const [enableEmailAuth, setEnableEmailAuth] = useState(authConfig.enableEmailAuth);
    const [enableGoogleAuth, setEnableGoogleAuth] = useState(authConfig.enableGoogleAuth);
    const [enableFacebookAuth, setEnableFacebookAuth] = useState(authConfig.enableFacebookAuth);
    const [maintenanceMode, setMaintenanceMode] = useState(authConfig.maintenanceMode || false);
    const [maintenanceMessage, setMaintenanceMessage] = useState(authConfig.maintenanceMessage || 'We are currently undergoing scheduled maintenance. Please check back later.');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        setImageUrl(authConfig.imageUrl);
        setAuthImageUrl(authConfig.authImageUrl || authConfig.imageUrl);
        setBackgroundImageUrl(authConfig.backgroundImageUrl || '');
        setWelcomeTitle(authConfig.welcomeTitle || 'RideCab');
        setWelcomeHeadline(authConfig.welcomeHeadline || 'Find your dream taxi to start your journey');
        setEnableEmailAuth(authConfig.enableEmailAuth);
        setEnableGoogleAuth(authConfig.enableGoogleAuth);
        setEnableFacebookAuth(authConfig.enableFacebookAuth);
        setMaintenanceMode(authConfig.maintenanceMode || false);
        setMaintenanceMessage(authConfig.maintenanceMessage || 'We are currently undergoing scheduled maintenance. Please check back later.');
    }, [authConfig, setImageUrl, setAuthImageUrl, setBackgroundImageUrl, setWelcomeTitle, setWelcomeHeadline, setEnableEmailAuth, setEnableGoogleAuth, setEnableFacebookAuth, setMaintenanceMode, setMaintenanceMessage]);

    const handleSave = async () => {
        setSaveStatus('saving');
        await adminUpdateAuthConfig({
            imageUrl,
            authImageUrl,
            backgroundImageUrl,
            welcomeTitle,
            welcomeHeadline,
            enableEmailAuth,
            enableGoogleAuth,
            enableFacebookAuth,
            maintenanceMode,
            maintenanceMessage
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            // Convert to Base64 with resizing to ensure persistence works (avoiding huge payloads)
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Max dimension 1024px to keep string size reasonable for storage
                    const MAX_DIM = 1024; 
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > MAX_DIM) {
                            height *= MAX_DIM / width;
                            width = MAX_DIM;
                        }
                    } else {
                        if (height > MAX_DIM) {
                            width *= MAX_DIM / height;
                            height = MAX_DIM;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        // Compress to JPEG 80% quality
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        setter(dataUrl);
                    }
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b-2 border-purple-500 pb-2 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-purple-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
                <span>Authentication Settings</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-300">Appearance</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Welcome Title (App Name)</label>
                        <input 
                            type="text" 
                            value={welcomeTitle}
                            onChange={(e) => setWelcomeTitle(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="RideCab"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Welcome Headline</label>
                        <textarea 
                            value={welcomeHeadline}
                            onChange={(e) => setWelcomeHeadline(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none h-20 resize-none"
                            placeholder="Find your dream taxi..."
                        />
                    </div>
                    
                    {/* Get Started Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Get Started Image</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="flex-grow bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="https://example.com/taxi-image.jpg"
                            />
                            <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-center min-w-[50px] transition-colors" title="Upload Image">
                                <UploadIcon className="w-5 h-5 text-purple-400" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setImageUrl)} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Image for the 'Get Started' slide</p>
                    </div>

                    {/* Login/Signup Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Login/Signup Image</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={authImageUrl}
                                onChange={(e) => setAuthImageUrl(e.target.value)}
                                className="flex-grow bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="https://example.com/login-image.jpg"
                            />
                            <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-center min-w-[50px] transition-colors" title="Upload Image">
                                <UploadIcon className="w-5 h-5 text-purple-400" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setAuthImageUrl)} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Image for the login form slide</p>
                    </div>
                    
                    {/* Background Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Background Image (Optional)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={backgroundImageUrl}
                                onChange={(e) => setBackgroundImageUrl(e.target.value)}
                                className="flex-grow bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="https://example.com/background.jpg"
                            />
                            <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-center min-w-[50px] transition-colors" title="Upload Image">
                                <UploadIcon className="w-5 h-5 text-purple-400" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setBackgroundImageUrl)} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Recommended: 1080x1920px (Portrait)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {imageUrl && (
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Get Started Preview:</p>
                                <div className="relative h-24 w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                    <img src={imageUrl} alt="Welcome Preview" className="h-full object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                </div>
                            </div>
                        )}
                        {authImageUrl && (
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Login/Signup Preview:</p>
                                <div className="relative h-24 w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                    <img src={authImageUrl} alt="Auth Preview" className="h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-300">Enable/Disable Methods</h3>
                    
                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-700 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Email & Password</h4>
                                <p className="text-xs text-gray-400">Allow standard signup/login</p>
                            </div>
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={enableEmailAuth} 
                                onChange={(e) => setEnableEmailAuth(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-full">
                                <GoogleIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Google Auth</h4>
                                <p className="text-xs text-gray-400">Allow login with Google</p>
                            </div>
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={enableGoogleAuth} 
                                onChange={(e) => setEnableGoogleAuth(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-[#1877F2] rounded-full">
                                <FacebookIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Facebook Auth</h4>
                                <p className="text-xs text-gray-400">Allow login with Facebook</p>
                            </div>
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={enableFacebookAuth} 
                                onChange={(e) => setEnableFacebookAuth(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    <h3 className="text-lg font-bold text-gray-300 mt-8">System Maintenance</h3>
                    
                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-900/50">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 dark:text-red-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Maintenance Mode</h4>
                                <p className="text-xs text-gray-400">Block access for non-admin users</p>
                            </div>
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={maintenanceMode} 
                                onChange={(e) => setMaintenanceMode(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    {maintenanceMode && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Maintenance Message</label>
                            <textarea 
                                value={maintenanceMessage}
                                onChange={(e) => setMaintenanceMessage(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-red-500 focus:outline-none h-20 resize-none"
                                placeholder="We are currently undergoing scheduled maintenance..."
                            />
                        </div>
                    )}

                    <button 
                        onClick={handleSave} 
                        disabled={saveStatus === 'saving'}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg transform active:scale-[0.98] ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                    >
                        {saveStatus === 'saving' ? 'Saving Configuration...' : saveStatus === 'saved' ? 'Changes Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthSettingsManager;
