import React from 'react';
import { Hand as HandType, TileId } from '../types/mahjong';
import Tile from './Tile';
import styles from '../styles/Hand.module.css';

interface HandProps {
  tiles: HandType;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  onDiscard?: (tile: TileId) => void;
  canDiscard?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Hand: React.FC<HandProps> = ({
  tiles,
  selectedIndex,
  onSelect,
  onDiscard,
  canDiscard = false,
  size = 'medium',
}) => {
  // 排序手牌
  const sortedTiles = [...tiles].sort((a, b) => {
    const suitOrder = { m: 0, p: 1, s: 2, z: 3 };
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    const aSuit = a[a.length - 1] as keyof typeof suitOrder;
    const bSuit = b[b.length - 1] as keyof typeof suitOrder;
    
    if (aSuit !== bSuit) return suitOrder[aSuit] - suitOrder[bSuit];
    return aNum - bNum;
  });

  const handleTileClick = (index: number, tile: TileId) => {
    if (canDiscard && onDiscard) {
      onDiscard(tile);
    } else if (onSelect) {
      onSelect(index);
    }
  };

  return (
    <div className={styles.hand}>
      <div className={styles.tiles}>
        {sortedTiles.map((tile, index) => (
          <Tile
            key={`${tile}-${index}`}
            tile={tile}
            size={size}
            selected={selectedIndex === index}
            onClick={() => handleTileClick(index, tile)}
          />
        ))}
      </div>
    </div>
  );
};

export default Hand;
