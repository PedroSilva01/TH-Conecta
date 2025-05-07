import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RewardCard } from "@/components/rewards/reward-card";
import { 
  Reward, 
  Redemption,
  insertRedemptionSchema
} from "@shared/schema";
import { Star, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RewardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  
  // Fetch rewards
  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });
  
  // Fetch redemption history
  const { data: redemptions, isLoading: isLoadingRedemptions } = useQuery<Redemption[]>({
    queryKey: ["/api/rewards/redemptions"],
  });
  
  // Redeem reward mutation
  const redeemRewardMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertRedemptionSchema>) => {
      const res = await apiRequest("POST", "/api/rewards/redeem", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Recompensa resgatada!",
        description: selectedReward ? `Você resgatou: ${selectedReward.title}` : "Resgate realizado com sucesso."
      });
      
      setConfirmDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao resgatar recompensa",
        description: error.message,
        variant: "destructive"
      });
      setConfirmDialogOpen(false);
    }
  });
  
  const handleRedeemClick = (rewardId: number) => {
    const reward = rewards?.find(r => r.id === rewardId);
    if (!reward) return;
    
    setSelectedReward(reward);
    setConfirmDialogOpen(true);
  };
  
  const confirmRedeem = () => {
    if (!selectedReward || !user) return;
    
    // Check if user has enough points
    if (user.points < selectedReward.pointsCost) {
      toast({
        title: "Pontos insuficientes",
        description: `Você precisa de ${selectedReward.pointsCost} pontos para resgatar esta recompensa.`,
        variant: "destructive"
      });
      setConfirmDialogOpen(false);
      return;
    }
    
    // Process redemption
    redeemRewardMutation.mutate({
      userId: user.id,
      rewardId: selectedReward.id,
      pointsSpent: selectedReward.pointsCost,
      status: "active"
    });
  };
  
  // Calculate progress to next level
  const calculateLevelProgress = () => {
    if (!user) return { currentLevel: 'Bronze', nextLevel: 'Prata', progress: 0, pointsToNext: 1000 };
    
    const levels = [
      { name: 'Bronze', minPoints: 0, maxPoints: 999 },
      { name: 'Prata', minPoints: 1000, maxPoints: 2999 },
      { name: 'Ouro', minPoints: 3000, maxPoints: 5999 },
      { name: 'Platina', minPoints: 6000, maxPoints: 9999 },
      { name: 'Diamante', minPoints: 10000, maxPoints: Infinity }
    ];
    
    const currentLevelIndex = levels.findIndex(level => 
      user.points >= level.minPoints && user.points <= level.maxPoints
    );
    
    const currentLevel = levels[currentLevelIndex];
    const nextLevel = levels[currentLevelIndex + 1];
    
    if (!nextLevel) {
      // Already at max level
      return {
        currentLevel: currentLevel.name,
        nextLevel: null,
        progress: 100,
        pointsToNext: 0
      };
    }
    
    const pointsInCurrentLevel = user.points - currentLevel.minPoints;
    const totalPointsInLevel = currentLevel.maxPoints - currentLevel.minPoints + 1;
    const progress = (pointsInCurrentLevel / totalPointsInLevel) * 100;
    const pointsToNext = nextLevel.minPoints - user.points;
    
    return {
      currentLevel: currentLevel.name,
      nextLevel: nextLevel.name,
      progress,
      pointsToNext
    };
  };
  
  const levelInfo = calculateLevelProgress();
  
  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Screen Header with Points Display */}
      <div className="bg-primary p-6 pt-12 pb-8">
        <div className="flex items-start mb-4">
          <button onClick={() => window.history.back()} className="text-white mr-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-white font-medium text-lg mb-1">Minhas Recompensas</h2>
          <div className="bg-white/10 rounded-full px-4 py-2 inline-flex items-center">
            <Star className="text-secondary h-5 w-5 mr-2" />
            <span className="text-white font-medium">{user?.points || 0} pontos</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 -mt-4">
        <div className="bg-white rounded-t-xl shadow-sm p-4">
          {/* Progress to Next Level */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Nível Atual: {levelInfo.currentLevel}</span>
              {levelInfo.nextLevel && <span>Próximo: {levelInfo.nextLevel}</span>}
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary" 
                style={{ width: `${Math.min(levelInfo.progress, 100)}%` }}
              ></div>
            </div>
            {levelInfo.nextLevel ? (
              <div className="text-right text-xs text-neutral-500 mt-1">
                {levelInfo.pointsToNext} pontos para o próximo nível
              </div>
            ) : (
              <div className="text-right text-xs text-green-600 mt-1">
                Você atingiu o nível máximo!
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-medium mb-3">Benefícios Disponíveis</h3>
          
          {/* Rewards List */}
          <div className="space-y-4">
            {isLoadingRewards ? (
              <div className="text-center py-6 text-neutral-500">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <p>Carregando recompensas disponíveis...</p>
              </div>
            ) : rewards && rewards.length > 0 ? (
              rewards.map(reward => (
                <RewardCard 
                  key={reward.id}
                  reward={reward}
                  onRedeem={handleRedeemClick}
                  disabled={user ? user.points < reward.pointsCost : true}
                />
              ))
            ) : (
              <div className="text-center py-6 text-neutral-500">
                <p>Nenhuma recompensa disponível no momento.</p>
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-medium my-6">Histórico de Resgates</h3>
          
          {/* Redemption History */}
          <div className="space-y-4">
            {isLoadingRedemptions ? (
              <div className="text-center py-6 text-neutral-500">
                <p>Carregando histórico de resgates...</p>
              </div>
            ) : redemptions && redemptions.length > 0 ? (
              redemptions.map((redemption, index) => {
                const rewardDetails = rewards?.find(r => r.id === redemption.rewardId);
                return (
                  <div key={index} className="border border-neutral-100 rounded-lg p-4">
                    <div className="flex">
                      <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mr-3">
                        <CheckCircle className="h-5 w-5 text-neutral-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{rewardDetails?.title || 'Recompensa'}</h4>
                          <span className="text-neutral-500 text-sm">
                            {new Date(redemption.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm text-neutral-500">{redemption.status === 'active' ? 'Ativo' : 'Utilizado'}</p>
                          <span className="text-red-500 font-medium">-{redemption.pointsSpent} pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-neutral-500">
                <p>Você ainda não resgatou nenhuma recompensa.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Resgate</DialogTitle>
            <DialogDescription>
              Você está prestes a resgatar a seguinte recompensa:
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="py-4">
              <div className="font-medium text-lg mb-2">{selectedReward.title}</div>
              <p className="text-neutral-600 mb-4">{selectedReward.description}</p>
              
              <div className="flex justify-between p-3 bg-neutral-100 rounded-lg">
                <div className="font-medium">Custo</div>
                <div className="font-bold text-primary">{selectedReward.pointsCost} pontos</div>
              </div>
              
              {user && user.points < selectedReward.pointsCost && (
                <div className="mt-4 flex items-start gap-2 text-red-500 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Pontos insuficientes</p>
                    <p className="text-sm">Você precisa de mais {selectedReward.pointsCost - user.points} pontos para esta recompensa.</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmRedeem}
              disabled={user ? user.points < (selectedReward?.pointsCost || 0) : true}
              className="w-full sm:w-auto"
            >
              Confirmar Resgate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
