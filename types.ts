
export type Token = string; 
export const DEFAULT_TOKENS: Token[] = ['USHA', 'BabyDoge', 'SHIB', 'PEPE', 'Lucky', 'Quack', 'Kishu'];
export const COINS = DEFAULT_TOKENS; 

export interface TokenConfig {
    symbol: string;
    name: string;
    logoUrl: string;
}

export type ActiveTab = 'home' | 'tasks' | 'games' | 'profile' | 'exchange' | 'referral' | 'markets';
export type VerificationMethod = 'screenshot' | 'code' | 'both' | 'timer';

export interface Video {
    id: string;
    title: string;
    description: string;
    url: string;
    rewardToken: Token;
    rewardPerSecond: number;
    timerInSeconds?: number;
    limit?: number; 
    dailyLimit?: number;
    endTime?: string;
    taskType?: 'video' | 'youtube' | 'telegram' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'app_download' | 'other';
    verificationMethod?: VerificationMethod;
    correctCode?: string;
    claimCount?: number;
    dailyClaimCount?: number;
    lastClaimDate?: string;
}

export interface BaseSocialTask {
    id: string;
    title: string;
    description: string;
    reward: number;
    rewardToken: Token;
    timerInSeconds?: number;
    limit?: number; 
    dailyLimit?: number; 
    endTime?: string;
    verificationMethod?: VerificationMethod;
    correctCode?: string;
    claimCount?: number;
    dailyClaimCount?: number;
    lastClaimDate?: string; 
}

export interface YouTubeTask extends BaseSocialTask { youtubeUrl: string; }
export interface FacebookTask extends BaseSocialTask { facebookUrl: string; }
export interface InstagramTask extends BaseSocialTask { instagramUrl: string; }
export interface TwitterTask extends BaseSocialTask { twitterUrl: string; }
export interface TikTokTask extends BaseSocialTask { tiktokUrl: string; }
export interface AppDownloadTask extends BaseSocialTask { downloadUrl: string; }
export interface OtherTask extends BaseSocialTask { taskUrl: string; }

export interface Banner { id: string; imageUrl: string; linkUrl?: string; title?: string; description?: string; active: boolean; }
export interface PromoCode { id: string; code: string; reward: number; rewardToken: Token; maxUses?: number; currentUses: number; expiryDate?: string; }
export interface SwapOption { token: Token; rate: number; enabled: boolean; }
export interface DepositMethod { label: string; value: string; }

export interface Game {
    id: string;
    title: string;
    description: string;
    gameUrl: string;
    imageUrl: string;
    reward: number;
    rewardToken: Token;
    timerSeconds: number;
    maxEnergy?: number;
    earningLimit?: number;
    gameTokenName?: string;
    minWithdraw?: number;
    minDeposit?: number;
    levelImages?: string[];
    swapOptions?: SwapOption[];
    depositConfig?: { enabled: boolean; methods: DepositMethod[]; };
}

export interface MineUpgrade {
    id: string;
    name: string;
    category: string;
    baseCost: number;
    baseProfit: number;
    icon: string;
    description?: string;
    costMultiplier?: number;
    maxLevel?: number;
    dependency?: { id: string; level: number; };
}

export interface Withdrawal { id: string; amount: number; recipientAddress: string; timestamp: string; status: 'pending' | 'processing' | 'completed' | 'rejected'; token: Token; method: 'email' | 'mobile' | 'uid'; exchange?: string; gameUid?: string; uidScreenshotUrl?: string; }
export interface Proof { proofUrl: string; codeSubmitted?: string; status: 'started' | 'pending' | 'processing' | 'approved' | 'rejected' | 'claimed'; taskTitle: string; reward: number; rewardToken: Token; submittedAt: string; startedAt?: string; approvedAt?: string; }
export interface Transaction { id: number; type: 'Swap' | 'Earned' | 'Mining' | 'Deposit' | 'Withdraw' | 'Referral' | 'Refund'; amount: string; date: string; isPositive: boolean; token?: string; }

export interface TapGameData {
    score: number;
    energy: number;
    remainingLimit: number;
    lastUpdated: string;
    history: Transaction[];
    dailyBoosts?: number;
    lastBoostReset?: string;
    multitapLevel?: number;
    energyLimitLevel?: number;
    dailyRewardStreak?: number;
    lastDailyRewardClaim?: string;
    lastCipherClaim?: string;
    lastComboClaim?: string;
    mineLevel?: Record<string, number>;
    dailyComboFound?: string[];
    selectedExchange?: string;
}

export interface ReferralStats { totalReferrals: number; totalEarned: Partial<Record<Token, number>>; }

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
    read?: boolean;
    userId?: string;
    link?: string;
}

export interface UserData {
    docId?: string;
    uid?: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    isAdmin: boolean;
    emailVerified: boolean;
    isBlocked?: boolean;
    lastActive?: string;
    gameUid?: string;
    uidScreenshotUrl?: string;
    isUidVerified?: boolean;
    exchangeUids?: Record<string, string>;
    exchangeScreenshotUrls?: Record<string, string>;
    pendingExchange?: string;
    pendingExchangeUids?: Record<string, string>;
    pendingExchangeScreenshots?: Record<string, string>;
    rejectedExchangeUids?: Record<string, boolean>;
    balance: Record<Token, number>;
    videoProofs: Record<string, Proof>;
    youtubeTaskProofs: Record<string, Proof>;
    facebookTaskProofs: Record<string, Proof>;
    instagramTaskProofs: Record<string, Proof>;
    twitterTaskProofs: Record<string, Proof>;
    tiktokTaskProofs: Record<string, Proof>;
    appDownloadTaskProofs: Record<string, Proof>;
    otherTaskProofs: Record<string, Proof>;
    depositProofs: Record<string, Proof>;
    withdrawals: Withdrawal[];

    referralCode: string;
    referredByEmail?: string;
    tapGameData?: TapGameData;
    referralStats?: ReferralStats;
    redeemedPromoCodes?: string[];
    airdropAddress?: string;
    notifications?: AppNotification[];
    openOrders?: Order[];
    positions?: Position[];
}

export interface WithdrawalSetting { minAmount: number; dailyLimit: number; dailyCountLimit?: number; exchangeName: string; methodLabel: string; network: string; enabled: boolean; swapRate: number; swapFee: number; depositAddress?: string; depositEnabled?: boolean; depositQrCodeUrl?: string; }
export interface DailyConfig { cipher: string; combo: string[]; cipherReward?: number; comboReward?: number; }
export interface ReferralConfig { amount: number; token: Token; enabled: boolean; }
export interface AirdropConfig { title: string; description: string; imageUrl: string; isActive: boolean; date?: string; allowAddressSubmission: boolean; }
export interface AuthConfig { imageUrl: string; authImageUrl?: string; backgroundImageUrl?: string; welcomeTitle: string; welcomeHeadline: string; enableEmailAuth: boolean; enableGoogleAuth: boolean; enableFacebookAuth: boolean; maintenanceMode?: boolean; maintenanceMessage?: string; }
export interface AdsConfig { 
    enabled: boolean; 
    adMobPublisherId: string; 
    bannerUnitId?: string; 
    interstitialUnitId?: string; 
    rewardedUnitId?: string;
    homeBannerSlotId?: string; 
    rewardTitle?: string;
    rewardAmount?: number;
    rewardToken?: Token;
}

export interface AdModalState {
    visible: boolean;
    type: 'interstitial' | 'rewarded';
}

export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface Order {
    id: string;
    pair: string;
    type: 'buy' | 'sell';
    orderType: 'limit' | 'market';
    amount: number;
    price: number;
    status: 'open' | 'filled' | 'canceled';
    timestamp: number;
}

export interface Position {
    pair: string;
    amount: number;
    entryPrice: number;
    liquidationPrice?: number;
    pnl?: number;
}

export interface OrderBookItem {
    price: number;
    amount: number;
    userId?: string;
    orderId?: string;
}

export interface Trade {
    id: string;
    time: string;
    price: number;
    amount: number;
    type: 'buy' | 'sell';
}

export interface MarketPair {
    id: string;
    base: string;
    quote: string;
    price: number;
    change24h: number;
    volume: number;
    candles: Candle[];
    bids?: OrderBookItem[];
    asks?: OrderBookItem[];
    trades?: Trade[];
}

export interface AppState {
    availableTokens: Token[];
    tokenConfigs: Record<string, TokenConfig>;
    tokenLogos: Record<string, string>;
    markets: MarketPair[];
    videos: Video[];
    games: Game[];
    mineUpgrades: MineUpgrade[];
    dailyComboCards: string[];
    dailyCipherCode: string;
    dailySchedule: Record<string, DailyConfig>;
    banners: Banner[];
    promoCodes: PromoCode[];
    youtubeTasks: YouTubeTask[];
    facebookTasks: FacebookTask[];
    instagramTasks: InstagramTask[];
    twitterTasks: TwitterTask[];
    tiktokTasks: TikTokTask[];
    appDownloadTasks: AppDownloadTask[];
    otherTasks: OtherTask[];
    withdrawalSettings: Record<Token, WithdrawalSetting>;
    referralConfig: ReferralConfig;
    airdropConfig: AirdropConfig;
    authConfig: AuthConfig;
    adsConfig: AdsConfig;
    currentUser: UserData | null;
    allUsers: UserData[];
    isAdminView: boolean;
    imagePreview: { visible: boolean; imageUrl: string; };
    playingGame: Game | null;
    theme: 'light' | 'dark';
    adModal: AdModalState;
    ushaPrice: number;
    loading: boolean;
    exchanges: { name: string; enabled: boolean }[];
    adminLogs: AdminLog[];
}

export interface AdminLog {
    id: string;
    adminEmail: string;
    action: string;
    details: string;
    timestamp: string;
}

export type AppAction =
    | { type: 'LOGIN_SUCCESS'; payload: UserData }
    | { type: 'LOGOUT' }
    | { type: 'SET_VIDEOS'; payload: Video[] }
    | { type: 'SET_GAMES'; payload: Game[] }
    | { type: 'SET_YOUTUBE_TASKS'; payload: YouTubeTask[] }
    | { type: 'SET_FACEBOOK_TASKS'; payload: FacebookTask[] }
    | { type: 'SET_INSTAGRAM_TASKS'; payload: InstagramTask[] }
    | { type: 'SET_TWITTER_TASKS'; payload: TwitterTask[] }
    | { type: 'SET_TIKTOK_TASKS'; payload: TikTokTask[] }
    | { type: 'SET_APP_DOWNLOAD_TASKS'; payload: AppDownloadTask[] }
    | { type: 'SET_OTHER_TASKS'; payload: OtherTask[] }
    | { type: 'SET_BANNERS'; payload: Banner[] }
    | { type: 'SET_PROMO_CODES'; payload: PromoCode[] }
    | { type: 'UPDATE_WITHDRAWAL_SETTINGS'; payload: Record<Token, WithdrawalSetting> }
    | { type: 'UPDATE_REFERRAL_CONFIG'; payload: ReferralConfig }
    | { type: 'UPDATE_AIRDROP_CONFIG'; payload: AirdropConfig }
    | { type: 'UPDATE_AUTH_CONFIG'; payload: AuthConfig }
    | { type: 'UPDATE_ADS_CONFIG'; payload: AdsConfig }
    | { type: 'SET_AVAILABLE_TOKENS'; payload: Token[] }
    | { type: 'SET_TOKEN_CONFIGS'; payload: Record<string, TokenConfig> }
    | { type: 'UPDATE_TOKEN_LOGO'; payload: { token: Token, url: string } }
    | { type: 'SET_MINE_UPGRADES'; payload: MineUpgrade[] }
    | { type: 'SET_DAILY_SCHEDULE'; payload: Record<string, DailyConfig> }
    | { type: 'SET_ALL_USERS', payload: UserData[] }
    | { type: 'SET_ADMIN_LOGS', payload: AdminLog[] }
    | { type: 'TOGGLE_VIEW' }
    | { type: 'SHOW_IMAGE_PREVIEW'; payload: string }
    | { type: 'HIDE_IMAGE_PREVIEW' }
    | { type: 'START_GAME'; payload: Game }
    | { type: 'END_GAME' }
    | { type: 'TOGGLE_THEME' }
    | { type: 'REFRESH_USER_STATE', payload: Partial<UserData> }
    | { type: 'SHOW_AD', payload: 'interstitial' | 'rewarded' }
    | { type: 'HIDE_AD' }
    | { type: 'UPDATE_MARKET_PRICE'; payload: { pair: string; price: number } }
    | { type: 'SET_MARKETS'; payload: MarketPair[] }
    | { type: 'SET_USHA_PRICE'; payload: number }
    | { type: 'SET_LOADING', payload: boolean }
    | { type: 'SET_EXCHANGES'; payload: { name: string; enabled: boolean }[] };
