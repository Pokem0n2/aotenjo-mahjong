import React, { useState, useCallback } from 'react';
import { GameModeState } from '../engine/game';
import { TileId, TILE_NAMES, ALL_TILE_IDS } from '../types/tile';
import styles from '../styles/QingyunGame.module.css';

interface QingyunGameProps {
  gameState: GameModeState;
  onStartNewRun: () => void;
  onEnterFloor: (floor: number) => void;
  onSelectTile: (index: number) => void;
  onDiscard: () => void;
  onTsumo: () => void;
  onRiichi: () => void;
  onUniversalDraw: (tileId: TileId) => void;
  onBuyItem: (itemId: string) => void;
  onRefreshShop: () => void;
  onReturnToSelect: () => void;
}

const QingyunGame: React.FC<QingyunGameProps> = ({
  gameState,
  onStartNewRun,
  onEnterFloor,
  onSelectTile,
  onDiscard,
  onTsumo,
  onRiichi,
  onUniversalDraw,
  onBuyItem,
  onRefreshShop,
  onReturnToSelect,
}) => {
  const { screen, player, battle, shop, message, level } = gameState;

  // 万能天引弹窗
  const [showUniversalPicker, setShowUniversalPicker] = useState(false);

  const renderTitle = () => (
    <div className={styles.titleScreen}>
      <h1 className={styles.gameTitle}>青云之志</h1>
      <p className={styles.subtitle}>雀魂Roguelike麻将</p>
      <div className={styles.titleButtons}>
        <button className={styles.startBtn} onClick={onStartNewRun}>
          开始新局
        </button>
      </div>
      <div className={styles.rules}>
        <h3>游戏规则</h3>
        <ul>
          <li>通过胡牌对敌人造成伤害</li>
          <li>每回合敌人会自动攻击你</li>
          <li>通关获得星币，在商店购买护身符强化</li>
          <li>万能天引：每局3次，抽取指定牌</li>
          <li>攀登25层高峰，成为传说！</li>
        </ul>
      </div>
    </div>
  );

  const renderFloorSelect = () => (
    <div className={styles.floorSelect}>
      <div className={styles.playerStatus}>
        <span>HP: {player.hp}/{player.maxHp}</span>
        <span>星币: {player.starCoin}</span>
        <span>总分: {player.totalScore}</span>
        <span>层数: {level.currentFloor}/{level.maxFloor}</span>
      </div>
      <h2>选择楼层</h2>
      <div className={styles.floorGrid}>
        {Array.from({ length: level.maxFloor }, (_, i) => i + 1).map(floor => {
          const isUnlocked = level.unlockedFloors.includes(floor);
          const isCleared = level.clearedFloors.has(floor);
          const isCurrent = level.currentFloor === floor;

          return (
            <button
              key={floor}
              className={`${styles.floorBtn} ${isCleared ? styles.cleared : ''} ${isCurrent ? styles.current : ''} ${!isUnlocked ? styles.locked : ''}`}
              onClick={() => isUnlocked && onEnterFloor(floor)}
              disabled={!isUnlocked}
            >
              <span className={styles.floorNum}>{floor}</span>
              {isCleared && <span className={styles.clearMark}>✓</span>}
              {floor % 5 === 0 && <span className={styles.bossMark}>BOSS</span>}
              {floor % 3 === 0 && !isCleared && <span className={styles.shopMark}>商</span>}
            </button>
          );
        })}
      </div>
      <div className={styles.message}>{message}</div>
    </div>
  );

  const renderBattle = () => {
    if (!battle) return null;

    return (
      <div className={styles.battleScreen}>
        {/* 敌人区域 */}
        <div className={styles.enemyArea}>
          {battle.currentEnemy && (
            <>
              <div className={styles.enemyInfo}>
                <span className={styles.enemyName}>{battle.currentEnemy.name}</span>
                <div className={styles.enemyHpBar}>
                  <div
                    className={styles.enemyHpFill}
                    style={{ width: `${(battle.enemyHp / battle.enemyMaxHp) * 100}%` }}
                  />
                </div>
                <span className={styles.enemyHpText}>{battle.enemyHp}/{battle.enemyMaxHp}</span>
              </div>
              <div className={styles.enemyDesc}>{battle.currentEnemy.desc}</div>
            </>
          )}
        </div>

        {/* 宝牌显示 */}
        <div className={styles.doraArea}>
          <span className={styles.doraLabel}>宝牌:</span>
          {battle.doraTiles.map((t, i) => (
            <img key={i} src={`/tiles/${t.id}.png`} alt={t.id} className={styles.doraTile} />
          ))}
        </div>

        {/* 手牌区域 */}
        <div className={styles.handArea}>
          <h3>你的手牌</h3>
          <div className={styles.handTiles}>
            {battle.hand.tiles.map((tile, index) => (
              <button
                key={`${tile.id}-${index}`}
                className={`${styles.tileBtn} ${battle.selectedTileIndex === index ? styles.selected : ''} ${tile.id === 'universal' ? styles.universal : ''}`}
                onClick={() => onSelectTile(index)}
              >
                <img
                  src={tile.id === 'universal' ? `/tiles/${(tile as any).originalId || '5z'}.png` : `/tiles/${tile.id}.png`}
                  alt={tile.id}
                  className={styles.tileImg}
                />
                {tile.id === 'universal' && <span className={styles.universalBadge}>万能</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 状态信息 */}
        <div className={styles.battleInfo}>
          <div className={styles.infoRow}>
            <span>向听数: {battle.shanten?.shanten ?? '?'}</span>
            <span>形态: {battle.shanten?.form === 'standard' ? '一般' : battle.shanten?.form === 'chiitoitsu' ? '七对' : '国士'}</span>
            <span>回合: {battle.turnCount}</span>
          </div>
          {battle.tenpaiTiles.length > 0 && (
            <div className={styles.tenpaiInfo}>
              <span>听牌: </span>
              {battle.tenpaiTiles.map(t => (
                <img key={t} src={`/tiles/${t}.png`} alt={t} className={styles.tenpaiTile} />
              ))}
            </div>
          )}
          {battle.isRiichi && <span className={styles.riichiBadge}>立直中</span>}
        </div>

        {/* 操作按钮 */}
        <div className={styles.battleControls}>
          <button
            className={`${styles.discardBtn} ${battle.selectedTileIndex === null ? styles.btnDisabled : ''}`}
            onClick={onDiscard}
            disabled={battle.selectedTileIndex === null}
            title={battle.selectedTileIndex === null ? '请先选择一张牌' : '打出选中的牌'}
          >
            出牌
          </button>
          <button
            className={`${styles.riichiBtn} ${!battle.canRiichi ? styles.btnDisabled : ''}`}
            onClick={onRiichi}
            disabled={!battle.canRiichi}
            title={battle.canRiichi ? '宣言立直（听牌后可用）' : battle.shanten?.shanten === 0 ? '已立直' : `还差${battle.shanten?.shanten ?? '?'}张才能听牌`}
          >
            立直
          </button>
          <button
            className={`${styles.tsumoBtn} ${!battle.canTsumo ? styles.btnDisabled : ''}`}
            onClick={onTsumo}
            disabled={!battle.canTsumo}
            title={battle.canTsumo ? '自摸和牌！' : '未满足和牌条件'}
          >
            自摸
          </button>
          <button
            className={`${styles.universalBtn} ${battle.universalDrawsLeft <= 0 ? styles.btnDisabled : ''}`}
            onClick={() => setShowUniversalPicker(true)}
            disabled={battle.universalDrawsLeft <= 0}
            title={battle.universalDrawsLeft > 0 ? `抽取指定牌作为万能牌（剩余${battle.universalDrawsLeft}次）` : '万能天引次数已用完'}
          >
            万能天引 ({battle.universalDrawsLeft})
          </button>
        </div>

        {/* 万能天引选择器 */}
        {showUniversalPicker && (
          <div className={styles.universalPicker}>
            <h4>选择要抽取的牌</h4>
            <div className={styles.universalGrid}>
              {ALL_TILE_IDS.map(id => (
                <button
                  key={id}
                  className={styles.universalOption}
                  onClick={() => {
                    onUniversalDraw(id);
                    setShowUniversalPicker(false);
                  }}
                >
                  <img src={`/tiles/${id}.png`} alt={id} />
                  <span>{TILE_NAMES[id]}</span>
                </button>
              ))}
            </div>
            <button className={styles.closeBtn} onClick={() => setShowUniversalPicker(false)}>取消</button>
          </div>
        )}

        {/* 玩家状态 */}
        <div className={styles.playerStatusBar}>
          <span>HP: {player.hp}/{player.maxHp}</span>
          <div className={styles.playerHpBar}>
            <div className={styles.playerHpFill} style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
          </div>
          <span>星币: {player.starCoin}</span>
          <span>本局得分: {battle.scoreThisBattle}</span>
        </div>

        <div className={styles.message}>{message}</div>
      </div>
    );
  };

  const renderShop = () => {
    if (!shop) return null;

    return (
      <div className={styles.shopScreen}>
        <h2>商店</h2>
        <div className={styles.shopInfo}>
          <span>星币: {shop.starCoin}</span>
          <span>刷新费用: {shop.refreshCost}</span>
          <span>剩余刷新: {shop.maxRefreshes - shop.currentRefreshes}</span>
        </div>
        <div className={styles.shopItems}>
          {shop.items.map(item => (
            <div key={item.id} className={styles.shopItem}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={`${styles.itemRarity} ${styles[item.rarity || 'N']}`}>{item.rarity}</span>
              </div>
              <p className={styles.itemDesc}>{item.desc}</p>
              <div className={styles.itemFooter}>
                <span className={styles.itemCost}>{item.cost} 星币</span>
                <button
                  className={styles.buyBtn}
                  onClick={() => onBuyItem(item.id)}
                  disabled={shop.starCoin < item.cost}
                >
                  购买
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.shopControls}>
          <button className={styles.refreshBtn} onClick={onRefreshShop} disabled={shop.currentRefreshes >= shop.maxRefreshes}>
            刷新商店 ({shop.refreshCost}星币)
          </button>
          <button className={styles.leaveBtn} onClick={onReturnToSelect}>
            离开商店
          </button>
        </div>
        <div className={styles.message}>{message}</div>
      </div>
    );
  };

  const renderResult = () => {
    if (!battle) return null;

    const isVictory = battle.enemyHp <= 0;
    const enemyDamage = Math.floor(battle.scoreThisBattle / 10);

    return (
      <div className={styles.resultScreen}>
        <h2 className={`${styles.resultTitle} ${isVictory ? styles.victoryTitle : styles.partialTitle}`}>
          {isVictory ? '🎉 战斗胜利！' : '⚔️ 造成伤害'}
        </h2>
        <div className={styles.resultStats}>
          <div className={styles.resultSection}>
            <h4>和牌信息</h4>
            <p className={styles.resultScore}>得分: <span className={styles.highlightScore}>{battle.scoreThisBattle}</span></p>
            <p>番数: {battle.detectedYaku.reduce((sum, y) => sum + y.han, 0)}番</p>
            <p>符数: 20符</p>
          </div>

          <div className={styles.resultSection}>
            <h4>战斗效果</h4>
            <p className={styles.enemyDamage}>对敌人造成: <span className={styles.damageValue}>{enemyDamage}</span> 伤害</p>
            <p>敌人剩余HP: {battle.enemyHp}/{battle.enemyMaxHp}</p>
            <p>获得星币: <span className={styles.coinValue}>+{battle.starCoinThisBattle}</span></p>
          </div>

          <div className={styles.resultSection}>
            <h4>战斗统计</h4>
            <p>使用回合: {battle.turnCount}</p>
            <p>是否立直: {battle.isRiichi ? '是' : '否'}</p>
            <p>万能天引使用: {3 - battle.universalDrawsLeft}/3</p>
          </div>

          {battle.detectedYaku.length > 0 && (
            <div className={styles.resultYaku}>
              <h4>和了役种:</h4>
              <div className={styles.yakuList}>
                {battle.detectedYaku.map((y, i) => (
                  <span key={i} className={styles.yakuTag}>{y.yaku.name} {y.han}番</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className={styles.continueBtn} onClick={onReturnToSelect}>
          {isVictory ? '继续攀登' : '返回楼层选择'}
        </button>
      </div>
    );
  };

  const renderGameOver = () => (
    <div className={styles.gameOverScreen}>
      <h2 className={styles.gameOverTitle}>游戏结束</h2>
      <div className={styles.finalStats}>
        <p>到达层数: {level.currentFloor}</p>
        <p>总分: {player.totalScore}</p>
        <p>星币: {player.starCoin}</p>
      </div>
      <button className={styles.restartBtn} onClick={onStartNewRun}>
        重新开始
      </button>
    </div>
  );

  return (
    <div className={styles.gameContainer}>
      {screen === 'title' && renderTitle()}
      {screen === 'floor_select' && renderFloorSelect()}
      {screen === 'battle' && renderBattle()}
      {screen === 'shop' && renderShop()}
      {screen === 'result' && renderResult()}
      {screen === 'game_over' && renderGameOver()}
    </div>
  );
};

export default QingyunGame;
