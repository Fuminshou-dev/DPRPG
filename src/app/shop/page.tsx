"use client";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useMutation, useQuery } from "convex/react";
import Image, { StaticImageData } from "next/image";
import { useState } from "react";

import reroll from "@/public/reroll.jpg";
import restore1 from "@/public/restore1.jpg";
import restore2 from "@/public/restore2.jpg";
import special from "@/public/special.jpg";

import { ReturnToMainMenuButton } from "@/components/return-to-main-button";
import { api } from "../../../convex/_generated/api";

const itemImages: { [key: string]: StaticImageData } = {
  restore1: restore1,
  restore2: restore2,
  special: special,
  reroll: reroll,
};

export default function ShopPage() {
  const [errorItemType, setErrorItemType] = useState<string | null>(null);
  const [successItemType, setSuccessItemType] = useState<string | null>(null);
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);

  const items = useQuery(api.shop.getAllShopItems);
  const updateShopStatisticsMutation = useMutation(
    api.player_statistics.updateShopStatistics
  );
  const updateGoldStatisticsMutation = useMutation(
    api.player_statistics.updateGoldStatistics
  );
  const player = useQuery(api.players.getPlayer);
  const buyItem = useMutation(api.shop.buyItem);

  const handleItemBuy = async ({
    price,
    type,
    updateShopStatisticsMutation,
    updateGoldStatisticsMutation,
  }: {
    price: number;
    type: string;
    updateShopStatisticsMutation: ReturnType<
      typeof useMutation<typeof api.player_statistics.updateShopStatistics>
    >;
    updateGoldStatisticsMutation: ReturnType<
      typeof useMutation<typeof api.player_statistics.updateGoldStatistics>
    >;
  }) => {
    setIsButtonLoading(true);
    const result = await buyItem({ price, type });

    if (!result.success) {
      if (result.error === "Not enough money") setErrorItemType(type);
    } else {
      setErrorItemType(null);
    }

    if (result.success) {
      await updateShopStatisticsMutation({
        toUpdate: {
          healingHiPotionsBought: type === "restore2",
          healingPotionsBought: type === "restore1",
          rerollPotionsBought: type === "reroll",
          specialPotionsBought: type === "special",
        },
      });
      await updateGoldStatisticsMutation({
        toUpdate: {
          goldSpent: price,
          goldEarned: 0,
        },
      });
      setSuccessItemType(type);
    }

    setTimeout(() => {
      setIsButtonLoading(false);
    }, 2000);
  };

  if (!items || !player) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <LoadingSpinner className="size-72"></LoadingSpinner>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex justify-center items-center min-h-screen py-8 px-4">
      <div className="flex flex-col gap-4 w-full max-w-6xl mt-8">
        <ReturnToMainMenuButton />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items?.map((item) => (
            <div
              key={item._id}
              className="flex flex-col gap-4 text-center justify-evenly items-center border p-4 rounded-lg w-full"
            >
              <h1 className="text-xl sm:text-2xl">{item.item}</h1>
              <Image
                className="rounded-lg"
                width={70}
                height={70}
                src={itemImages[item.type]}
                alt={item.item}
              ></Image>
              <p className="text-sm sm:text-base">{item.effectDescription}</p>
              <p className="text-lg sm:text-xl">
                Cost: <span className="text-yellow-400">{item.price}</span> Gold
              </p>
              <p className="text-lg sm:text-xl">
                You have{" "}
                {player.items.map((el) =>
                  el.type === item.type ? (
                    el.amount === 0 ? (
                      <span key={el.type} className="text-red-500">
                        {el.amount}
                      </span>
                    ) : (
                      <span key={el.type} className="text-green-500">
                        {el.amount}
                      </span>
                    )
                  ) : (
                    ""
                  )
                )}{" "}
                of this item
              </p>
              <div className="flex flex-col justify-center items-center gap-2">
                <Button
                  disabled={isButtonLoading || player.gold < item.price}
                  onClick={() =>
                    handleItemBuy({
                      updateGoldStatisticsMutation,
                      price: item.price,
                      type: item.type,
                      updateShopStatisticsMutation,
                    })
                  }
                  variant={
                    player.gold < item.price ? "destructive" : "secondary"
                  }
                  className={
                    player.gold < item.price
                      ? "w-24 h-12 disabled:cursor-not-allowed"
                      : "w-24 h-12 bg-green-600"
                  }
                >
                  {isButtonLoading ? "Loading..." : "Buy"}
                </Button>
                {errorItemType === item.type && (
                  <p className="text-red-500 text-sm">Not enough gold</p>
                )}
                {successItemType === item.type && (
                  <p className="text-green-500 text-sm">
                    Successfully bought an item
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
