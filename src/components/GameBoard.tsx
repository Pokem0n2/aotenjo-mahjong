import React, { useState, useCallback } from 'react';
import TileTable from './TileTable';
import { GameState, TileId, ALL_TILES } from '../types/mahjong';
import styles from '../styles/GameBoard.module.css';

const createInitialDeck = (): TileId[] => {
  const deck: TileId[] = [];
  for (const tile of ALL_TILES) {
    for (let i = 0; i < 4; i++) {
      deck.push(tile);
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const createInitialState = (): GameState => {
  const deck = createInitialDeck();
  const players = Array(4).fill(null).map(() => ({
    hand: [] as TileId[],
    melds: [],
    discards: [] as TileId[],
    riichi: false,
    riichiSticks: 0,
  }));

  // 发牌 - 每人13张，最后一张给庄家
  for (let i = 0; i < 13 * 4; i++) {
    players[i % 4].hand.push(deck[i]);
  }
  players[0].hand.push(deck[13 * 4]); // 庄家多一张

  return {
    phase: 'discard',
    deck,
    deckIndex: 13 * 4 + 1,
    currentPlayer: 0,
    players,
    doraIndicators: [deck[13 * 4 + 1]],
    round: 1,
    honba: 0,
    riichiSticks: 0,
    scores: [25000, 25000, 25000, 25000],
    oya: 0,
  };
};

interface GameBoardProps {
  onScoreUpdate?: (scores: number[]) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ onScoreUpdate }) => {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
  const [message, setMessage] = useState<string>('请选择并打出的一张牌');

  const canRon = useCallback((playerIndex: number): boolean => {
    if (playerIndex === gameState.currentPlayer) return false;
    if (!gameState.lastDiscard) return false;
    return true;
  }, [gameState.lastDiscard, gameState.currentPlayer]);

  const handleTileSelect = (index: number) => {
    if (gameState.phase !== 'discard') return;
    setSelectedIndex(index);
    setMessage(`已选择 ${gameState.players[gameState.currentPlayer].hand[index]}，请打出`);
  };

  const handleDiscard = (tile: TileId) => {
    const player = gameState.players[gameState.currentPlayer];
    const tileIndex = player.hand.indexOf(tile);
    const newHand = player.hand.filter((_, i) => i !== tileIndex);
    
    const newPlayers = [...gameState.players];
    newPlayers[gameState.currentPlayer] = {
      ...player,
      hand: newHand,
      discards: [...player.discards, tile],
    };

    const canRonPlayers = newPlayers
      .map((_, i) => i)
      .filter(i => i !== gameState.currentPlayer && canRon(i));

    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      lastDiscard: tile,
      lastDiscardPlayer: prev.currentPlayer,
      phase: canRonPlayers.length > 0 ? 'ron' : 'draw',
    }));

    setSelectedIndex(undefined);

    if (canRonPlayers.length > 0) {
      setMessage('等待其他玩家胡牌...');
      setTimeout(() => {
        setGameState(prev => {
          const nextPlayer = (prev.currentPlayer + 1) % 4;
          const drawTile = prev.deck[prev.deckIndex];
          const updatedPlayers = [...prev.players];
          updatedPlayers[nextPlayer] = {
            ...updatedPlayers[nextPlayer],
            hand: [...updatedPlayers[nextPlayer].hand, drawTile],
          };
          return {
            ...prev,
            players: updatedPlayers,
            deckIndex: prev.deckIndex + 1,
            currentPlayer: nextPlayer,
            phase: 'discard',
          };
        });
        setMessage('请选择并打出一张牌');
      }, 1000);
    } else {
      const nextPlayer = (gameState.currentPlayer + 1) % 4;
      const drawTile = gameState.deck[gameState.deckIndex];
      
      const newState: GameState = { 
        ...gameState, 
        players: newPlayers,
        lastDiscard: tile,
        lastDiscardPlayer: gameState.currentPlayer,
      };
      newState.players[nextPlayer].hand.push(drawTile);
      newState.deckIndex++;
      newState.currentPlayer = nextPlayer;
      newState.phase = 'discard';
      
      setGameState(newState);
      setMessage('请选择并打出一张牌');
    }
  };

  const handleDraw = () => {
    if (gameState.phase !== 'draw') return;
    
    const drawTile = gameState.deck[gameState.deckIndex];
    const newPlayers = [...gameState.players];
    newPlayers[gameState.currentPlayer].hand.push(drawTile);
    
    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      deckIndex: prev.deckIndex + 1,
      phase: 'discard',
    }));
    
    setMessage(`摸到 ${drawTile}，请选择并打出一张牌`);
  };

  const handleTsumo = () => {
    const currentPlayer = gameState.currentPlayer;
    
    setGameState(prev => {
      const newScores = [...prev.scores];
      newScores[currentPlayer] += 3000 * (prev.honba + 1);
      onScoreUpdate?.(newScores);
      return {
        ...prev,
        phase: 'end',
        scores: newScores,
        honba: prev.honba + 1,
      };
    });
    
    setMessage(`自摸！玩家${currentPlayer + 1}获胜！得分 +${3000 * (gameState.honba + 1)}`);
  };

  const handleNewGame = () => {
    setGameState(createInitialState());
    setSelectedIndex(undefined);
    setMessage('请选择并打出一张牌');
  };

  const currentTile = selectedIndex !== undefined 
    ? gameState.players[gameState.currentPlayer].hand[selectedIndex] 
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>青云之志麻将</h1>
        <div className={styles.scores}>
          {gameState.scores.map((score, i) => (
            <div key={i} className={styles.scoreItem}>
              <span className={styles.playerName}>{['东', '南', '西', '北'][i]}</span>
              <span className={styles.scoreValue}>{score}</span>
            </div>
          ))}
        </div>
      </div>

      <TileTable
        players={gameState.players}
        currentPlayer={gameState.currentPlayer}
        selectedIndex={selectedIndex}
        onSelectTile={handleTileSelect}
        onDiscard={handleDiscard}
        canDiscard={gameState.phase === 'discard' && selectedIndex !== undefined}
        lastDiscard={gameState.lastDiscard}
        deckIndex={gameState.deckIndex}
        totalDeck={gameState.deck.length}
      />

      <div className={styles.controls}>
        <div className={styles.message}>{message}</div>
        
        {gameState.phase === 'discard' && selectedIndex !== undefined && currentTile && (
          <button
            className={styles.discardBtn}
            onClick={() => handleDiscard(currentTile)}
          >
            打出 {currentTile}
          </button>
        )}

        {gameState.phase === 'draw' && (
          <button className={styles.drawBtn} onClick={handleDraw}>
            摸牌
          </button>
        )}

        {gameState.phase === 'discard' && (
          <button className={styles.tsumoBtn} onClick={handleTsumo}>
            自摸
          </button>
        )}

        {gameState.phase === 'end' && (
          <button className={styles.newGameBtn} onClick={handleNewGame}>
            新游戏
          </button>
        )}
      </div>

      <div className={styles.info}>
        <span>回合: {gameState.round}</span>
        <span>本场: {gameState.honba}</span>
        <span>立直棒: {gameState.riichiSticks}</span>
      </div>
    </div>
  );
};

export default GameBoard;
