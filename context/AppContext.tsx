
import { createContext } from 'react';
import { AppState, AppAction, UserData, Token, Video, Game, Banner, PromoCode, 
    YouTubeTask, TelegramTask, FacebookTask, InstagramTask, TwitterTask, TikTokTask, AppDownloadTask,
    WithdrawalSetting, ReferralConfig, AirdropConfig, MineUpgrade, AuthConfig, AdsConfig,
    Proof, Withdrawal, AppNotification, MarketPair, OtherTask
} from '../types';

export interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithFacebook: () => Promise<void>;
    logout: () => Promise<void>;
    resendVerificationEmail: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    reloadUser: () => Promise<void>;
    
    addNotification: (userId: string, notification: Omit<AppNotification, 'id' | 'timestamp'>) => Promise<void>;
    markNotificationRead: (userId: string, notificationId: string) => Promise<void>;
    clearNotifications: (userId: string) => Promise<void>;
    
    uploadProofAttachment: (file: File) => Promise<string>;
    startTask: (taskId: string, title: string, taskType: string) => Promise<void>;
    cancelTask: (taskId: string, taskType: string) => Promise<void>;
    submitVideoProof: (videoId: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => Promise<void>;
    submitYouTubeProof: (taskId: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => Promise<void>;
    submitTelegramProof: (taskId: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => Promise<void>;
    submitFacebookProof: (taskId: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => Promise<void>;
    submitInstagramProof: (taskId: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => Promise<void>;
    submitTwitterProof: (taskId: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => Promise<void>;
    submitTikTokProof: (taskId: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => Promise<void>;
    submitAppDownloadProof: (taskId: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => Promise<void>;
    submitOtherProof: (taskId: string, title: string, proofUrl: string, reward: number, token: Token, code?: string) => Promise<void>;
    submitDepositProof: (depositId: string, title: string, proofUrl: string, amount: number, token: Token) => Promise<void>;
    
    claimTaskReward: (taskId: string, taskType: string, ignoreTimer?: boolean) => Promise<void>;

    initiateWithdrawal: (address: string, token: Token, amount: number, method: Withdrawal['method'], exchange?: string) => Promise<string>;
    swapBalance: (fromToken: Token, toToken: Token, fromAmount: number, toAmount: number) => Promise<void>;
    applyReferralCode: (code: string) => Promise<void>;
    redeemPromoCode: (code: string) => Promise<{ reward: number; token: Token }>;
    updateTapGameData: (data: any) => Promise<void>;
    playGame: (game: Game) => void;
    closeGame: () => void;
    submitAirdropAddress: (address: string) => Promise<void>;
    updateProfile: (displayName: string, photoURL: string) => Promise<void>;
    updatePassword: (current: string, newPass: string) => Promise<void>;
    getProofUrl: (proofUrl: string) => Promise<string>;
    getLeaderboard: () => { email: string; balance: number }[];

    addVideo: (video: Video) => Promise<void>;
    removeVideo: (videoId: string) => Promise<void>;
    addGame: (game: Game) => Promise<void>;
    updateGame: (game: Game) => Promise<void>;
    removeGame: (gameId: string) => Promise<void>;
    addBanner: (banner: Banner) => Promise<void>;
    updateBanner: (banner: Banner) => Promise<void>;
    removeBanner: (bannerId: string) => Promise<void>;
    addPromoCode: (promoCode: PromoCode) => Promise<void>;
    removePromoCode: (id: string) => Promise<void>;
    
    addYouTubeTask: (task: YouTubeTask) => Promise<void>;
    updateYouTubeTask: (task: YouTubeTask) => Promise<void>;
    removeYouTubeTask: (taskId: string) => Promise<void>;
    addTelegramTask: (task: TelegramTask) => Promise<void>;
    updateTelegramTask: (task: TelegramTask) => Promise<void>;
    removeTelegramTask: (taskId: string) => Promise<void>;
    addFacebookTask: (task: FacebookTask) => Promise<void>;
    updateFacebookTask: (task: FacebookTask) => Promise<void>;
    removeFacebookTask: (taskId: string) => Promise<void>;
    addInstagramTask: (task: InstagramTask) => Promise<void>;
    updateInstagramTask: (task: InstagramTask) => Promise<void>;
    removeInstagramTask: (taskId: string) => Promise<void>;
    addTwitterTask: (task: TwitterTask) => Promise<void>;
    updateTwitterTask: (task: TwitterTask) => Promise<void>;
    removeTwitterTask: (taskId: string) => Promise<void>;
    addTikTokTask: (task: TikTokTask) => Promise<void>;
    updateTikTokTask: (task: TikTokTask) => Promise<void>;
    removeTikTokTask: (taskId: string) => Promise<void>;
    addAppDownloadTask: (task: AppDownloadTask) => Promise<void>;
    updateAppDownloadTask: (task: AppDownloadTask) => Promise<void>;
    removeAppDownloadTask: (taskId: string) => Promise<void>;
    addOtherTask: (task: OtherTask) => Promise<void>;
    updateOtherTask: (task: OtherTask) => Promise<void>;
    removeOtherTask: (taskId: string) => Promise<void>;

    adminUpdateWithdrawalSettings: (settings: Record<Token, WithdrawalSetting>) => Promise<void>;
    adminUpdateReferralConfig: (config: ReferralConfig) => Promise<void>;
    adminUpdateAirdropConfig: (config: AirdropConfig) => Promise<void>;
    adminUpdateAuthConfig: (config: AuthConfig) => Promise<void>;
    adminUpdateAdsConfig: (config: AdsConfig) => Promise<void>;
    adminUpdateUshaPrice: (price: number) => Promise<void>;
    executeTrade: (pair: string, type: 'buy' | 'sell', orderType: 'limit' | 'market', amount: number, price: number) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
    updateMarketPrice: (pair: string, newPrice: number) => void;
    addMarket: (market: MarketPair) => Promise<void>;
    updateMarket: (market: MarketPair) => Promise<void>;
    removeMarket: (marketId: string) => Promise<void>;
    addToken: (token: string, name?: string) => Promise<void>;
    updateTokenName: (token: string, name: string) => Promise<void>;
    removeToken: (token: string) => Promise<void>;
    updateTokenLogo: (token: string, url: string) => Promise<void>;
    addMineUpgrade: (upgrade: MineUpgrade) => Promise<void>;
    updateMineUpgrade: (upgrade: MineUpgrade) => Promise<void>;
    removeMineUpgrade: (id: string) => Promise<void>;
    updateDailySchedule: (date: string, cipher: string, combo: string[], cipherReward?: number, comboReward?: number) => Promise<void>;

    adminApproveProof: (userEmail: string, videoId: string) => Promise<void>;
    adminRejectProof: (userEmail: string, videoId: string) => Promise<void>;
    adminApproveYouTubeProof: (userEmail: string, taskId: string) => Promise<void>;
    adminRejectYouTubeProof: (userEmail: string, taskId: string) => Promise<void>;
    adminApproveTelegramProof: (userEmail: string, taskId: string) => Promise<void>;
    adminRejectTelegramProof: (userEmail: string, taskId: string) => Promise<void>;
    adminApproveFacebookProof: (userEmail: string, taskId: string) => Promise<void>;
    adminRejectFacebookProof: (userEmail: string, taskId: string) => Promise<void>;
    adminApproveInstagramProof: (userEmail: string, taskId: string) => Promise<void>;
    adminRejectInstagramProof: (userEmail: string, taskId: string) => Promise<void>;
    adminApproveTwitterProof: (userEmail: string, taskId: string) => Promise<void>;
    adminRejectTwitterProof: (userEmail: string, taskId: string) => Promise<void>;
    adminApproveTikTokProof: (userEmail: string, taskId: string) => Promise<void>;
    adminRejectTikTokProof: (userEmail: string, taskId: string) => Promise<void>;
    adminApproveAppDownloadProof: (userEmail: string, taskId: string) => Promise<void>;
    adminRejectAppDownloadProof: (userEmail: string, taskId: string) => Promise<void>;
    adminApproveOtherProof: (userEmail: string, taskId: string) => Promise<void>;
    adminRejectOtherProof: (userEmail: string, taskId: string) => Promise<void>;
    adminApproveDepositProof: (userEmail: string, depositId: string) => Promise<void>;
    adminRejectDepositProof: (userEmail: string, depositId: string) => Promise<void>;
    
    adminUpdateTaskProofStatus: (userEmail: string, taskId: string, taskType: string, status: Proof['status']) => Promise<void>;
    
    adminRemoveProof: (userEmail: string, taskId: string, type: string) => Promise<void>;
    adminUpdateWithdrawalStatus: (userEmail: string, id: string, status: Withdrawal['status']) => Promise<void>;
    adminUpdateUserBalance: (userEmail: string, token: string, newBalance: number) => Promise<void>;
    adminToggleUserBlock: (userEmail: string, block: boolean, uid?: string) => Promise<void>;
    
    toggleTheme: () => void;
    addBalance: (amount: number, token: Token) => Promise<void>;
    triggerAd: (type: 'interstitial' | 'rewarded') => Promise<void>;
    closeAd: () => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);
