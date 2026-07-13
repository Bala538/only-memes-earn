
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import GameControllerIcon from './icons/GameControllerIcon';
import TokenIcon from './icons/TokenIcon';
import PlayCircleIcon from './icons/PlayCircleIcon';
import { Game } from '../types';
import { triggerHapticFeedback } from '../utils/telegramUtils';

const DEFAULT_GAME: Game = {
    id: 'official-tap-game',
    title: 'Tap to Earn (Official)',
    description: 'Tap, Mine, and Upgrade! The official earning game.',
    gameUrl: 'local', // Identifier for internal game logic
    imageUrl: 'https://i.postimg.cc/RZTZLQT6/IMG-20251121-174619-657.jpg',
    reward: 0, // Score based
    rewardToken: 'USHA',
    timerSeconds: 0, // Endless
    maxEnergy: 5000,
    earningLimit: 0
};

const GamesView: React.FC = () => {
    const { state, playGame } = useContext(AppContext);

    // Combine default game with dynamic games
    const displayGames = [DEFAULT_GAME, ...state.games];

    return (
        <div className="pt-20 pb-24 px-4 max-w-screen-md mx-auto min-h-screen">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <GameControllerIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Play & Earn</h1>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {displayGames.map(game => (
                    <div 
                        key={game.id} 
                        onClick={() => {
                            triggerHapticFeedback('light');
                            playGame(game);
                        }}
                        className="bg-white dark:bg-[#161B22] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-all group relative"
                    >
                        {game.id === 'official-tap-game' && (
                            <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                OFFICIAL
                            </div>
                        )}
                        <div className="aspect-square bg-gray-200 dark:bg-gray-800 relative">
                            {game.imageUrl ? (
                                <img src={game.imageUrl} alt={game.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                                    <GameControllerIcon className="w-12 h-12 text-white opacity-80" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlayCircleIcon className="w-12 h-12 text-white drop-shadow-lg" />
                            </div>
                            {game.reward > 0 && (
                                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-yellow-400 flex items-center space-x-1">
                                    <TokenIcon token={game.rewardToken} className="w-3 h-3" />
                                    <span>+{game.reward}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate">{game.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{game.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GamesView;
