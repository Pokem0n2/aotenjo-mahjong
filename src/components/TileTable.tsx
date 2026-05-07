import React from 'react';
import { TileId, PlayerState } from '../types/mahjong';
import Hand from './Hand';
import Tile from './Tile';
import styles from '../styles/TileTable.module.css';

interface TileTableProps {
  players: PlayerState[];
  currentPlayer: number;
  selectedIndex?: number;
  onSelectTile?: (index: number) => void;
  onDiscard?: (tile: TileId) => void;
  canDiscard?: boolean;
  lastDiscard?: TileId;
  deckIndex: number;
  totalDeck: number;
}

export const TileTable: React.FC<TileTableProps> = ({
  players,
  currentPlayer,
  selectedIndex,
  onSelectTile,
  onDiscard,
  canDiscard = false,
  lastDiscard,
  deckIndex,
  totalDeck,
}) => {
  const currentHand = players[currentPlayer]?.hand || [];

  return (
    <div className={styles.table}>
      {/* 牌山指示器 */}
      <div className={styles.deckInfo}>
        <span>牌山: {deckIndex}/{totalDeck}</span>
      </div>

      {/* 四个玩家位置 */}
      <div className={styles.playerNorth}>
        <div className={styles.playerLabel}>北</div>
        <div className={styles.discardArea}>
          {players[0]?.discards.slice(-6).map((tile, i) => (
            <Tile key={i} tile={tile} size="small" />
          ))}
        </div>
      </div>

      <div className={styles.playerWest}>
        <div className={styles.playerLabel}>西</div>
        <div className={styles.discardArea}>
          {players[3]?.discards.slice(-6).map((tile, i) => (
            <Tile key={i} tile={tile} size="small" />
          ))}
        </div>
      </div>

      <div className={styles.playerEast}>
        <div className={styles.playerLabel}>东</div>
        <div className={styles.discardArea}>
          {players[1]?.discards.slice(-6).map((tile, i) => (
            <Tile key={i} tile={tile} size="small" />
          ))}
        </div>
      </div>

      <div className={styles.playerSouth}>
        <div className={styles.playerLabel}>南</div>
        <div className={styles.discardArea}>
          {players[2]?.discards.slice(-6).map((tile, i) => (
            <Tile key={i} tile={tile} size="small" />
          ))}
        </div>
      </div>

      {/* 中心区域 - 最后打出的牌 */}
      <div className={styles.centerArea}>
        {lastDiscard && (
          <div className={styles.lastDiscard}>
            <span className={styles.label}>最后</span>
            <Tile tile={lastDiscard} size="medium" highlighted />
          </div>
        )}
      </div>

      {/* 玩家手牌区域 */}
      <div className={styles.playerHandArea}>
        <div className={styles.handWrapper}>
          <Hand
            tiles={currentHand}
            selectedIndex={selectedIndex}
            onSelect={onSelectTile}
            onDiscard={canDiscard ? onDiscard : undefined}
            canDiscard={canDiscard}
            size="medium"
          />
        </div>
      </div>

      {/* 当前玩家指示 */}
      <div className={styles.currentIndicator}>
        当前: {['东', '南', '西', '北'][currentPlayer]}
      </div>
    </div>
  );
};

export default TileTable;
