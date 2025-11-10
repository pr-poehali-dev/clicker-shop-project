import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Upgrade {
  id: string;
  name: string;
  icon: string;
  cost: number;
  effect: number;
  owned: number;
  description: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  icon: string;
  unlocked: boolean;
}

interface LeaderboardPlayer {
  nickname: string;
  totalClicks: number;
  clickPower: number;
  autoClickRate: number;
}

const API_URL = 'https://functions.poehali.dev/bc904408-bc31-4bae-863e-6b3c3c8522db';

const getPlayerId = () => {
  let playerId = localStorage.getItem('playerId');
  if (!playerId) {
    playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('playerId', playerId);
  }
  return playerId;
};

const Index = () => {
  const [clicks, setClicks] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoClickRate, setAutoClickRate] = useState(0);
  const [clickAnimation, setClickAnimation] = useState(false);
  const [nickname, setNickname] = useState('Аноним');
  const [newNickname, setNewNickname] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playerId] = useState(getPlayerId());

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: 'cursor',
      name: 'Авто-кликер',
      icon: 'MousePointer2',
      cost: 15,
      effect: 0.1,
      owned: 0,
      description: '+0.1 кликов/сек',
    },
    {
      id: 'multiplier',
      name: 'Множитель силы',
      icon: 'Zap',
      cost: 100,
      effect: 1,
      owned: 0,
      description: '+1 к силе клика',
    },
    {
      id: 'factory',
      name: 'Фабрика',
      icon: 'Factory',
      cost: 500,
      effect: 5,
      owned: 0,
      description: '+5 кликов/сек',
    },
    {
      id: 'megaboost',
      name: 'Мега-буст',
      icon: 'Rocket',
      cost: 2000,
      effect: 10,
      owned: 0,
      description: '+10 к силе клика',
    },
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_click',
      name: 'Первый клик',
      description: 'Сделай свой первый клик',
      target: 1,
      progress: 0,
      icon: 'MousePointer',
      unlocked: false,
    },
    {
      id: 'hundred',
      name: 'Сотня',
      description: 'Набери 100 кликов',
      target: 100,
      progress: 0,
      icon: 'Target',
      unlocked: false,
    },
    {
      id: 'thousand',
      name: 'Тысяча',
      description: 'Набери 1000 кликов',
      target: 1000,
      progress: 0,
      icon: 'Trophy',
      unlocked: false,
    },
    {
      id: 'first_upgrade',
      name: 'Первая покупка',
      description: 'Купи первое улучшение',
      target: 1,
      progress: 0,
      icon: 'ShoppingCart',
      unlocked: false,
    },
  ]);

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        const response = await fetch(`${API_URL}/?action=player&playerId=${playerId}`);
        if (response.ok) {
          const data = await response.json();
          setNickname(data.nickname || 'Аноним');
          setTotalClicks(data.totalClicks || 0);
          setClicks(data.totalClicks || 0);
          setClickPower(data.clickPower || 1);
          setAutoClickRate(data.autoClickRate || 0);
          
          if (data.upgrades && Array.isArray(data.upgrades)) {
            setUpgrades((prev) =>
              prev.map((upgrade) => {
                const savedUpgrade = data.upgrades.find((u: any) => u.id === upgrade.id);
                return savedUpgrade ? { ...upgrade, owned: savedUpgrade.owned } : upgrade;
              })
            );
          }
          
          if (data.achievements && Array.isArray(data.achievements)) {
            setAchievements((prev) =>
              prev.map((achievement) => {
                const savedAchievement = data.achievements.find((a: any) => a.id === achievement.id);
                return savedAchievement 
                  ? { ...achievement, unlocked: savedAchievement.unlocked, progress: savedAchievement.progress }
                  : achievement;
              })
            );
          }
        } else {
          await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, nickname: 'Аноним' }),
          });
        }
      } catch (error) {
        console.error('Failed to load player:', error);
      }
    };
    loadPlayer();
  }, [playerId]);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/?action=leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (autoClickRate > 0) {
        setClicks((prev) => prev + autoClickRate / 10);
        setTotalClicks((prev) => prev + autoClickRate / 10);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [autoClickRate]);

  const savePlayerData = async () => {
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          nickname,
          totalClicks: Math.floor(totalClicks),
          clickPower,
          autoClickRate,
          upgrades: upgrades.map(u => ({ id: u.id, owned: u.owned })),
          achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked, progress: a.progress })),
        }),
      });
      await loadLeaderboard();
    } catch (error) {
      console.error('Failed to save player data:', error);
    }
  };

  useEffect(() => {
    const saveInterval = setInterval(savePlayerData, 3000);
    return () => clearInterval(saveInterval);
  }, [playerId, nickname, totalClicks, clickPower, autoClickRate, upgrades, achievements]);

  useEffect(() => {
    setAchievements((prev) =>
      prev.map((ach) => {
        const newProgress =
          ach.id === 'first_upgrade'
            ? upgrades.reduce((sum, u) => sum + u.owned, 0)
            : totalClicks;
        const unlocked = newProgress >= ach.target;
        if (unlocked && !ach.unlocked) {
          toast.success(`Достижение разблокировано: ${ach.name}!`);
        }
        return { ...ach, progress: newProgress, unlocked };
      })
    );
  }, [totalClicks, upgrades]);

  const handleClick = () => {
    setClicks((prev) => prev + clickPower);
    setTotalClicks((prev) => prev + clickPower);
    setClickAnimation(true);
    setTimeout(() => setClickAnimation(false), 300);
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (clicks >= upgrade.cost) {
      setClicks((prev) => prev - upgrade.cost);
      setUpgrades((prev) =>
        prev.map((u) => {
          if (u.id === upgrade.id) {
            const newOwned = u.owned + 1;
            const newCost = Math.floor(u.cost * 1.15);

            if (u.id === 'cursor' || u.id === 'factory') {
              setAutoClickRate((rate) => rate + u.effect);
            }
            if (u.id === 'multiplier' || u.id === 'megaboost') {
              setClickPower((power) => power + u.effect);
            }

            return { ...u, owned: newOwned, cost: newCost };
          }
          return u;
        })
      );
      toast.success(`Куплено: ${upgrade.name}!`);
    } else {
      toast.error('Недостаточно кликов!');
    }
  };

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString('ru-RU');
  };

  const handleNicknameChange = async () => {
    if (!newNickname.trim()) {
      toast.error('Введи ник!');
      return;
    }
    if (newNickname.length > 20) {
      toast.error('Ник слишком длинный (макс. 20 символов)!');
      return;
    }
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          nickname: newNickname.trim(),
          totalClicks: Math.floor(totalClicks),
          clickPower,
          autoClickRate,
          upgrades: upgrades.map(u => ({ id: u.id, owned: u.owned })),
          achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked, progress: a.progress })),
        }),
      });
      if (response.ok) {
        setNickname(newNickname.trim());
        setNewNickname('');
        setSettingsOpen(false);
        toast.success('Ник изменён!');
        await loadLeaderboard();
      }
    } catch (error) {
      toast.error('Ошибка при изменении ника');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <div className="flex-1 text-center">
              <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
                NO. Кликер 🎮
              </h1>
              <p className="text-white/80 text-lg">Кликай и прокачивайся!</p>
            </div>
            <div className="flex-1 flex justify-end">
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-purple-500/20 border-purple-400/50 hover:bg-purple-500/30">
                    <Icon name="Settings" className="text-white" size={20} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gradient-to-br from-purple-900 to-pink-900 border-purple-400/50">
                  <DialogHeader>
                    <DialogTitle className="text-white text-2xl">Настройки игрока</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-white/80 text-sm mb-2 block">
                        Текущий ник: <span className="font-bold text-white">{nickname}</span>
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Введи новый ник"
                          value={newNickname}
                          onChange={(e) => setNewNickname(e.target.value)}
                          maxLength={20}
                          className="bg-purple-500/20 border-purple-400/50 text-white placeholder:text-white/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleNicknameChange();
                            }
                          }}
                        />
                        <Button
                          onClick={handleNicknameChange}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                        >
                          Сохранить
                        </Button>
                      </div>
                      <p className="text-white/60 text-xs mt-2">
                        Максимум 20 символов
                      </p>
                    </div>
                    <div className="pt-4 border-t border-purple-400/30">
                      <p className="text-white/80 text-sm">
                        <Icon name="Info" size={16} className="inline mr-1" />
                        Твой ник будет виден в таблице лидеров
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/50 animate-glow">
              <div className="text-center mb-6">
                <div className="text-6xl font-black text-white mb-2 drop-shadow-lg">
                  {formatNumber(clicks)}
                </div>
                <div className="text-white/70 text-sm">
                  {autoClickRate > 0 && `+${autoClickRate.toFixed(1)}/сек`}
                </div>
                <div className="text-white/70 text-xs mt-1">
                  Сила клика: {clickPower}
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <button
                  onClick={handleClick}
                  className={`relative transition-all duration-200 hover:scale-105 active:scale-95 ${
                    clickAnimation ? 'animate-pulse-scale' : ''
                  }`}
                >
                  <img
                    src="https://i.ibb.co/jPZtrC3w/image.png"
                    alt="NO Character"
                    className="w-64 h-64 object-contain drop-shadow-2xl animate-float cursor-pointer"
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-purple-500/30 border-purple-400/50">
                  <div className="flex items-center gap-2">
                    <Icon name="MousePointer2" className="text-white" size={24} />
                    <div>
                      <div className="text-white/70 text-xs">Всего кликов</div>
                      <div className="text-white font-bold text-lg">
                        {formatNumber(totalClicks)}
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-pink-500/30 border-pink-400/50">
                  <div className="flex items-center gap-2">
                    <Icon name="ShoppingCart" className="text-white" size={24} />
                    <div>
                      <div className="text-white/70 text-xs">Улучшений</div>
                      <div className="text-white font-bold text-lg">
                        {upgrades.reduce((sum, u) => sum + u.owned, 0)}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Tabs defaultValue="shop" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-purple-900/50">
                <TabsTrigger value="shop">Магазин</TabsTrigger>
                <TabsTrigger value="achievements">Награды</TabsTrigger>
                <TabsTrigger value="stats">Статистика</TabsTrigger>
              </TabsList>

              <TabsContent value="shop" className="space-y-3">
                {upgrades.map((upgrade) => (
                  <Card
                    key={upgrade.id}
                    className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border-purple-400/50 hover:scale-[1.02] transition-transform"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-500/50 p-2 rounded-lg">
                          <Icon name={upgrade.icon} className="text-white" size={24} />
                        </div>
                        <div>
                          <div className="text-white font-bold">{upgrade.name}</div>
                          <div className="text-white/60 text-xs">
                            {upgrade.description}
                          </div>
                        </div>
                      </div>
                      {upgrade.owned > 0 && (
                        <Badge className="bg-pink-500">{upgrade.owned}</Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => buyUpgrade(upgrade)}
                      disabled={clicks < upgrade.cost}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                    >
                      <Icon name="Coins" size={16} className="mr-2" />
                      {formatNumber(upgrade.cost)}
                    </Button>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="achievements" className="space-y-3">
                {achievements.map((ach) => (
                  <Card
                    key={ach.id}
                    className={`p-4 backdrop-blur-sm border-purple-400/50 transition-all ${
                      ach.unlocked
                        ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30'
                        : 'bg-purple-500/10 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg ${
                          ach.unlocked ? 'bg-yellow-500/50' : 'bg-gray-500/30'
                        }`}
                      >
                        <Icon name={ach.icon} className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-white font-bold">{ach.name}</div>
                          {ach.unlocked && (
                            <Icon name="Check" className="text-yellow-400" size={16} />
                          )}
                        </div>
                        <div className="text-white/60 text-xs">{ach.description}</div>
                      </div>
                    </div>
                    {!ach.unlocked && (
                      <div>
                        <Progress
                          value={(ach.progress / ach.target) * 100}
                          className="h-2"
                        />
                        <div className="text-white/60 text-xs mt-1">
                          {formatNumber(ach.progress)} / {formatNumber(ach.target)}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="stats" className="space-y-3">
                <Card className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-400/50">
                  <div className="text-white font-bold mb-4 flex items-center gap-2">
                    <Icon name="BarChart3" size={20} />
                    Общая статистика
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Всего кликов:</span>
                      <span className="text-white font-bold">
                        {formatNumber(totalClicks)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Сила клика:</span>
                      <span className="text-white font-bold">{clickPower}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Авто-клики/сек:</span>
                      <span className="text-white font-bold">
                        {autoClickRate.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Куплено улучшений:</span>
                      <span className="text-white font-bold">
                        {upgrades.reduce((sum, u) => sum + u.owned, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">
                        Разблокировано достижений:
                      </span>
                      <span className="text-white font-bold">
                        {achievements.filter((a) => a.unlocked).length} /{' '}
                        {achievements.length}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/50">
                  <div className="text-white font-bold mb-4 flex items-center gap-2">
                    <Icon name="TrendingUp" size={20} />
                    Прогресс
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/70">Достижения</span>
                        <span className="text-white">
                          {Math.floor(
                            (achievements.filter((a) => a.unlocked).length /
                              achievements.length) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          (achievements.filter((a) => a.unlocked).length /
                            achievements.length) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm border-orange-400/50">
                  <div className="text-white font-bold mb-4 flex items-center gap-2">
                    <Icon name="Crown" size={20} />
                    Топ игроков
                  </div>
                  <div className="space-y-2">
                    {leaderboard.length === 0 ? (
                      <div className="text-white/60 text-center py-4">
                        Пока нет игроков в таблице
                      </div>
                    ) : (
                      leaderboard.map((player, idx) => {
                        const isCurrentPlayer = player.nickname === nickname && player.totalClicks === Math.floor(totalClicks);
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              isCurrentPlayer
                                ? 'bg-yellow-500/30 border border-yellow-400/50'
                                : 'bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold ${
                                  idx === 0
                                    ? 'text-yellow-400'
                                    : idx === 1
                                    ? 'text-gray-300'
                                    : idx === 2
                                    ? 'text-orange-400'
                                    : 'text-white/70'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <span className={`${isCurrentPlayer ? 'text-yellow-200 font-bold' : 'text-white'}`}>
                                {player.nickname}
                                {isCurrentPlayer && ' (Ты)'}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-white/70 text-sm">
                                {formatNumber(player.totalClicks)}
                              </div>
                              <div className="text-white/50 text-xs">
                                Сила: {player.clickPower} | Авто: {player.autoClickRate.toFixed(1)}/с
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;