import React, { useState, useCallback, useRef } from 'react';
import styles from '../styles/AotenjoGame.module.css';
import {
  GameState, LevelState, ItemCard, ItemSlot,
  createGameState, createLevel, generateShopChoices,
  addItemCard, updateItemsAfterLevel, updateItemsAfterWin,
  drawFromWall, checkWin, calculateBaseScore, applyItemEffects,
  tileToId
} from '../engine/aotenjo';
import { Tile } from '../types/tile';
import { handDiscard } from '../engine/hand';

// ========== 游戏画面类型 ==========
type Screen = 'title' | 'shop' | 'game' | 'result';

export default function AotenjoGame() {
  const [screen, setScreen] = useState<Screen>('title');
  const [gameState, setGameState] = useState<GameState>(createGameState());
  const [levelState, setLevelState] = useState<LevelState | null>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [message, setMessage] = useState('');
  const [scoreDetails, setScoreDetails] = useState<string[]>([]);
  const [scorePopup, setScorePopup] = useState<{ score: number; visible: boolean }>({ score: 0, visible: false });
  const [winEffect, setWinEffect] = useState<{ pattern: string; visible: boolean }>({ pattern: '', visible: false });
  const [shopSlotIndex, setShopSlotIndex] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // 使用ref来避免闭包问题
  const levelRef = useRef<LevelState | null>(null);
  const gameRef = useRef<GameState>(gameState);
  
  // 同步ref
  levelRef.current = levelState;
  gameRef.current = gameState;

  // ========== 开始新游戏 ==========
  const startNewGame = useCallback(() => {
    const newGame = createGameState();
    const choices = generateShopChoices();
    newGame.shopChoices = choices;
    setGameState(newGame);
    gameRef.current = newGame;
    setScreen('shop');
    setMessage('选择你的第一张道具卡！');
    setScoreDetails([]);
  }, []);

  // ========== 进入商店 ==========
  const enterShop = useCallback((slots: ItemSlot[]) => {
    const choices = generateShopChoices();
    setGameState(prev => {
      const newState = { ...prev, shopChoices: choices };
      gameRef.current = newState;
      return newState;
    });
    setScreen('shop');
    setMessage('选择一张道具卡！');
  }, []);

  // ========== 选择商店道具卡 ==========
  const selectShopCard = useCallback((card: ItemCard) => {
    const currentGame = gameRef.current;
    
    // 检查是否有空槽位
    const emptySlot = currentGame.itemSlots.findIndex(slot => !slot.card);
    
    if (emptySlot !== -1) {
      // 有空槽位，直接放入
      const newSlots = addItemCard(currentGame.itemSlots, card, emptySlot);
      setGameState(prev => {
        const newState = { ...prev, itemSlots: newSlots };
        gameRef.current = newState;
        return newState;
      });
      
      // 进入关卡
      startLevel(currentGame.level, newSlots);
    } else {
      // 槽位已满，需要选择替换
      setMessage('槽位已满！请选择要替换的槽位');
      setShopSlotIndex(0);
    }
  }, []);

  // ========== 替换槽位中的道具卡 ==========
  const replaceSlot = useCallback((slotIndex: number, card: ItemCard) => {
    const currentGame = gameRef.current;
    const newSlots = addItemCard(currentGame.itemSlots, card, slotIndex);
    setGameState(prev => {
      const newState = { ...prev, itemSlots: newSlots };
      gameRef.current = newState;
      return newState;
    });
    setShopSlotIndex(null);
    
    // 进入关卡
    startLevel(currentGame.level, newSlots);
  }, []);

  // ========== 开始关卡 ==========
  const startLevel = useCallback((level: number, itemSlots: ItemSlot[]) => {
    const levelData = createLevel(level, itemSlots);
    setLevelState(levelData);
    levelRef.current = levelData;
    setScreen('game');
    setMessage(`第 ${level} 关 - 目标: ${levelData.targetScore}分`);
    setScoreDetails([]);
    setSelectedTile(null);
    
    // 自动摸第一张牌
    setTimeout(() => {
      autoDraw(levelData);
    }, 800);
  }, []);

  // ========== 自动摸牌 ==========
  const autoDraw = useCallback((currentLevel: LevelState) => {
    const { newHand, tile, wall } = drawFromWall(currentLevel.wall, currentLevel.hand);
    
    if (!tile) {
      // 牌山已空，检查是否过关
      checkLevelComplete({ ...currentLevel, wall });
      return;
    }
    
    // 创建新的关卡状态
    const newLevel: LevelState = { 
      ...currentLevel, 
      hand: newHand, 
      wall: {
        ...wall,
        currentIndex: wall.currentIndex // 确保currentIndex被正确复制
      }
    };
    
    // 使用函数式更新确保状态正确
    setLevelState(prev => {
      if (!prev) return newLevel;
      return { ...prev, hand: newHand, wall: { ...wall, currentIndex: wall.currentIndex } };
    });
    levelRef.current = newLevel;
    
    // 强制触发重新渲染
    setForceUpdate(prev => prev + 1);
    
    // 检查是否胡牌（使用刚摸到的tile作为winningTile）
    const winResult = checkWin(newHand, tile);
    if (winResult.isWin) {
      setAnimating(false);
      handleWin(newLevel, winResult.pattern, winResult.fan, winResult.score);
    } else {
      setAnimating(false);
      setMessage(`摸到 ${tile.id}，请选择一张牌丢弃`);
    }
  }, []);

  // ========== 处理胡牌 ==========
  const handleWin = useCallback((currentLevel: LevelState, pattern: string, fan: number, winScore: number) => {
    const { finalScore, details, universalTiles } = applyItemEffects(
      winScore,
      pattern,
      currentLevel.itemSlots,
      currentLevel.hand
    );
    
    const newScore = currentLevel.currentScore + finalScore;
    const newTotalWins = currentLevel.totalWins + 1;
    
    const newLevel = {
      ...currentLevel,
      currentScore: newScore,
      lastWinScore: finalScore,
      totalWins: newTotalWins,
      itemSlots: updateItemsAfterWin(currentLevel.itemSlots, pattern)
    };
    
    setLevelState(newLevel);
    levelRef.current = newLevel;
    setScoreDetails(details);
    setMessage(`🎉 胡牌！${pattern} - 获得 ${finalScore}分 (累计: ${newScore})`);
    
    // 显示动画
    setScorePopup({ score: finalScore, visible: true });
    setWinEffect({ pattern, visible: true });
    
    setTimeout(() => {
      setScorePopup(prev => ({ ...prev, visible: false }));
      setWinEffect(prev => ({ ...prev, visible: false }));
    }, 2000);
    
    // 检查是否还有牌
    if (newLevel.wall.currentIndex >= newLevel.wall.tiles.length) {
      setTimeout(() => {
        checkLevelComplete(newLevel);
      }, 1500);
    } else {
      // 继续自动摸牌
      setTimeout(() => {
        autoDraw(newLevel);
      }, 1200);
    }
  }, []);

  // ========== 检查关卡是否完成 ==========
  const checkLevelComplete = useCallback((currentLevel: LevelState) => {
    if (currentLevel.currentScore >= currentLevel.targetScore) {
      // 过关
      const newLevel = currentLevel.level + 1;
      const updatedItems = updateItemsAfterLevel(currentLevel.itemSlots);
      
      setGameState(prev => {
        const newState = {
          ...prev,
          level: newLevel,
          totalScore: prev.totalScore + currentLevel.currentScore,
          itemSlots: updatedItems
        };
        gameRef.current = newState;
        return newState;
      });
      
      setMessage(`✅ 第 ${currentLevel.level} 关通过！得分: ${currentLevel.currentScore}`);
      setScreen('result');
    } else {
      // 失败
      setMessage(`❌ 第 ${currentLevel.level} 关失败！得分: ${currentLevel.currentScore}/${currentLevel.targetScore}`);
      setGameState(prev => {
        const newState = { ...prev, gameOver: true };
        gameRef.current = newState;
        return newState;
      });
      setScreen('result');
    }
  }, []);

  // ========== 玩家丢弃牌 ==========
  const discardTile = useCallback((tile: Tile) => {
    if (!levelState || animating) return;
    
    setAnimating(true);
    setSelectedTile(null);
    
    // 使用handDiscard正确移除牌
    const tileIndex = levelState.hand.tiles.findIndex(t => t.id === tile.id);
    if (tileIndex === -1) {
      setAnimating(false);
      return;
    }
    
    const { hand: newHand } = handDiscard(levelState.hand, tileIndex);
    
    // 重要：先更新状态，再调用autoDraw
    const newLevel = { ...levelState, hand: newHand };
    
    // 使用函数式更新确保状态同步
    setLevelState(prev => {
      if (!prev) return prev;
      const updatedLevel = { ...prev, hand: newHand };
      levelRef.current = updatedLevel;
      return updatedLevel;
    });
    
    // 自动摸下一张（使用ref中的最新状态）
    setTimeout(() => {
      const latestLevel = levelRef.current;
      if (latestLevel) {
        autoDraw(latestLevel);
      }
    }, 300);
  }, [levelState, animating, autoDraw]);

  // ========== 继续下一关 ==========
  const nextLevel = useCallback(() => {
    enterShop(gameState.itemSlots);
  }, [gameState.itemSlots, enterShop]);

  // ========== 重新开始 ==========
  const restart = useCallback(() => {
    const newGame = createGameState();
    setGameState(newGame);
    gameRef.current = newGame;
    setLevelState(null);
    levelRef.current = null;
    setScreen('title');
    setMessage('');
    setScoreDetails([]);
    setSelectedTile(null);
    setAnimating(false);
  }, []);

  // ========== 渲染标题画面 ==========
  const renderTitle = () => (
    <div className={styles.titleScreen}>
      <h1 className={styles.title}>青天井</h1>
      <p className={styles.subtitle}>麻将版小丑牌</p>
      <button className={styles.startButton} onClick={startNewGame}>
        开始游戏
      </button>
      <div className={styles.rules}>
        <h3>游戏规则</h3>
        <p>1. 从牌山中自动摸牌，组成胡牌牌型</p>
        <p>2. 胡牌得分 = 牌面分数总和 × 番数 × 道具卡效果</p>
        <p>3. 8个道具卡槽位，合理搭配Build</p>
        <p>4. 每关需要达到目标分数才能过关</p>
      </div>
    </div>
  );

  // ========== 渲染商店 ==========
  const renderShop = () => (
    <div className={styles.shopScreen}>
      <h2>道具商店</h2>
      <p className={styles.shopMessage}>{message}</p>
      
      <div className={styles.shopChoices}>
        {gameState.shopChoices.map((card, index) => (
          <div key={index} className={styles.shopCard}>
            <h3>{card.name}</h3>
            <p>{card.description}</p>
            {shopSlotIndex !== null ? (
              <button onClick={() => replaceSlot(shopSlotIndex, card)}>
                替换槽位 {shopSlotIndex + 1}
              </button>
            ) : (
              <button onClick={() => selectShopCard(card)}>
                选择
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* 显示当前道具卡槽 */}
      <div className={styles.itemSlots}>
        <h3>当前道具卡</h3>
        <div className={styles.slotsGrid}>
          {gameState.itemSlots.map((slot, index) => (
            <div key={index} className={styles.slot}>
              {slot.card ? (
                <div className={styles.slotCard}>
                  <span>{slot.card.name}</span>
                  {slot.multiplier !== 1 && (
                    <span className={styles.multiplier}>×{slot.multiplier.toFixed(2)}</span>
                  )}
                </div>
              ) : (
                <span className={styles.emptySlot}>空</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ========== 渲染游戏画面 ==========
  const renderGame = () => {
    if (!levelState) return null;
    
    return (
      <div className={styles.gameScreen}>
        {/* 顶部信息栏 */}
        <div className={styles.topBar}>
          <span>第 {levelState.level} 关</span>
          <span>目标: {levelState.targetScore.toLocaleString()}</span>
          <span>当前: {levelState.currentScore.toLocaleString()}</span>
          <span>胡牌: {levelState.totalWins}次</span>
        </div>
        
        {/* 道具卡槽 */}
        <div className={styles.itemSlotsBar}>
          {levelState.itemSlots.map((slot, index) => (
            <div key={index} className={styles.itemSlot}>
              {slot.card ? (
                <div className={styles.itemCard} title={slot.card.description}>
                  <span>{slot.card.name}</span>
                  {slot.multiplier !== 1 && (
                    <span className={styles.mult}>×{slot.multiplier.toFixed(2)}</span>
                  )}
                </div>
              ) : (
                <span className={styles.emptyItem}>空</span>
              )}
            </div>
          ))}
        </div>
        
        {/* 牌山 - 4×9阵列，摸牌后保留空白占位框 */}
        <div className={styles.wallSection}>
          <h3>牌山 ({levelState.wall.currentIndex}/{levelState.wall.tiles.length})</h3>
          <div className={styles.wallGrid}>
            {Array.from({ length: 36 }, (_, index) => {
              const tile = levelState.wall.tiles[index];
              const isDrawn = index < levelState.wall.currentIndex;
              const isRevealed = levelState.wall.revealed[index];
              
              return (
                <div
                  key={index}
                  className={`${styles.wallTile} ${
                    isDrawn ? styles.drawn : ''
                  } ${isRevealed ? styles.revealed : ''}`}
                >
                  {tile && (isRevealed || isDrawn) ? (
                    <img
                      src={`/tiles/${tile.id}.png`}
                      alt={tile.id}
                      className={styles.tileImg}
                    />
                  ) : tile ? (
                    <div className={styles.hiddenTile}>?</div>
                  ) : (
                    <div className={styles.emptyTile}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 手牌 - 直接点击即丢弃 */}
        <div className={styles.handSection}>
          <h3>手牌 ({levelState.hand.tiles.length}张) - 点击直接丢弃</h3>
          <div className={styles.handGrid}>
            {levelState.hand.tiles.map((tile, index) => (
              <button
                key={index}
                className={`${styles.handTile} ${animating ? styles.disabled : ''}`}
                onClick={() => {
                  if (!animating) {
                    discardTile(tile);
                  }
                }}
                disabled={animating}
                title="点击丢弃此牌"
              >
                <img
                  src={`/tiles/${tile.id}.png`}
                  alt={tile.id}
                  className={styles.tileImg}
                />
              </button>
            ))}
          </div>
        </div>
        
        {/* 操作区 - 仅显示消息 */}
        <div className={styles.actions}>
          <p className={styles.message}>{message}</p>
          {animating && (
            <div className={styles.animating}>处理中...</div>
          )}
        </div>
        
        {/* 得分详情 */}
        {scoreDetails.length > 0 && (
          <div className={styles.scoreDetails}>
            <h4>上次得分详情</h4>
            {scoreDetails.map((detail, index) => (
              <p key={index}>{detail}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ========== 渲染结果画面 ==========
  const renderResult = () => (
    <div className={styles.resultScreen}>
      <h2>{gameState.gameOver ? '游戏结束' : '过关！'}</h2>
      <p className={styles.resultMessage}>{message}</p>
      
      {!gameState.gameOver && (
        <div className={styles.resultStats}>
          <p>总得分: {gameState.totalScore.toLocaleString()}</p>
          <p>当前关卡: {gameState.level}</p>
        </div>
      )}
      
      <div className={styles.resultActions}>
        {!gameState.gameOver ? (
          <button className={styles.nextBtn} onClick={nextLevel}>
            下一关
          </button>
        ) : (
          <button className={styles.restartBtn} onClick={restart}>
            重新开始
          </button>
        )}
      </div>
    </div>
  );

  // ========== 主渲染 ==========
  return (
    <div className={styles.aotenjoGame}>
      {screen === 'title' && renderTitle()}
      {screen === 'shop' && renderShop()}
      {screen === 'game' && renderGame()}
      {screen === 'result' && renderResult()}
      
      {/* 得分飘字动画 */}
      {scorePopup.visible && (
        <div className={styles.scorePopup}>
          +{scorePopup.score}
        </div>
      )}
      
      {/* 胡牌特效 */}
      {winEffect.visible && (
        <div className={styles.winEffect}>
          <div className={styles.winEffectText}>
            {winEffect.pattern}
          </div>
        </div>
      )}
    </div>
  );
}
