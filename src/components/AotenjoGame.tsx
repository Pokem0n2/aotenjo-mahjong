import React, { useState, useCallback, useRef } from 'react';
import styles from '../styles/AotenjoGame.module.css';
import {
  GameState, LevelState, ItemCard, ItemSlot,
  createGameState, createLevel, generateShopChoices,
  addItemCard, updateItemsAfterLevel, updateItemsAfterWin,
  discardAndDraw, checkWin, calculateBaseScore, applyItemEffects,
  tileToId, drawFromWall, autoDiscardAfterWin
} from '../engine/aotenjo';
import { Tile, TILE_NAMES, TileId } from '../types/tile';
import { handDiscard } from '../engine/hand';

// ========== 游戏画面类型 ==========
type Screen = 'title' | 'shop' | 'game' | 'result';

interface AotenjoGameProps {
  cheatMode?: boolean;
}

export default function AotenjoGame({ cheatMode = false }: AotenjoGameProps) {
  const [screen, setScreen] = useState<Screen>('title');
  const [gameState, setGameState] = useState<GameState>(createGameState());
  const [levelState, setLevelState] = useState<LevelState | null>(null);
  const [message, setMessage] = useState('');
  const [scoreDetails, setScoreDetails] = useState<string[]>([]);
  const [scorePopup, setScorePopup] = useState<{ score: number; visible: boolean }>({ score: 0, visible: false });
  const [winEffect, setWinEffect] = useState<{ pattern: string; visible: boolean }>({ pattern: '', visible: false });
  const [universalDisplay, setUniversalDisplay] = useState<TileId | null>(null); // 万能牌临时显示的牌ID
  const [shopSlotIndex, setShopSlotIndex] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  
  // 使用ref来避免闭包问题
  const levelRef = useRef<LevelState | null>(null);
  const gameRef = useRef<GameState>(gameState);
  
  // 同步ref
  levelRef.current = levelState;
  gameRef.current = gameState;

  // ========== 开始新游戏 ==========
  const startNewGame = useCallback(() => {
    const newGame = createGameState();
    const choices = generateShopChoices(newGame.itemSlots);
    newGame.shopChoices = choices;
    setGameState(newGame);
    gameRef.current = newGame;
    setScreen('shop');
    setMessage('选择你的第一张道具卡！');
    setScoreDetails([]);
  }, []);

  // ========== 进入商店 ==========
  const enterShop = useCallback((slots: ItemSlot[]) => {
    const choices = generateShopChoices(slots);
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
    const levelData = createLevel(level, itemSlots, cheatMode);
    setLevelState(levelData);
    levelRef.current = levelData;
    setScreen('game');
    setMessage(`第 ${level} 关 - 目标: ${levelData.targetScore}分 | 已自动摸入${levelData.hand.lastDraw ? TILE_NAMES[levelData.hand.lastDraw.id as import('../types/tile').TileId] : ''}，请选择一张牌丢弃`);
    setScoreDetails([]);
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
      // 胡牌后自动丢弃lastDraw，然后继续摸牌
      setTimeout(() => {
        const latestLevel = levelRef.current;
        if (latestLevel) {
          // 自动丢弃lastDraw并摸新牌
          const autoResult = autoDiscardAfterWin(latestLevel.wall, latestLevel.hand);
          const autoLevel: LevelState = {
            ...latestLevel,
            hand: autoResult.newHand,
            wall: autoResult.newWall
          };
          setLevelState(autoLevel);
          levelRef.current = autoLevel;
          
          if (autoResult.drawnTile) {
            // 检查新摸的牌是否胡牌
            const winResult = checkWin(autoResult.newHand, autoResult.drawnTile);
            if (winResult.isWin) {
              handleWin(autoLevel, winResult.pattern, winResult.fan, winResult.score);
            } else {
              setAnimating(false);
              setMessage(autoResult.message);
            }
          } else {
            setAnimating(false);
            setMessage(autoResult.message);
            if (autoResult.message === '牌山已空！') {
              setTimeout(() => checkLevelComplete(autoLevel), 1000);
            }
          }
        }
      }, 1200);
    }
  }, []);

  // ========== 胡牌后继续自动摸牌 ==========
  const autoDrawAfterWin = useCallback((currentLevel: LevelState) => {
    const { newHand, tile, newWall } = drawFromWall(currentLevel.wall, currentLevel.hand);
    
    if (!tile) {
      // 牌山已空
      checkLevelComplete({ ...currentLevel, wall: newWall, hand: newHand });
      return;
    }
    
    const newLevel: LevelState = {
      ...currentLevel,
      hand: newHand,
      wall: newWall
    };
    
    setLevelState(newLevel);
    levelRef.current = newLevel;
    
    // 检查是否胡牌
    const winResult = checkWin(newHand, tile);
    if (winResult.isWin) {
      handleWin(newLevel, winResult.pattern, winResult.fan, winResult.score);
    } else {
      setAnimating(false);
        setMessage(`摸到 ${tile ? TILE_NAMES[tile.id as import('../types/tile').TileId] : ''}，请选择一张牌丢弃`);
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
    
    // 如果关卡已标记完成（牌山已空），弃牌后立即结算
    if (levelState.isComplete) {
      // 清除万能牌临时显示
      setUniversalDisplay(null);
      
      // 执行弃牌（不摸新牌，因为牌山已空）
      const tileIndex = levelState.hand.tiles.findIndex(t => t.id === tile.id);
      const discardResult = handDiscard(levelState.hand, tileIndex >= 0 ? tileIndex : levelState.hand.tiles.length - 1);
      
      const finalLevel: LevelState = {
        ...levelState,
        hand: discardResult.hand
      };
      setLevelState(finalLevel);
      levelRef.current = finalLevel;
      
      // 立即结算
      checkLevelComplete(finalLevel);
      return;
    }
    
    setAnimating(true);
    
    // 点击弃牌时，清除万能牌临时显示（恢复为问号）
    setUniversalDisplay(null);
    
    // 调用discardAndDraw：丢弃牌 + 自动摸新牌
    const result = discardAndDraw(levelState.wall, levelState.hand, tile);
    
    // 更新关卡状态
    const newLevel: LevelState = {
      ...levelState,
      hand: result.newHand,
      wall: result.newWall
    };
    
    setLevelState(newLevel);
    levelRef.current = newLevel;
    
    if (result.isWin) {
      // 胡牌了！累加得分到关卡总分
      const updatedLevel: LevelState = {
        ...newLevel,
        currentScore: newLevel.currentScore + result.winScore
      };
      setLevelState(updatedLevel);
      levelRef.current = updatedLevel;
      
      // 显示胡牌效果
      setWinEffect({ pattern: result.winPattern, visible: true });
      setScorePopup({ score: result.winScore, visible: true });
      setScoreDetails(prev => [...prev, `${result.winPattern} ${result.winFan}番 +${result.winScore}分`]);
      setMessage(result.message);
      
      // 如果有万能牌，临时显示为最佳牌型所缺的牌
      if (result.universalDisplayTile) {
        setUniversalDisplay(result.universalDisplayTile);
      }
      
      // 1.5秒后清除动画，让玩家手动选择丢弃哪张牌
      setTimeout(() => {
        setWinEffect({ pattern: '', visible: false });
        setScorePopup({ score: 0, visible: false });
        
        if (result.isWallEmpty) {
          // 牌山已空，进入结算
          checkLevelComplete(updatedLevel);
        } else {
          // 牌山还有牌，让玩家手动选择丢弃一张牌（包括lastDraw）
          setAnimating(false);
          setMessage('🎉 胡牌了！请选择一张牌丢弃，继续游戏');
        }
      }, 1500);
    } else if (result.isWallEmpty) {
      // 牌山已空，没胡牌，让玩家手动选择丢弃一张牌后再结算
      setAnimating(false);
      setMessage(result.message);
      
      // 标记关卡为已完成（等待玩家弃牌后结算）
      const completedLevel: LevelState = {
        ...newLevel,
        isComplete: true
      };
      setLevelState(completedLevel);
      levelRef.current = completedLevel;
    } else {
      // 正常摸到新牌，继续游戏
      // 检查新摸的牌是否触发万能牌胡牌（已在discardAndDraw中处理）
      setAnimating(false);
      setMessage(result.message);
    }
  }, [levelState, animating]);

  // ========== 继续下一关 ==========
  const nextLevel = useCallback(() => {
    // 使用 gameRef 获取最新的 gameState，避免闭包问题
    enterShop(gameRef.current.itemSlots);
  }, [enterShop]);

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
        <p>1. 每关从完整日麻牌组中发13张手牌</p>
        <p>2. 36张独立牌山，自动从左到右依次摸牌</p>
        <p>3. 当前要摸的牌在牌山中明牌展示（黄色高亮）</p>
        <p>4. 弃牌后该位置变空白，下一张变为高亮</p>
        <p>5. 胡牌得分 = 牌面分数总和 × 番数 × 道具卡效果</p>
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
    
    const wall = levelState.wall;
    const currentDrawIndex = wall.currentIndex; // 当前要摸的牌位置
    
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
        
        {/* 牌山 - 9×4阵列 */}
        <div className={styles.wallSection}>
          <h3>牌山 ({wall.currentIndex}/{wall.tiles.length})</h3>
          <div className={styles.wallGrid}>
            {Array.from({ length: 36 }, (_, index) => {
              const tile = wall.tiles[index];
              const isDrawn = index < wall.currentIndex; // 已摸走的牌
              const isRevealed = wall.revealed[index];   // 随机明牌
              
              return (
                <div
                  key={index}
                  className={`${styles.wallTile} ${
                    isDrawn ? styles.drawn : ''
                  }`}
                >
                  {isDrawn ? (
                    // 已摸走的牌：空白占位框
                    <div className={styles.emptyTile}></div>
                  ) : isRevealed ? (
                    // 明牌：展示牌面
                    <img
                      src={`/tiles/${tile.id}.png`}
                      alt={tile.id}
                      className={styles.tileImg}
                    />
                  ) : (
                    // 暗牌：显示"?"
                    <div className={styles.hiddenTile}>?</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 手牌 - 直接点击即丢弃，lastDraw高亮 */}
        <div className={styles.handSection}>
          <h3>手牌 ({levelState.hand.tiles.length}张) - 点击直接丢弃</h3>
          <div className={styles.handGrid}>
            {levelState.hand.tiles.map((tile, index) => {
              // 通过索引匹配lastDraw：找到lastDraw在手牌中的实际索引（最后一张匹配的牌）
              let lastDrawIndex = -1;
              if (levelState.hand.lastDraw) {
                for (let i = levelState.hand.tiles.length - 1; i >= 0; i--) {
                  if (levelState.hand.tiles[i].id === levelState.hand.lastDraw.id) {
                    lastDrawIndex = i;
                    break;
                  }
                }
              }
              const isLastDraw = index === lastDrawIndex;
              const isUniversal = tile.id === 'universal';
              
              return (
                <button
                  key={index}
                  className={`${styles.handTile} ${isLastDraw ? styles.lastDrawHighlight : ''} ${isUniversal ? styles.universalTile : ''} ${animating ? styles.disabled : ''}`}
                  onClick={() => {
                    if (!animating && !isUniversal) {
                      discardTile(tile);
                    }
                  }}
                  disabled={animating || isUniversal}
                  title={isUniversal ? "万象天引-万能牌（不可丢弃）" : isLastDraw ? "刚摸到的牌，点击丢弃" : "点击丢弃此牌"}
                >
                  {isUniversal ? (
                    universalDisplay ? (
                      <img
                        src={`/tiles/${universalDisplay}.png`}
                        alt={universalDisplay}
                        className={styles.tileImg}
                      />
                    ) : (
                      <div className={styles.universalIcon}>?</div>
                    )
                  ) : (
                    <img
                      src={`/tiles/${tile.id}.png`}
                      alt={tile.id}
                      className={styles.tileImg}
                    />
                  )}
                </button>
              );
            })}
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
