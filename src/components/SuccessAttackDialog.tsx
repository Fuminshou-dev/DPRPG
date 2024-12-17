"use client";
import { updatePlayerFightStatus } from "@/app/utils/utilFunctions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import React from "react";

export default function SuccessAttackDialog({
  playerHp,
  monsterHp,
  monsterAtk,
  monster,
  monsterId,
  playerAtk,
  hasSpecialPotionEffect,
  setIsPlayerDead,
  finalDmg,
  showSuccessAttackDialog,
  setShowSuccessAttackDialog,
  playerStats,
  setIsLastBossDead,
  setIsMonsterDead,
  updatePlayerFightStatusMutation,
  updatePlayerCombatStatisticsMutation,
  updatePlayerMonstersStatisticsMutation,
  updatePlayerGoldMutation,
}: {
  playerHp: number;
  monsterHp: number;
  finalDmg: number;
  monsterAtk: number;
  showSuccessAttackDialog: boolean;
  setShowSuccessAttackDialog: (value: boolean) => void;
  monsterId: number;
  playerAtk: number;
  monster: Doc<"monsters">;
  playerStats: Doc<"player_stats">;
  updatePlayerFightStatusMutation: ReturnType<
    typeof useMutation<typeof api.players.updatePlayerFightStatus>
  >;
  setIsMonsterDead: (value: boolean) => void;
  setIsPlayerDead: (value: boolean) => void;
  hasSpecialPotionEffect: boolean;
  setIsLastBossDead: (value: boolean) => void;
  updatePlayerCombatStatisticsMutation: ReturnType<
    typeof useMutation<
      typeof api.player_statistics.updatePlayerCombatStatistics
    >
  >;
  updatePlayerGoldMutation: ReturnType<
    typeof useMutation<typeof api.player_statistics.updateGoldStatistics>
  >;
  updatePlayerMonstersStatisticsMutation: ReturnType<
    typeof useMutation<
      typeof api.player_statistics.updatePlayerMonstersStatistics
    >
  >;
}) {
  const handleSuccessAttack = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Loading...";

    setTimeout(async () => {
      setShowSuccessAttackDialog(false);
      const { status } = await updatePlayerFightStatus({
        hasSpecialPotionEffect,
        updatePlayerFightStatusMutation,
        playerHp,
        monsterHp,
        monsterAtk,
        finalDmg,
        monster,
        playerStats,
        monsterId,
        playerAtk,
      });
      if (status === "player_dead") {
        setIsPlayerDead(true);
      }
      if (status === "monster_dead" && monster.monster_type !== "Evil Deity") {
        await updatePlayerMonstersStatisticsMutation({
          toUpdate: {
            monsterKilled: monster.monster_type,
          },
        });
        await updatePlayerGoldMutation({
          toUpdate: {
            goldSpent: 0,
            goldEarned: monster.gold,
          },
        });
        setIsMonsterDead(true);
      }
      if (status === "monster_dead" && monster.monster_type === "Evil Deity") {
        await updatePlayerMonstersStatisticsMutation({
          toUpdate: {
            monsterKilled: monster.monster_type,
          },
        });
        setIsLastBossDead(true);
      }

      await updatePlayerCombatStatisticsMutation({
        toUpdate: {
          totalCombatTasks: true,
          totalCombatTasksCompleted: true,
          totalDamageTaken: monsterAtk,
          totalDamageDealt: finalDmg,
        },
      });
    }, 3000);
  };

  return (
    <AlertDialog open={showSuccessAttackDialog}>
      <AlertDialogContent className="max-w-full sm:max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-center">
            Congratulations!
          </AlertDialogTitle>
          <AlertDialogDescription asChild className="flex flex-col text-lg">
            <div>
              <span className="border-b-4 text-center block">
                You have successfully completed the task!
              </span>
              <Table className="mt-8">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xl sm:text-3xl"></TableHead>
                    <TableHead className="text-xl sm:text-3xl text-red-500">
                      {monster.monster_type}
                    </TableHead>
                    <TableHead className="text-xl sm:text-3xl text-green-500">
                      Player
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-lg sm:text-2xl">
                      Attack
                    </TableCell>
                    <TableCell className="text-lg sm:text-2xl text-red-500">
                      {monsterAtk}
                    </TableCell>
                    <TableCell className="text-lg sm:text-2xl text-green-500">
                      {finalDmg}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-lg sm:text-2xl">HP</TableCell>
                    <TableCell className="text-lg sm:text-2xl text-red-500">
                      {monsterHp}
                    </TableCell>
                    <TableCell className="text-lg sm:text-2xl text-green-500">
                      {playerHp}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-lg sm:text-2xl">
                      New HP
                    </TableCell>
                    <TableCell className="text-lg sm:text-2xl text-red-500">
                      {monsterHp - finalDmg}
                    </TableCell>
                    <TableCell className="text-lg sm:text-2xl text-green-500">
                      {playerHp - monsterAtk}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setShowSuccessAttackDialog(false);
            }}
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction onClick={handleSuccessAttack}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
