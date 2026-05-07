import React from 'react';
import { TileId } from '../types/mahjong';
import styles from '../styles/Tile.module.css';

interface TileProps {
  tile: TileId;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  highlighted?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
}

export const Tile: React.FC<TileProps> = ({
  tile,
  size = 'medium',
  selected = false,
  highlighted = false,
  faceDown = false,
  onClick,
}) => {
  const classNames = [
    styles.tile,
    styles[size],
    selected && styles.selected,
    highlighted && styles.highlighted,
    faceDown && styles.faceDown,
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {faceDown ? (
        <div className={styles.back} />
      ) : (
        <img
          src={`/tiles/${tile}.png`}
          alt={tile}
          className={styles.image}
          draggable={false}
        />
      )}
    </div>
  );
};

export default Tile;
